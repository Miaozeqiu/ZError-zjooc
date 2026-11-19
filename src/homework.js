const rules = {
  routes: [
    ['course', 'study', ':course', ':kind', ':stage', ':paper'],
    ['ucenter', 'student', 'course', 'study', ':course', ':kind', ':stage', ':paper'],
    ['usercenter', 'student', 'course', 'study', ':course', ':kind', ':stage', ':paper'],
  ],
  optionalSuffix: 'processStatus',
  kinds: ['homework', 'exam', 'singleQuestion'], singleKind: 'singleQuestion',
  exerciseStage: 'do', reviewStage: 'result',
  reviewReady: '.common_test_correct + .common_test_html',
  singleRows: '.left_container > .question_content', rows: '.common_look_main .questiono-item',
  title: '.common_look_title h6, .common_look_header .ft18, .top_title p',
  singleNumber: '.left_container > .question_title p', rowNumber: '.questiono-header b',
  stem: '.questiono-header h6 .processing_img, .questiono-header .processing_img, .question_title > span',
  fields: '.pb10 input.el-input__inner[placeholder="此处输入答案"], .blanks_box input, .blanks_box textarea',
  choices: '.common_test_option, .radio_content', choiceText: '.processing_img, p',
  judgeLabels: ['正确', '错误', '对', '错'], questionGroup: '.common-question',
  unsupportedGroups: ['听力', '材料题', '完型', '完形', '简答'],
  excluded: 'img,video,audio,.questiono-item,.questiono-header a[href],.question_title a[href]',
  questionBody: '.questiono-main',
  reviewMarker: '.common_test_correct', reviewLabel: '正确答案', reviewAnswer: '.common_test_html',
  alternateMultipleLabel: '不定项', subjectTypes: { alternate: 10, single: 1, multiple: 2, judgement: 3, completion: 7 },
  totalLabels: '.common_look_main .el-col', indexItems: '.index_box li',
  next: '.question_btn button', nextLabel: '下一题',
}

export function run(input) {
  if (input.operation === 'paper_rules') return rules
  if (input.operation === 'review_page') {
    const parts = input.path.split('/').filter(Boolean)
    if (parts.at(-2) === rules.optionalSuffix && /^\d+$/.test(parts.at(-1))) parts.splice(-2)
    return input.origin === 'https://www.zjooc.cn'
      && rules.routes.some(route => route.length === parts.length && route.every((part, index) => {
        if (part === ':stage') return parts[index] === rules.reviewStage
        if (part === ':kind') return ['homework', 'exam'].includes(parts[index])
        return part.startsWith(':') ? /^[\w-]+$/.test(parts[index]) : part === parts[index]
      }))
  }
  return input.questions.map(question => ({
    index: question.index,
    action: !question.supported ? 'needs_review' : question.answered ? 'existing_answer' : 'resolve',
  }))
}

export function* workflow() {
  const batch = yield { op: 'read' }
  if (!batch?.questions) return { done: false }
  for (const question of run(batch)) {
    if (question.action !== 'resolve') {
      yield { op: 'record', index: question.index, status: question.action }
      continue
    }
    let found = false
    for (const source of ['review', 'server', 'local_bank', 'model']) {
      const result = yield { op: 'lookup', index: question.index, source }
      if (result?.error) return { error: result.error }
      if (result?.found) {
        const receipt = yield { op: 'fill', index: question.index }
        if (!receipt?.ok) return receipt
        found = true
        break
      }
    }
    if (!found) yield { op: 'record', index: question.index, status: 'needs_review' }
  }
  return { done: true }
}
