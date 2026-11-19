import { createHash } from 'node:crypto'
import { build, context } from 'esbuild'
import { mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'node:http'

const skill = new URL('../skills/zjooc/', import.meta.url)
const read = path => readFile(new URL(path, skill))
const port = Number(process.env.ZERROR_SCRIPT_PORT || 8818)
const scripts = new URL('../site-tools/', import.meta.url)
const digest = value => createHash('sha256').update(value).digest('hex')

const root = fileURLToPath(new URL('../', import.meta.url))
const out = resolve(root, 'dist')
const publish = process.argv.includes('--publish')
const serve = process.argv.includes('--serve')
const capabilities = ['homework', 'login', 'playback']

async function writeAtomic(path, bytes) {
  const temp = path + '.' + process.pid + '.tmp'
  await writeFile(temp, bytes)
  await rename(temp, path)
}

async function experience() {
  const website = JSON.parse(await read('website.json'))
  const mimeTypes = { ico: 'x-icon', png: 'png', jpg: 'jpeg', jpeg: 'jpeg', gif: 'gif', webp: 'webp' }
  const iconPath = /^assets\/[\w-]+\.(ico|png|jpe?g|gif|webp)$/.exec(website.icon)
  if (!iconPath) throw new Error('Invalid website icon path')
  const icon = { path: website.icon, dataUrl: 'data:image/' + mimeTypes[iconPath[1]] + ';base64,' + (await read(website.icon)).toString('base64') }
  const refs = await readdir(new URL('references/', skill)).catch(err => {
    if (err.code === 'ENOENT') return []
    throw err
  })
  const paths = ['SKILL.md', 'site-graph.json', ...refs.filter(name => /^[\w-]+\.md$/.test(name)).sort().map(name => 'references/' + name)]
  const files = Object.fromEntries(await Promise.all(paths.map(async path => [path, (await read(path)).toString('utf8')])))
  const tools = JSON.parse(await readFile(new URL('tools.json', scripts), 'utf8'))
  const data = { website, files, icon, tools, scriptManifest: './script-manifest.json' }
  return { ...data, revision: digest(JSON.stringify(data)) }
}

const options = {
  absWorkingDir: root,
  entryPoints: Object.fromEntries(capabilities.map(name => [name, 'src/' + name + '.js'])),
  outdir: 'scripts',
  bundle: true,
  format: 'iife',
  globalName: 'ZErrorSiteScript',
  target: 'es2020',
  write: false,
  plugins: [{
    name: 'publish-website-scripts',
    setup(builder) {
      builder.onEnd(async result => {
        if (result.errors.length) return
        await mkdir(resolve(out, 'scripts'), { recursive: true })
        const bundles = Object.fromEntries(await Promise.all(result.outputFiles.map(async ({ contents, path }) => {
          const name = basename(path, '.js')
          const sha256 = digest(contents)
          const artifact = 'scripts/' + name + '.' + sha256 + '.js'
          await writeAtomic(resolve(out, artifact), contents)
          if (publish) await writeAtomic(fileURLToPath(new URL(name + '.js', scripts)), contents)
          return [name, { url: './' + artifact, sha256 }]
        })))
        const manifest = { apiVersion: 1, siteId: 'zjooc', revision: digest(JSON.stringify(bundles)), bundles }
        await writeAtomic(resolve(out, 'experience.json'), JSON.stringify(await experience(), null, 2) + '\n')
        await writeAtomic(resolve(out, 'script-manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
        console.log('Built ' + capabilities.join(', ') + ' ' + manifest.revision.slice(0, 12))
      })
    },
  }],
}

if (!serve) {
  await build(options)
} else {
  const builder = await context(options)
  try {
    await builder.rebuild()
    await builder.watch()
  } catch (error) {
    await builder.dispose()
    throw error
  }
  const server = createServer(async (req, res) => {
    const path = req.url?.split('?')[0]
    const bundle = /^\/scripts\/([a-z][a-z0-9-]*)\.([a-f0-9]{64})\.js$/.exec(path || '')
    if (req.method !== 'GET' || (path !== '/experience.json' && path !== '/script-manifest.json' && !bundle)) {
      res.writeHead(404).end()
      return
    }
    try {
      if (bundle && !capabilities.includes(bundle[1])) return res.writeHead(404).end()
      const bytes = path === '/experience.json'
        ? JSON.stringify(await experience())
        : await readFile(resolve(out, '.' + path))
      const etag = '"' + digest(bytes) + '"'
      res.setHeader('ETag', etag)
      res.setHeader('Cache-Control', bundle ? 'public, max-age=31536000, immutable' : 'no-cache')
      if (req.headers['if-none-match'] === etag) res.writeHead(304).end()
      else res.writeHead(200, { 'Content-Type': bundle ? 'application/javascript' : 'application/json; charset=utf-8' }).end(bytes)
    } catch (error) {
      if (bundle && error.code === 'ENOENT') return res.writeHead(404).end()
      console.error(error.message)
      res.writeHead(500).end('Unable to load website experience')
    }
  }).listen(port, '127.0.0.1', () => console.log('http://127.0.0.1:' + port + '/experience.json'))
  server.once('error', async error => {
    console.error(error.message)
    await builder.dispose()
    process.exitCode = 1
  })
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, async () => {
      server.close()
      await builder.dispose()
    })
  }
}
