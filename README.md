# ZError · 在浙学网站能力包

在浙学（zjooc.cn）的可复用操作经验、导航图谱与网站图标。通用经验整理自 ZError 的在浙学内置资源，使用标准 `SKILL.md`，需要 ZError 提供的浏览器、凭据与事件等待工具。

## 仓库内容

```text
skills/zjooc/
├── website.json        网站身份与图标路径
├── SKILL.md            操作经验
├── site-graph.json     导航图谱
└── assets/icon.ico     在浙学图标
```

支持网站仓库导入的 ZError 版本可在「设置 → Agent → 网站 → 导入 GitHub 仓库」中粘贴本仓库链接，预览网站名称、域名和图标后确认导入。软件会缓存完整版本，离线可用；Agent 的修改保存到本地分支，不自动上传。较旧版本不支持该入口。

## 网站仓库格式

在 `skills/<id>/`、`.agents/skills/<id>/` 或仓库根目录中提供 `website.json`：

```json
{ "version": 1, "id": "zjooc", "name": "在浙学", "host": "zjooc.cn", "icon": "assets/icon.ico" }
```

同目录必须有 `SKILL.md` 与 `site-graph.json`。Skill 的 name、图谱的 id 和网站 id 一致；图谱 host 与网站 host 一致。图标必须是仓库内 `assets/` 下的 PNG、ICO、JPEG、WebP 或 GIF 文件，最多 256 KB，不使用外链。可选细则放在 `references/<名称>.md`。

通用规则采用 MIT，保留原 ZError 版权声明。图标取自对应网站，仅作网站标识，品牌权利归其权利人。

维护时只保存已验证的通用步骤，不保存账号、密码、Token、个人学习记录、具体课程答案或临时 DOM 引用。不提供题卡、解析器或模拟测试网页。校验：`npm test`。

## 工具发布

`site-tools/tools.json` 定义 Agent 工具，`site-tools/*.js` 提供隔离脚本。Open 从同一 Git 提交同步这些文件。凭据、页面动作和提交授权由 ZError 宿主核验。
