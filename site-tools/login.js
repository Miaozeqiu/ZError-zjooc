const ZErrorSiteScript = {
  run({ kind, atForm, atHome, frameReady, rejection }) {
    if (kind === 'space' && atHome) return 'logged_in'
    if (atForm && kind === 'reset') return 'reset_password'
    if (atForm && kind === 'rejected') return rejection === 'credentials' || rejection === 'captcha' ? rejection : 'rejected'
    if (atForm && kind === 'form' && frameReady) return 'fill'
    if (atHome && kind === 'guest' && frameReady) return 'open_form'
    return 'wait'
  },
}
