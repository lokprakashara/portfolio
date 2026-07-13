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

/* Animated molecule/network background */
(() => {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
