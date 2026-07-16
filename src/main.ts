// ================================================================
// HERITAGE TECH — main.js
// ================================================================
import { initChakraDividers } from './three.bg.js';

// ── PREVENT SCROLL RESTORATION ───────────────────────────────────
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

// ── 0. LOADING SCREEN ────────────────────────────────────────────
(function initLoader() {
  const loader = document.getElementById('site-loader') as HTMLElement | null;
  const taglineEl = document.getElementById('loader-tagline') as HTMLElement;
  const bar = document.getElementById('loader-bar') as HTMLElement;
  const counterEl = document.getElementById('loader-counter') as HTMLElement;
  const glowRing = document.getElementById('loader-glow-ring') as HTMLElement;
  const particleBox = document.getElementById('loader-particles') as HTMLElement;
  if (!loader) return;

  // ── Floating particles
  const PARTICLE_COUNT = 18;
  for (let p = 0; p < PARTICLE_COUNT; p++) {
    const el = document.createElement('div');
    el.className = 'loader-particle';
    const size = 2 + Math.random() * 4;
    const x = 10 + Math.random() * 80;
    const dur = 4 + Math.random() * 5;
    const del = Math.random() * 4;
    const drift = (Math.random() - 0.5) * 60;
    el.style.cssText = `
      width:${size}px; height:${size}px;
      left:${x}%;
      bottom:${5 + Math.random() * 30}%;
      --drift-x:${drift}px;
      animation-duration:${dur}s;
      animation-delay:${del}s;
    `;
    particleBox.appendChild(el);
  }

  // ── Glow ring appears after first stroke finishes (~2.6s)
  setTimeout(() => glowRing && glowRing.classList.add('visible'), 2600);

  // ── Typewriter (starts at 3.2s when tagline fades in)
  const phrases = ['ML Enthusiast', 'iOS Engineer', 'Frontend Craftsman'];
  let pIdx = 0, charIdx = 0, typing = true;
  function typeStep() {
    const word = phrases[pIdx] || '';
    if (typing) {
      charIdx++;
      taglineEl.textContent = word.slice(0, charIdx);
      if (charIdx >= word.length) {
        typing = false;
        setTimeout(typeStep, 2000);
        return;
      }
    } else {
      charIdx--;
      taglineEl.textContent = word.slice(0, charIdx);
      if (charIdx === 0) {
        typing = true;
        pIdx = (pIdx + 1) % phrases.length;
      }
    }
    setTimeout(typeStep, typing ? 95 : 48);
  }
  setTimeout(typeStep, 3400);

  // ── Progress bar: starts at 1.5s, fills slowly to exactly 100% over ~6s
  //    Exit fires only AFTER bar reaches 100% + 0.6s pause
  let progress = 0;
  setTimeout(() => {
    // Total fill time: 6000ms. Tick every 30ms → 200 steps → += 0.5 per step
    const FILL_MS = 6000;
    const TICK_MS = 30;
    const INCREMENT = 100 / (FILL_MS / TICK_MS); // = 0.5

    const barInterval = setInterval(() => {
      progress = Math.min(100, progress + INCREMENT);
      bar.style.width = progress + '%';
      if (counterEl) counterEl.textContent = Math.round(progress) + '%';

      if (progress >= 100) {
        clearInterval(barInterval);
        // Exit 0.6s after bar hits 100%
        setTimeout(() => {
          loader.classList.add('exit');
          loader.addEventListener('transitionend', () => loader.remove(), { once: true });
        }, 600);
      }
    }, TICK_MS);
  }, 3400);
})();

document.addEventListener('DOMContentLoaded', () => {


  // ── 1. THEME TOGGLE ──────────────────────────────────────────
  function applyTheme(t: string) {
    document.body.setAttribute('data-theme', t);
    localStorage.setItem('theme', t);
  }

  const saved = localStorage.getItem('theme')
    || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  applyTheme(saved);

  function makeThemeToggle(id: string) {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('click', () => {
      applyTheme(document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
  }
  makeThemeToggle('theme-toggle');
  makeThemeToggle('theme-toggle-mob');


  // ── 3. NAV ACTIVE STATE + iOS TAB BAR SLIDING BUBBLE ──────────
  const allNavLinks = document.querySelectorAll('[data-section]');
  const tabBar = document.getElementById('tabbar') as HTMLElement | null;
  const pill = document.getElementById('pill') as HTMLElement | null;

  function moveBubble(activeLink: Element) {
    if (!tabBar || !pill) return;
    const barRect = tabBar.getBoundingClientRect();
    const itemRect = activeLink.getBoundingClientRect();
    const leftOffset = itemRect.left - barRect.left;

    pill.style.setProperty('--pill-width', `${itemRect.width}px`);
    pill.style.setProperty('--pill-x', `${leftOffset}px`);
    // Note: CSS uses transform: translateX(var(--pill-x))
    pill.style.transform = `translateX(${leftOffset}px)`;
  }

  // Add squash animation on click for the "gel" feel
  allNavLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (!pill) return;
      pill.classList.add('squash');
      setTimeout(() => pill.classList.remove('squash'), 150);
    });
  });

  function setActive(sectionId: string) {
    allNavLinks.forEach(l => {
      const isActive = l.getAttribute('data-section') === sectionId;
      l.classList.toggle('active', isActive);
      if (isActive) moveBubble(l);
    });
  }

  const targets = ['home', 'projects', 'expertise', 'contact'];
  const ioOpts = { rootMargin: '-35% 0px -55% 0px' };

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) setActive(e.target.id);
    });
  }, ioOpts);

  targets.forEach(id => {
    const el = document.getElementById(id);
    if (el) io.observe(el);
  });

  setActive('home');

  // Recalculate bubble position on resize (pill reflows)
  window.addEventListener('resize', () => {
    const activeLink = document.querySelector('.tab-item.active');
    if (activeLink) moveBubble(activeLink);
  });


  // ── 4. HERO IMAGE REVEAL ─────────────────────────────────────
  const frame = document.getElementById('image-container') as HTMLElement;
  const reveal = document.getElementById('reveal-img') as HTMLElement;
  const faceidBtn = document.getElementById('faceid-btn') as HTMLElement;
  const faceidText = document.getElementById('faceid-text') as HTMLElement;

  if (frame && reveal) {
    const R = 155;
    const MAX_TILT = 8;
    let mobileRevealed = false;

    function setRevealState(shouldReveal: boolean) {
      mobileRevealed = shouldReveal;
      if (shouldReveal) {
        reveal.classList.add('revealed');
        reveal.style.setProperty('--pr', '150%');
        reveal.style.setProperty('--px', '50%');
        reveal.style.setProperty('--py', '50%');
        if (faceidText) faceidText.textContent = 'Show Cartoon';
        if (faceidBtn) faceidBtn.classList.add('active');
      } else {
        reveal.classList.remove('revealed');
        reveal.style.setProperty('--pr', '0px');
        if (faceidText) faceidText.textContent = 'Reveal Real';
        if (faceidBtn) faceidBtn.classList.remove('active');
      }
    }

    // Desktop: flashlight reveal + 3D tilt on mousemove
    frame.addEventListener('mousemove', (e: MouseEvent) => {
      const isHoverDevice = window.matchMedia('(hover: hover)').matches;
      if (!isHoverDevice) return;
      const rect = frame.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      reveal.style.setProperty('--px', `${x}px`);
      reveal.style.setProperty('--py', `${y}px`);
      reveal.style.setProperty('--pr', `${R}px`);

      const xp = (x / rect.width - 0.5) * 2;
      const yp = (y / rect.height - 0.5) * 2;
      frame.style.setProperty('--rx', `${yp * -MAX_TILT}deg`);
      frame.style.setProperty('--ry', `${xp * MAX_TILT}deg`);
    });

    frame.addEventListener('mouseleave', () => {
      const isHoverDevice = window.matchMedia('(hover: hover)').matches;
      if (!isHoverDevice) return;
      reveal.style.setProperty('--pr', '0px');
      frame.style.setProperty('--rx', '0deg');
      frame.style.setProperty('--ry', '0deg');
    });

    // Mobile/Touch: tap the photo or FaceID button to toggle
    const handleTouchToggle = (e: Event) => {
      const isTouchDevice = !window.matchMedia('(hover: hover)').matches;
      if (!isTouchDevice) return;
      setRevealState(!mobileRevealed);
    };

    frame.addEventListener('click', handleTouchToggle);

    if (faceidBtn) {
      faceidBtn.addEventListener('click', (e: MouseEvent) => {
        e.stopPropagation(); // Prevent duplicate toggle from frame's click listener
        const isTouchDevice = !window.matchMedia('(hover: hover)').matches;
        if (isTouchDevice) {
          setRevealState(!mobileRevealed);
        }
      });
    }
  }

  // ── 5. 3D TILT (cards & contact) ─────────────────────────────
  document.querySelectorAll('.tilt-card:not(#image-container)').forEach(card => {
    (card as HTMLElement).addEventListener('mousemove', (e: MouseEvent) => {
      if (window.innerWidth <= 768) return;
      const r = card.getBoundingClientRect();
      const xp = (e.clientX - r.left) / r.width - 0.5;
      const yp = (e.clientY - r.top) / r.height - 0.5;
      (card as HTMLElement).style.setProperty('--rx', `${yp * -5}deg`);
      (card as HTMLElement).style.setProperty('--ry', `${xp * 5}deg`);
    });
    (card as HTMLElement).addEventListener('mouseleave', () => {
      (card as HTMLElement).style.setProperty('--rx', '0deg');
      (card as HTMLElement).style.setProperty('--ry', '0deg');
    });
  });

  // ── 5.5 CASE STUDY ACCORDION ──────────────────────────────────
  document.querySelectorAll('.case-study-toggle').forEach((btn: any) => {
    const panelId = btn.getAttribute('aria-controls');
    const panel = document.getElementById(panelId);
    if (!panel) return;
    btn.addEventListener('click', () => {
      const isOpen = btn.getAttribute('aria-expanded') === 'true';
      const opening = !isOpen;
      btn.setAttribute('aria-expanded', String(opening));
      panel.setAttribute('aria-hidden', String(!opening));
      panel.classList.toggle('is-open', opening);
      btn.textContent = opening ? 'Close case study ↑' : 'Read case study ↓';
    });
  });

  // ── 6. THREE.JS ASHOKA CHAKRA DIVIDERS ─────────────────────────
  import('./three.bg.js').then(m => m.initChakraDividers());

  // ── 7. CURSOR-FOLLOWING PARTICLE CANVAS BACKGROUND ────────────
  const canvas = document.getElementById('bg-canvas') as HTMLCanvasElement;
  if (!canvas) return;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

  let W = 0, H = 0, dots: any[] = [];
  let mouse = { x: -3000, y: -3000 };
  let lastW = 0;

  const DOT_COUNT = 50;
  const isMob = () => window.innerWidth <= 768;
  const getConnDist = () => isMob() ? 100 : 180;
  const getCursorR = () => isMob() ? 120 : 200;

  function buildDots() {
    dots = [];
    const count = isMob() ? 25 : DOT_COUNT;
    for (let i = 0; i < count; i++) {
      dots.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        glow: 0,
        r: 1.5 + Math.random() * 1,
      });
    }
  }

  function resize() {
    const newW = window.innerWidth;
    const newH = window.innerHeight;
    const widthChanged = newW !== lastW;

    W = canvas.width = newW;
    H = canvas.height = newH;
    lastW = newW;

    if (widthChanged) {
      buildDots();
    }
  }
  window.addEventListener('resize', resize);

  document.addEventListener('mousemove', (e: MouseEvent) => {
    if (!isMob()) { mouse.x = e.clientX; mouse.y = e.clientY; }
  });

  let ambT = 0;

  function getColors() {
    const dark = document.body.getAttribute('data-theme') !== 'light';
    return {
      dot: dark ? 'rgba(184,115,51,' : 'rgba(194,120,64,',
      line: dark ? 'rgba(184,115,51,' : 'rgba(194,120,64,',
    };
  }

  function animate() {
    ctx.clearRect(0, 0, W, H);
    const C = getColors();
    const mob = isMob();
    ambT += 0.005;

    const mx = mob ? W * 0.5 + Math.sin(ambT * 0.7) * W * 0.38 : mouse.x;
    const my = mob ? H * 0.5 + Math.cos(ambT * 0.55) * H * 0.32 : mouse.y;

    const cursorR = getCursorR();
    dots.forEach(d => {
      d.x += d.vx;
      d.y += d.vy;
      if (d.x < 0 || d.x > W) d.vx *= -1;
      if (d.y < 0 || d.y > H) d.vy *= -1;

      const dx = mx - d.x, dy = my - d.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const target = dist < cursorR ? Math.pow(1 - dist / cursorR, 1.8) : 0;
      d.glow += (target - d.glow) * (mob ? 0.02 : 0.1);
    });

    const connDist = getConnDist();
    for (let i = 0; i < dots.length; i++) {
      for (let j = i + 1; j < dots.length; j++) {
        const a = dots[i], b = dots[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > connDist) continue;
        const alphaBase = mob ? 0.03 : 0.07;
        const glowContribution = mob ? 0.06 : 0.3;
        const alpha = (1 - d / connDist) * alphaBase + Math.max(a.glow, b.glow) * glowContribution;
        ctx.strokeStyle = `${C.line}${alpha})`;
        ctx.lineWidth = (mob ? 0.4 : 0.6) + Math.max(a.glow, b.glow) * (mob ? 0.4 : 1.0);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    dots.forEach(d => {
      const baseAlpha = mob ? 0.03 : 0.06;
      const glowAlphaMultiplier = mob ? 0.25 : 0.75;
      const alpha = baseAlpha + d.glow * glowAlphaMultiplier;

      if (d.glow > 0.02) {
        const radiusGlow = (mob ? 6 : 12) * d.glow;
        const g = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, radiusGlow);
        g.addColorStop(0, `${C.dot}${0.3 * d.glow})`);
        g.addColorStop(1, `${C.dot}0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(d.x, d.y, radiusGlow, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = `${C.dot}${alpha})`;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r + d.glow * (mob ? 1.0 : 2.0), 0, Math.PI * 2);
      ctx.fill();
    });

    requestAnimationFrame(animate);
  }

  resize();
  animate();

  // ── 8. CONTACT FORM HANDLING ──────────────────────────────────
  const contactForm = document.getElementById('contact-form') as HTMLFormElement;
  const contactStatus = document.getElementById('contact-status') as HTMLElement;
  const submitBtn = document.getElementById('contact-submit') as HTMLButtonElement;

  if (contactForm && contactStatus && submitBtn) {
    contactForm.addEventListener('submit', async (e: Event) => {
      e.preventDefault();

      const formData = new FormData(contactForm);
      const name = formData.get('name') as string;
      const email = formData.get('email') as string;
      const message = formData.get('message') as string;

      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';
      contactStatus.textContent = '';
      contactStatus.className = 'contact-status';

      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, email, message }),
        });

        let result;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          result = await response.json();
        } else {
          // If the proxy fails (e.g. backend offline), Vite returns empty or plain text
          throw new Error('Could not connect to the backend server. Is it running?');
        }

        if (response.ok) {
          contactStatus.textContent = 'Message sent successfully!';
          contactStatus.classList.add('success');
          contactForm.reset();
        } else {
          throw new Error(result.error || 'Failed to send message.');
        }
      } catch (error: any) {
        contactStatus.textContent = error.message || 'An error occurred. Please try again.';
        contactStatus.classList.add('error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message ↗';

        // Clear message after 5 seconds
        setTimeout(() => {
          contactStatus.textContent = '';
          contactStatus.className = 'contact-status';
        }, 5000);
      }
    });
  }

  // ── 9. AI PROJECT INSIGHTS HANDLER ────────────────────────────
  const insightsToggles = document.querySelectorAll('.ai-insights-toggle');
  const insightsCache: Record<string, string> = {};

  function parseInsightsMarkdown(md: string): string {
    // 1. Convert bold markers **text** to <strong>text</strong>
    let html = md.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // 2. Convert headers (e.g. ### Headers) to <h3>
    html = html.replace(/^###\s+(.*?)$/gm, '<h3>$1</h3>');
    html = html.replace(/^##\s+(.*?)$/gm, '<h3>$1</h3>');

    // 3. Convert markdown lists (1. bullet, * bullet or - bullet) to <li>
    html = html.replace(/^\s*(?:[\*\-]|(?:[0-9]+\.))\s+(.*?)$/gm, '<li>$1</li>');

    // 4. Wrap adjacent <li> lines inside <ul> groups
    html = html.replace(/(?:<li>.*?<\/li>\s*)+/gs, (match) => {
      return `<ul>${match.trim()}</ul>`;
    });

    // 5. Convert clean non-HTML blocks into paragraphs
    const paragraphs = html.split('\n\n');
    const processed = paragraphs.map(p => {
      const trimmed = p.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<li')) {
        return trimmed;
      }
      return `<p style="font-size: 0.9rem; color: var(--text-2); line-height: 1.65; margin-bottom: 12px;">${trimmed}</p>`;
    });

    return processed.join('\n');
  }

  insightsToggles.forEach((btn: any) => {
    const panelId = btn.getAttribute('aria-controls');
    const panel = document.getElementById(panelId);
    const projectId = btn.getAttribute('data-project');
    if (!panel || !projectId) return;

    btn.addEventListener('click', async () => {
      const isOpen = btn.getAttribute('aria-expanded') === 'true';
      const opening = !isOpen;

      if (opening) {
        document.querySelectorAll('.ai-insights-toggle[aria-expanded="true"]').forEach((otherBtn: any) => {
          if (otherBtn !== btn) {
            otherBtn.setAttribute('aria-expanded', 'false');
            otherBtn.textContent = 'AI Architecture Analysis ↓';
            const otherPanel = document.getElementById(otherBtn.getAttribute('aria-controls'));
            if (otherPanel) {
              otherPanel.classList.remove('is-open');
              otherPanel.setAttribute('aria-hidden', 'true');
            }
          }
        });
      }

      // Toggle current panel state
      btn.setAttribute('aria-expanded', String(opening));
      panel.classList.toggle('is-open', opening);
      panel.setAttribute('aria-hidden', String(!opening));
      btn.textContent = opening ? 'Close AI Architecture Analysis ↑' : 'AI Architecture Analysis ↓';

      // Fetch and render insights if we are opening and haven't loaded yet
      if (opening && !insightsCache[projectId]) {
        // Show glassmorphic loader screen with shimmer animation
        panel.innerHTML = `
          <div class="insights-content">
            <span class="ai-badge">Storyteller AI &middot; Reviewing Git DNA</span>
            <div class="shimmer-loader">
              <div class="shimmer-line w-90"></div>
              <div class="shimmer-line w-80"></div>
              <div class="shimmer-line w-60"></div>
            </div>
          </div>
        `;

        try {
          const response = await fetch(`/api/project-insights?project=${projectId}`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();

          if (data && data.insights) {
            insightsCache[projectId] = data.insights;
            panel.innerHTML = `
              <div class="insights-content">
                <span class="ai-badge">Storyteller AI &middot; Architectural Review</span>
                <div style="margin-top: 14px;">
                  ${parseInsightsMarkdown(data.insights)}
                </div>
              </div>
            `;
          } else {
            throw new Error('Invalid response structure from insights backend.');
          }
        } catch (err) {
          console.error(`Failed to load insights for ${projectId}:`, err);
          panel.innerHTML = `
            <div class="insights-content" style="border-color: rgba(248, 113, 113, 0.3); background: rgba(248, 113, 113, 0.03);">
              <span class="ai-badge" style="color: #f87171; border-color: rgba(248, 113, 113, 0.3); background: rgba(248, 113, 113, 0.08);">Error Connection</span>
              <p style="font-size: 0.9rem; color: #f87171; line-height: 1.6; margin-top: 10px;">
                Could not establish connection to the AI Insights service. Ensure your backend server is running on port 8000.
              </p>
            </div>
          `;
        }
      }
    });
  });

});

