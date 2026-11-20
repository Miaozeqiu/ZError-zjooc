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
