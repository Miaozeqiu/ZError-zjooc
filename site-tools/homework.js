var ZErrorSiteScript = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/homework.js
  var homework_exports = {};
  __export(homework_exports, {
    run: () => run,
    workflow: () => workflow
  });
  var rules = {
    routes: [
      ["course", "study", ":course", ":kind", ":stage", ":paper"],
      ["ucenter", "student", "course", "study", ":course", ":kind", ":stage", ":paper"],
      ["usercenter", "student", "course", "study", ":course", ":kind", ":stage", ":paper"]
    ],
    optionalSuffix: "processStatus",
    kinds: ["homework", "exam", "singleQuestion"],
    singleKind: "singleQuestion",
    exerciseStage: "do",
    reviewStage: "result",
    reviewReady: ".common_test_correct + .common_test_html",
    singleRows: ".left_container > .question_content",
    rows: ".common_look_main .questiono-item",
    title: ".common_look_title h6, .common_look_header .ft18, .top_title p",
    singleNumber: ".left_container > .question_title p",
    rowNumber: ".questiono-header b",
    stem: ".questiono-header h6 .processing_img, .questiono-header .processing_img, .question_title > span",
    fields: '.pb10 input.el-input__inner[placeholder="\u6B64\u5904\u8F93\u5165\u7B54\u6848"], .blanks_box input, .blanks_box textarea',
    choices: ".common_test_option, .radio_content",
    choiceText: ".processing_img, p",
    judgeLabels: ["\u6B63\u786E", "\u9519\u8BEF", "\u5BF9", "\u9519"],
    questionGroup: ".common-question",
    unsupportedGroups: ["\u542C\u529B", "\u6750\u6599\u9898", "\u5B8C\u578B", "\u5B8C\u5F62", "\u7B80\u7B54"],
    excluded: "img,video,audio,.questiono-item,.questiono-header a[href],.question_title a[href]",
    questionBody: ".questiono-main",
    reviewMarker: ".common_test_correct",
    reviewLabel: "\u6B63\u786E\u7B54\u6848",
    reviewAnswer: ".common_test_html",
    alternateMultipleLabel: "\u4E0D\u5B9A\u9879",
    subjectTypes: { alternate: 10, single: 1, multiple: 2, judgement: 3, completion: 7 },
    totalLabels: ".common_look_main .el-col",
    indexItems: ".index_box li",
    next: ".question_btn button",
    nextLabel: "\u4E0B\u4E00\u9898"
  };
  function run(input) {
    if (input.operation === "paper_rules") return rules;
    if (input.operation === "review_page") {
      const parts = input.path.split("/").filter(Boolean);
      if (parts.at(-2) === rules.optionalSuffix && /^\d+$/.test(parts.at(-1))) parts.splice(-2);
      return input.origin === "https://www.zjooc.cn" && rules.routes.some((route) => route.length === parts.length && route.every((part, index) => {
        if (part === ":stage") return parts[index] === rules.reviewStage;
        if (part === ":kind") return ["homework", "exam"].includes(parts[index]);
        return part.startsWith(":") ? /^[\w-]+$/.test(parts[index]) : part === parts[index];
      }));
    }
    return input.questions.map((question) => ({
      index: question.index,
      action: !question.supported ? "needs_review" : question.answered ? "existing_answer" : "resolve"
    }));
  }
  function* workflow() {
    const batch = yield { op: "read" };
    if (!batch?.questions) return { done: false };
    for (const question of run(batch)) {
      if (question.action !== "resolve") {
        yield { op: "record", index: question.index, status: question.action };
        continue;
      }
      let found = false;
      for (const source of ["review", "server", "local_bank", "model"]) {
        const result = yield { op: "lookup", index: question.index, source };
        if (result?.error) return { error: result.error };
        if (result?.found) {
          const receipt = yield { op: "fill", index: question.index };
          if (!receipt?.ok) return receipt;
          found = true;
          break;
        }
      }
      if (!found) yield { op: "record", index: question.index, status: "needs_review" };
    }
    return { done: true };
  }
  return __toCommonJS(homework_exports);
})();
