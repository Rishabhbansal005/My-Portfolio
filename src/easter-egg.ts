// ================================================================
// KONAMI CODE EASTER EGG
// Up Up Down Down Left Right Left Right B A
// ================================================================

const KONAMI: string[] = [
  'ArrowUp', 'ArrowUp',
  'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight',
  'ArrowLeft', 'ArrowRight',
  'KeyB', 'KeyA',
];

// ── Inject the particle keyframe animation once ──────────────────
function ensureKeyframes(): void {
  if (document.getElementById('konami-keyframes')) return;
  const style = document.createElement('style');
  style.id = 'konami-keyframes';
  style.textContent = `
    @keyframes konamiParticle {
      0% { transform: translate(0, 0) scale(1); opacity: 1; }
      60% { opacity: 0.85; }
      100% { transform: translate(var(--kp-dx), var(--kp-dy)) scale(var(--kp-scale)); opacity: 0; }
    }
    @keyframes konamiFadeIn {
      from { opacity: 0; transform: scale(0.85); }
      to   { opacity: 1; transform: scale(1); }
    }
    @keyframes konamiFadeOut {
      from { opacity: 1; }
      to   { opacity: 0; }
    }
    #konami-overlay {
      position: fixed;
      inset: 0;
      z-index: 99998;
      pointer-events: none;
      overflow: hidden;
    }
    .konami-particle {
      position: absolute;
      border-radius: 50%;
      will-change: transform, opacity;
      animation: konamiParticle var(--kp-dur) var(--kp-ease) forwards;
    }
    #konami-toast {
      position: fixed;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 99999;
      pointer-events: none;
      background: var(--nav-bg);
      border: 1px solid var(--glass-border);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      color: var(--accent-2);
      font-family: 'Inter', sans-serif;
      font-size: 0.85rem;
      font-weight: 500;
      letter-spacing: 0.05em;
      padding: 10px 22px;
      border-radius: 999px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.35);
      white-space: nowrap;
    }
    #konami-toast.ktoast-in {
      animation: konamiFadeIn 0.35s var(--ease, cubic-bezier(0.25,1,0.5,1)) both;
    }
    #konami-toast.ktoast-out {
      animation: konamiFadeOut 0.5s ease forwards;
    }
  `;
  document.head.appendChild(style);
}

// ── Spawn one particle ────────────────────────────────────────────
function spawnParticle(overlay: HTMLElement): void {
  const p = document.createElement('div');
  p.className = 'konami-particle';

  const ox = 10 + Math.random() * 80;
  const oy = 20 + Math.random() * 60;
  const angle = Math.random() * Math.PI * 2;
  const dist = 80 + Math.random() * 200;
  const dx = Math.cos(angle) * dist;
  const dy = Math.sin(angle) * dist;
  const size = 6 + Math.random() * 12;
  const dur = 1.2 + Math.random() * 1.8;
  const delay = Math.random() * 0.6;
  const endScale = 0.1 + Math.random() * 0.5;

  const colours = ['#B87333', '#D4924A', '#E8AA62', '#C07830', '#f0c070'];
  const colour = colours[Math.floor(Math.random() * colours.length)];

  p.style.cssText = `
    left: ${ox}%;
    top:  ${oy}%;
    width:  ${size}px;
    height: ${size}px;
    background: ${colour};
    box-shadow: 0 0 ${size * 1.5}px ${colour};
    --kp-dx: ${dx}px;
    --kp-dy: ${dy}px;
    --kp-dur: ${dur}s;
    --kp-scale: ${endScale};
    --kp-ease: cubic-bezier(0.16, 1, 0.3, 1);
    animation-delay: ${delay}s;
  `;

  overlay.appendChild(p);
}

// ── Trigger the easter egg ────────────────────────────────────────
function triggerKonami(): void {
  ensureKeyframes();

  document.getElementById('konami-overlay')?.remove();
  document.getElementById('konami-toast')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'konami-overlay';
  document.body.appendChild(overlay);

  for (let i = 0; i < 60; i++) {
    spawnParticle(overlay);
  }

  const toast = document.createElement('div');
  toast.id = 'konami-toast';
  toast.textContent = '🎮 ↑↑↓↓←→←→BA — You found it! ✨';
  toast.className = 'ktoast-in';
  document.body.appendChild(toast);

  setTimeout(() => {
    overlay.remove();
    toast.className = 'ktoast-out';
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, 3500);
}

// ── Main init ─────────────────────────────────────────────────────
export function initKonamiEgg(): void {
  ensureKeyframes();

  let progress = 0;

  document.addEventListener('keydown', (e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      progress = 0;
      return;
    }

    const expected = KONAMI[progress];
    const got = e.code || e.key;

    if (got === expected) {
      progress++;
      if (progress === KONAMI.length) {
        progress = 0;
        triggerKonami();
      }
    } else {
      progress = got === KONAMI[0] ? 1 : 0;
    }
  });
}
