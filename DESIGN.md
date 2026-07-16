---
name: SoulClone
description: "替你穿过社交噪声，找到那个值得你亲自出现的人。"
colors:
  soul-void: "#050508"
  dark-matter: "#0A0A10"
  elevated-matter: "#181820"
  soul-white: "#E8E8EC"
  quiet-silver: "#8B8B9A"
  distant-silver: "#6B6B7B"
  consciousness-cyan: "#00F0FF"
  relationship-magenta: "#FF006E"
  handover-gold: "#FFBE0B"
  alive-green: "#00E676"
  caution-orange: "#FF9100"
  boundary-red: "#FF1744"
typography:
  display:
    fontFamily: "Newsreader, LXGW WenKai, Noto Serif SC, PingFang SC, Microsoft YaHei, serif"
    fontSize: "4.5rem"
    fontWeight: 300
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Newsreader, LXGW WenKai, Noto Serif SC, PingFang SC, Microsoft YaHei, serif"
    fontSize: "2.25rem"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Newsreader, LXGW WenKai, Noto Serif SC, PingFang SC, Microsoft YaHei, serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Inter, PingFang SC, Microsoft YaHei, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "0.01em"
  label:
    fontFamily: "Inter, PingFang SC, Microsoft YaHei, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "0.02em"
  data:
    fontFamily: "JetBrains Mono, LXGW WenKai Mono, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
rounded:
  control-sm: "6px"
  control: "8px"
  interactive: "12px"
  surface: "16px"
  overlay: "24px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "#00F0FF1A"
    textColor: "{colors.consciousness-cyan}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "10px 24px"
    height: "40px"
  button-ghost:
    backgroundColor: "#00000000"
    textColor: "{colors.soul-white}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "10px 24px"
    height: "40px"
  input-default:
    backgroundColor: "{colors.dark-matter}"
    textColor: "{colors.soul-white}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "44px"
  card-flat:
    backgroundColor: "{colors.dark-matter}"
    textColor: "{colors.soul-white}"
    rounded: "{rounded.surface}"
    padding: "24px"
  badge-cyan:
    backgroundColor: "#00F0FF26"
    textColor: "{colors.consciousness-cyan}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
    height: "24px"
---

# Design System: SoulClone

## Overview

**Creative North Star: "Liquid Dark Matter（液态暗物质）"**

SoulClone 像一座深海中的灵魂仪表盘：深色空间安静承载关系，液态光线只在连接、心跳和交接发生时显现。它真诚、克制、神秘；视觉不试图证明 AI 有多强，而是让用户更清楚何时该把关系交还给真人。

界面安静地存在，回应时才显露生命感。产品区以熟悉、直接的任务流为骨架，Landing 等品牌表面可以承担更强的沉浸感，但两者共享同一套色彩语义、字体声音和材质规则。系统明确拒绝千篇一律的 AI 或 SaaS 控制台、依赖无限滑动的游戏化交友软件，以及冰冷炫技、把人简化成数据的科幻工具。

**Key Characteristics:**

- 深色明度层级构成稳定空间，饱和色只表达语义与状态。
- Serif 展示字体承载灵魂与叙事，Inter 承载任务，等宽字体承载精确数据。
- 产品界面静止时克制，交互发生时才使用光晕、呼吸和液态反馈。
- 玻璃是悬浮层与意识材质，不是所有容器的默认装饰。
- 所有视觉高潮最终都服务于真人接管，而不是延长 AI 的存在。

## Colors

色彩不是装饰，而是关系状态的语言：Cyan 是意识连接，Magenta 是关系心跳，Gold 是真实交接，Void 是灵魂深空。

### Primary

- **意识连接（Consciousness Cyan）：** 用于消息、主操作、当前导航、聚焦状态和孪生在线反馈。它必须意味着“连接正在发生”，不能作为大面积背景填充。

### Secondary

- **关系心跳（Relationship Magenta）：** 用于新关系、匹配、未读、关系升温和需要注意的社交信号。它表达生命与张力，不表达通用主操作。

### Tertiary

- **真实交接（Handover Gold）：** 用于亲密度高点、符合度、校准成就与真人接管。Gold 是稀缺的终点色；只有关系足够重要时才出现。
- **活跃绿、警示橙、边界红：** 分别只承担成功、警告和错误/阻止等系统状态，禁止与三种品牌色混用以制造装饰性彩虹。

### Neutral

- **灵魂深空（Soul Void）：** 页面画布和最深背景，让高饱和信号保持稀缺。
- **暗物质（Dark Matter）：** 内容容器、卡片和输入区的默认表面。
- **升起的暗物质（Elevated Matter）：** 下拉层、悬浮 Dock、Modal 和明确高于页面的表面。
- **灵魂白（Soul White）：** 主要正文与关键标签。
- **静默银（Quiet Silver）：** 次要说明和未激活导航。
- **远距银（Distant Silver）：** 辅助元数据、占位式弱信息与低优先级状态；关键正文禁止使用。

### Named Rules

**The Semantic Color Rule.** 每一次品牌色出现都必须回答“发生了什么状态变化”；如果答案只是“更好看”，删除它。

**The One Chapter Rule.** 单个产品页面只允许一种品牌色主导，另外两种只能表达局部语义事件。

**The Gold Exit Rule.** Gold 优先标记校准完成、深度关系和真人接管，禁止把它降格为普通按钮颜色。

## Typography

**Display Font:** Newsreader 与霞鹜文楷（以 Noto Serif SC 和系统中文 Serif 回退）
**Body Font:** Inter（以苹方、微软雅黑和 system-ui 回退）
**Label/Mono Font:** UI 标签使用 Inter Medium；数据使用 JetBrains Mono 与霞鹜文楷 Mono

**Character:** Serif 是灵魂的面孔，适合提出问题、表达关系与承载第一人称叙事；Sans 是灵魂的声音，让任务流清楚、不打扰；Mono 是孪生的脉搏，只用于评分、时间和精确状态。

### Hierarchy

- **Display**（300，最大 4.5rem，1.15）：仅用于 Landing 主标题、交接仪式和少数情感高潮；移动端必须下调，字距不得紧于 -0.02em。
- **Headline**（400，2.25rem，1.3）：页面级标题与重要章节，不用于按钮或导航。
- **Title**（400，1.125rem，1.3）：卡片标题、关系名称和内容区标题。
- **Body**（400，1rem，1.7）：说明、对话外的叙述和长文本；叙述性内容控制在 65–75ch。
- **Label**（500，0.875rem，0.02em）：按钮、输入标签、导航和紧凑状态；不使用全大写来制造层级。
- **Data**（400，0.875rem，1.5）：评分、置信度、时间和模型状态；必须启用等宽数字语义。

### Named Rules

**The Three Voices Rule.** Serif 讲“人与关系”，Sans 讲“任务与操作”，Mono 讲“数字与状态”；禁止跨角色混用。

**The Quiet Interface Rule.** 产品标签和按钮禁止使用 Display 字体，界面必须先可操作，再有气质。

## Elevation

SoulClone 使用“明度层级 + 环境响应”的混合深度系统。静止表面主要依靠 Soul Void、Dark Matter 与 Elevated Matter 的明度差区分；阴影和光晕只在悬浮层、焦点、选中、在线或交接等真实状态中出现。玻璃材质只用于顶部栏、Floating Dock、Modal、意识流等需要表达悬浮或非实体感的区域。

### Shadow Vocabulary

- **环境微光**（`0 0 8px rgba(accent, 0.3)`）：头像环、微小状态点和低强度反馈。
- **交互光晕**（`0 0 16px rgba(accent, 0.4)`）：输入聚焦和明确选中状态；只使用当前页面主导色。
- **悬浮层阴影**（`0 8px 32px rgba(0, 0, 0, 0.4)`）：仅用于 Floating Dock、Modal 或明确脱离页面流的表面。
- **大气光场**（24–48px 模糊的低透明径向光）：只用于页面氛围和情感高潮，永远不承担边界或可点击性的表达。

### Named Rules

**The Stillness First Rule.** 静止状态禁止用大范围阴影证明层级；先使用表面明度，交互发生后才允许光出现。

**The Glass Is Air Rule.** 玻璃代表悬浮、意识或过渡，不代表普通内容；普通卡片必须保持实体和安静。

## Components

组件遵循“安静地存在，回应时才显露生命感”：默认态清晰克制，Hover、Focus、Active、Disabled、Error 必须完整并共享同一套语义。

### Buttons

- **Shape:** 主按钮、次按钮和 Ghost 按钮使用完整胶囊形；常规高度 40px，触控关键操作至少 44px。
- **Primary:** Cyan 低透明背景、Cyan 文本与细边界，中号内边距 10px × 24px；它表示当前页面最重要的连接动作。
- **Hover / Focus:** Hover 提升同色背景和边界对比；Focus 使用深色内圈与 2px Cyan 外圈；Active 轻微缩放至 0.98；Disabled 降低至 30%–50% 不透明度。
- **Secondary / Gold / Danger:** 分别使用 Magenta、Gold 和 Red 的同构语义样式；Gold 只用于真实交接或高价值完成状态。
- **Ghost / Link:** Ghost 以透明背景和微弱中性边界承载次级动作；Link 仅用于文字级导航，不得与主按钮竞争。

### Chips

- **Style:** 完整胶囊形、24px 常规高度、4px × 12px 内边距；使用语义色 15% 背景、30% 边界和全强度文字。
- **State:** 未选中标签保持 Dark Matter 与 Quiet Silver；选中后只切换到对应语义色，禁止额外添加阴影或缩放。

### Cards / Containers

- **Corner Style:** 普通内容使用柔和 16px 圆角；显式 Overlay 最多 24px。
- **Background:** Flat 卡片使用 Dark Matter；Elevated 表面使用半透明 Elevated Matter；Liquid 只用于真正需要表达意识或过渡的签名区域。
- **Shadow Strategy:** 默认无阴影，以 6%–12% 白色边界和明度差建立结构；Hover 最多使用 16px 低透明光晕。
- **Border:** 边界必须完整包围容器，禁止用粗侧边色条制造强调。
- **Internal Padding:** 标准为 24px，紧凑内容可用 16px，大型入门步骤可用 32px。

### Inputs / Fields

- **Style:** Dark Matter 背景、10% 白色边界、Soul White 输入文字；常规高度 44px、8px 圆角和 16px 水平内边距。
- **Focus:** 边界转为 60% Cyan，并出现 16px Cyan 光晕；Search 变体可以使用胶囊形，但普通表单保持 8px 圆角。
- **Error / Disabled:** Error 使用 Boundary Red 边界、同色光晕与文字说明；Disabled 降低到 50% 不透明度并禁止交互。占位文字必须保持可读，不能用 Distant Silver 充当正文。

### Navigation

- 顶栏是低透明玻璃层，只保留 Logo 与上下文；主导航使用底部 Floating Dock，单项最小触控区 44px。
- 未激活项使用 Quiet Silver；当前页使用 Cyan、10% Cyan 背景、底部状态点和缓慢呼吸光晕。
- Hover 可以放大图标至 1.15 并显示简短 Tooltip；Reduced Motion 下取消缩放、入场和循环呼吸，只保留即时颜色变化。
- 移动端沿用同一 Dock 结构，禁止退回标准 SaaS 侧栏或把核心目的地藏入汉堡菜单。

### Twin Identity

Liquid Twin Logo、亲密度头像环、人格雷达与意识交接是签名组件。两个不对称液滴分别代表真人与孪生，Gold 光核代表共享但最终回归真人的关系价值；Logo 必须保持矢量、无文字、16×16 可识别，禁止替换成芯片、脑形、电路板或六边形 AI 图标。

## Do's and Don'ts

### Do:

- **Do** 让每个页面只由 Cyan、Magenta 或 Gold 中的一种颜色主导，并让颜色明确表达状态。
- **Do** 在静止状态使用 Soul Void、Dark Matter、Elevated Matter 的明度层级，交互发生后再显示光晕。
- **Do** 保证按钮、输入、导航具备 Hover、Focus、Active、Disabled 和 Error 等完整状态。
- **Do** 为所有循环动画与大幅位移提供 `prefers-reduced-motion` 降级，并让声音始终可关闭。
- **Do** 在关系达到交接条件时用 Gold 和清晰文案把注意力导向真人接管。
- **Do** 保持正文对比度达到 WCAG 2.2 AA，并为触控操作提供至少 44px 的有效区域。

### Don't:

- **Don't** 做成“千篇一律的 AI 或 SaaS 控制台”；禁止默认侧栏、无意义指标卡阵列和装饰性渐变文字。
- **Don't** 做成“依靠无限滑动和上瘾式匹配留住用户的游戏化交友软件”；禁止用无限 Feed、虚假稀缺或奖励连击制造停留。
- **Don't** 做成“冰冷、炫技、把人简化成数据的科幻工具”；数据必须连接到可理解的人与关系结果。
- **Don't** 在普通卡片上滥用玻璃、宽阴影、粒子或三色渐变；材质必须承担明确语义。
- **Don't** 使用大于 1px 的彩色单侧边框、32px 以上的卡片圆角、装饰性网格背景或手绘感 AI SVG。
- **Don't** 让 AI 视觉高潮压过真人接管；找到合拍的人之后，界面必须帮助孪生退出。
