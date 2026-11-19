const ZErrorSiteScript = {
  workflow,
  run(input) {
    if (input.operation === 'observe') return observation(input)
    const { kind, atForm, atHome, frameReady, rejection } = input
    if (kind === 'space' && atHome) return 'logged_in'
    if (atForm && kind === 'reset') return 'reset_password'
    if (atForm && kind === 'rejected') return rejection === 'credentials' || rejection === 'captcha' ? rejection : 'rejected'
    if (atForm && kind === 'form' && frameReady) return 'fill'
    if (atHome && kind === 'guest' && frameReady) return 'open_form'
    return 'wait'
  },
}

function observation({ origin, path, matches, captureCaptcha }) {
  const query = (kind, selector, pattern) => ({ kind, selector, pattern })
  if (origin === 'https://background.zjooc.cn' && path === '/gxptLogin') {
    const box = '.login_box '
    const errors = '#error_msg'
    if (!matches) return { rules: [
      query('editable', box + 'input#login_name[type=text]'),
      query('editable', box + 'input#password[type=password]'),
      query('visible', box + 'button.dologin:enabled'),
      query('visible', '#login-warp .login-dialog'),
      query('text', errors, '验证码\\s*(?:输入\\s*)?(?:错误|有误|不正确|不匹配|不一致|无效|已?过期|已?失效)'),
      query('text', errors, '(?:用户名|账号|帐号|账户|密码)\\s*(?:输入\\s*)?(?:错误|有误|不正确|不匹配|不存在)|(?:用户名|账号|帐号|账户)\\s*(?:与|和|或)\\s*密码不一致'),
      query('text', errors, '\\S'),
      query('visible', box + '.forms.code input[name=captchaCode]'),
      ...(captureCaptcha ? [query('image', box + '.forms.code img[alt="点击刷新"]')] : []),
    ] }
    if (matches[3]) return { kind: 'reset' }
    if (matches[6]) return { kind: 'rejected', rejection: matches[4] ? 'captcha' : matches[5] ? 'credentials' : 'unknown' }
    const ready = matches[0] && matches[1] && matches[2]
    return { kind: ready ? 'form' : 'loading', challenge: matches[7] === true, imageRule: ready && matches[7] && matches[8] ? 8 : undefined }
  }
  if (origin !== 'https://www.zjooc.cn') return matches ? { kind: 'other' } : { rules: [] }
  const links = '.front-header-top .ta-r a'
  if (!matches) return { rules: [
    query('text', links, '^退出$'),
    query('visible', '.front-header-item .avators-item.identity_switching'),
    query('text', links, '^请登录$'),
  ] }
  return { kind: matches[0] || matches[1] ? 'space' : matches[2] ? 'guest' : 'loading' }
}

function* workflow({ verify, submittingCaptcha, restart }) {
  const home = 'https://www.zjooc.cn'
  const origin = 'https://background.zjooc.cn'
  const passport = origin + '/gxptLogin'
  const atForm = state => state.origin === origin && state.path === '/gxptLogin'
  const logged = { status: 'logged_in' }
  const manual = message => ({ status: 'manual', message })
  const stale = message => ({ status: 'stale', message })
  const reset = manual('在浙学要求修改密码，请在当前网页处理。')
  const wrong = manual('在浙学提示账号或密码有误，请在对话中重新填写。')
  const rejected = manual('在浙学显示登录错误，请核对网页提示。')
  const captchaRejected = manual('在浙学提示验证码有误或失效，请在网页刷新验证码后重试。')
  let state = yield { op: 'read', capture: submittingCaptcha }
  if (state.kind === 'space') return logged
  if (submittingCaptcha) {
    if (!atForm(state) || state.kind !== 'form' || !state.challenge || !(yield {
      op: 'submit', button: '.login_box button.dologin', captcha: '.login_box .forms.code input[name=captchaCode]',
    })) return stale('验证码或登录表单已变化，请重新获取图片。')
    for (let i = 0; i < 32; i++) {
      state = yield { op: 'read', delay: 375 }
      if (state.kind === 'space') return logged
      if (!atForm(state)) continue
      if (state.kind === 'reset') return reset
      if (state.rejection === 'credentials') { yield { op: 'reject_credentials' }; return wrong }
      if (state.rejection === 'captcha') return captchaRejected
      if (state.kind === 'rejected') return rejected
    }
    return manual('登录已提交，尚未确认账号已登录。')
  }
  if (verify) {
    for (let i = 0; i < 90; i++) {
      if (state.kind === 'space') return logged
      if (atForm(state) && state.kind === 'reset') return reset
      if (atForm(state) && state.rejection === 'credentials') { yield { op: 'reject_credentials' }; return wrong }
      if (!atForm(state) && state.origin !== home && state.kind !== 'loading') return manual('登录页已切换，请核对在浙学登录状态。')
      state = yield { op: 'read', delay: 2000 }
    }
    return state.kind === 'space' ? logged : manual('等待在浙学验证超时。')
  }
  const reopening = restart && atForm(state) && state.rejection === 'credentials'
  const previousDocument = state.document
  if (reopening || (!atForm(state) && state.origin !== home)) {
    yield { op: 'navigate', url: reopening ? passport : home }
    if (state.kind === 'unsupported') return manual('请在浏览器页面手动登录在浙学。')
    state = yield { op: 'read' }
  }
  let openedForm = false
  for (let i = 0; i < 40; i++) {
    if (state.kind === 'space') return logged
    if (!reopening || (atForm(state) && state.document !== previousDocument)) {
      if (atForm(state) && state.kind === 'reset') return reset
      if (atForm(state) && state.kind === 'rejected') {
        if (state.rejection === 'credentials') { yield { op: 'reject_credentials' }; return wrong }
        return state.rejection === 'captcha' ? captchaRejected : rejected
      }
      if (atForm(state) && state.kind === 'form' && state.document) break
      if (!openedForm && state.kind === 'guest' && state.origin === home && state.document) {
        openedForm = true
        if (!(yield { op: 'open_form', selector: '.front-header-top .ta-r a', label: '请登录' })) {
          return manual('未能打开在浙学登录页，请核对官网上的「请登录」入口。')
        }
      }
    }
    state = yield { op: 'read', delay: 250 }
  }
  if (!atForm(state) || state.kind !== 'form' || !state.document || (reopening && state.document === previousDocument)) {
    return manual('未确认在浙学的登录表单，请核对当前页面。')
  }
  const filled = yield {
    op: 'fill_credentials', account: '.login_box input#login_name[type=text]', password: '.login_box input#password[type=password]',
  }
  if (filled === 'missing') return manual('请在对话中填写「在浙学」的账号和密码。')
  if (filled !== 'filled') return manual('在浙学表单未能完成安全填写，请核对当前页面。')
  const current = yield { op: 'read', capture: true }
  if (!atForm(current) || current.kind !== 'form' || current.document !== state.document) return stale('在浙学登录页已变化。')
  if (current.challenge) {
    if (current.imageAvailable) yield { op: 'issue_captcha' }
    return { status: 'captcha', message: '请在浏览器完成在浙学验证码并点击登录。' }
  }
  return manual('已填写在浙学账号和密码，请核对当前页面并点击登录。')
}
