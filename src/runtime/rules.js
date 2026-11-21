import { observation } from './loginRules.js'
export const login = {
  observe: observation, formHost: 'background.zjooc.cn', entry: 'https://background.zjooc.cn/gxptLogin', homeLink: '.front-header-top .ta-r a',
  account: '.login_box input#login_name[type=text]', password: '.login_box input#password[type=password]', submit: '.login_box button.dologin:enabled',
  captcha: '.login_box .forms.code input[name=captchaCode]',
}
export const catalog = {
  // Course/homework list markup has not been verified; use the generic browser for those pages.
  courses: null, homework: null,
  chapters: { rows: '.el-tree-node.is-leaf > .el-tree-node__content', heading: '.el-tree-node__label', completed: '.complete' },
}
export const questions = {
  rows: '.common_look_main .questiono-item, .left_container > .question_content', heading: ':is(.questiono-header,.question_title)',
  types: { single: '单选|单项选择', multiple: '多选|多项选择|不定项', judgement: '判断', completion: '填空' },
  options: '.common_test_option, .radio_content', fields: '.pb10 input.el-input__inner[placeholder="此处输入答案"], .blanks_box input, .blanks_box textarea',
  selectedClass: '(?:^|\\s)(?:is-checked|checked|selected|active)(?:\\s|$)',
  visual: 'img,svg,canvas,math,mjx-container,.MathJax', review: '.common_test_correct + .common_test_html',
}
export const chapter = {
  completionScope: 'tabs',
  directoryRows: '.el-tree-node.is-leaf > .el-tree-node__content',
  directoryActive: '.el-tree-node.is-current.is-leaf > .el-tree-node__content', directoryDone: '.complete',
  rows: '.el-tabs__header [role="tab"]', active: '[aria-selected="true"]', done: '.icon-shipin.complete, .complete',
  tabs: '.el-tabs__header [role="tab"]', selectedTab: '(?:^|\\s)is-active(?:\\s|$)', disabledTab: '(?:^|\\s)is-disabled(?:\\s|$)',
  media: '.contain-video video, video, audio', question: questions.rows,
}
export const discussion = null
export const viewer = {
  next: '.plan-detailvideo .swiper-button-next:not(.swiper-button-disabled), .plan-detailvideo [aria-label="下一页"], .plan-detailvideo [title="下一页"]',
  viewport: '.plan-detailvideo #viewerContainer, .plan-detailvideo .document-viewer, #viewerContainer',
  marker: '.plan-detailvideo [aria-current="page"], #numPages, .swiper-slide-active', pageSelect: '',
}

export const paperRules = { title: '.common_look_title h6, .common_look_header .ft18, .top_title p', totalLabels: '.common_look_main .el-col', indexItems: '.index_box li' }
export function paperForURL(value) {
  const match = /^https:\/\/www\.zjooc\.cn(\/[^?#]*)/.exec(value)
  if (!match) return null
  const parts = match[1].split('/').filter(Boolean)
  if (parts.at(-2) === 'processStatus' && /^\d+$/.test(parts.at(-1))) parts.splice(-2)
  const prefix = parts[0] === 'course' ? 0 : ['ucenter', 'usercenter'].includes(parts[0]) && parts[1] === 'student' ? 2 : -1
  if (prefix < 0 || parts.length !== prefix + 6 || parts[prefix] !== 'course' || parts[prefix + 1] !== 'study' || !['homework', 'exam', 'singleQuestion'].includes(parts[prefix + 3]) || !['do', 'result'].includes(parts[prefix + 4]) || ![parts[prefix + 2], parts[prefix + 5]].every(value => /^[\w-]+$/.test(value))) return null
  const [courseId, kind, stage, paperId] = parts.slice(prefix + 2)
  return { courseId, kind, stage, paperId, single: kind === 'singleQuestion', url: 'https://www.zjooc.cn' + match[1], key: [courseId, kind, paperId].join('/') }
}
Object.assign(questions, { stem: ':is(.questiono-header h6 .processing_img,.questiono-header .processing_img,.question_title > span)', choiceText: ':is(.processing_img,p)',
  reviewMarker: '.common_test_correct', reviewLabel: '正确答案', number: '.questiono-header b', singleNumber: '.left_container > .question_title p',
  alternateType: 10, subjectTypes: { single: 1, multiple: 2, judgement: 3, completion: 7 } })

export const answerService = { lookup: '/originalJson', upload: '/upload' }


export const automations = [{ event: 'page', tool: 'sync_review' }]
