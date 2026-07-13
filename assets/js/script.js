document.getElementById('year').textContent = new Date().getFullYear();

const navToggle = document.getElementById('navToggle');
const nav = document.getElementById('nav');

navToggle.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

nav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

const heroEl = document.querySelector('.hero');

if (heroEl && 'IntersectionObserver' in window) {
  const heroObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        heroEl.classList.toggle('is-offscreen', !entry.isIntersecting);
      });
    },
    { threshold: 0 }
  );
  heroObserver.observe(heroEl);
}

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const gsapReady = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';

if (gsapReady) {
  gsap.registerPlugin(ScrollTrigger);
}

/* ---------- Loading screen ---------- */
function setupLoader() {
  const loader = document.getElementById('loader');
  if (!loader) return;
  let done = false;
  const hide = () => {
    if (done || !loader.isConnected) return;
    done = true;
    if (gsapReady) {
      gsap.to(loader, {
        opacity: 0,
        scale: 1.05,
        duration: 0.6,
        ease: 'power2.inOut',
        onComplete: () => loader.remove(),
      });
    } else {
      loader.style.transition = 'opacity 0.4s ease';
      loader.style.opacity = '0';
      setTimeout(() => loader.remove(), 450);
    }
  };
  window.addEventListener('load', () => setTimeout(hide, 300));
  setTimeout(hide, 2500);
  // Hard fallback: guarantees the loader is gone even if GSAP/rAF never
  // progresses the fade (e.g. animation engine failure). The loader must
  // never be able to permanently block the page.
  setTimeout(() => {
    if (loader.isConnected) loader.remove();
  }, 4000);
}

/* ---------- Lenis smooth scroll + ScrollTrigger sync ---------- */
let lenis = null;

function disableLenis() {
  if (lenis) {
    try {
      lenis.destroy();
    } catch (err) {
      /* already gone */
    }
    lenis = null;
  }
  document.documentElement.classList.add('no-lenis');
}

function setupLenis() {
  if (prefersReducedMotion || typeof Lenis === 'undefined') {
    document.documentElement.classList.add('no-lenis');
    return;
  }
  lenis = new Lenis({
    duration: 1.1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });

  const raf = (time) => {
    if (!lenis) return;
    lenis.raf(time);
    if (gsapReady) ScrollTrigger.update();
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);

  // Watchdog: if Lenis's animation loop ever stalls (e.g. a backgrounded tab
  // resuming, or heavy main-thread work), it has already called preventDefault()
  // on wheel input, so native scroll can't take over on its own. Detect that the
  // page isn't actually moving despite scroll attempts and fall back to native
  // scroll rather than leaving the page permanently stuck.
  let lastY = window.scrollY;
  let pendingCheck = null;
  let attempts = 0;
  const scheduleCheck = () => {
    attempts++;
    if (pendingCheck) return;
    pendingCheck = setTimeout(() => {
      pendingCheck = null;
      if (!lenis) return;
      const y = window.scrollY;
      if (Math.abs(y - lastY) < 1 && attempts > 3) {
        disableLenis();
      } else {
        lastY = y;
        attempts = 0;
      }
    }, 700);
  };
  window.addEventListener('wheel', scheduleCheck, { passive: true });
  window.addEventListener('touchmove', scheduleCheck, { passive: true });
}

/* ---------- Scroll progress bar ---------- */
function setupScrollProgress() {
  const bar = document.getElementById('scrollProgress');
  if (!bar) return;
  const update = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - window.innerHeight;
    const progress = height > 0 ? Math.min(1, Math.max(0, scrollTop / height)) : 0;
    bar.style.transform = `scaleX(${progress})`;
  };
  // Lenis moves the real window scroll position, so native scroll events fire
  // either way — listening natively keeps this working even if Lenis later
  // falls back via the watchdog in setupLenis().
  window.addEventListener('scroll', update, { passive: true });
  update();
}

/* ---------- Cursor glow ---------- */
function setupCursorGlow() {
  if (!gsapReady) return;
  const glow = document.getElementById('cursorGlow');
  if (!glow || window.matchMedia('(hover: none)').matches) return;
  const setX = gsap.quickTo(glow, 'x', { duration: 0.5, ease: 'power3' });
  const setY = gsap.quickTo(glow, 'y', { duration: 0.5, ease: 'power3' });
  window.addEventListener(
    'mousemove',
    (e) => {
      glow.classList.add('is-active');
      setX(e.clientX);
      setY(e.clientY);
    },
    { passive: true }
  );
}

/* ---------- Magnetic buttons ---------- */
function setupMagnetic() {
  if (!gsapReady) return;
  document.querySelectorAll('.magnetic').forEach((el) => {
    const setX = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3' });
    const setY = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3' });
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const relX = e.clientX - rect.left - rect.width / 2;
      const relY = e.clientY - rect.top - rect.height / 2;
      setX(gsap.utils.clamp(-16, 16, relX * 0.35));
      setY(gsap.utils.clamp(-16, 16, relY * 0.35));
    });
    el.addEventListener('mouseleave', () => {
      setX(0);
      setY(0);
    });
  });
}

/* ---------- 3D hero tilt ---------- */
function setupTilt() {
  if (!gsapReady) return;
  const hero = document.querySelector('.hero');
  const tilt = document.getElementById('heroTilt');
  if (!hero || !tilt) return;
  const setRX = gsap.quickTo(tilt, 'rotationX', { duration: 0.6, ease: 'power3' });
  const setRY = gsap.quickTo(tilt, 'rotationY', { duration: 0.6, ease: 'power3' });
  hero.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setRY(gsap.utils.clamp(-5, 5, px * 10));
    setRX(gsap.utils.clamp(-5, 5, -py * 10));
  });
  hero.addEventListener('mouseleave', () => {
    setRX(0);
    setRY(0);
  });
}

/* ---------- Particle burst on hero name ---------- */
function setupParticleBurst() {
  if (!gsapReady) return;
  const nameEl = document.getElementById('heroName');
  if (!nameEl) return;
  const colors = ['#2f6fed', '#6366f1', '#0891b2', '#c08a1e'];
  let cooldown = false;

  nameEl.addEventListener('mouseenter', () => {
    if (cooldown) return;
    cooldown = true;
    const rect = nameEl.getBoundingClientRect();
    const originX = rect.width / 2;
    const originY = rect.height / 2;
    const count = 16;

    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'particle-burst';
      p.style.left = originX + 'px';
      p.style.top = originY + 'px';
      p.style.background = colors[i % colors.length];
      nameEl.appendChild(p);

      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const dist = 36 + Math.random() * 46;

      gsap
        .timeline({ onComplete: () => p.remove() })
        .to(p, { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, opacity: 1, duration: 0.35, ease: 'power2.out' })
        .to(p, { x: 0, y: 0, opacity: 0, duration: 0.45, ease: 'power2.in' });
    }

    setTimeout(() => {
      cooldown = false;
    }, 900);
  });
}

/* ---------- Animated counters ---------- */
function setupCounters() {
  const counters = document.querySelectorAll('.counter');
  if (!counters.length) return;

  if (!gsapReady) {
    counters.forEach((el) => {
      el.textContent = (el.dataset.count || '0') + (el.dataset.suffix || '');
    });
    return;
  }

  counters.forEach((el) => {
    const target = parseFloat(el.dataset.count || '0');
    const suffix = el.dataset.suffix || '';
    const obj = { val: 0 };
    ScrollTrigger.create({
      trigger: el,
      start: 'top 92%',
      once: true,
      onEnter: () => {
        gsap.to(obj, {
          val: target,
          duration: 1.6,
          ease: 'power2.out',
          onUpdate: () => {
            el.textContent = Math.round(obj.val) + suffix;
          },
        });
        // Hard fallback: guarantee the correct final number is shown even if
        // the tween never finishes ticking for any reason.
        setTimeout(() => {
          el.textContent = target + suffix;
        }, 2200);
      },
    });
  });
}

/* ---------- SVG line-draw (hero DNA icon) ---------- */
function setupLineDraw() {
  if (!gsapReady) return;
  const svg = document.querySelector('.hi-1');
  if (!svg) return;
  const paths = svg.querySelectorAll('path');
  paths.forEach((p) => {
    try {
      const len = p.getTotalLength();
      p.style.strokeDasharray = String(len);
      p.style.strokeDashoffset = String(len);
      gsap.to(p, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut', delay: 0.3 + Math.random() * 0.4 });
    } catch (err) {
      /* unsupported geometry — skip silently */
    }
  });
}

/* ---------- Per-section scroll reveals ---------- */
function setupScrollReveals() {
  gsap.utils.toArray('.reveal').forEach((el) => {
    gsap.fromTo(
      el,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 85%' } }
    );
  });

  gsap.utils.toArray('#experience .reveal-item').forEach((el) => {
    gsap.fromTo(
      el,
      { opacity: 0, x: -60 },
      { opacity: 1, x: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } }
    );
  });

  gsap.utils.toArray('#skills .reveal-item').forEach((el, i) => {
    gsap.fromTo(
      el,
      { opacity: 0, rotationY: -85, transformPerspective: 800 },
      {
        opacity: 1,
        rotationY: 0,
        duration: 0.8,
        ease: 'power2.out',
        delay: (i % 4) * 0.06,
        scrollTrigger: { trigger: el, start: 'top 92%' },
      }
    );
  });

  gsap.utils.toArray('#education .reveal-item').forEach((el, i) => {
    gsap.fromTo(
      el,
      { opacity: 0, scale: 0.82 },
      {
        opacity: 1,
        scale: 1,
        duration: 0.6,
        ease: 'back.out(1.6)',
        delay: (i % 6) * 0.05,
        scrollTrigger: { trigger: el, start: 'top 94%' },
      }
    );
  });

  gsap.utils.toArray('#contact .reveal-item').forEach((el, i) => {
    gsap.fromTo(
      el,
      { opacity: 0, filter: 'blur(10px)', y: 16 },
      {
        opacity: 1,
        filter: 'blur(0px)',
        y: 0,
        duration: 0.8,
        delay: i * 0.06,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 92%' },
      }
    );
  });

  gsap.utils.toArray('#publications .reveal-item').forEach((el, i) => {
    gsap.fromTo(
      el,
      { opacity: 0, y: 24 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay: i * 0.08,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 90%' },
      }
    );
  });
}

/* ---------- Research timeline: line draw + node pop + card slide ---------- */
function setupProjectsTimeline() {
  const rtSection = document.querySelector('.rtimeline');
  const line = document.getElementById('rtimelineLine');
  if (!rtSection || !line) return;

  gsap.set(line, { scaleY: 0 });
  gsap.to(line, {
    scaleY: 1,
    ease: 'none',
    scrollTrigger: {
      trigger: rtSection,
      start: 'top 78%',
      end: 'bottom 75%',
      scrub: 0.6,
    },
  });

  gsap.utils.toArray('.rtimeline-item').forEach((item, i) => {
    const node = item.querySelector('.rtimeline-node');
    const content = item.querySelector('.rtimeline-content');
    if (!node || !content) return;
    const fromX = i % 2 === 0 ? -50 : 50;

    gsap.set(node, { scale: 0 });
    gsap.set(content, { opacity: 0, x: fromX });

    gsap
      .timeline({ scrollTrigger: { trigger: item, start: 'top 82%' } })
      .to(node, { scale: 1, duration: 0.45, ease: 'back.out(2.4)' })
      .to(content, { opacity: 1, x: 0, duration: 0.6, ease: 'power3.out' }, '-=0.2');
  });
}

/* ---------- Fallback reveal (no GSAP) ---------- */
function setupFallbackReveal() {
  const revealTargets = document.querySelectorAll('.reveal, .reveal-group');
  if ('IntersectionObserver' in window && revealTargets.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );
    revealTargets.forEach((el) => observer.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add('is-visible'));
  }
}

setupLoader();
setupLenis();
setupScrollProgress();
setupCounters();

if (gsapReady) {
  setupScrollReveals();
  setupProjectsTimeline();
  setupLineDraw();
} else {
  setupFallbackReveal();
}

if (!prefersReducedMotion) {
  setupCursorGlow();
  setupMagnetic();
  setupTilt();
  setupParticleBurst();
}

/* ---------- Animated molecule/network background ---------- */
(() => {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const reduceMotion = prefersReducedMotion;
  const dotColors = ['47,111,237', '8,145,178', '99,102,241'];

  let width, height, dpr, particles, maxDist, rafId, running = true;

  function sizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function makeParticles() {
    const count = Math.max(26, Math.min(64, Math.round((width * height) / 24000)));
    maxDist = Math.max(110, Math.min(160, width / 9));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      r: Math.random() * 1.6 + 1,
      c: dotColors[Math.floor(Math.random() * dotColors.length)],
    }));
  }

  function step() {
    ctx.clearRect(0, 0, width, height);

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -20) p.x = width + 20;
      if (p.x > width + 20) p.x = -20;
      if (p.y < -20) p.y = height + 20;
      if (p.y > height + 20) p.y = -20;
    }

    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxDist) {
          const alpha = (1 - dist / maxDist) * 0.16;
          ctx.strokeStyle = `rgba(${a.c},${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.c},0.45)`;
      ctx.fill();
    }

    if (running) rafId = requestAnimationFrame(step);
  }

  function start() {
    sizeCanvas();
    makeParticles();
    if (rafId) cancelAnimationFrame(rafId);
    if (reduceMotion) {
      step();
      running = false;
    } else {
      running = true;
      step();
    }
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(start, 200);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
    } else if (!reduceMotion) {
      running = true;
      step();
    }
  });

  start();
})();
