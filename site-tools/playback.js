const ZErrorSiteScript = {
  run({ mode, title, active, videos }) {
    return videos.filter(video => mode === 'section' ? !video.complete : title ? video.title === title : video.id === active).map(video => video.id)
  },
}
