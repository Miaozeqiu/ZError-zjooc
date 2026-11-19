import { readFile } from 'node:fs/promises'
import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'

const manifestUrl = new URL('../dist/script-manifest.json', import.meta.url)
const manifest = JSON.parse(await readFile(manifestUrl, 'utf8'))
const source = await readFile(new URL(manifest.bundles.login.url, manifestUrl), 'utf8')
const adapter = runInNewContext(source + '\nZErrorSiteScript')
const page = { kind: 'form', document: 'current', origin: 'https://background.zjooc.cn', path: '/gxptLogin', challenge: true }

test('distinguishes a rejected password from an expired captcha', () => {
  const input = { operation: 'observe', origin: page.origin, path: page.path, captureCaptcha: true }
  const { rules } = adapter.run(input)
  assert.match('用户名或密码错误', new RegExp(rules[5].pattern))
  assert.match('验证码已过期', new RegExp(rules[4].pattern))
  assert.equal(adapter.run({ ...input, matches: [true, true, true, false, true, false, true] }).rejection, 'captcha')
  assert.equal(adapter.run({ ...input, matches: [true, true, true, false, false, true, true] }).rejection, 'credentials')
})
test('requests a screenshot bound to the filled document and does not submit before recognition', () => {
  const flow = adapter.workflow({})
  assert.equal(flow.next().value.op, 'read')
  assert.equal(flow.next(page).value.op, 'fill_credentials')
  assert.equal(flow.next('filled').value.capture, true)
  assert.equal(flow.next({ ...page, imageAvailable: true }).value.op, 'issue_captcha')
  assert.equal(flow.next().value.status, 'captcha')
})
test('rejection and stale verification use separate responses', () => {
  const flow = adapter.workflow({ submittingCaptcha: true })
  assert.equal(flow.next().value.capture, true)
  assert.equal(flow.next(page).value.op, 'submit')
  assert.equal(flow.next(false).value.status, 'stale')
  const renewed = adapter.workflow({ verify: true })
  assert.equal(renewed.next().value.op, 'read')
  assert.equal(renewed.next({ ...page, kind: 'rejected', rejection: 'credentials' }).value.op, 'reject_credentials')
  assert.equal(renewed.next().value.status, 'manual')
})
