<p align="left">
  <img src="https://github.com/wenxuanzhang1209-cyber/personal-life-hub/actions/workflows/ci.yml/badge.svg" />
  <img src="https://img.shields.io/github/license/wenxuanzhang1209-cyber/personal-life-hub" />
  <img src="https://img.shields.io/github/v/release/wenxuanzhang1209-cyber/personal-life-hub?label=release" />
</p>

# NORTH · 个人生活与工作中枢

这是一个本地优先的个人工作台，把工作、日常生活和私密记录放在同一条时间线上，同时用空间边界避免互相干扰。

## 已完成的产品能力

- 今日总览：三个结果、统一时间线、等待事项、风险项目、最近资料
- 日程：日视图、工作 / 生活 / 私密安排、未排时间任务
- 任务库：状态流转、优先级、截止日、项目上下文、快速新增
- 问题与决策：开放问题、等待外部、高风险、决策证据和状态
- 收件箱：拖入 / 选择文件、原件保留、待确认状态、分析抽屉
- 资料库：会议纪要、供应商简报、个人记录、生活文件、灵感库
- 项目与领域：工作项目、生活领域、项目进度和下一步
- 模板库：会议纪要、供应商尽调、周复盘、生活安排模板，可直接复制
- 复盘：完成、等待、风险项目和生活信号
- 全局搜索：项目、任务、文件
- 本地持久化：浏览器本地保存，支持 JSON 导出与导入备份
- 私密空间：单独的空间过滤；新增私密内容默认不进入文件助手分析

## 启动

```bash
npm install
npm run dev
```

打开终端输出的本地地址即可。生产构建：

```bash
npm run build
```

## 数据与权限边界

当前版本不会静默扫描整台电脑，也不会自动改写正式台账。文件拖入后只进入收件箱，分类、关联和确认由你决定。

下一阶段可以接入一个明确授权的本地目录桥接层：只读取用户授权的目录，记录文件指纹与变更，生成待确认建议，再由用户写入资料库。DOCX / PDF / PPTX / XLSX 的真实解析、页码引用和分析任务队列也应在这一层完成。

## 代码结构

- `src/App.tsx`：数据模型、种子数据、页面和交互逻辑
- `src/styles.css`：视觉系统、布局、响应式样式
- `src/vite-env.d.ts`：Vite 类型声明
- `dist/`：`npm run build` 生成的生产包

工作种子数据只使用会议纪要文件夹中已经出现的工作域，并把未经确认的内容标为“待确认”或“等待外部”；生活与私密种子数据只作为工作台演示结构，不代表任何真实完成状态。
