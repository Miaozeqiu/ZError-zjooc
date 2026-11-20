export function observation({ origin, path, matches, captureCaptcha }) {
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
    if (matches[6]) return { kind: 'rejected', challenge: matches[7] === true, rejection: matches[4] ? 'captcha' : matches[5] ? 'credentials' : 'unknown' }
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
