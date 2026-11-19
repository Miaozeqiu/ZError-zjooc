const paths = [
  ['course', 'study', ':group', 'plan', 'detail', ':resource'],
  ['ucenter', 'student', 'course', 'study', ':group', 'plan', 'detail', ':resource'],
  ['usercenter', 'student', 'course', 'study', ':group', 'plan', 'detail', ':resource'],
]

const ZErrorSiteScript = {
  run(input) {
    if (input.operation === 'page_rules') return {
      routes: paths, optionalSegments: 1, root: '.plan-detailvideo',
      dialogs: '[role="dialog"], .el-message-box__wrapper, .el-dialog__wrapper',
      tabs: '.el-tabs__header [role="tab"]', panelAttribute: 'aria-controls', panelPrefix: 'pane-',
      active: '[aria-selected=true], .is-active', disabled: '[aria-disabled=true], .is-disabled',
      videoTab: '.icon-shipin', completedTab: '.icon-shipin.complete', player: '.contain-video',
    }
    const { mode, title, active, videos } = input
    return videos.filter(video => mode === 'section' ? !video.complete : title ? video.title === title : video.id === active).map(video => video.id)
  },
  *workflow({ mode, title }) {
    let catalog
    for (let attempt = 0; attempt < 24; attempt++) {
      catalog = yield { op: 'catalog', delay: attempt ? 250 : 0 }
      if (catalog?.error) return { error: catalog.error }
      if (catalog?.videos) break
    }
    if (!catalog?.videos) return { error: '小节的视频页签尚未就绪。' }
    const videos = catalog.videos
    const items = ZErrorSiteScript.run({ mode, title, videos, active: catalog.active })
    if (mode !== 'section' && items.length !== 1) {
      return { error: title ? '请核对视频名称，当前小节没有唯一匹配。' : '当前页签不是视频，请指定本小节的视频名称。' }
    }
    if (!videos.length) return { error: '当前小节没有视频课件。' }
    for (const id of items) {
      const result = yield { op: 'play', id }
      if (!result.ok || result.playing) return result
    }
    return { done: true }
  },
}
