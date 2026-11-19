const ZErrorSiteScript = {
  run({ questions }) {
    return questions.map(question => ({
      index: question.index,
      action: !question.supported ? 'needs_review' : question.answered ? 'existing_answer' : 'resolve',
    }))
  },
}
