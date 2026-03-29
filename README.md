# MyApplyDashboard

一个用于批量投递简历的多网站并行 Vue 单页应用

## ✨ 功能特性

- 🚀 **多站并行** - 同时打开多个招聘/投递网站，提升效率
- 📱 **响应式布局** - 自适应不同屏幕尺寸，移动端自动单列展示
- 🎯 **独立操作** - 每个窗口支持独立的刷新、缩放、跳转等操作
- 🔧 **灵活配置** - 通过简单的配置文件即可自定义网站列表
- ⚡ **快速加载** - 使用 Vite 构建工具，开发体验优秀

## 🖼️ 界面预览

![界面预览](./dist/assets/hero.png)

## 🛠️ 技术栈

- **Vue 3** - 渐进式 JavaScript 框架
- **Vite** - 下一代前端构建工具
- **CSS3** - 现代化样式设计

## 📦 安装与使用

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd MyApplyDashboard
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置网站地址

编辑 `src/config/sites.js` 文件，添加你想要同时打开的网站：

```js
export default [
  { 
    id: 'boss', 
    title: 'BOSS 直聘', 
    url: 'https://www.zhipin.com' 
  },
  { 
    id: 'lagou', 
    title: '拉勾网', 
    url: 'https://www.lagou.com' 
  },
  { 
    id: '51job', 
    title: '前程无忧', 
    url: 'https://www.51job.com' 
  }
]
```

**配置说明：**
- `id`: 站点唯一标识符（可选，自动生成）
- `title`: 站点标题，显示在面板顶部
- `url`: 站点网址，支持 http/https

### 4. 启动开发服务器

```bash
npm run dev
```

浏览器访问显示的本地地址即可使用（通常是 `http://localhost:5173`）

### 5. 生产环境打包

```bash
npm run build
```

打包后的文件位于 `dist/` 目录，可部署到任意静态资源服务器

## 🎮 使用说明

### 控制面板功能

每个网站面板都提供以下操作按钮：

- **刷新** - 重新加载当前网页
- **缩小** - 缩小页面显示比例（最小 60%）
- **放大** - 放大页面显示比例（最大 180%）
- **1:1** - 重置缩放比例为 100%
- **新开** - 在新标签页中打开当前网站
- **地址栏** - 手动输入网址并跳转

### 快捷键提示

当前版本暂未设置快捷键，所有操作通过点击按钮完成

## ⚠️ 注意事项

### iframe 限制问题

部分网站设置了 `X-Frame-Options` 或 `CSP frame-ancestors` 安全策略，会拒绝在 iframe 中嵌入。

常见无法嵌入的网站：
- 知乎
- 百度
- 淘宝/天猫
- 大部分政府网站

**解决方案：**
- 使用面板右上角的 `新开` 按钮，在新标签页中打开网站
- 或使用浏览器的"允许在不安全的网站上运行"等扩展插件

### 跨域问题

由于浏览器同源策略限制，不同网站之间无法进行数据交互。每个 iframe 都是完全独立的浏览环境。

## 📁 项目结构

```
MyApplyDashboard/
├── public/              # 静态资源
├── src/
│   ├── assets/         # 图片等资源
│   ├── components/     # Vue 组件
│   ├── config/
│   │   └── sites.js    # 网站配置文件 ⭐
│   ├── App.vue         # 主应用组件
│   ├── main.js         # 入口文件
│   └── style.css       # 全局样式
├── index.html          # HTML 模板
├── package.json        # 项目依赖
└── vite.config.js      # Vite 配置
```

## 🔌 扩展建议

如果你想要进一步增强功能，可以考虑：

- 添加localStorage 持久化保存网址配置
- 增加预设网站模板，一键切换不同场景
- 添加拖拽排序功能，自定义面板布局
- 集成书签管理功能
- 添加搜索功能，快速定位特定网站

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

MIT License

## 🙏 致谢

感谢所有为开源社区做出贡献的开发者！

---

**💡 使用技巧：** 配合浏览器的"同时打开多个标签页"扩展使用效果更佳！
