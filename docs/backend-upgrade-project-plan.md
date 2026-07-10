# SoulClone 后端升级技术推进计划

> 目标：将当前“功能型 MVP”升级为可供真实用户封闭测试的可靠版本。

## 1. 项目目标

升级完成后，系统必须满足：

- 用户无法访问不属于自己的资源。
- WebSocket 断线、重连不会导致重复消息。
- 真人接管后 AI 不会继续发言。
- LLM 超时或失败不会破坏正常会话。
- 每条 AI 消息可以追溯、解释和纠正。
- 核心业务链路具有自动化测试。
- 服务状态、错误率和 LLM 成本可以监控。
- 本地、测试、生产环境使用一致的数据库迁移流程。

## 2. 项目范围与周期

计划按照一名主力开发者、六周周期设计。如果有两至三名开发者并行，可压缩至约四周。

| 里程碑 | 周期 | 交付结果 |
|---|---:|---|
| M0 基线建立 | 2 天 | CI、测试基线和环境配置明确 |
| M1 安全会话 | 第 1 周 | REST 与 WebSocket 权限闭环 |
| M2 可靠消息 | 第 2 周 | 消息协议、幂等、回执与重连 |
| M3 接管状态机 | 第 3 周 | 真人与 AI 控制权可靠切换 |
| M4 AI 执行管线 | 第 4 周 | 异步任务、重试、降级与取消 |
| M5 记忆与审计 | 第 5 周 | 记忆隔离、人格版本与行为追溯 |
| M6 上线准备 | 第 6 周 | E2E、监控、压测与部署手册 |

## 3. 技术原则

- 不进行一次性架构重写，每个阶段都保持系统可运行。
- REST、WebSocket 和 Celery 复用同一套领域规则。
- 所有数据库结构变化必须使用 Alembic。
- 所有写操作必须考虑权限、事务和幂等。
- AI 生成与 AI 发送是两个独立步骤。
- 高风险 AI 行为默认需要真人确认。
- P0 功能必须具备自动化测试后才能进入下一阶段。

---

## 4. M0：建立升级基线

周期：第 1 至 2 天。

### SC-001 统一本地开发环境

任务：

- 明确 Python 3.12、Node.js 20、PostgreSQL 16 和 Redis 7。
- 补充 `.env.example`，区分开发、测试和生产配置。
- 修复 Docker 前端 API 地址，确保前端正确访问 `/api/v1`。
- 生产环境禁止使用默认密钥。
- 增加统一的启动、测试、检查和迁移命令。

建议命令：

```bash
make dev
make test
make lint
make migrate
```

验收标准：

- 新环境按照 README 可在 15 分钟内启动。
- 前端能够正确访问后端 API。
- `/health` 返回应用、数据库和 Redis 状态。
- 仓库不包含密钥、运行时数据库或本地缓存。

### SC-002 建立 CI

流水线至少包含：

1. Ruff 静态检查。
2. Pytest 后端测试。
3. TypeScript 类型检查。
4. 前端生产构建。
5. Alembic 空库迁移验证。
6. 依赖安全扫描。

验收标准：

- 每个 PR 自动执行完整流水线。
- 测试失败时禁止合并。
- CI 不依赖开发者本地状态。

### SC-003 建立测试基线

任务：

- 记录当前测试数量和覆盖率。
- 修复不稳定测试。
- 增加测试数据工厂。
- 使用隔离的测试数据库。
- LLM 测试默认使用 Fake Provider。

建议交付物：

```text
backend/tests/factories/
backend/tests/fakes/fake_llm.py
```

---

## 5. M1：安全会话

周期：第 1 周。目标是消除越权和输入安全问题。

### SC-101 统一会话成员校验

实现统一的会话访问服务：

```python
class ConversationAccessService:
    async def require_member(
        self,
        conversation_id: UUID,
        user_id: UUID,
    ) -> Conversation:
        ...
```

覆盖范围：

- 对话详情和消息列表。
- 发送消息和输入状态。
- 已读回执。
- 真人接管。
- WebSocket 所有事件。

验收测试：

- 用户 A 可以访问 A/B 会话。
- 用户 C 无法读取或修改 A/B 会话。
- 用户 C 无法触发 A 或 B 的克隆。
- 不存在和无权访问使用安全且一致的响应。

### SC-102 建立资源级权限矩阵

| 资源 | 查看 | 修改 | 删除 |
|---|---|---|---|
| 用户资料 | 本人或公开字段 | 本人 | 本人 |
| 克隆配置 | 本人 | 本人 | 本人 |
| 对话 | 会话成员 | 会话成员 | 按产品策略 |
| 消息 | 会话成员 | 发送者 | 发送者 |
| 记忆 | 本人 | 本人 | 本人 |
| 通知 | 本人 | 本人 | 本人 |

所有接口均应按照权限矩阵补齐测试。

### SC-103 完善认证闭环

任务：

- 新增 Refresh Token 接口并校验 Token 类型。
- 实现 Refresh Token 轮换与撤销。
- 修改密码后使旧 Token 失效。
- 增加登录频率限制。
- 禁止日志输出完整 Token。

验收标准：

- Refresh Token 不能调用普通 API。
- Access Token 不能用于刷新。
- 已撤销 Token 不再有效。
- 连续暴力登录会触发限流。

### SC-104 完善输入约束

覆盖消息长度、昵称长度、空白消息、非法 UUID、异常 JSON、不支持的 WebSocket 事件、文件大小和请求体大小。

M1 完成定义：REST 和 WebSocket 的资源访问均通过自动化越权测试。

---

## 6. M2：可靠消息系统

周期：第 2 周。目标是消息不丢失、不重复、状态一致。

### SC-201 定义 WebSocket 协议

建议事件：

```text
client.message.send
client.message.read
client.typing.start
client.typing.stop
client.takeover.start
client.takeover.end

server.connected
server.message.ack
server.message.created
server.message.read
server.typing.changed
server.takeover.changed
server.error
```

所有事件使用 Pydantic discriminated union 校验。

统一错误结构：

```json
{
  "type": "server.error",
  "request_id": "uuid",
  "code": "CONVERSATION_FORBIDDEN",
  "message": "无法执行该操作",
  "retryable": false
}
```

### SC-202 实现消息幂等

数据库新增：

- `client_message_id`。
- `delivery_status`。
- `failed_reason`。
- `sender_id + client_message_id` 唯一约束。

消息状态：

```text
accepted -> persisted -> delivered -> read
                    \-> failed
```

验收标准：

- 相同 `client_message_id` 发送十次，只生成一条消息。
- 客户端未收到 ACK 后重试不会重复。
- 服务端重启后幂等仍然有效。

### SC-203 实现已读回执

采用游标式批量已读：

```json
{
  "type": "client.message.read",
  "conversation_id": "uuid",
  "read_through_message_id": "uuid"
}
```

要求：

- 记录 `read_at`。
- 只允许接收者标记已读。
- 通过 WebSocket 推送已读事件。
- 未读数与消息状态保持一致。

### SC-204 完善连接管理

实现心跳、连接超时、多设备策略、指数退避建议、服务端优雅关闭，以及基于 Redis Pub/Sub 的跨实例投递。

M2 完成定义：断网、重连、重复发送和多设备登录不会造成重复消息或错误未读数。

---

## 7. M3：真人接管状态机

周期：第 3 周。目标是明确控制每一刻由谁发言。

### SC-301 建立控制状态模型

建议新增 `conversation_controls`：

```text
id
conversation_id
user_id
mode
version
changed_at
expires_at
changed_by
reason
```

状态模式：

- `clone_active`：孪生可以自动回复。
- `human_active`：真人正在控制。
- `clone_cooldown`：真人刚离开，AI 暂不抢答。
- `paused`：用户暂停该会话的 AI。
- `blocked`：系统风控禁止 AI 行动。

唯一约束为 `conversation_id + user_id`。

### SC-302 建立状态转移服务

所有状态变化必须通过统一服务：

```python
ConversationControlService.transition(
    current_state=current_state,
    event=event,
    actor=actor,
)
```

禁止 API、WebSocket 和 Celery 直接修改状态字段。

### SC-303 消除接管竞态

AI 回复流程必须执行两次状态检查：

1. 任务开始执行前。
2. 消息正式发送前。

AI Job 保存：

- `control_version_at_start`。
- `started_at`。
- `cancelled_at`。
- `cancel_reason`。

发送前控制版本不一致时，必须取消消息。

P0 测试场景：

```text
AI 开始生成
-> 真人点击接管
-> AI 返回结果
-> AI 消息不得发送
```

### SC-304 明确暂停与自动交还规则

需要确定：

- 真人接管是否自动过期。
- 真人离开后的冷却时长。
- 收到新消息是否延长接管。
- `paused` 是否只能手动解除。
- 高风险会话是否永久禁用自动回复。

M3 完成定义：真人接管后的 AI 误发次数为零。

---

## 8. M4：AI 执行管线

周期：第 4 周。目标是 LLM 故障不影响核心消息系统。

### SC-401 将 AI 回复任务化

把 WebSocket 中的同步生成迁移到 Celery：

```text
message persisted
-> enqueue reply job
-> planning
-> context loading
-> generation
-> validation
-> control recheck
-> delivery
```

WebSocket 只负责鉴权、保存用户消息、返回 ACK 和推送任务状态。

### SC-402 增加任务状态与幂等

新增 `clone_reply_jobs`：

- `source_message_id`。
- `clone_id`。
- `status`。
- `attempt_count`。
- `idempotency_key`。
- `control_version`。
- `model`。
- `error_code`。
- 相关时间戳。

一条来源消息只能有一个有效回复任务，任务重试不得重复发送。

### SC-403 建立 LLM Gateway

统一 OpenAI 和 Anthropic：

```python
class LLMGateway:
    async def generate(
        self,
        request: GenerationRequest,
    ) -> GenerationResult:
        ...
```

Gateway 统一负责：

- 超时与重试。
- 模型路由与降级。
- Token 和成本统计。
- 结构化输出解析。
- Trace ID。
- 敏感日志脱敏。

### SC-404 建立错误与降级策略

| 故障 | 处理方式 |
|---|---|
| 模型限流 | 指数退避 |
| 模型超时 | 重试一次后切换备用模型 |
| 输出解析失败 | 修复提示或重新生成 |
| 队列不可用 | 保留用户消息，稍后补偿 |
| 用户已经接管 | 取消任务 |
| 安全校验失败 | 不发送，进入人工确认 |
| 达到最大重试 | 进入 Dead Letter Queue |

### SC-405 建立 AI 行为风险等级

- L0：普通回复，可自动执行。
- L1：关系推进，需要更高置信度。
- L2：联系方式、线下邀约，需要用户授权。
- L3：资金、法律、医疗、隐私承诺，禁止自动执行。

M4 完成定义：模型超时、限流或供应商故障时，会话仍可使用，且不会产生重复或失控回复。

---

## 9. M5：记忆、校准与审计

周期：第 5 周。

### SC-501 实现记忆隔离

记忆必须包含：

- `owner_user_id`。
- `relationship_id`。
- `conversation_id`。
- `scope`。
- `sensitivity`。
- `confidence`。
- `source_message_id`。
- `expires_at`。

硬性规则：

- 关系记忆不能跨关系检索。
- 高敏感记忆默认不进入 Prompt。
- 删除原始消息时触发记忆清理或重新评估。

### SC-502 实现人格版本管理

每次蒸馏或校准创建新版本，记录：

- 版本号。
- System Prompt。
- 人格参数。
- 来源样本。
- Fidelity 分数。
- 生效时间。
- 回滚状态。

AI Job 必须记录其使用的人格版本。

### SC-503 建立校准反馈闭环

记录：

- 原始 AI 回复。
- 点赞或点踩。
- 用户修改后的版本。
- 不满意原因。
- 人格版本。
- 使用的记忆。
- 场景标签。

第一阶段先将反馈用于规则和 Prompt 优化，不直接进行在线训练。

### SC-504 建立 AI 行为审计

每条 AI 消息都能追溯完整过程：

```text
来源消息
-> 行为规划
-> 使用记忆
-> 人格版本
-> 模型调用
-> 安全检查
-> 控制权检查
-> 最终消息
```

M5 完成定义：任意 AI 消息都能回答“为什么这样回复”，并能定位使用了哪些记忆和人格版本。

---

## 10. M6：测试、监控与上线准备

周期：第 6 周。

### SC-601 建立端到端测试

必须覆盖：

1. 注册与登录。
2. 完成人格蒸馏。
3. 激活克隆。
4. 建立匹配和对话。
5. 真人发送消息。
6. AI 生成回复。
7. 真人中途接管。
8. AI 任务被取消。
9. 解除接管。
10. 提交校准反馈。
11. 查看 AI 行为记录。

### SC-602 并发与故障测试

测试场景：

- 同一消息重复提交一百次。
- WebSocket 突然断开。
- Redis 临时不可用。
- Celery Worker 重启。
- LLM 长时间延迟后返回。
- 数据库事务中断。
- 多设备同时接管。
- 短时间内同时收到多条消息。

初期目标：

| 指标 | 目标 |
|---|---:|
| API P95，不含 LLM | 小于 300 ms |
| 消息持久化 P95 | 小于 500 ms |
| WebSocket ACK P95 | 小于 500 ms |
| AI 回复成功率 | 大于 98% |
| 重复消息率 | 0 |
| 越权访问成功数 | 0 |
| 接管后 AI 误发数 | 0 |

### SC-603 建立可观测性

落地内容：

- JSON 结构化日志。
- Request ID 和 Trace ID。
- Sentry 错误收集。
- OpenTelemetry 链路追踪。
- 指标仪表盘和告警规则。

重点监控：

- API 请求量、延迟和错误率。
- WebSocket 在线连接数。
- Celery 队列长度。
- AI 回复成功率与耗时。
- 任务取消原因。
- Token 用量与成本。
- 校准否定率。
- 接管后 AI 误发次数。

### SC-604 完成部署与恢复方案

交付：

- Docker 生产配置。
- Alembic 发布流程。
- 数据库备份和恢复演练。
- Redis 持久化策略。
- Worker 优雅停止。
- 发布回滚手册。
- 密钥轮换说明。

---

## 11. 建议的代码结构

不做一次性迁移，按业务改动逐步演化：

```text
backend/app/
├── api/                 # HTTP 输入输出
├── websocket/           # 实时协议与连接管理
├── domain/
│   ├── conversation/    # 会话权限与规则
│   ├── takeover/        # 接管状态机
│   ├── clone/           # 克隆领域规则
│   └── memory/          # 记忆隔离与生命周期
├── application/
│   ├── commands/        # 写操作
│   ├── queries/         # 读操作
│   └── jobs/            # 异步执行管线
├── infrastructure/
│   ├── llm/             # 模型供应商适配
│   ├── queue/           # Celery
│   ├── persistence/     # SQLAlchemy
│   └── observability/   # 日志、指标与追踪
└── models/              # 现有模型，逐步迁移
```

重点是把业务规则从 API、WebSocket 和 Celery 中抽离，让三个入口调用同一套权限和状态逻辑。

## 12. GitHub 项目管理

### 标签

```text
priority:P0
priority:P1
priority:P2

area:auth
area:chat
area:websocket
area:takeover
area:llm
area:memory
area:infra
area:test

type:feature
type:bug
type:security
type:refactor
type:test
```

### 看板状态

```text
Backlog
-> Ready
-> In Progress
-> In Review
-> Verification
-> Done
```

### Issue 模板要求

每张 Issue 必须包含：

- 背景与目标。
- 非目标。
- 技术方案。
- 数据库变化。
- 安全影响。
- 测试用例。
- 验收标准。
- 回滚方案。

## 13. 分支与发布策略

采用短生命周期功能分支：

```text
main
└── feat/sc-301-takeover-state-machine
```

合并规则：

- 一个 PR 解决一个 Issue。
- PR 尽量控制在 500 行有效变更以内。
- 数据库迁移需要单独审查。
- P0 PR 必须包含自动化测试。
- 不保留长期大型重构分支。
- 每个里程碑发布一个可运行版本。

建议版本：

- `v0.2.0`：安全会话。
- `v0.3.0`：可靠消息。
- `v0.4.0`：接管状态机。
- `v0.5.0`：可靠 AI 管线。
- `v0.6.0`：记忆与审计。
- `v0.7.0-beta`：封闭测试版。

## 14. 每周推进节奏

- 周一：确定本周验收场景和风险。
- 周二至周四：实现、测试、小 PR 合并。
- 周五上午：集成测试和故障演练。
- 周五下午：发布里程碑并记录技术债。

每天保留约 20% 时间用于测试、文档、Bug、代码审查和可观测性。

## 15. 第一周立即执行清单

建议优先创建以下 Issue：

1. `SC-001` 修复本地与 Docker API 配置。
2. `SC-002` 建立前后端 CI。
3. `SC-003` 建立 Fake LLM 测试环境。
4. `SC-101` 实现会话成员校验服务。
5. `SC-102` 为 REST 会话接口补充越权测试。
6. `SC-103` 为 WebSocket 补充越权测试。
7. `SC-104` 使用 Pydantic 校验 WebSocket 事件。
8. `SC-105` 修复不存在会话导致的空对象异常。
9. `SC-106` 实现认证限流和 Token 类型校验。
10. `SC-107` 建立 Alembic 空库迁移测试。

第一周结束时应能演示：

> 创建 A、B、C 三个用户。A 与 B 可以正常聊天；C 无法读取、发送、输入状态、标记已读或接管 A/B 的会话。所有越权行为都有自动化测试保护。

## 16. 项目最终验收标准

封闭测试版本发布前，必须达到：

- 两个测试用户可以稳定完成注册、蒸馏、匹配、聊天、接管和校准。
- 重复请求、断线重连和 Worker 重启不会导致消息重复。
- LLM 超时、限流和供应商故障不会破坏正常聊天。
- 用户中途接管会可靠取消所有未发送的 AI 回复。
- 每条 AI 消息都有完整的审计链路。
- 核心指标和异常已经接入监控与告警。
- 数据库迁移、备份、恢复和版本回滚经过演练。

达到以上标准后，SoulClone 后端即可从“可演示”进入“可邀请真实用户试用”的阶段。
