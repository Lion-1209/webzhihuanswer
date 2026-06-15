# 知乎问答助手 (Edge 插件)

一个运行在 Edge 浏览器中的知乎问答助手插件，可以自动分析知乎网页端的问题，并生成贴近真人风格的知乎回答，支持一键提交。

## 功能特性

- **悬浮球开关**：右下角悬浮球，不干扰知乎页面布局
- **AI 问答面板**：三标签页设计（问答 / 设置 / 历史）
- **真人风格回答**：口语化、接地气，不像 AI 生成的
- **一键提交**：生成回答后可直接发布到知乎
- **多模型支持**：兼容 OpenAI 接口，支持 DeepSeek、StepFun 等国内模型
- **历史记录**：本地保存问答历史，支持再次提问

## 安装方式

### 方式一：开发者模式加载（推荐）

1. 下载本项目 ZIP 包（ Releases 页面下载）
2. 解压到任意目录
3. 打开 Edge，地址栏输入 `edge://extensions`
4. 开启右上角「开发者模式」
5. 点击「加载解压缩的扩展」
6. 选择解压后的目录

### 方式二：一键安装脚本

Windows 用户双击运行 `install.ps1`，自动完成加载。

## 使用步骤

1. 点击右下角蓝色悬浮球「💬 AI 问答」
2. 切到「⚙️ 设置」标签页，填写：
   - **Base URL**：API 地址，如 `https://api.deepseek.com` 或 `https://api.stepfun.com`
   - **Model**：模型名称，如 `deepseek-chat` 或 `step-3.7-flash`
   - **API Key**：你的 API 密钥
3. 点击「测试连接」验证配置
4. 回到「💬 问答」标签页，点击「分析当前问题」
5. 满意后点击「🚀 一键提交回答」

## 打包成 ZIP

```bash
# PowerShell
.\build.ps1

# 或手动打包
Compress-Archive -Path manifest.json,background.js,content.js,content.css,popup.html,popup.js,options.html,options.js,icons/* -DestinationPath zhihu-assistant.zip
```

## 注意事项

- 知乎的反爬机制可能会检测自动化操作，首次使用建议先手动确认内容再提交
- 配置信息保存在本地浏览器中，不会上传到任何服务器
- 请遵守知乎社区规范，合理使用 AI 辅助

## License

MIT
