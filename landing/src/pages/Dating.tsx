import { useState, useRef, useCallback, lazy, Suspense } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

/* Inline keyframes for animations not in Tailwind config */
const inlineStyles = `
@keyframes glitch {
  0%, 90%, 100% { transform: translate(0); filter: none; }
  91% { transform: translate(-2px, 1px); filter: hue-rotate(90deg); }
  92% { transform: translate(2px, -1px); filter: hue-rotate(-90deg); }
  93% { transform: translate(0); filter: none; }
}
@keyframes fall {
  0% { transform: translateY(-100%); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(100%); opacity: 0; }
}
@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
`;

gsap.registerPlugin(ScrollTrigger);

/* Isolated canvas component */
const ResonanceCanvas = lazy(() => import('../components/dating/ResonanceCanvas'));

const scenarios = [
  { name: 'The Gravity Garden', desc: '花朵向天空坠落，星辰在脚下绽放', color: '#ff006e' },
  { name: 'Neon Rain Street', desc: '数据雨滴在霓虹灯下编织光之河流', color: '#00f0ff' },
  { name: 'The Floating Library', desc: '无数书籍在虚空中漂浮，文字化为蝴蝶', color: '#ffbe0b' },
  { name: 'Aurora Rooftop', desc: '极光在天台之上缓缓流淌', color: '#00f0ff' },
  { name: 'Virtual Café', desc: '咖啡香气由代码编译，对话由频率共振', color: '#ff006e' },
  { name: 'Data Waterfall', desc: '瀑布由纯粹的信息流构成', color: '#ffbe0b' },
];

const badges = [
  { name: '社交蝴蝶', condition: '完成 50 次对话', color: '#ff006e', unlocked: true },
  { name: '深夜诗人', condition: '在凌晨发送 20 条消息', color: '#00f0ff', unlocked: true },
  { name: '谜语大师', condition: '连续 7 天发送谜语', color: '#ffbe0b', unlocked: false },
  { name: '心动捕手', condition: '触发 10 次共振', color: '#ff006e', unlocked: true },
  { name: '数据游侠', condition: '探索所有场景', color: '#00f0ff', unlocked: false },
  { name: '霓虹骑士', condition: '送出 100 份虚拟礼物', color: '#ffbe0b', unlocked: false },
  { name: '频率调谐师', condition: '完成人格蒸馏', color: '#ff006e', unlocked: true },
  { name: '深渊凝视者', condition: '在黑暗中停留 1 小时', color: '#00f0ff', unlocked: false },
  { name: '代码织梦人', condition: '创建自定义礼物', color: '#ffbe0b', unlocked: true },
  { name: '孪生守护者', condition: '激活数字孪生', color: '#ff006e', unlocked: false },
  { name: '时空旅人', condition: '跨时区约会 5 次', color: '#00f0ff', unlocked: false },
  { name: '共振引擎', condition: '达成 100% 心动匹配', color: '#ffbe0b', unlocked: false },
];

export default function Dating() {
  const heroRef = useRef<HTMLDivElement>(null);
  const giftsRef = useRef<HTMLDivElement>(null);
  const resonanceRef = useRef<HTMLDivElement>(null);
  const scenariosRef = useRef<HTMLDivElement>(null);
  const badgesRef = useRef<HTMLDivElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  const [giftCompiled, setGiftCompiled] = useState(false);
  const [activeScenario, setActiveScenario] = useState<number | null>(null);
  const [hoveredBadge, setHoveredBadge] = useState<number | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  /* GSAP scroll animations */
  useGSAP(() => {
    if (!heroRef.current || !giftsRef.current || !resonanceRef.current || !scenariosRef.current || !badgesRef.current) return;

    // Hero title entrance
    gsap.fromTo(
      titleRef.current,
      { opacity: 0, x: -40 },
      { opacity: 1, x: 0, duration: 1.2, ease: 'power3.out', delay: 0.3 }
    );

    // Parallax background on scroll
    gsap.to(parallaxRef.current, {
      x: '-20%',
      ease: 'none',
      scrollTrigger: {
        trigger: heroRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: 1,
      },
    });

    // Gifts section
    gsap.fromTo(
      giftsRef.current,
      { opacity: 0, y: 60 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        scrollTrigger: {
          trigger: giftsRef.current,
          start: 'top 80%',
          end: 'top 40%',
          scrub: 1,
        },
      }
    );

    // Resonance section
    gsap.fromTo(
      resonanceRef.current,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 1.2,
        scrollTrigger: {
          trigger: resonanceRef.current,
          start: 'top 80%',
          end: 'top 40%',
          scrub: 1,
        },
      }
    );

    // Scenarios section
    gsap.fromTo(
      scenariosRef.current,
      { opacity: 0, y: 60 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        scrollTrigger: {
          trigger: scenariosRef.current,
          start: 'top 80%',
          end: 'top 40%',
          scrub: 1,
        },
      }
    );

    // Badges section
    gsap.fromTo(
      badgesRef.current,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        scrollTrigger: {
          trigger: badgesRef.current,
          start: 'top 85%',
          end: 'top 50%',
          scrub: 1,
        },
      }
    );

    // Scroll progress tracking for hero
    ScrollTrigger.create({
      trigger: heroRef.current,
      start: 'top top',
      end: 'bottom top',
      onUpdate: (self) => setScrollProgress(self.progress),
    });
  }, []);

  const compileGift = useCallback(() => {
    setGiftCompiled(true);
    setTimeout(() => setGiftCompiled(false), 3000);
  }, []);

  return (
    <div className="relative bg-[#050508] text-white">
      <style dangerouslySetInnerHTML={{ __html: inlineStyles }} />
      {/* ========== HERO: Neon Expanse ========== */}
      <section
        ref={heroRef}
        className="relative flex min-h-[100dvh] flex-col justify-center overflow-hidden"
      >
        {/* Parallax background layers */}
        <div className="absolute inset-0">
          {/* Far layer: illustration */}
          <div
            ref={parallaxRef}
            className="absolute inset-0 h-[120%] w-[140%]"
            style={{
              backgroundImage: 'url(/dating-scene-illustration.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.35,
              filter: 'saturate(0.7) contrast(1.2)',
              top: '-10%',
              left: '-20%',
            }}
          />

          {/* Mid layer: glow orbs */}
          <div className="absolute inset-0">
            <div
              className="absolute h-96 w-96 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(0,240,255,0.15) 0%, transparent 70%)',
                top: '20%',
                left: '30%',
                filter: 'blur(60px)',
                transform: `translateX(${scrollProgress * -80}px)`,
                transition: 'transform 0.1s linear',
              }}
            />
            <div
              className="absolute h-80 w-80 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(255,0,110,0.12) 0%, transparent 70%)',
                top: '50%',
                right: '20%',
                filter: 'blur(50px)',
                transform: `translateX(${scrollProgress * 60}px)`,
                transition: 'transform 0.1s linear',
              }}
            />
          </div>

          {/* Near layer: fast bokeh */}
          <div className="absolute inset-0">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: 40 + Math.random() * 80,
                  height: 40 + Math.random() * 80,
                  background: i % 2 === 0
                    ? 'radial-gradient(circle, rgba(0,240,255,0.2), transparent)'
                    : 'radial-gradient(circle, rgba(255,0,110,0.15), transparent)',
                  filter: 'blur(20px)',
                  top: `${10 + i * 15}%`,
                  left: `${5 + i * 15}%`,
                  transform: `translateX(${scrollProgress * (i % 2 === 0 ? -120 : 100)}px)`,
                  transition: 'transform 0.1s linear',
                }}
              />
            ))}
          </div>
        </div>

        {/* Fixed title */}
        <div ref={titleRef} className="relative z-10 px-6 md:px-12">
          <h1 className="font-display text-5xl font-bold leading-tight md:text-7xl lg:text-8xl">
            <span className="block text-white">DATING</span>
            <span
              className="block"
              style={{
                background: 'linear-gradient(135deg, #00f0ff 0%, #ff006e 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 40px rgba(0,240,255,0.3), 0 0 80px rgba(255,0,110,0.2)',
              }}
            >
              REIMAGINED
            </span>
          </h1>
          <p className="mt-6 font-mono text-sm text-white/50 md:text-base">
            SCROLL TO ENTER THE SIMULATION{' '}
            <span className="inline-block animate-pulse">{'>>'}</span>
          </p>
        </div>

        {/* Central rotating ring (CSS 3D) */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className="h-48 w-48 rounded-full border-2 border-dashed md:h-72 md:w-72"
            style={{
              borderColor: 'rgba(0,240,255,0.2)',
              animation: 'spin 20s linear infinite',
              boxShadow: '0 0 60px rgba(0,240,255,0.1), inset 0 0 40px rgba(0,240,255,0.05)',
            }}
          />
          <div
            className="absolute h-40 w-40 rounded-full border border-dashed md:h-56 md:w-56"
            style={{
              borderColor: 'rgba(255,0,110,0.15)',
              animation: 'spin 15s linear infinite reverse',
            }}
          />
        </div>

        {/* Scene tags around the ring */}
        <div className="pointer-events-none absolute inset-0">
          {['虚拟咖啡馆', '霓虹花园', '数据瀑布', '极光天台'].map((tag, i) => {
            const angle = (i / 4) * Math.PI * 2 - Math.PI / 2;
            const radius = 42; // % from center
            const x = 50 + Math.cos(angle) * radius;
            const y = 50 + Math.sin(angle) * radius;
            return (
              <div
                key={tag}
                className="absolute whitespace-nowrap rounded-full px-3 py-1 text-xs"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: 'translate(-50%, -50%)',
                  background: 'rgba(15,15,20,0.6)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(8px)',
                  color: 'rgba(255,255,255,0.5)',
                }}
              >
                {tag}
              </div>
            );
          })}
        </div>
      </section>

      {/* ========== SECTION 2: Data-Constructed Romance ========== */}
      <section
        ref={giftsRef}
        className="relative min-h-[100dvh] px-6 py-20"
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left: title & description */}
            <div>
              <h2
                className="mb-4 font-display text-4xl font-extrabold tracking-tight text-white md:text-6xl"
                style={{
                  textShadow: '0 0 30px rgba(0,240,255,0.2)',
                }}
              >
                GIFTS ARE{' '}
                <span
                  className="relative inline-block"
                  style={{
                    animation: 'glitch 5s infinite',
                  }}
                >
                  CODE
                </span>
                .
              </h2>
              <p className="mb-4 font-body text-sm italic text-white/50">
                Not pixels. Not polygons. Pure intention compiled into data.
              </p>
              <p className="max-w-md text-sm leading-relaxed text-white/60">
                在 SoulClone 的宇宙中，一份礼物不是一张静态的图片，而是一段可以被接收者人格 AI
                实时解读、反馈和互动的情感算法。送出一束霓虹玫瑰，接收者的孪生会闻到它的芬芳；
                送出一首数据诗，它会根据接收者的情感拓扑自动改写韵脚。
              </p>
            </div>

            {/* Right: gift box & panels */}
            <div className="relative flex h-[500px] items-center justify-center">
              {/* Central gift box */}
              <button
                onClick={compileGift}
                className="relative z-10 flex h-40 w-40 flex-col items-center justify-center rounded-2xl liquid-glass-strong transition-all duration-500 hover:scale-110 md:h-48 md:w-48"
                style={{
                  boxShadow: giftCompiled
                    ? '0 0 80px rgba(255,190,11,0.6)'
                    : '0 0 40px rgba(0,240,255,0.2)',
                }}
              >
                <div className="font-mono text-4xl text-accent-cyan">{'{ }'}</div>
                <div className="mt-2 font-mono text-xs text-white/40">
                  {giftCompiled ? 'COMPILED' : 'CLICK TO COMPILE'}
                </div>
                {/* Code waterfall overlay */}
                <div className="absolute inset-0 overflow-hidden rounded-2xl opacity-20">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute font-mono text-[8px] text-accent-cyan"
                      style={{
                        left: `${10 + i * 12}%`,
                        top: `${(Date.now() / 30 + i * 40) % 100}%`,
                        animation: `fall ${3 + Math.random() * 2}s linear infinite`,
                        animationDelay: `${i * 0.5}s`,
                      }}
                    >
                      {'{ } ; <> //'}
                    </div>
                  ))}
                </div>
              </button>

              {/* Surrounding panels */}
              {[
                { label: '情感价值', value: '94% MATCH', icon: '♥', color: '#ff006e', pos: { top: '5%', left: '5%' } },
                { label: '幽默指数', value: 'LEVEL 7', icon: '☺', color: '#ffbe0b', pos: { top: '5%', right: '5%' } },
                { label: '稀有度', value: 'LEGENDARY', icon: '⬡', color: '#00f0ff', pos: { bottom: '5%', left: '5%' } },
                { label: '互动性', value: 'CHAINABLE', icon: '⇄', color: '#ff006e', pos: { bottom: '5%', right: '5%' } },
              ].map((panel, i) => (
                <div
                  key={panel.label}
                  className="absolute w-32 rounded-xl liquid-glass p-3 transition-all duration-300 hover:scale-105 md:w-36"
                  style={{
                    ...panel.pos,
                    borderColor: `${panel.color}33`,
                    animation: `float ${4 + i}s ease-in-out infinite`,
                    animationDelay: `${i * 0.5}s`,
                  }}
                >
                  <div className="mb-1 text-lg" style={{ color: panel.color }}>
                    {panel.icon}
                  </div>
                  <div className="text-xs text-white/60">{panel.label}</div>
                  <div className="font-mono text-sm font-bold" style={{ color: panel.color }}>
                    {panel.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========== SECTION 3: Resonance Trigger ========== */}
      <section
        ref={resonanceRef}
        className="relative min-h-[100dvh] overflow-hidden px-6 py-20"
      >
        <div className="mx-auto max-w-5xl">
          {/* Scanning text */}
          <div className="mb-8 text-center">
            <div className="mb-4 font-mono text-sm tracking-wider text-accent-cyan/60">
              SCANNING FOR RESONANCE...
            </div>
          </div>

          {/* Canvas visualization */}
          <div className="relative mx-auto h-[500px] w-full overflow-hidden rounded-3xl liquid-glass">
            <Suspense fallback={<div className="flex h-full items-center justify-center text-white/30">Loading resonance field...</div>}>
              <ResonanceCanvas />
            </Suspense>

            {/* Overlays */}
            <div className="absolute bottom-6 left-6">
              <div className="font-mono text-xs text-accent-cyan/60">
                FREQUENCY: 440Hz
              </div>
            </div>
            <div className="absolute bottom-6 right-6">
              <div className="font-mono text-xs text-accent-magenta/60">
                FREQUENCY: 440Hz
              </div>
            </div>
          </div>

          {/* Bottom poetry */}
          <div className="mt-10 text-center">
            <p className="font-display text-lg text-white/70 md:text-xl">
              当两个孤独的频率，在数据深渊中偶然对齐。
            </p>
          </div>
        </div>
      </section>

      {/* ========== SECTION 4: Scenario Sandbox ========== */}
      <section
        ref={scenariosRef}
        className="relative min-h-[100dvh] px-6 py-20"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold text-white md:text-4xl">
              场景漫游
            </h2>
            <p className="mt-3 text-sm text-white/50">
              约会的无限可能 — 进入任意一个微缩宇宙
            </p>
          </div>

          {/* 3D Card fan */}
          <div className="relative flex flex-wrap justify-center gap-6 perspective-1000">
            {scenarios.map((scene, i) => {
              const isActive = activeScenario === i;
              return (
                <button
                  key={scene.name}
                  onClick={() => setActiveScenario(isActive ? null : i)}
                  className="group relative h-72 w-56 overflow-hidden rounded-2xl liquid-glass transition-all duration-500"
                  style={{
                    transform: isActive
                      ? 'scale(1.08) rotateY(0deg)'
                      : `rotateY(${(i - scenarios.length / 2) * 5}deg)`,
                    zIndex: isActive ? 10 : 1,
                  }}
                >
                  {/* Scene thumbnail */}
                  <div
                    className="absolute inset-0 transition-all duration-500 group-hover:scale-110"
                    style={{
                      background: `radial-gradient(ellipse at 50% 50%, ${scene.color}22 0%, transparent 70%)`,
                    }}
                  />

                  {/* Content */}
                  <div className="relative flex h-full flex-col justify-between p-5">
                    <div
                      className="h-24 w-full rounded-lg"
                      style={{
                        background: `linear-gradient(135deg, ${scene.color}15, transparent)`,
                        border: `1px solid ${scene.color}22`,
                      }}
                    >
                      <div className="flex h-full items-center justify-center text-3xl opacity-30">
                        {['🌸', '🌧', '📚', '🌌', '☕', '💧'][i]}
                      </div>
                    </div>

                    <div>
                      <h3 className="mb-1 font-display text-lg text-white">{scene.name}</h3>
                      <p className="mb-3 text-xs text-white/40">{scene.desc}</p>
                      <span
                        className="inline-block rounded-full px-3 py-1 text-xs font-medium"
                        style={{
                          color: scene.color,
                          border: `1px solid ${scene.color}44`,
                        }}
                      >
                        ENTER
                      </span>
                    </div>
                  </div>

                  {/* Glow on active */}
                  {isActive && (
                    <div
                      className="absolute inset-0"
                      style={{
                        boxShadow: `inset 0 0 40px ${scene.color}33`,
                        border: `1px solid ${scene.color}55`,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========== SECTION 5: Personality Badges ========== */}
      <section
        ref={badgesRef}
        className="relative min-h-[80dvh] px-6 py-20"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold text-white md:text-4xl">
              人格勋章
            </h2>
            <p className="mt-3 text-sm text-white/50">
              每一个徽章，都是你在数字宇宙中留下的足迹
            </p>
          </div>

          {/* Base dodecahedron visual (CSS approximation) */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 opacity-20">
            <div
              className="h-full w-full"
              style={{
                background: 'radial-gradient(circle, rgba(0,240,255,0.1) 0%, transparent 70%)',
                animation: 'pulse-glow 4s ease-in-out infinite',
              }}
            />
          </div>

          {/* Badge grid */}
          <div className="relative grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
            {badges.map((badge, i) => {
              const isHovered = hoveredBadge === i;
              const isUnlocked = badge.unlocked;

              return (
                <button
                  key={badge.name}
                  onMouseEnter={() => setHoveredBadge(i)}
                  onMouseLeave={() => setHoveredBadge(null)}
                  className="relative flex flex-col items-center gap-2 rounded-2xl p-4 transition-all duration-300"
                  style={{
                    background: isUnlocked
                      ? 'rgba(15,15,20,0.6)'
                      : 'rgba(15,15,20,0.3)',
                    border: `1px solid ${isUnlocked ? badge.color + '33' : 'rgba(255,255,255,0.04)'}`,
                    boxShadow: isHovered && isUnlocked
                      ? `0 0 30px ${badge.color}33`
                      : 'none',
                    transform: isHovered && isUnlocked ? 'scale(1.05)' : 'scale(1)',
                  }}
                >
                  {/* Badge icon */}
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-full text-lg transition-all duration-300"
                    style={{
                      background: isUnlocked
                        ? `linear-gradient(135deg, ${badge.color}22, transparent)`
                        : 'rgba(255,255,255,0.03)',
                      color: isUnlocked ? badge.color : 'rgba(255,255,255,0.15)',
                      animation: isUnlocked ? 'pulse-glow 3s ease-in-out infinite' : 'none',
                      animationDelay: `${i * 0.2}s`,
                    }}
                  >
                    {['🦋', '📜', '❓', '💓', '🗺', '🎁', '🎛', '👁', '✨', '🛡', '⏰', '⚡'][i]}
                  </div>

                  {/* Name */}
                  <div
                    className="text-center text-xs"
                    style={{
                      color: isUnlocked ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)',
                    }}
                  >
                    {badge.name}
                  </div>

                  {/* Condition */}
                  <div className="text-center text-[10px] text-white/20">
                    {badge.condition}
                  </div>

                  {/* Frost overlay for locked */}
                  {!isUnlocked && (
                    <div className="absolute inset-0 rounded-2xl bg-white/[0.02] backdrop-blur-[1px]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Hover detail panel */}
          {hoveredBadge !== null && badges[hoveredBadge].unlocked && (
            <div className="mx-auto mt-8 max-w-md rounded-2xl liquid-glass p-5 text-center">
              <div className="mb-2 font-display text-lg" style={{ color: badges[hoveredBadge].color }}>
                {badges[hoveredBadge].name}
              </div>
              <p className="text-sm text-white/50">{badges[hoveredBadge].condition}</p>
              <div className="mt-3 font-mono text-xs text-white/30">
                解锁时间: 2024.06.{15 + hoveredBadge} · 来源: 自动同步
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
