import { createHash } from 'node:crypto'
import { lstat, readFile, readdir } from 'node:fs/promises'
import { createServer } from 'node:http'

const skill = new URL('../skills/zjooc/', import.meta.url)
const read = path => readFile(new URL(path, skill))
const port = Number(process.env.ZERROR_SCRIPT_PORT || 8818)
const scripts = new URL('../site-tools/', import.meta.url)
const digest = value => createHash('sha256').update(value).digest('hex')

async function scriptBundles() {
  const entries = await readdir(scripts, { withFileTypes: true }).catch(err => {
    if (err.code === 'ENOENT') return []
    throw err
  })
  const bundles = {}
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isFile() || !/^[a-z][a-z0-9-]*\.js$/.test(entry.name)) continue
    const name = entry.name.slice(0, -3)
    const sha256 = digest(await readFile(new URL(entry.name, scripts)))
    bundles[name] = { url: './scripts/' + name + '.' + sha256 + '.js', sha256 }
  }
  return bundles
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

createServer(async (req, res) => {
  const path = req.url?.split('?')[0]
  const bundle = /^\/scripts\/([a-z][a-z0-9-]*)\.([a-f0-9]{64})\.js$/.exec(path || '')
  if (req.method !== 'GET' || (path !== '/experience.json' && path !== '/script-manifest.json' && !bundle)) {
    res.writeHead(404).end()
    return
  }
  try {
    let bytes
    if (bundle) {
      const file = new URL(bundle[1] + '.js', scripts)
      if (!(await lstat(file)).isFile()) return res.writeHead(404).end()
      bytes = await readFile(file)
      if (digest(bytes) !== bundle[2]) return res.writeHead(404).end()
    } else if (path === '/script-manifest.json') {
      const bundles = await scriptBundles()
      bytes = JSON.stringify({ apiVersion: 1, siteId: 'zjooc', revision: digest(JSON.stringify(bundles)), bundles })
    } else {
      bytes = JSON.stringify(await experience())
    }
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
