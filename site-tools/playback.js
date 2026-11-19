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

  // src/playback.js
  var playback_exports = {};
  __export(playback_exports, {
    run: () => run,
    workflow: () => workflow
  });
  var paths = [
    ["course", "study", ":group", "plan", "detail", ":resource"],
    ["ucenter", "student", "course", "study", ":group", "plan", "detail", ":resource"],
    ["usercenter", "student", "course", "study", ":group", "plan", "detail", ":resource"]
  ];
  function run(input) {
    if (input.operation === "page_rules") return {
      routes: paths,
      optionalSegments: 1,
      root: ".plan-detailvideo",
      dialogs: '[role="dialog"], .el-message-box__wrapper, .el-dialog__wrapper',
      tabs: '.el-tabs__header [role="tab"]',
      panelAttribute: "aria-controls",
      panelPrefix: "pane-",
      active: "[aria-selected=true], .is-active",
      disabled: "[aria-disabled=true], .is-disabled",
      videoTab: ".icon-shipin",
      completedTab: ".icon-shipin.complete",
      player: ".contain-video"
    };
    const { mode, title, active, videos } = input;
    return videos.filter((video) => mode === "section" ? !video.complete : title ? video.title === title : video.id === active).map((video) => video.id);
  }
  function* workflow({ mode, title }) {
    let catalog;
    for (let attempt = 0; attempt < 24; attempt++) {
      catalog = yield { op: "catalog", delay: attempt ? 250 : 0 };
      if (catalog?.error) return { error: catalog.error };
      if (catalog?.videos) break;
    }
    if (!catalog?.videos) return { error: "\u5C0F\u8282\u7684\u89C6\u9891\u9875\u7B7E\u5C1A\u672A\u5C31\u7EEA\u3002" };
    const videos = catalog.videos;
    const items = run({ mode, title, videos, active: catalog.active });
    if (mode !== "section" && items.length !== 1) {
      return { error: title ? "\u8BF7\u6838\u5BF9\u89C6\u9891\u540D\u79F0\uFF0C\u5F53\u524D\u5C0F\u8282\u6CA1\u6709\u552F\u4E00\u5339\u914D\u3002" : "\u5F53\u524D\u9875\u7B7E\u4E0D\u662F\u89C6\u9891\uFF0C\u8BF7\u6307\u5B9A\u672C\u5C0F\u8282\u7684\u89C6\u9891\u540D\u79F0\u3002" };
    }
    if (!videos.length) return { error: "\u5F53\u524D\u5C0F\u8282\u6CA1\u6709\u89C6\u9891\u8BFE\u4EF6\u3002" };
    for (const id of items) {
      const result = yield { op: "play", id };
      if (!result.ok || result.playing) return result;
    }
    return { done: true };
  }
  return __toCommonJS(playback_exports);
})();
