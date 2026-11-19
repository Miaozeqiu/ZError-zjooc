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

  // src/login.js
  var login_exports = {};
  __export(login_exports, {
    run: () => run,
    workflow: () => workflow
  });
  function run(input) {
    if (input.operation === "observe") return observation(input);
    const { kind, atForm, atHome, frameReady, rejection } = input;
    if (kind === "space" && atHome) return "logged_in";
    if (atForm && kind === "reset") return "reset_password";
    if (atForm && kind === "rejected") return rejection === "credentials" || rejection === "captcha" ? rejection : "rejected";
    if (atForm && kind === "form" && frameReady) return "fill";
    if (atHome && kind === "guest" && frameReady) return "open_form";
    return "wait";
  }
  function observation({ origin, path, matches, captureCaptcha }) {
    const query = (kind, selector, pattern) => ({ kind, selector, pattern });
    if (origin === "https://background.zjooc.cn" && path === "/gxptLogin") {
      const box = ".login_box ";
      const errors = "#error_msg";
      if (!matches) return { rules: [
        query("editable", box + "input#login_name[type=text]"),
        query("editable", box + "input#password[type=password]"),
        query("visible", box + "button.dologin:enabled"),
        query("visible", "#login-warp .login-dialog"),
        query("text", errors, "\u9A8C\u8BC1\u7801\\s*(?:\u8F93\u5165\\s*)?(?:\u9519\u8BEF|\u6709\u8BEF|\u4E0D\u6B63\u786E|\u4E0D\u5339\u914D|\u4E0D\u4E00\u81F4|\u65E0\u6548|\u5DF2?\u8FC7\u671F|\u5DF2?\u5931\u6548)"),
        query("text", errors, "(?:\u7528\u6237\u540D|\u8D26\u53F7|\u5E10\u53F7|\u8D26\u6237|\u5BC6\u7801)\\s*(?:\u8F93\u5165\\s*)?(?:\u9519\u8BEF|\u6709\u8BEF|\u4E0D\u6B63\u786E|\u4E0D\u5339\u914D|\u4E0D\u5B58\u5728)|(?:\u7528\u6237\u540D|\u8D26\u53F7|\u5E10\u53F7|\u8D26\u6237)\\s*(?:\u4E0E|\u548C|\u6216)\\s*\u5BC6\u7801\u4E0D\u4E00\u81F4"),
        query("text", errors, "\\S"),
        query("visible", box + ".forms.code input[name=captchaCode]"),
        ...captureCaptcha ? [query("image", box + '.forms.code img[alt="\u70B9\u51FB\u5237\u65B0"]')] : []
      ] };
      if (matches[3]) return { kind: "reset" };
      if (matches[6]) return { kind: "rejected", rejection: matches[4] ? "captcha" : matches[5] ? "credentials" : "unknown" };
      const ready = matches[0] && matches[1] && matches[2];
      return { kind: ready ? "form" : "loading", challenge: matches[7] === true, imageRule: ready && matches[7] && matches[8] ? 8 : void 0 };
    }
    if (origin !== "https://www.zjooc.cn") return matches ? { kind: "other" } : { rules: [] };
    const links = ".front-header-top .ta-r a";
    if (!matches) return { rules: [
      query("text", links, "^\u9000\u51FA$"),
      query("visible", ".front-header-item .avators-item.identity_switching"),
      query("text", links, "^\u8BF7\u767B\u5F55$")
    ] };
    return { kind: matches[0] || matches[1] ? "space" : matches[2] ? "guest" : "loading" };
  }
  function* workflow({ verify, submittingCaptcha, restart }) {
    const home = "https://www.zjooc.cn";
    const origin = "https://background.zjooc.cn";
    const passport = origin + "/gxptLogin";
    const atForm = (state2) => state2.origin === origin && state2.path === "/gxptLogin";
    const logged = { status: "logged_in" };
    const manual = (message) => ({ status: "manual", message });
    const stale = (message) => ({ status: "stale", message });
    const reset = manual("\u5728\u6D59\u5B66\u8981\u6C42\u4FEE\u6539\u5BC6\u7801\uFF0C\u8BF7\u5728\u5F53\u524D\u7F51\u9875\u5904\u7406\u3002");
    const wrong = manual("\u5728\u6D59\u5B66\u63D0\u793A\u8D26\u53F7\u6216\u5BC6\u7801\u6709\u8BEF\uFF0C\u8BF7\u5728\u5BF9\u8BDD\u4E2D\u91CD\u65B0\u586B\u5199\u3002");
    const rejected = manual("\u5728\u6D59\u5B66\u663E\u793A\u767B\u5F55\u9519\u8BEF\uFF0C\u8BF7\u6838\u5BF9\u7F51\u9875\u63D0\u793A\u3002");
    const captchaRejected = manual("\u5728\u6D59\u5B66\u63D0\u793A\u9A8C\u8BC1\u7801\u6709\u8BEF\u6216\u5931\u6548\uFF0C\u8BF7\u5728\u7F51\u9875\u5237\u65B0\u9A8C\u8BC1\u7801\u540E\u91CD\u8BD5\u3002");
    let state = yield { op: "read", capture: submittingCaptcha };
    if (state.kind === "space") return logged;
    if (submittingCaptcha) {
      if (!atForm(state) || state.kind !== "form" || !state.challenge || !(yield {
        op: "submit",
        button: ".login_box button.dologin",
        captcha: ".login_box .forms.code input[name=captchaCode]"
      })) return stale("\u9A8C\u8BC1\u7801\u6216\u767B\u5F55\u8868\u5355\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u83B7\u53D6\u56FE\u7247\u3002");
      for (let i = 0; i < 32; i++) {
        state = yield { op: "read", delay: 375 };
        if (state.kind === "space") return logged;
        if (!atForm(state)) continue;
        if (state.kind === "reset") return reset;
        if (state.rejection === "credentials") {
          yield { op: "reject_credentials" };
          return wrong;
        }
        if (state.rejection === "captcha") return captchaRejected;
        if (state.kind === "rejected") return rejected;
      }
      return manual("\u767B\u5F55\u5DF2\u63D0\u4EA4\uFF0C\u5C1A\u672A\u786E\u8BA4\u8D26\u53F7\u5DF2\u767B\u5F55\u3002");
    }
    if (verify) {
      for (let i = 0; i < 90; i++) {
        if (state.kind === "space") return logged;
        if (atForm(state) && state.kind === "reset") return reset;
        if (atForm(state) && state.rejection === "credentials") {
          yield { op: "reject_credentials" };
          return wrong;
        }
        if (!atForm(state) && state.origin !== home && state.kind !== "loading") return manual("\u767B\u5F55\u9875\u5DF2\u5207\u6362\uFF0C\u8BF7\u6838\u5BF9\u5728\u6D59\u5B66\u767B\u5F55\u72B6\u6001\u3002");
        state = yield { op: "read", delay: 2e3 };
      }
      return state.kind === "space" ? logged : manual("\u7B49\u5F85\u5728\u6D59\u5B66\u9A8C\u8BC1\u8D85\u65F6\u3002");
    }
    const reopening = restart && atForm(state) && state.rejection === "credentials";
    const previousDocument = state.document;
    if (reopening || !atForm(state) && state.origin !== home) {
      yield { op: "navigate", url: reopening ? passport : home };
      if (state.kind === "unsupported") return manual("\u8BF7\u5728\u6D4F\u89C8\u5668\u9875\u9762\u624B\u52A8\u767B\u5F55\u5728\u6D59\u5B66\u3002");
      state = yield { op: "read" };
    }
    let openedForm = false;
    for (let i = 0; i < 40; i++) {
      if (state.kind === "space") return logged;
      if (!reopening || atForm(state) && state.document !== previousDocument) {
        if (atForm(state) && state.kind === "reset") return reset;
        if (atForm(state) && state.kind === "rejected") {
          if (state.rejection === "credentials") {
            yield { op: "reject_credentials" };
            return wrong;
          }
          return state.rejection === "captcha" ? captchaRejected : rejected;
        }
        if (atForm(state) && state.kind === "form" && state.document) break;
        if (!openedForm && state.kind === "guest" && state.origin === home && state.document) {
          openedForm = true;
          if (!(yield { op: "open_form", selector: ".front-header-top .ta-r a", label: "\u8BF7\u767B\u5F55" })) {
            return manual("\u672A\u80FD\u6253\u5F00\u5728\u6D59\u5B66\u767B\u5F55\u9875\uFF0C\u8BF7\u6838\u5BF9\u5B98\u7F51\u4E0A\u7684\u300C\u8BF7\u767B\u5F55\u300D\u5165\u53E3\u3002");
          }
        }
      }
      state = yield { op: "read", delay: 250 };
    }
    if (!atForm(state) || state.kind !== "form" || !state.document || reopening && state.document === previousDocument) {
      return manual("\u672A\u786E\u8BA4\u5728\u6D59\u5B66\u7684\u767B\u5F55\u8868\u5355\uFF0C\u8BF7\u6838\u5BF9\u5F53\u524D\u9875\u9762\u3002");
    }
    const filled = yield {
      op: "fill_credentials",
      account: ".login_box input#login_name[type=text]",
      password: ".login_box input#password[type=password]"
    };
    if (filled === "missing") return manual("\u8BF7\u5728\u5BF9\u8BDD\u4E2D\u586B\u5199\u300C\u5728\u6D59\u5B66\u300D\u7684\u8D26\u53F7\u548C\u5BC6\u7801\u3002");
    if (filled !== "filled") return manual("\u5728\u6D59\u5B66\u8868\u5355\u672A\u80FD\u5B8C\u6210\u5B89\u5168\u586B\u5199\uFF0C\u8BF7\u6838\u5BF9\u5F53\u524D\u9875\u9762\u3002");
    const current = yield { op: "read", capture: true };
    if (!atForm(current) || current.kind !== "form" || current.document !== state.document) return stale("\u5728\u6D59\u5B66\u767B\u5F55\u9875\u5DF2\u53D8\u5316\u3002");
    if (current.challenge) {
      if (current.imageAvailable) yield { op: "issue_captcha" };
      return { status: "captcha", message: "\u8BF7\u5728\u6D4F\u89C8\u5668\u5B8C\u6210\u5728\u6D59\u5B66\u9A8C\u8BC1\u7801\u5E76\u70B9\u51FB\u767B\u5F55\u3002" };
    }
    return manual("\u5DF2\u586B\u5199\u5728\u6D59\u5B66\u8D26\u53F7\u548C\u5BC6\u7801\uFF0C\u8BF7\u6838\u5BF9\u5F53\u524D\u9875\u9762\u5E76\u70B9\u51FB\u767B\u5F55\u3002");
  }
  return __toCommonJS(login_exports);
})();
