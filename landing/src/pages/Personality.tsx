import { useState, useRef, useEffect, useCallback, lazy, Suspense } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

/* GSAP/Three.js components — isolated from Framer Motion tree */
const NeuralGridBackground = lazy(() => import('../components/personality/NeuralGridBackground'));
const TopologyGraph = lazy(() => import('../components/personality/TopologyGraph'));

/* Framer Motion is NOT used in this page — we stay purely in GSAP + React state */

const inlineStyles = `
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

const sliderData = [
  { label: '社交能量', color: '#ff006e' },
  { label: '思辨深度', color: '#00f0ff' },
  { label: '幽默阈值', color: '#ffbe0b' },
  { label: '共情带宽', color: '#ff006e' },
  { label: '创造冲动', color: '#00f0ff' },
];

const logMessages = [
  '正在分析语料库...',
  '情感模式匹配度 87%...',
  '幽默感向量已归一化...',
  '社交能量节点稳定...',
  '共情带宽扩容中...',
  '人格拓扑图绘制完成...',
  '数字孪生核心编译中...',
];

export default function Personality() {
  const [sliders, setSliders] = useState<number[]>([0.3, 0.2, 0.4, 0.15, 0.25]);
  const [distillation, setDistillation] = useState(0);
  const [capsulesDropped, setCapsulesDropped] = useState(0);
  const [awakened, setAwakened] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const heroRef = useRef<HTMLDivElement>(null);
  const topologyRef = useRef<HTMLDivElement>(null);
  const memoryRef = useRef<HTMLDivElement>(null);
  const awakeningRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const sliderContainerRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);

  const totalFill = sliders.reduce((a, b) => a + b, 0) / sliders.length;

  const handleSliderChange = useCallback((idx: number, value: number) => {
    setSliders((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
    // Add log
    setLogs((prev) => {
      const msg = `${sliderData[idx].label} 已调整至 ${Math.round(value * 100)}%`;
      return [msg, ...prev].slice(0, 6);
    });
  }, []);

  /* GSAP scroll animations */
  useGSAP(() => {
    if (!heroRef.current || !topologyRef.current || !memoryRef.current || !awakeningRef.current) return;

    // Hero entrance
    gsap.fromTo(
      titleRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out', delay: 0.3 }
    );

    gsap.fromTo(
      sliderContainerRef.current?.children ?? [],
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, duration: 0.8, stagger: 0.12, ease: 'elastic.out(1, 0.7)', delay: 0.6 }
    );

    // Topology section
    gsap.fromTo(
      topologyRef.current,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 1,
        scrollTrigger: {
          trigger: topologyRef.current,
          start: 'top 80%',
          end: 'top 30%',
          scrub: 1,
        },
      }
    );

    // Memory injection
    gsap.fromTo(
      memoryRef.current,
      { opacity: 0, y: 60 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        scrollTrigger: {
          trigger: memoryRef.current,
          start: 'top 80%',
          end: 'top 40%',
          scrub: 1,
        },
      }
    );

    // Awakening
    gsap.fromTo(
      awakeningRef.current,
      { opacity: 0, scale: 0.95 },
      {
        opacity: 1,
        scale: 1,
        duration: 1.2,
        scrollTrigger: {
          trigger: awakeningRef.current,
          start: 'top 80%',
          end: 'top 40%',
          scrub: 1,
        },
      }
    );
  }, []);

  /* Central container fill animation */
  useEffect(() => {
    if (fillRef.current) {
      gsap.to(fillRef.current, {
        height: `${totalFill * 100}%`,
        duration: 0.8,
        ease: 'elastic.out(1, 0.6)',
      });
    }
  }, [totalFill]);

  /* Distillation progress animation */
  useEffect(() => {
    if (progressRef.current) {
      gsap.to(progressRef.current, {
        opacity: 1,
        duration: 0.3,
      });
    }
  }, [distillation]);

  const dropCapsule = useCallback(() => {
    if (capsulesDropped >= 3) return;
    const next = capsulesDropped + 1;
    setCapsulesDropped(next);
    const newProgress = Math.min(100, next * 35 + Math.floor(Math.random() * 15));
    setDistillation(newProgress);
    setLogs((prev) => [`记忆样本 #${next} 注入完成`, ...prev].slice(0, 6));
  }, [capsulesDropped]);

  const activateTwin = useCallback(() => {
    setAwakened(true);
    if (coreRef.current) {
      gsap.to(coreRef.current, {
        scale: 2,
        opacity: 0,
        duration: 1.5,
        ease: 'power2.in',
        onComplete: () => {
          gsap.set(coreRef.current, { scale: 0.5, opacity: 0 });
          gsap.to(coreRef.current, {
            scale: 1,
            opacity: 1,
            duration: 1,
            ease: 'elastic.out(1, 0.5)',
          });
        },
      });
    }
  }, []);

  return (
    <div className="relative bg-[#050508] text-white">
      <style dangerouslySetInnerHTML={{ __html: inlineStyles }} />
      {/* ========== HERO: Consciousness Tuner ========== */}
      <section
        ref={heroRef}
        className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-4 py-20"
      >
        <Suspense fallback={<div className="absolute inset-0 bg-[#050508]" />}>
          <NeuralGridBackground />
        </Suspense>

        {/* Title */}
        <div ref={titleRef} className="relative z-10 mb-8 text-center">
          <div className="mb-2 overflow-hidden">
            <div className="animate-marquee whitespace-nowrap font-mono text-xs tracking-[0.3em] text-accent-cyan/80">
              INITIALIZING PERSONALITY DISTILLATION... SYSTEM ONLINE... NEURAL MESH CONNECTED...
            </div>
          </div>
          <h1 className="font-display text-3xl font-bold tracking-wider text-white md:text-4xl">
            意识调频舱
          </h1>
          <p className="mt-3 max-w-md text-sm text-white/50">
            调整你的核心频率，让数字深渊感知你的灵魂波形。
          </p>
        </div>

        {/* Central container + Sliders */}
        <div className="relative z-10 flex flex-col items-center gap-6 md:flex-row md:gap-16">
          {/* Left sliders */}
          <div ref={sliderContainerRef} className="flex gap-3 md:gap-6">
            {sliderData.slice(0, 2).map((s, i) => (
              <LiquidSlider
                key={s.label}
                label={s.label}
                color={s.color}
                value={sliders[i]}
                onChange={(v) => handleSliderChange(i, v)}
              />
            ))}
          </div>

          {/* Central liquid glass container */}
          <div className="relative h-64 w-48 overflow-hidden rounded-3xl liquid-glass-strong md:h-96 md:w-72">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="font-mono text-3xl font-bold text-white/80">
                  {Math.round(totalFill * 100)}%
                </div>
                <div className="mt-1 text-xs text-white/40">人格充能</div>
              </div>
            </div>
            {/* Multi-color liquid fill */}
            <div
              ref={fillRef}
              className="absolute bottom-0 left-0 w-full"
              style={{
                height: '0%',
                background: `linear-gradient(0deg,
                  ${sliderData[0].color}88 0%,
                  ${sliderData[1].color}66 25%,
                  ${sliderData[2].color}44 50%,
                  ${sliderData[3].color}66 75%,
                  ${sliderData[4].color}88 100%)`,
                mixBlendMode: 'screen',
                transition: 'height 0.5s ease-out',
              }}
            />
            {/* Surface shimmer */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                background: 'radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.15) 0%, transparent 70%)',
              }}
            />
          </div>

          {/* Right sliders */}
          <div ref={sliderContainerRef} className="flex gap-3 md:gap-6">
            {sliderData.slice(2).map((s, i) => (
              <LiquidSlider
                key={s.label}
                label={s.label}
                color={s.color}
                value={sliders[i + 2]}
                onChange={(v) => handleSliderChange(i + 2, v)}
              />
            ))}
          </div>
        </div>

        {/* Resonance indicator */}
        {totalFill > 0.5 && (
          <div className="relative z-10 mt-8 text-center">
            <div
              className="inline-block rounded-full px-4 py-1.5 font-mono text-xs tracking-wider"
              style={{
                color: '#ffbe0b',
                border: '1px solid rgba(255,190,11,0.3)',
                boxShadow: '0 0 20px rgba(255,190,11,0.15)',
                animation: 'pulse-glow 2s ease-in-out infinite',
              }}
            >
              RESONANCE DETECTED — 人格波形同步中
            </div>
          </div>
        )}
      </section>

      {/* ========== SECTION 2: Topology Workshop ========== */}
      <section
        ref={topologyRef}
        className="relative min-h-[100dvh] overflow-hidden px-6 py-20"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold text-white md:text-4xl">
              人格拓扑工坊
            </h2>
            <p className="mt-3 text-sm text-white/50">
              实时构建你的 AI 人格神经网络
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Blueprint panel */}
            <div className="relative h-96 overflow-hidden rounded-2xl liquid-glass lg:h-[500px]">
              <Suspense fallback={<div className="flex h-full items-center justify-center text-white/30">Loading neural mesh...</div>}>
                <TopologyGraph />
              </Suspense>
              <div className="absolute bottom-4 left-4 right-4 rounded-lg bg-black/40 px-3 py-2 backdrop-blur-sm">
                <div className="font-mono text-[10px] text-accent-cyan/80">
                  {logs[0] || '等待输入...'}
                </div>
              </div>
            </div>

            {/* Sculpt inspection */}
            <div className="flex flex-col justify-center gap-6">
              <div className="rounded-2xl liquid-glass p-6">
                <h3 className="mb-4 font-display text-lg text-white">人格特质分析</h3>
                {sliderData.map((s, i) => (
                  <div key={s.label} className="mb-3 flex items-center gap-3">
                    <div className="w-24 text-xs" style={{ color: s.color }}>
                      {s.label}
                    </div>
                    <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${sliders[i] * 100}%`,
                          background: s.color,
                          boxShadow: `0 0 8px ${s.color}66`,
                        }}
                      />
                    </div>
                    <div className="w-10 text-right font-mono text-xs text-white/60">
                      {Math.round(sliders[i] * 100)}%
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl liquid-glass p-6">
                <h3 className="mb-3 font-display text-lg text-white">实时日志</h3>
                <div className="space-y-1.5">
                  {logMessages.map((msg, i) => (
                    <div
                      key={msg}
                      className="font-mono text-xs transition-colors duration-300"
                      style={{
                        color: logs.includes(msg) || i < logs.length ? '#00f0ffcc' : '#ffffff33',
                      }}
                    >
                      {`>`} {msg}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== SECTION 3: Memory Injection Protocol ========== */}
      <section
        ref={memoryRef}
        className="relative min-h-[100dvh] px-6 py-20"
      >
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold text-white md:text-4xl">
              样本注入协议
            </h2>
            <p className="mt-3 text-sm text-white/50">
              拖拽记忆胶囊，完成人格蒸馏的最后一步
            </p>
          </div>

          {/* Capsules */}
          <div className="mb-12 flex flex-wrap justify-center gap-4">
            {[
              { label: '微信聊天记录', color: '#00f0ff' },
              { label: '深夜树洞独白', color: '#ff006e' },
              { label: '职场撕逼金句', color: '#ffbe0b' },
            ].map((capsule, i) => (
              <button
                key={capsule.label}
                onClick={dropCapsule}
                disabled={i < capsulesDropped}
                className="relative overflow-hidden rounded-full px-6 py-3 text-sm font-medium transition-all duration-300 disabled:opacity-30"
                style={{
                  background: `linear-gradient(135deg, ${capsule.color}11, ${capsule.color}22)`,
                  border: `1px solid ${capsule.color}44`,
                  color: capsule.color,
                  boxShadow: i < capsulesDropped
                    ? `0 0 30px ${capsule.color}33`
                    : `0 0 10px ${capsule.color}22`,
                  cursor: i < capsulesDropped ? 'default' : 'pointer',
                }}
              >
                <span className="relative z-10">{capsule.label}</span>
                {i < capsulesDropped && (
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${capsule.color}33, transparent)`,
                      animation: 'shimmer 2s linear infinite',
                    }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Transmission channel */}
          <div className="relative mx-auto mb-12 h-32 w-full max-w-md overflow-hidden rounded-2xl liquid-glass">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-px w-full bg-gradient-to-r from-transparent via-accent-cyan/30 to-transparent" />
            </div>
            {/* Rising bubbles */}
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: 4 + Math.random() * 8,
                  height: 4 + Math.random() * 8,
                  left: `${10 + i * 12}%`,
                  bottom: `${(Date.now() / 50 + i * 30) % 100}%`,
                  background: i % 2 === 0 ? '#00f0ff' : '#ff006e',
                  opacity: 0.4,
                  animation: `float ${3 + Math.random() * 2}s ease-in-out infinite`,
                  animationDelay: `${i * 0.3}s`,
                }}
              />
            ))}
            {/* Falling text fragments */}
            {capsulesDropped > 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="animate-pulse font-mono text-xs text-white/40">
                  数据流注入中...
                </span>
              </div>
            )}
          </div>

          {/* Distillation percentage */}
          <div className="text-center">
            <div
              ref={progressRef}
              className="font-mono text-6xl font-bold tracking-tighter md:text-8xl"
              style={{
                color: distillation >= 100 ? '#ffbe0b' : '#00f0ff',
                textShadow: distillation >= 100
                  ? '0 0 40px rgba(255,190,11,0.6), 0 0 80px rgba(255,190,11,0.3)'
                  : '0 0 40px rgba(0,240,255,0.4), 0 0 80px rgba(0,240,255,0.2)',
              }}
            >
              DISTILLATION: {distillation}%
            </div>
            {distillation >= 100 && (
              <div className="mt-6">
                <button
                  onClick={() => {
                    const el = document.getElementById('awakening');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="rounded-full px-8 py-3 font-display text-sm font-bold tracking-wider text-accent-gold"
                  style={{
                    border: '1px solid rgba(255,190,11,0.4)',
                    boxShadow: '0 0 30px rgba(255,190,11,0.2)',
                  }}
                >
                  进入觉醒确认
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========== SECTION 4: Awakening Confirmation ========== */}
      <section
        id="awakening"
        ref={awakeningRef}
        className="relative flex min-h-[100dvh] flex-col items-center justify-center px-6 py-20"
      >
        <div className="relative z-10 text-center">
          {/* Core */}
          <div
            ref={coreRef}
            className="relative mx-auto mb-8 h-48 w-48 md:h-64 md:w-64"
          >
            {/* Outer glow */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: awakened
                  ? 'radial-gradient(circle, rgba(255,190,11,0.4) 0%, transparent 70%)'
                  : 'radial-gradient(circle, rgba(0,240,255,0.3) 0%, transparent 70%)',
                animation: 'pulse-glow 3s ease-in-out infinite',
              }}
            />
            {/* Core geometry */}
            <div
              className="absolute inset-4 rounded-full liquid-glass-strong"
              style={{
                boxShadow: awakened
                  ? '0 0 60px rgba(255,190,11,0.5), inset 0 0 40px rgba(255,190,11,0.2)'
                  : '0 0 60px rgba(0,240,255,0.4), inset 0 0 40px rgba(0,240,255,0.15)',
              }}
            >
              {/* Inner spinning ring */}
              <div
                className="absolute inset-2 rounded-full border-2 border-dashed"
                style={{
                  borderColor: awakened ? 'rgba(255,190,11,0.4)' : 'rgba(0,240,255,0.3)',
                  animation: 'spin 8s linear infinite',
                }}
              />
              {/* Inner core light */}
              <div
                className="absolute inset-8 rounded-full"
                style={{
                  background: awakened
                    ? 'radial-gradient(circle, #ffbe0b 0%, transparent 80%)'
                    : 'radial-gradient(circle, #00f0ff 0%, transparent 80%)',
                  filter: 'blur(8px)',
                }}
              />
              {/* Stripes based on personality traits */}
              {sliders.map((s, i) => (
                <div
                  key={i}
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `conic-gradient(from ${i * 72}deg, transparent ${100 - s * 100}%, ${sliderData[i].color}88 ${100 - s * 100}%, transparent)`,
                    opacity: 0.3,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Labels */}
          <div className="mb-6 flex justify-center gap-16">
            <span className="font-mono text-xs tracking-wider text-accent-cyan/60">ORIGINAL</span>
            <span className="font-mono text-xs tracking-wider text-accent-magenta/60">TWIN</span>
          </div>

          {/* Declaration */}
          <h2 className="mb-6 font-display text-3xl font-bold text-white md:text-5xl">
            {awakened ? 'YOUR DIGITAL TWIN IS' : 'YOUR DIGITAL TWIN IS READY.'}
          </h2>

          {/* Warning */}
          <p className="mx-auto mb-10 max-w-lg text-xs leading-relaxed text-accent-magenta/60">
            警告：一旦激活，你的孪生将具备独立社交权限。你在现实中的沉默，将被它在虚拟世界中的喧嚣所填补。
          </p>

          {/* Control panel */}
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={activateTwin}
              disabled={awakened}
              className="rounded-full px-8 py-3 font-display text-sm font-bold tracking-wider transition-all duration-300 disabled:opacity-50"
              style={{
                background: 'rgba(255,0,110,0.15)',
                color: '#ff006e',
                border: '1px solid rgba(255,0,110,0.4)',
                boxShadow: '0 0 20px rgba(255,0,110,0.2)',
              }}
            >
              ACTIVATE (释放孪生)
            </button>
            <button
              onClick={() => {
                setSliders([0.3, 0.2, 0.4, 0.15, 0.25]);
                setDistillation(0);
                setCapsulesDropped(0);
                setAwakened(false);
                setLogs([]);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="rounded-full px-8 py-3 font-display text-sm font-bold tracking-wider transition-all duration-300 hover:bg-accent-cyan/10"
              style={{
                color: '#00f0ff',
                border: '1px solid rgba(0,240,255,0.3)',
              }}
            >
              RE-DISTILL (重新蒸馏)
            </button>
          </div>

          {awakened && (
            <div className="mt-8 font-mono text-sm text-accent-gold">
              SOCIAL_PROTOCOL_INITIATED... MATCHING_ENGINE_SPINNING_UP...
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

/* Inline slider component for hero */
function LiquidSlider({ label, color, value, onChange }: {
  label: string;
  color: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleMove = useCallback(
    (clientY: number) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const pct = 1 - (clientY - rect.top) / rect.height;
      onChange(Math.max(0, Math.min(1, pct)));
    },
    [onChange]
  );

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        ref={trackRef}
        className="relative h-56 w-3 cursor-pointer overflow-hidden rounded-full md:h-72"
        style={{ background: 'rgba(255,255,255,0.05)' }}
        onPointerDown={(e) => {
          setDragging(true);
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          handleMove(e.clientY);
        }}
        onPointerMove={(e) => {
          if (!dragging) return;
          handleMove(e.clientY);
        }}
        onPointerUp={() => setDragging(false)}
      >
        <div
          className="absolute bottom-0 left-0 w-full"
          style={{
            height: `${value * 100}%`,
            background: `linear-gradient(180deg, ${color}44 0%, ${color} 100%)`,
            borderRadius: '999px',
            boxShadow: `0 0 16px ${color}55`,
            transition: dragging ? 'none' : 'height 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        />
        <div
          className="absolute left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            top: `${100 - value * 100}%`,
            background: color,
            boxShadow: `0 0 10px ${color}, 0 0 20px ${color}66`,
          }}
        />
      </div>
      <div
        className="font-display text-[10px] tracking-widest md:text-xs"
        style={{
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          color,
          textShadow: `0 0 8px ${color}44`,
        }}
      >
        {label}
      </div>
    </div>
  );
}
