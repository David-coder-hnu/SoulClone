---
target: 登录后的核心首页 HomePage.tsx
total_score: 16
p0_count: 0
p1_count: 4
timestamp: 2026-07-16T02-56-43Z
slug: frontend-src-pages-homepage-tsx
---
Method: dual-agent (A: critique_design_a · B: critique_detector_b)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|------:|-----------|
| 1 | Visibility of System Status | 2/4 | 冷启动时服务端状态与本地 Toggle 可能互相矛盾，切换也没有持久化确认。 |
| 2 | Match System / Real World | 2/4 | 大部分中文自然，但“意识分离/传输”掩盖了简单状态变化，并把交接方向讲反。 |
| 3 | User Control and Freedom | 1/4 | 3.8 秒全屏交接动画没有取消、Esc、关闭或撤销。 |
| 4 | Consistency and Standards | 2/4 | 视觉统一，但“离线”“孪生接管”“孪生不会行动”描述了互不兼容的状态。 |
| 5 | Error Prevention | 1/4 | 高后果自动化开关即时变化，没有确认、持久化、失败回滚或并发保护。 |
| 6 | Recognition Rather Than Recall | 3/4 | 主操作有文字，但 Dock 在视觉上仍以图标为主，标签依赖鼠标 Hover。 |
| 7 | Flexibility and Efficiency | 1/4 | 没有快捷方式或加速路径，指标不可下钻，重复用户仍要等待仪式动画。 |
| 8 | Aesthetic and Minimalist Design | 2/4 | 垂直结构清楚，但粒子、网格、光晕、玻璃、计数器和仪式争夺关系任务的注意力。 |
| 9 | Error Recovery | 2/4 | 统计失败有重试，但状态变更无错误路径，每日简报失败会变成含义模糊的空状态。 |
| 10 | Help and Documentation | 0/4 | 没有解释自动化范围、隐私、接管含义和开关后果的上下文帮助。 |
| **Total** | | **16/40** | **Poor — 核心状态可信度与产品方向需要重构。** |

## Anti-Patterns Verdict

**Does this look AI-generated? — Yes, high risk.** 首页组合了深色 AI 仪表盘最常见的套路：Cyan/Magenta/Gold 霓虹、玻璃 Dock、Mesh Gradient、浮动粒子、呼吸光、动态计数器和戏剧化“意识传输”。单独看都有完成度，叠加后却更像在证明 AI 很神奇，而不是安静地帮助两个人相遇。

**LLM assessment:** 最大的 AI 痕迹不是某个视觉效果，而是产品目标被通用 AI Dashboard 模板取代。四个活动 KPI 把关系转换成吞吐量，“替你维系关系”又直接违背 PRODUCT.md 中“找到后 AI 退出”的边界。设计系统的个性存在，但首页没有把最独特的产品承诺变成第一信息层级。

**Deterministic scan:** 自动检测发现 1 个 advisory：`frontend/src/pages/HomePage.tsx:196` 使用 `text-[11px]`，不在 DESIGN.md 已记录的最小 14px 字号阶梯中。它可能是紧凑指标标签的有意例外，但与 `text-text-tertiary` 组合后同时带来可读性风险；应改用 14px，或在经过对比度与缩放验证后明确扩展设计系统。

**Visual overlays:** 已尝试建立独立浏览器标签，但当前会话没有可用的浏览器后端，因此没有完成脚本注入，也没有可靠的用户可见 Overlay。结论使用了独立源码评审、确定性扫描及 Live URL HTTP 200 健康检查作为回退证据。

## Overall Impression

首页有清晰的“问候 → 孪生状态 → 今日摘要 → 每日简报”结构，也有完整品牌识别；但它把最重要的产品问题——“谁值得我亲自出现？”——藏在了活动数据之后。最大的机会不是继续打磨氛围，而是把首页从“AI 今天做了多少事”改成“现在有没有一个人值得你接管”。

## What's Working

- 页面自上而下的区块顺序易理解，用户可以快速扫到状态、摘要与今日叙事。
- Loading、统计错误重试和 Daily Brief 空状态都有明确代码分支，没有只设计 Happy Path。
- 页面以 Cyan 为主导色，Shell 具备 Skip Link、语义导航、`aria-current` 和 44px Dock 目标，设计基础并不薄弱。

## Priority Issues

### [P1] 自动化状态不是权威状态

**Why it matters:** `onlineActive` 在异步统计完成前从空数据初始化，之后没有同步；Header 可能显示孪生活跃，而 Toggle 与状态卡显示离线。点击 Toggle 只改本地 React 状态，没有服务端持久化。用户无法确认孪生此刻是否正在代表自己行动。

**Fix:** 让服务端状态成为唯一来源；使用显式 Mutation，覆盖 Loading、成功、失败、回滚与并发禁用；用 Live Region 宣布结果，并在离开页面或刷新后保持一致。

**Suggested command:** `$impeccable harden frontend/src/pages/HomePage.tsx`

### [P1] 交接方向与产品承诺相反

**Why it matters:** PRODUCT.md 要求找到合拍的人后 AI 退出，但当前“下线”仪式让真人淡出、孪生接管；同一张卡又说离线后孪生不会行动。“替你维系关系”把 SoulClone 拉回持续代聊产品。

**Fix:** 明确定义“孪生寻找中 / 等待你接管 / 已由本人接管”等状态。Gold 仪式只用于围绕具体对象的 AI→真人交接，并提供清楚后果、取消和撤销。

**Suggested command:** `$impeccable shape relationship handover`

### [P1] 移动端布局存在结构性溢出

**Why it matters:** 四项统计是不可换行的单行 Flex；交接动画三列仅头像、光束和 Gap 就约 384px，尚未计入页面内边距；长问候语和两个 Header 控件也会在窄屏争夺空间。

**Fix:** 指标改成可换行或以“需要你注意的人”为核心的纵向摘要；交接仪式在小屏改为垂直叙事；Header 将操作移至问候下方。验证 320/375/768px 与 200% Zoom。

**Suggested command:** `$impeccable adapt frontend/src/pages/HomePage.tsx`

### [P1] 高后果交互的可访问性不合格

**Why it matters:** 通知铃没有 Accessible Name，未读只靠视觉红点；状态按钮缺少 Switch/`aria-pressed` 语义；仪式没有 Dialog 角色、焦点管理、阶段播报或键盘退出。11px Tertiary 标签约 3.89:1，对普通文本未达到 AA；Ghost 文本更低。CSS 的 Reduced Motion 覆盖也无法可靠中和所有 Framer Motion 动画。

**Fix:** 增加名称与未读数量、Switch 语义、Live Status、Dialog/Focus Trap/Esc、可见 Focus Ring 和 AA 文本令牌；使用 Framer Motion 的 Reduced Motion 能力对 JS 动画降级。

**Suggested command:** `$impeccable audit frontend/src/pages/HomePage.tsx`

### [P2] 首页奖励活动量，而不是节省注意力

**Why it matters:** “今日消息 / 新匹配 / 深入聊天 / 社区互动”复制了通用 Engagement Dashboard，奖励的正是 PRODUCT.md 希望过滤的互动量。用户仍然不知道“谁值得我关注、为什么、下一步做什么”。

**Fix:** 第一模块改成接管/注意力队列：具体的人、合拍原因、重要上下文、信心与边界，以及唯一主操作“本人接管”。活动总量降为可选详情。

**Suggested command:** `$impeccable distill frontend/src/pages/HomePage.tsx`

## Persona Red Flags

**Alex（高频用户）:** 没有状态或通知快捷键，KPI 不可下钻，日常 Toggle 强制播放 3.8 秒动画；本地状态刷新后可能丢失。Alex 会把首页判断为缓慢且不可信。

**Sam（键盘/读屏用户）:** 通知铃无名称、未读仅视觉表达、Toggle 状态不暴露、仪式不播报也不能键盘关闭；11px 低对比标签和移动端/200% Zoom 溢出进一步阻断任务。

**Lin（时间稀缺、寻找真正合拍关系的用户）:** Lin 打开 SoulClone 是想知道有没有人值得亲自投入，首页却先展示四个活动总数与“社区互动”，没有具体对象、合拍理由或接管依据，还声称 AI 会“维系关系”。Lin 仍要亲自调查噪声。

## Minor Observations

- 全局 `h1/h2/h3` Margin 与组件局部 Tailwind Margin 叠加，可能造成 Flex/Card 内部节奏漂移。
- 通知查询失败被静默转换为 0 未读，用户会误以为系统正常且没有通知。
- 除非用户已存储关闭设置，声音默认开启；首页播放交接声音前没有邻近提示。
- Daily Brief 的“查看全部”泛化链接到 `/clone`，没有跳到对应活动或关系。
- 全局 Mesh Gradient 同时混入三种品牌色，违背 DESIGN.md 的单章节主导色规则。

## Questions to Consider

- 如果 SoulClone 昨晚运行得完美，首页应该展示四个活动总数，还是一个值得你去见的人？
- 为什么最戏剧化的时刻是真人消失进 AI，而不是 AI 优雅地退到幕后？
- “在线/离线”能否同时准确描述自动化、可用性和关系所有权，还是它们本来就是三个状态？
- 如果每个装饰效果都必须回答“用户的什么发生了变化”，首页还会留下哪些效果？
