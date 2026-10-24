interface Point3 {
  x: number;
  y: number;
  z: number;
}
interface ScreenPoint {
  x: number;
  y: number;
  depth: number;
}

export function initHomeIntro() {
  const dialog = document.querySelector<HTMLDialogElement>('#home-intro');
  const canvas = dialog?.querySelector('canvas');
  const context = canvas?.getContext('2d');
  const replay = document.querySelector<HTMLButtonElement>('[data-replay-intro]');
  if (!dialog || !canvas || !context || !replay) return;
  const modal = dialog,
    surface = canvas,
    ctx = context;
  const pause = modal.querySelector<HTMLButtonElement>('[data-intro-pause]')!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const key = 'personal-space:particle-intro-seen';
  let frame = 0,
    previous = 0,
    elapsed = 0,
    exitAt = 0,
    timer = 0;
  let paused = false,
    width = 1,
    height = 1,
    radius = 1;
  let oldOverflow = '',
    returnFocus: HTMLElement | undefined;
  let controls: AbortController | undefined, observer: ResizeObserver | undefined;
  let particles: Point3[] = [],
    edges: [number, number][] = [];
  let pointer = { x: 0, y: 0 },
    smooth = { x: 0, y: 0 },
    hit = { x: 0, y: 0 };
  let accent = '',
    cyan = '';
  const stars = Array.from({ length: 100 }, (_, i) => ({
    x: (Math.sin(i * 127.1 + 7) * 43758.5453) % 1,
    y: (Math.sin(i * 311.7 + 11) * 12345.6789) % 1,
    z: 0.3 + (i % 7) / 10,
  }));

  function finish() {
    if (!modal.open) return;
    controls?.abort();
    observer?.disconnect();
    cancelAnimationFrame(frame);
    clearTimeout(timer);
    frame = 0;
    modal.close();
    modal.dataset.state = 'closed';
    document.documentElement.style.overflow = oldOverflow;
    const target = returnFocus?.isConnected ? returnFocus : document.getElementById('main');
    if (target) {
      const temporary = target.tagName === 'MAIN' && !target.hasAttribute('tabindex');
      if (temporary) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      if (temporary)
        target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
    }
  }

  function resize() {
    width = modal.clientWidth;
    height = modal.clientHeight;
    radius = Math.min(width * 0.43, height * 0.39, 380);
    const dpr = Math.min(devicePixelRatio || 1, 2);
    surface.width = Math.round(width * dpr);
    surface.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = width < 600 ? 140 : 240;
    if (count !== particles.length) {
      particles = Array.from({ length: count }, (_, i) => {
        const y = 1 - ((i + 0.5) * 2) / count;
        const r = Math.sqrt(1 - y * y),
          angle = i * Math.PI * (3 - Math.sqrt(5));
        return { x: Math.cos(angle) * r, y, z: Math.sin(angle) * r };
      });
      // Neighbour links are built once, instead of testing every pair on every frame.
      edges = [];
      for (let i = 0; i < count; i++)
        for (let j = i + 1; j < count; j++) {
          const a = particles[i],
            b = particles[j];
          if (Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) < (count < 200 ? 0.34 : 0.27))
            edges.push([i, j]);
        }
    }
    render(0);
  }

  function render(progress: number) {
    ctx.clearRect(0, 0, width, height);
    const expand = progress * progress * 9;
    const cx = width / 2,
      cy = height / 2;
    for (const star of stars) {
      const x = Math.abs(star.x) * width + smooth.x * star.z * 22;
      const y =
        Math.abs(star.y) * height +
        Math.sin(elapsed * 0.2 + star.z * 8) * 8 +
        smooth.y * star.z * 22;
      ctx.globalAlpha = 0.15 + star.z * 0.3;
      ctx.fillStyle = cyan;
      ctx.beginPath();
      ctx.arc(x + (x - hit.x) * expand, y + (y - hit.y) * expand, star.z, 0, Math.PI * 2);
      ctx.fill();
    }
    const ay = elapsed * 0.11 + smooth.x * 0.25,
      ax = -0.24 + smooth.y * 0.18;
    const sinY = Math.sin(ay),
      cosY = Math.cos(ay),
      sinX = Math.sin(ax),
      cosX = Math.cos(ax);
    const projected: ScreenPoint[] = particles.map((p) => {
      const x = p.x * cosY + p.z * sinY,
        z = -p.x * sinY + p.z * cosY;
      const y = p.y * cosX - z * sinX,
        depth = p.y * sinX + z * cosX;
      const scale = 3 / (3 + depth);
      const px = cx + x * radius * scale,
        py = cy + y * radius * scale;
      return { x: px + (px - hit.x) * expand, y: py + (py - hit.y) * expand, depth };
    });
    ctx.lineWidth = 0.65;
    ctx.strokeStyle = accent;
    for (const [i, j] of edges) {
      const a = projected[i],
        b = projected[j];
      ctx.globalAlpha = (0.12 + (2 - a.depth - b.depth) * 0.055) * (1 - progress);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    projected.forEach((p, i) => {
      const near = (1 - p.depth) / 2,
        size = 0.8 + near * 1.7;
      ctx.fillStyle = i % 4 === 0 ? cyan : accent;
      ctx.globalAlpha = 0.25 + near * 0.65;
      if (progress > 0) {
        ctx.strokeStyle = ctx.fillStyle;
        ctx.lineWidth = size * 0.65;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - (p.x - hit.x) * progress * 0.13, p.y - (p.y - hit.y) * progress * 0.13);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, size * (1 + progress), 0, Math.PI * 2);
      ctx.fill();
      if (near > 0.65) {
        ctx.globalAlpha = 0.06;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    if (progress > 0) {
      ctx.globalAlpha = (1 - progress) * 0.5;
      ctx.strokeStyle = cyan;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(hit.x, hit.y, Math.hypot(width, height) * progress, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function draw(now: number) {
    frame = 0;
    if (!modal.open || document.hidden) return;
    const delta = previous ? Math.min((now - previous) / 1000, 0.05) : 0;
    previous = now;
    elapsed += delta;
    smooth.x += (pointer.x - smooth.x) * Math.min(1, delta * 5);
    smooth.y += (pointer.y - smooth.y) * Math.min(1, delta * 5);
    const progress = exitAt ? Math.min(1, (now - exitAt) / 1000) : 0;
    render(progress);
    if (progress >= 1) {
      finish();
      return;
    }
    if (!paused || exitAt) frame = requestAnimationFrame(draw);
  }

  function startFrames() {
    if (!frame && modal.open && !document.hidden && (!paused || exitAt)) {
      previous = 0;
      frame = requestAnimationFrame(draw);
    }
  }

  function enter(x = width / 2, y = height / 2) {
    if (exitAt || !modal.open) return;
    hit = { x, y };
    exitAt = performance.now();
    modal.dataset.state = 'leaving';
    timer = window.setTimeout(finish, 1150);
    startFrames();
  }

  function play(trigger?: HTMLElement) {
    if (reduced.matches || modal.open) return;
    returnFocus = trigger;
    elapsed = 0;
    exitAt = 0;
    paused = false;
    pointer = { x: 0, y: 0 };
    smooth = { x: 0, y: 0 };
    pause.textContent = '暂停动画';
    pause.setAttribute('aria-pressed', 'false');
    const theme = getComputedStyle(document.documentElement);
    accent = theme.getPropertyValue('--accent').trim();
    cyan = theme.getPropertyValue('--cyan').trim();
    controls = new AbortController();
    const options = { signal: controls.signal };
    oldOverflow = document.documentElement.style.overflow;
    modal.dataset.state = 'waiting';
    modal.showModal();
    document.documentElement.style.overflow = 'hidden';
    try {
      resize();
      observer = new ResizeObserver(resize);
      observer.observe(modal);
      modal.addEventListener(
        'click',
        (event) => {
          const button = (event.target as Element).closest('button');
          if (button?.hasAttribute('data-intro-skip')) {
            finish();
            return;
          }
          if (button?.hasAttribute('data-intro-pause')) {
            if (exitAt) return;
            paused = !paused;
            pause.textContent = paused ? '继续动画' : '暂停动画';
            pause.setAttribute('aria-pressed', String(paused));
            if (paused) {
              cancelAnimationFrame(frame);
              frame = 0;
            } else startFrames();
            return;
          }
          if (event.detail === 0) enter();
          else enter(event.clientX, event.clientY);
        },
        options,
      );
      modal.addEventListener(
        'pointermove',
        (event) => {
          pointer = { x: (event.clientX / width) * 2 - 1, y: (event.clientY / height) * 2 - 1 };
        },
        options,
      );
      modal.addEventListener(
        'pointerleave',
        () => {
          pointer = { x: 0, y: 0 };
        },
        options,
      );
      modal.addEventListener(
        'cancel',
        (event) => {
          event.preventDefault();
          finish();
        },
        options,
      );
      modal.addEventListener(
        'keydown',
        (event) => {
          if (
            event.key === 'Enter' &&
            !(event.target as Element).closest('[data-intro-pause], [data-intro-skip]')
          ) {
            event.preventDefault();
            enter();
          }
        },
        options,
      );
      document.addEventListener(
        'visibilitychange',
        () => {
          if (document.hidden) {
            cancelAnimationFrame(frame);
            frame = 0;
            if (exitAt) finish();
          } else startFrames();
        },
        options,
      );
      reduced.addEventListener(
        'change',
        () => {
          if (reduced.matches) finish();
        },
        options,
      );
      window.addEventListener('pagehide', finish, options);
      startFrames();
    } catch {
      finish();
    }
  }

  replay.hidden = reduced.matches;
  replay.addEventListener('click', () => play(replay));
  reduced.addEventListener('change', () => {
    replay.hidden = reduced.matches;
  });
  try {
    const seen = sessionStorage.getItem(key);
    sessionStorage.setItem(key, '1');
    if (!seen && !location.hash && document.visibilityState === 'visible') play();
  } catch {
    /* Storage denied: preserve direct access to the homepage. */
  }
}
