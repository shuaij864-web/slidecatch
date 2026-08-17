<div align="center">
  <img src="src/assets/icons/icon128.png" width="96" height="96" alt="SlideCatch 图标">
  <h1>SlideCatch｜课件捕手</h1>
  <p><strong>本地优先、显式授权、实时收集网页中已经加载的课件图片。</strong></p>
  <p>
    <a href="README.md">English</a> ·
    <a href="PRIVACY.md">隐私说明</a> ·
    <a href="docs/architecture.md">架构</a> ·
    <a href="docs/provider-development.md">平台适配开发</a>
  </p>
</div>

[![CI](https://github.com/shuaij864-web/slidecatch/actions/workflows/ci.yml/badge.svg)](https://github.com/shuaij864-web/slidecatch/actions/workflows/ci.yml)
[![CodeQL](https://github.com/shuaij864-web/slidecatch/actions/workflows/codeql.yml/badge.svg)](https://github.com/shuaij864-web/slidecatch/actions/workflows/codeql.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

SlideCatch 用于监听页面中**已经由浏览器实际加载**的课件图片，将图片本体和元数据缓存到本机，尽可能恢复页码顺序、提示疑似缺页，并导出 ZIP 或通过浏览器打印为 PDF。

它不是爬虫，也不绕过登录、数字版权管理、付费墙、课程权限或隐藏页面控制。

## 核心能力

- 实时观察 `<img>`、`srcset`、CSS `background-image`、浏览器资源记录，以及可选的大型 `<canvas>` 快照。
- 综合图片尺寸、宽高比、URL 家族、邻近页码文本和平台规则，排除 Logo、头像、图标、追踪像素等噪声。
- 将图片**本体**写入扩展自己的 IndexedDB；即使临时签名 URL 过期，已经缓存的页面仍然可用。
- 同时按规范化资源 URL 与 SHA-256 内容哈希去重，老师前后翻页不会重复保存。
- 识别 `第 21 页`、`Slide 9 of 40`、HTML 属性、文件名和平台自定义规则中的页码。
- 仅提示疑似缺页，不猜 URL、不枚举老师尚未展示或平台尚未下发的页面。
- 网站被停用或域名权限被撤销时，立即终止当前页面中已经运行的收集器。
- 导出按序图片 ZIP，并附带 `slidecatch-manifest.json`；也可调用浏览器“打印 / 另存为 PDF”。
- 内置雨课堂 / Yuketang 适配器，同时提供通用网页识别模式和自定义平台规则。
- 无服务器、无遥测、无分析 SDK、无广告、无远程执行代码。

## 能力边界

| 场景 | 状态 | 说明 |
|---|---:|---|
| 通用网页图片式课件 | 已支持 | 适用于页面以图片或 CSS 背景图呈现课件的情况。 |
| 雨课堂 / Yuketang | 已支持 | 识别课程会话与 `/slide/` 类 CDN 资源。 |
| 自定义平台规则 | 已支持 | 可在本地 JSON 中定义域名、资源 URL、会话和页码规则。 |
| Canvas 画布渲染 | 可选 | 默认关闭；跨域污染画布可能无法导出。 |
| 跨域 iframe、仅存在于 Shadow DOM 的渲染器 | v0.1 暂不支持 | 当前只扫描顶层页面的普通 DOM。 |
| 视频、加密、DRM、服务端受保护内容 | 不支持 | 不绕过任何访问控制。 |
| 恢复原始可编辑 PPT | 不支持 | 图片无法无损恢复动画、文本框、字体和母版对象。 |

## 安装

1. 下载 Release ZIP 并解压，或在源码目录运行 `npm run build`。
2. Chrome 打开 `chrome://extensions/`。
3. 开启右上角“开发者模式”。
4. 点击“加载已解压的扩展程序”，选择解压目录或本仓库的 `dist/`。
5. 可按需固定扩展图标。

生产版安装时**不直接获取任何网站权限**。首次使用时，在目标课件页面点击 SlideCatch →“在此网站启用”。Chrome 只会询问当前平台所需域名。若课件图片来自另一个 CDN，插件会列出资源域名并再次要求显式授权。

## 直播授课时的使用流程

1. 打开你有权访问的课程课件页面。
2. 点击 SlideCatch →“在此网站启用”。
3. 保持课程页面打开。老师继续翻页时，徽标和右下角浮层会自动增加已缓存页数。
4. 对采用缩略图懒加载的平台，下课前从头到尾滚动一次缩略图列表，再点“立即扫描”。
5. 打开“资料库 / 导出”，检查页码和疑似缺页，再下载 ZIP 或打印为 PDF。

“疑似缺页”只表示已识别页码不连续，不等于插件一定漏抓。课件可能故意不编号、跳号或包含无页码页面。

## 权限与隐私

生产版清单：

```json
{
  "permissions": ["activeTab", "scripting", "storage", "unlimitedStorage"],
  "optional_host_permissions": ["http://*/*", "https://*/*"]
}
```

`optional_host_permissions` 只是声明插件**允许向用户申请**哪些类型的网站权限，并不等于安装时获得全网访问权。权限必须由用户在扩展弹窗中的点击动作触发，且只在用户批准后注册持久化内容脚本。停用网站或在浏览器中撤销域名权限后，插件会停止当前已运行的收集器，并拒绝后续会话注册。详见 [docs/permissions.md](docs/permissions.md)。

本地数据位置：

- 课件图片与元数据：扩展源下的 IndexedDB；
- 设置与已授权网站：`chrome.storage.local`；
- 当前标签页与会话映射：`chrome.storage.session`；
- 上传服务器：无；
- 遥测：无；
- 远程 JavaScript / WASM：无。

详见 [PRIVACY.md](PRIVACY.md)。

## 开发与验证

要求：Node.js 20+。构建过程为零第三方依赖，仓库内含一个确定性的轻量 ES 模块打包器和 ZIP 生成器。

```bash
npm ci
npm run lint
npm test
npm run build
npm run validate
npm run package
npm run verify:release
```

输出：

```text
dist/                         可加载的生产版扩展目录
release/slidecatch-v0.1.0.zip 发布 ZIP
```

真实 Chromium 的内容脚本与弹窗验证：

```bash
npm run test:e2e
```

在常规 CI 环境进行完整“加载未打包扩展”测试：

```bash
python -m pip install playwright==1.57.0
python -m playwright install --with-deps chromium
npm run test:extension
```

当前云端验证结果与限制见 [docs/CLOUD_VALIDATION.md](docs/CLOUD_VALIDATION.md) 和 [VALIDATION_REPORT.md](VALIDATION_REPORT.md)。

## 架构

```text
src/
├── core/          评分、页码、排序、存储、URL 规范化
├── content/       DOM/资源监听与页面浮层
├── background/    权限、抓取、去重、持久化、消息路由
├── providers/     通用、雨课堂和用户自定义适配器
├── export/        零依赖 ZIP 生成器
└── ui/            弹窗、资料库、设置页
```

平台相关知识被隔离在 `src/providers/`，核心收集器不写死雨课堂结构。新增平台只需实现位置匹配、权限规划、会话标识、资源评分、URL 规范化和页码提取接口。详见 [docs/provider-development.md](docs/provider-development.md)。

## 安全与合规边界

仅用于你有权访问和保存的内容。本项目有意不实现：

- 绕过登录、付费墙、DRM、加密或课程权限；
- 枚举未发布、未下发或未展示的页面；
- 猜测签名 URL；
- 在浏览器权限模型之外重放身份凭据；
- 从图片恢复原始可编辑 PPT 对象。

网页属于不可信输入。SlideCatch 采用图片大小上限、保守的匹配模式校验、内容安全策略、禁止动态执行代码、禁止远程代码、内容哈希和显式域名授权。扩展新抓取机制前请审查 [docs/threat-model.md](docs/threat-model.md)。

## 许可证

MIT，见 [LICENSE](LICENSE)。

SlideCatch 是独立开源项目，与雨课堂、Yuketang 及其运营方不存在隶属或合作关系。
