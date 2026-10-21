import { useEffect, useRef, useState } from 'react';
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export default function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const settings = useRef({ count: 75, speed: 1, distance: 125, playing: false });
  const [count, setCount] = useState(75);
  const [speed, setSpeed] = useState(1);
  const [distance, setDistance] = useState(125);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const redraw = useRef<() => void>(() => {});

  useEffect(() => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    setPlaying(!reduced.matches);
    setReady(true);
    const changed = (event: MediaQueryListEvent) => {
      if (event.matches) setPlaying(false);
    };
    reduced.addEventListener('change', changed);
    return () => reduced.removeEventListener('change', changed);
  }, []);
  useEffect(() => {
    settings.current = { count, speed, distance, playing };
    redraw.current();
  }, [count, speed, distance, playing]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    let width = 1,
      height = 1,
      particles: Particle[] = [];
    let frame = 0,
      previous = 0,
      visible = true,
      disposed = false;
    let pointer: { x: number; y: number } | null = null;
    const makeParticle = (): Particle => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.7,
      vy: (Math.random() - 0.5) * 0.7,
      radius: Math.random() * 1.4 + 0.7,
    });
    function draw(time: number) {
      if (disposed || !ctx || !canvas) return;
      frame = 0;
      const { count: total, speed: rate, distance: reach, playing: active } = settings.current;
      while (particles.length < total) particles.push(makeParticle());
      particles.length = total;
      const delta = active ? Math.min((time - previous) / 16.67 || 1, 2) : 0;
      previous = time;
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.x += p.vx * rate * delta;
        p.y += p.vy * rate * delta;
        if (pointer && active) {
          const dx = p.x - pointer.x,
            dy = p.y - pointer.y,
            d = Math.hypot(dx, dy);
          if (d > 0.1 && d < 110) {
            const force = (1 - d / 110) * delta * 0.6;
            p.x += (dx / d) * force;
            p.y += (dy / d) * force;
          }
        }
        if (p.x < 0 || p.x > width) {
          p.vx *= -1;
          p.x = Math.max(0, Math.min(width, p.x));
        }
        if (p.y < 0 || p.y > height) {
          p.vy *= -1;
          p.y = Math.max(0, Math.min(height, p.y));
        }
      }
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const distance = Math.hypot(p.x - q.x, p.y - q.y);
          if (distance < reach) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(130,143,237,${(1 - distance / reach) * 0.42})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = i % 3 === 0 ? '#79d8ef' : '#b8afff';
        ctx.fill();
      }
      canvas.dataset.particles = String(particles.length);
      if (active && visible && !document.hidden) frame = requestAnimationFrame(draw);
    }
    function wake() {
      if (disposed) return;
      cancelAnimationFrame(frame);
      previous = performance.now();
      draw(previous);
    }
    redraw.current = wake;
    const resize = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(devicePixelRatio || 1, 2);
      const oldWidth = width,
        oldHeight = height;
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      particles.forEach((p) => {
        p.x = (p.x / oldWidth) * width;
        p.y = (p.y / oldHeight) * height;
      });
      wake();
    });
    resize.observe(canvas);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) wake();
      else cancelAnimationFrame(frame);
    });
    observer.observe(canvas);
    const onVisibility = () => {
      if (document.hidden) cancelAnimationFrame(frame);
      else wake();
    };
    const onPointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };
    const onLeave = () => {
      pointer = null;
    };
    document.addEventListener('visibilitychange', onVisibility);
    canvas.addEventListener('pointermove', onPointer);
    canvas.addEventListener('pointerleave', onLeave);
    wake();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resize.disconnect();
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('pointermove', onPointer);
      canvas.removeEventListener('pointerleave', onLeave);
      redraw.current = () => {};
    };
  }, []);
  return (
    <div className="particle-experiment">
      <canvas
        ref={canvasRef}
        className="particle-canvas"
        aria-label="交互式粒子场：使用下方滑块调整粒子数量、速度与连线距离"
      >
        浏览器不支持 Canvas。请使用支持 Canvas 的浏览器体验粒子动画。
      </canvas>
      <div className="particle-controls">
        <label>
          <span>
            粒子数量 <output>{count}</output>
          </span>
          <input
            aria-label="粒子数量"
            type="range"
            min="20"
            max="150"
            step="5"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
          />
        </label>
        <label>
          <span>
            运动速度 <output>{speed.toFixed(1)}×</output>
          </span>
          <input
            aria-label="运动速度"
            type="range"
            min=".2"
            max="2"
            step=".1"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          />
        </label>
        <label>
          <span>
            连线距离 <output>{distance}px</output>
          </span>
          <input
            aria-label="连线距离"
            type="range"
            min="50"
            max="200"
            step="5"
            value={distance}
            onChange={(e) => setDistance(Number(e.target.value))}
          />
        </label>
        <button
          className="button button-secondary"
          disabled={!ready}
          onClick={() => setPlaying(!playing)}
          aria-pressed={playing}
        >
          {playing ? '暂停动画' : '播放动画'}
        </button>
      </div>
      <p className="demo-help" aria-live="polite">
        {playing ? '动画运行中' : '动画已暂停'} ·
        移动指针与粒子互动。尊重系统的减少动画设置，离开视口时自动暂停绘制。
      </p>
    </div>
  );
}
