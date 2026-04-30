# Contributing to SoulClone

感谢你的兴趣。在提交贡献之前，请阅读以下指南。

## 我们在找什么

SoulClone 不是"缺人手"。我们在找**相信社交应该更像灵魂而非表演**的人。

- **视觉设计师**：把"Liquid Dark Matter"推进到每一个像素
- **前端工程师**：React 19 + Framer Motion + Web Audio API，让界面有呼吸感
- **AI 工程师**：人格蒸馏、情感记忆、长期关系维护——不是 prompt engineering
- **全栈工程师**：FastAPI + PostgreSQL + Redis，毫秒级响应

如果你不确定自己适合哪个角色，直接在 Issue 里问："我想加入，我能做什么？"

## 开发环境

确保你已安装：

- Node.js 20+
- Python 3.12+
- Docker & Docker Compose

## 设计审查

**任何 UI 变更必须通过 AGENTS.md 审查。**

提交 PR 时，请回答：
1. 这个变更符合 Liquid Dark Matter 的哪一条原则？
2. 它使用了设计系统中的哪个组件/变体？
3. 它的空状态/错误状态/加载状态是什么？

## 代码检查

```bash
# 后端
cd backend
ruff check .
ruff format .

# 前端
cd frontend
npx tsc --noEmit
npx vite build
```

## 提交规范

使用以下类型前缀：

- `feat:` 新功能
- `fix:` 修复
- `design:` 设计/视觉变更（新增）
- `docs:` 文档
- `style:` 代码格式
- `refactor:` 重构
- `test:` 测试
- `chore:` 构建/工具

## 提交 PR

1. Fork 仓库并创建功能分支
2. 确保所有检查通过
3. 在 PR 描述中告诉我们：**你为什么在乎这件事？**
4. 如果是 UI 变更，附上截图或录屏

## 设计规范

UI 变更需遵循 **Liquid Dark Matter** 设计系统：

- 背景色：`#050508`
- 卡片表面：`#0a0a10`
- 强调色：Cyan `#00f0ff` / Magenta `#ff006e` / Gold `#ffbe0b`
- 标题字体：Sora + Noto Serif SC
- 正文字体：Inter
- 数据字体：JetBrains Mono
- 每页必须有 **One More Thing**（超出预期的细节）

完整规范见 [AGENTS.md](AGENTS.md)。
