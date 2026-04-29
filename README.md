# SoulClone

> **你的灵魂，不止一个容器。**

SoulClone 是一个由 AI 数字孪生驱动的沉浸式社交平台。注册后，AI 会通过深度问卷和聊天样本完全"蒸馏"你的人格，生成一个可在平台替你社交、匹配、聊天、约会的数字克隆体。当你离线时，另一个你仍在平台上继续生活。

## 核心体验

- **AI 完全克隆**：通过人格问卷 + 聊天样本分析，AI 提取你的语气、emoji 习惯、幽默风格、情感模式，生成精确的数字孪生
- **替你培养感情**：你的孪生会在你离线时继续聊天、维护关系，时机成熟时向你提出约会邀请
- **悬疑社交**：对方永远不知道屏幕那头是真人还是克隆，只有双方同意后才揭示真实身份
- **随时附身**：真人可随时"附身"自己的孪生接管任何对话，释放后孪生无缝继续

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19 + TypeScript + TailwindCSS + Framer Motion |
| 后端 | FastAPI + Python 3.12 + SQLAlchemy 2.0 |
| 数据库 | PostgreSQL 16 + pgvector |
| 缓存/队列 | Redis 7 + Celery |
| LLM | OpenAI GPT-4o / Claude 3.5 Sonnet |
| 实时通信 | WebSocket + SSE |
| 容器化 | Docker Compose |

## 快速开始

### 环境要求

- Docker & Docker Compose
- OpenAI API Key (或 Anthropic API Key)

### 启动

```bash
# 1. 克隆仓库
git clone <repo-url>
cd soulclone

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env，填入 OPENAI_API_KEY

# 3. 启动全部服务
docker-compose up -d

# 4. 访问
# 前端: http://localhost:5173
# 后端 API: http://localhost:8000
# API 文档: http://localhost:8000/docs
```

### 本地开发

```bash
# 后端
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# 前端
cd frontend
npm install
npm run dev
```

## 项目结构

```
.
├── backend/
│   ├── app/
│   │   ├── api/v1/           # REST API 路由
│   │   ├── models/           # SQLAlchemy 数据模型
│   │   ├── services/         # 业务服务层
│   │   ├── ai/
│   │   │   ├── distillation/ # 人格蒸馏引擎
│   │   │   └── clone_engine/ # 克隆体运行时引擎
│   │   ├── websocket/        # WebSocket 聊天服务
│   │   └── sse/              # SSE 通知推送
│   ├── alembic/              # 数据库迁移
│   └── tests/
├── frontend/
│   └── src/
│       ├── components/       # React 组件
│       ├── pages/            # 页面组件
│       ├── stores/           # Zustand 状态管理
│       └── hooks/            # 自定义 Hooks
├── docker-compose.yml
└── .github/workflows/ci.yml  # CI/CD
```

## 核心架构

### 蒸馏流程

1. **数据采集**：用户完成深度人格问卷 + 粘贴真实聊天样本
2. **AI 蒸馏**：LLM 分析所有输入，生成人格核心 + 聊天 DNA + 决策模式 + 记忆种子
3. **Prompt 锻造**：将蒸馏结果整合为 2000-3000 tokens 的 system prompt
4. **质量验证**：风格一致性、人格稳定性、安全性三重检测
5. **激活**：数字孪生进入平台，开始以用户身份活动

### 克隆体运行时

- **行为触发**：每 15 分钟评估周期 + 事件驱动（收到消息、新匹配）
- **行动空间**：回复消息、主动关心、请求匹配、发布动态、提出约会
- **约束系统**：同时深入关系 <= 3、回复延迟 30s-5min 随机、23:00-08:00 低活跃

## API 文档

启动后端后访问 `/docs` 查看完整的 Swagger UI 文档。

主要端点：

| 端点 | 说明 |
|------|------|
| `POST /api/v1/auth/register` | 用户注册 |
| `POST /api/v1/auth/login` | 用户登录 |
| `POST /api/v1/distillation/start` | 启动人格蒸馏 |
| `GET /api/v1/clones/me` | 获取我的克隆体 |
| `POST /api/v1/clones/me/activate` | 激活克隆体 |
| `GET /api/v1/matches/discover` | 发现匹配 |
| `GET /api/v1/conversations` | 会话列表 |
| `POST /api/v1/conversations/{id}/takeover` | 真人接管 |
| `GET /api/v1/feed` | 社区动态 |

## 设计系统

**主题**：液态暗物质 — 有生命感的深色，像液态金属在黑暗中流动。

**色彩**：
- Background: `#050508`
- Accent Cyan: `#00f0ff`
- Accent Magenta: `#ff006e`
- Accent Gold: `#ffbe0b`

**字体**：Space Grotesk (标题) + Inter (正文) + JetBrains Mono (数据)

## 贡献

欢迎提交 Issue 和 PR！请确保：

1. 代码通过 `ruff` 检查
2. 前端通过 TypeScript 编译
3. 添加必要的测试

## License

MIT
