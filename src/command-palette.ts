// ================================================================
// COMMAND PALETTE — Ctrl+K / Cmd+K
// ================================================================

// ── Types ─────────────────────────────────────────────────────────
interface Command {
  id: string;
  label: string;
  category: string;
  icon: string;
  action: () => void;
}

// ── OS detection (runtime, not dev machine) ────────────────────────
function isMac(): boolean {
  const platform =
    (navigator as any).userAgentData?.platform ??
    navigator.platform ??
    '';
  return /mac/i.test(platform);
}

// ── Build the searchable command list from the live DOM ────────────
function buildCommands(applyTheme: (t: string) => void): Command[] {
  const commands: Command[] = [];

  // ── Navigation sections
  const sectionMap: Record<string, string> = {
    home: 'Home',
    projects: 'Work / Projects',
    expertise: 'Expertise',
    contact: 'Contact',
  };

  Object.entries(sectionMap).forEach(([id, label]) => {
    const el = document.getElementById(id);
    if (!el) return;
    commands.push({
      id: `nav-${id}`,
      label,
      category: 'Navigation',
      icon: '→',
      action: () => {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      },
    });
  });

  // ── Project titles (read dynamically from .card-title inside .step-card)
  document.querySelectorAll<HTMLElement>('.step-card .card-title').forEach((titleEl, idx) => {
    const title = titleEl.textContent?.trim() || `Project ${idx + 1}`;
    const article = titleEl.closest('.step-card');
    const cardLink = article?.querySelector<HTMLAnchorElement>('a.card-link');
    const href = cardLink?.href || '';

    commands.push({
      id: `project-${idx}`,
      label: title,
      category: 'Projects',
      icon: '◈',
      action: () => {
        if (href) {
          window.open(href, '_blank', 'noopener,noreferrer');
        } else {
          document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
        }
      },
    });
  });

  // ── External links
  commands.push({
    id: 'github',
    label: 'GitHub Profile',
    category: 'Links',
    icon: '↗',
    action: () => window.open('https://github.com/Rishabhbansal005', '_blank', 'noopener,noreferrer'),
  });
  commands.push({
    id: 'linkedin',
    label: 'LinkedIn Profile',
    category: 'Links',
    icon: '↗',
    action: () => window.open('https://www.linkedin.com/in/rishabh-bansal-1b2b9b29b/', '_blank', 'noopener,noreferrer'),
  });
  commands.push({
    id: 'email',
    label: 'Send Email',
    category: 'Links',
    icon: '✉',
    action: () => { window.location.href = 'mailto:rishabhbansal.cse@gmail.com'; },
  });

  // ── Theme action
  commands.push({
    id: 'theme-toggle',
    label: 'Toggle Dark / Light Theme',
    category: 'Actions',
    icon: '◑',
    action: () => {
      const current = document.body.getAttribute('data-theme') ?? 'dark';
      applyTheme(current === 'dark' ? 'light' : 'dark');
    },
  });

  return commands;
}

// ── Simple fuzzy filter ────────────────────────────────────────────
function filterCommands(commands: Command[], query: string): Command[] {
  if (!query.trim()) return commands;
  const q = query.toLowerCase();
  return commands.filter(
    c => c.label.toLowerCase().includes(q) || c.category.toLowerCase().includes(q),
  );
}

// ── Build Modal HTML once ──────────────────────────────────────────
function buildModal(shortcutLabel: string): HTMLElement {
  const overlay = document.createElement('div');
  overlay.id = 'cmd-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Command palette');
  overlay.hidden = true;

  overlay.innerHTML = `
    <div id="cmd-modal" role="document">
      <div id="cmd-search-row">
        <span id="cmd-search-icon" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2.2"
               stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </span>
        <input
          id="cmd-input"
          type="text"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          spellcheck="false"
          placeholder="Jump to a section or project…"
          aria-label="Search commands"
          aria-autocomplete="list"
          aria-controls="cmd-list"
        />
        <kbd id="cmd-esc-hint" aria-label="Press Escape to close">esc</kbd>
      </div>
      <ul id="cmd-list" role="listbox" aria-label="Commands"></ul>
      <div id="cmd-footer">
        <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
        <span><kbd>↵</kbd> select</span>
        <span><kbd>${shortcutLabel}</kbd> close</span>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  return overlay;
}

// ── Build the search button injected into the nav ──────────────────
function buildNavButton(shortcutLabel: string): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.className = 'cmd-palette-btn';
  btn.setAttribute('aria-label', `Open command palette (${shortcutLabel})`);
  btn.setAttribute('title', `Search  ${shortcutLabel}`);
  btn.innerHTML = `
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-width="2.2"
         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
    <span class="cmd-palette-btn-hint">${shortcutLabel}</span>
  `;
  return btn;
}

// ── Focusable elements query ───────────────────────────────────────
function getFocusables(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'input, button, [href], [tabindex]:not([tabindex="-1"])',
    ),
  ).filter(el => !el.hasAttribute('disabled') && !el.closest('[hidden]'));
}

// ── Main init ─────────────────────────────────────────────────────
export function initCommandPalette(applyTheme: (t: string) => void): void {
  const mac = isMac();
  const shortcutLabel = mac ? '⌘K' : 'Ctrl+K';
  const commands = buildCommands(applyTheme);

  // Build & mount the modal overlay
  const overlay = buildModal(shortcutLabel);
  const modal = overlay.querySelector<HTMLElement>('#cmd-modal')!;
  const input = overlay.querySelector<HTMLInputElement>('#cmd-input')!;
  const list = overlay.querySelector<HTMLUListElement>('#cmd-list')!;

  // ── Inject search button into desktop nav
  const desktopNav = document.getElementById('desktop-nav');
  const themeToggleDesktop = document.getElementById('theme-toggle');
  const desktopBtn = buildNavButton(shortcutLabel);
  desktopBtn.id = 'cmd-palette-btn';
  if (desktopNav && themeToggleDesktop) {
    desktopNav.insertBefore(desktopBtn, themeToggleDesktop);
  }

  // ── Inject search button into mobile header
  const mobileHeader = document.getElementById('mobile-header');
  const themeToggleMob = document.getElementById('theme-toggle-mob');
  const mobileBtn = buildNavButton(shortcutLabel);
  mobileBtn.id = 'cmd-palette-btn-mob';
  mobileBtn.querySelector('.cmd-palette-btn-hint')?.remove();
  if (mobileHeader && themeToggleMob) {
    mobileHeader.insertBefore(mobileBtn, themeToggleMob);
  }

  // ── State
  let activeIdx = -1;
  let visibleCommands: Command[] = [];
  let isOpen = false;
  let previousFocus: HTMLElement | null = null;

  // ── Render list ────────────────────────────────────────────────
  function renderList(cmds: Command[]): void {
    visibleCommands = cmds;
    list.innerHTML = '';
    activeIdx = cmds.length > 0 ? 0 : -1;

    if (cmds.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'cmd-empty';
      empty.textContent = 'No results found.';
      list.appendChild(empty);
      return;
    }

    const groups = new Map<string, Command[]>();
    cmds.forEach(cmd => {
      if (!groups.has(cmd.category)) groups.set(cmd.category, []);
      groups.get(cmd.category)!.push(cmd);
    });

    let itemIdx = 0;
    groups.forEach((groupCmds, category) => {
      const catEl = document.createElement('li');
      catEl.className = 'cmd-category';
      catEl.setAttribute('aria-hidden', 'true');
      catEl.textContent = category;
      list.appendChild(catEl);

      groupCmds.forEach(cmd => {
        const li = document.createElement('li');
        li.className = 'cmd-item';
        li.setAttribute('role', 'option');
        li.setAttribute('data-idx', String(itemIdx));
        li.setAttribute('aria-selected', itemIdx === 0 ? 'true' : 'false');
        li.innerHTML = `
          <span class="cmd-item-icon" aria-hidden="true">${cmd.icon}</span>
          <span class="cmd-item-label">${cmd.label}</span>
        `;
        li.addEventListener('mouseenter', () => setActive(itemIdx));
        li.addEventListener('mousedown', (e) => {
          e.preventDefault();
          execute(itemIdx);
        });
        list.appendChild(li);
        itemIdx++;
      });
    });
  }

  function setActive(idx: number): void {
    const old = list.querySelector<HTMLElement>('[aria-selected="true"]');
    if (old) old.setAttribute('aria-selected', 'false');
    activeIdx = Math.max(0, Math.min(idx, visibleCommands.length - 1));
    const items = list.querySelectorAll<HTMLElement>('.cmd-item');
    const target = items[activeIdx];
    if (target) {
      target.setAttribute('aria-selected', 'true');
      target.scrollIntoView({ block: 'nearest' });
    }
  }

  function execute(idx: number): void {
    const cmd = visibleCommands[idx];
    if (!cmd) return;
    close();
    setTimeout(() => cmd.action(), 60);
  }

  // ── Open / close ───────────────────────────────────────────────
  function open(): void {
    if (isOpen) return;
    isOpen = true;
    previousFocus = document.activeElement as HTMLElement;
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    renderList(commands);
    input.value = '';
    requestAnimationFrame(() => {
      overlay.classList.add('cmd-visible');
      input.focus();
    });
  }

  function close(): void {
    if (!isOpen) return;
    isOpen = false;
    overlay.classList.remove('cmd-visible');
    document.body.style.overflow = '';
    const onEnd = () => {
      overlay.hidden = true;
      overlay.removeEventListener('transitionend', onEnd);
    };
    overlay.addEventListener('transitionend', onEnd);
    previousFocus?.focus();
  }

  // ── Focus trap ────────────────────────────────────────────────
  overlay.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      const focusables = getFocusables(modal);
      if (focusables.length === 0) { e.preventDefault(); return; }
      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  });

  // ── Input + keyboard navigation ───────────────────────────────
  input.addEventListener('input', () => {
    renderList(filterCommands(commands, input.value));
  });

  input.addEventListener('keydown', (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActive(activeIdx + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActive(activeIdx - 1);
        break;
      case 'Enter':
        e.preventDefault();
        execute(activeIdx);
        break;
      case 'Escape':
        e.preventDefault();
        close();
        break;
    }
  });

  // ── Close on backdrop click ────────────────────────────────────
  overlay.addEventListener('mousedown', (e: MouseEvent) => {
    if (e.target === overlay) close();
  });

  // ── Global keyboard shortcut ───────────────────────────────────
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    const mod = mac ? e.metaKey : e.ctrlKey;
    if (mod && e.key === 'k') {
      e.preventDefault();
      isOpen ? close() : open();
    }
    if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      close();
    }
  });

  // ── Button clicks ──────────────────────────────────────────────
  desktopBtn.addEventListener('click', () => open());
  mobileBtn.addEventListener('click', () => open());
}
