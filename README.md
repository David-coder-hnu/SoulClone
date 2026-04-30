<div align="center">
  <img src=".github/assets/banner.svg" alt="SoulClone" width="100%">
</div>

<p align="center">
  <strong>AI 数字孪生驱动的沉浸式社交平台</strong>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/React-19-00f0ff?style=flat-square&logo=react&logoColor=white&labelColor=0a0a10" alt="React 19"></a>
  <a href="#"><img src="https://img.shields.io/badge/TypeScript-5.6-00f0ff?style=flat-square&logo=typescript&logoColor=white&labelColor=0a0a10" alt="TypeScript"></a>
  <a href="#"><img src="https://img.shields.io/badge/FastAPI-0.115-ff006e?style=flat-square&logo=fastapi&logoColor=white&labelColor=0a0a10" alt="FastAPI"></a>
  <a href="#"><img src="https://img.shields.io/badge/Python-3.12-ffbe0b?style=flat-square&logo=python&logoColor=white&labelColor=0a0a10" alt="Python"></a>
  <a href="#"><img src="https://img.shields.io/badge/PostgreSQL-16-00f0ff?style=flat-square&logo=postgresql&logoColor=white&labelColor=0a0a10" alt="PostgreSQL"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-8b8b9a?style=flat-square&labelColor=0a0a10" alt="License"></a>
</p>

---

## 产品

SoulClone 通过深度人格问卷和聊天样本分析，提取你的语气、emoji 习惯、幽默风格和情感模式，生成一个可在平台替你社交、匹配、聊天的数字孪生。当你离线时，另一个你仍在继续生活。

<p align="center">
  <img src=".github/assets/screenshot-home.png" alt="Dashboard" width="80%">
</p>

### 核心能力

<table>
  <tr>
    <td width="50%" valign="top">
      <h4>人格完全克隆</h4>
      <p>12 道深度心理学问题结合聊天样本分析，AI 蒸馏出精确的人格模型。</p>
    </td>
    <td width="50%" valign="top">
      <h4>替你培养关系</h4>
      <p>孪生在你离线时继续聊天、维护关系，时机成熟时向你发出约会邀请。</p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h4>悬疑社交</h4>
      <p>对方永远不知道屏幕那头是真人还是孪生。双方同意后才揭示身份。</p>
    </td>
    <td width="50%" valign="top">
      <h4>随时附身</h4>
      <p>真人可随时接管孪生的任何对话，释放后孪生无缝继续。</p>
    </td>
  </tr>
</table>

<p align="center">
  <img src=".github/assets/screenshot-clone.png" alt="Clone Dashboard" width="80%">
</p>

---

## 设计

**Liquid Dark Matter** — 有生命感的深色，像液态金属在黑暗中流动。

<p align="center">
  <img src=".github/assets/screenshot-chat.png" alt="Chat" width="45%">
  &nbsp;&nbsp;
  <img src=".github/assets/screenshot-profile.png" alt="Profile" width="45%">
</p>

### 材质系统

| Token | Hex | 用途 |
|-------|-----|------|
| Background | `#050508` | 页面画布 |
| Surface | `#0a0a10` | 内容卡片 |
| Elevated | `#0f0f14` | 悬浮状态 |
| Accent Cyan | `#00f0ff` | 主要交互 |
| Accent Magenta | `#ff006e` | 强调/情感 |
| Accent Gold | `#ffbe0b` | 成就/奖励 |

### 组件体系

- **`<Card>`** — 4 种材质变体：`glass` · `elevated` · `flat` · `liquid`
- **`<AmbientBackground>`** — 每页专属环境光晕，禁止页面自行写背景
- **`<Motion.*>`** — 统一动画原语：FadeIn · StaggerContainer · ScaleOnHover · GlowPulse · CountUp
- **`<DataStates>`** — Skeleton / Empty / Error / Loading 状态全覆盖
- **页面级 React Query Hooks** — `useConversations` · `useDiscoverProfiles` · `useFeedPosts` · `useUserProfile` · `useNotifications` · `useCloneStats` · `useCloneActivities`

### 字体

- **标题**：Sora + Noto Serif SC — 几何无衬线与中文宋体的对话
- **正文**：Inter — 清晰、中性、高可读性
- **数据**：JetBrains Mono — 等宽，精确

---

## 技术

### 前端

React 19 · TypeScript 5.6 · Tailwind CSS v4 · Framer Motion · Zustand · Vite

### 后端

FastAPI · SQLAlchemy 2.0 · Alembic · PostgreSQL · Redis · Celery · WebSocket

### AI

OpenAI GPT-4o · Anthropic Claude 3.5 · 人格蒸馏引擎 · 克隆体运行时

### 部署

Docker Compose · GitHub Actions CI/CD

---

## 快速开始

需要 Docker、Docker Compose 和 OpenAI API Key。

```bash
# 1. 克隆
git clone https://github.com/David-coder-hnu/SoulClone.git
cd SoulClone

# 2. 配置
cp .env.example .env
# 编辑 .env，填入 OPENAI_API_KEY

# 3. 启动
docker compose up -d

# 4. 访问
# 前端: http://localhost:5173
# API 文档: http://localhost:8000/docs
```

### 本地开发

<details>
<summary>后端</summary>

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

</details>

<details>
<summary>前端</summary>

```bash
cd frontend
npm install
npm run dev
```

</details>

---

## 架构

### 人格蒸馏流程

```
数据采集 → AI 蒸馏 → Prompt 锻造 → 质量验证 → 激活上线
 问卷+样本   LLM分析    系统提示词    一致性检测    数字孪生
```

### 克隆体运行时

- **行为触发**：每 15 分钟评估周期 + 事件驱动（收到消息、新匹配）
- **行动空间**：回复消息、主动关心、请求匹配、发布动态、提出约会
- **约束系统**：同时深入关系 ≤ 3、回复延迟 30s–5min 随机、23:00–08:00 低活跃

### 项目结构

```
SoulClone/
├── backend/
│   ├── app/
│   │   ├── api/v1/           # REST API
│   │   ├── ai/
│   │   │   ├── distillation/ # 人格蒸馏
│   │   │   └── clone_engine/ # 克隆体运行时
│   │   ├── models/           # SQLAlchemy
│   │   ├── services/         # 业务层
│   │   └── websocket/        # 实时通信
│   ├── alembic/              # 数据库迁移
│   └── tests/
├── frontend/
│   └── src/
│       ├── components/       # React 组件
│       ├── pages/            # 页面
│       ├── stores/           # Zustand
│       └── lib/              # 工具
└── docker-compose.yml
```

---

## API

启动后端后访问 `/docs` 查看完整 Swagger UI。

| Method | Endpoint | 说明 |
|--------|----------|------|
| `POST` | `/api/v1/auth/register` | 用户注册 |
| `POST` | `/api/v1/auth/login` | 用户登录 |
| `GET` | `/api/v1/users/me` | 当前用户资料 |
| `POST` | `/api/v1/distillation/start` | 启动人格蒸馏 |
| `GET` | `/api/v1/clones/me` | 获取克隆体 |
| `GET` | `/api/v1/clones/me/activities` | 克隆体活动日志 |
| `POST` | `/api/v1/clones/me/activate` | 激活克隆体 |
| `GET` | `/api/v1/conversations` | 对话列表（含对方资料、未读数、最后消息） |
| `POST` | `/api/v1/conversations/{id}/takeover` | 真人接管 |
| `GET` | `/api/v1/matches/discover` | 发现匹配（含用户资料、兼容度） |
| `GET` | `/api/v1/feed` | 社区动态（含作者信息） |
| `GET` | `/api/v1/notifications` | 通知列表 |

---

## 贡献

欢迎提交 Issue 和 PR。请确保：

1. 代码通过 `ruff check .`
2. 前端通过 `tsc && vite build`
3. 添加必要的测试

---

[MIT](LICENSE) © SoulClone Team
