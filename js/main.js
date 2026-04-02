/**
 * main.js  –  Portfolio UI logic
 * ═══════════════════════════════════════════════════════════
 *  • Renders project cards from window.PROJECTS (projects.js)
 *  • Handles modal open/close
 *  • Filter bar
 *  • Scroll-reveal (IntersectionObserver)
 *  • Navbar scroll-state & active link
 *  • Hero canvas pixel-rain background
 *  • Typewriter effect
 *  • Footer year
 *  • Mobile nav toggle
 * ═══════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  /* ── Typewriter phrases ──────────────────────────────────
     Edit this array to change the rotating taglines in the hero.
  ─────────────────────────────────────────────────────────── */
  const TYPEWRITER_PHRASES = [
    'Crafting interactive worlds, one pixel at a time.',
    'Unity Developer',
    'Game-jam Winner · Problem Solver',
    'Artist and Music Composer',
    'Open to freelance & full-time roles.',
  ];

  /* ══════════════════════════════════════════════════════════
     1. INIT
  ══════════════════════════════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', function () {
    renderProjects();
    initFilterBar();
    initModal();
    initScrollReveal();
    initNavbar();
    initMobileNav();
    initTypewriter();
    initHeroCanvas();
    initFooterYear();
    initSmoothScroll();
  });

  /* ══════════════════════════════════════════════════════════
     2. PROJECT CARD RENDERING
     Reads window.PROJECTS and builds the card grid.
  ══════════════════════════════════════════════════════════ */
  function renderProjects() {
    const grid = document.getElementById('projects-grid');
    if (!grid) return;

    const projects = window.PROJECTS || [];

    if (projects.length === 0) {
      grid.innerHTML = '<p style="color:var(--text-secondary);text-align:center;grid-column:1/-1;">' +
        'No projects yet — add them in <code>js/projects.js</code></p>';
      return;
    }

    projects.forEach(function (project, index) {
      const card = buildCard(project, index);
      grid.appendChild(card);
    });
  }

  /**
   * buildCard(project, index)
   * Creates a single project card DOM element.
   */
  function buildCard(project, index) {
    const card = document.createElement('article');
    card.className = 'project-card reveal';
    card.setAttribute('role', 'listitem');
    card.setAttribute('tabindex', '0');
    card.style.animationDelay = (index * 0.08) + 's';

    // Store filter tags as data attribute (space-separated)
    card.dataset.tags = (project.tags || []).join(' ');

    /* ── Media area ── */
    const media = document.createElement('div');
    media.className = 'card-media';

    // Cards always show the thumbnail image (YouTube videos play in modal only)
    if (project.imagePath) {
      const img = document.createElement('img');
      img.src     = project.imagePath;
      img.alt     = project.title + ' screenshot';
      img.loading = 'lazy';
      media.appendChild(img);
    } else if (project.youtubeId) {
      // Fallback: use YouTube's auto-generated thumbnail if no imagePath
      const img = document.createElement('img');
      img.src     = 'https://img.youtube.com/vi/' + project.youtubeId + '/maxresdefault.jpg';
      img.alt     = project.title + ' thumbnail';
      img.loading = 'lazy';
      media.appendChild(img);
    } else {
      // Placeholder
      const ph = document.createElement('div');
      ph.className = 'card-placeholder';
      ph.innerHTML = '<span class="card-placeholder-icon">&#127918;</span>' +
                     '<span class="card-placeholder-text">NO PREVIEW</span>';
      media.appendChild(ph);
    }

    // Year badge
    const yearBadge = document.createElement('span');
    yearBadge.className = 'card-year';
    yearBadge.textContent = project.year || '';
    media.appendChild(yearBadge);

    // Play overlay (only shown if there's a YouTube video)
    if (project.youtubeId) {
      const playOverlay = document.createElement('div');
      playOverlay.className = 'card-play-overlay';
      playOverlay.innerHTML = '<div class="play-icon" aria-hidden="true">&#9654;</div>';
      media.appendChild(playOverlay);
    }

    card.appendChild(media);

    /* ── Card body ── */
    const body = document.createElement('div');
    body.className = 'card-body';

    // Tags row
    const tagsRow = document.createElement('div');
    tagsRow.className = 'card-tags';
    (project.tags || []).forEach(function (tag) {
      const pill = document.createElement('span');
      pill.className = 'tag ' + tagClass(tag);
      pill.textContent = tag;
      tagsRow.appendChild(pill);
    });
    body.appendChild(tagsRow);

    // Title
    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = project.title;
    body.appendChild(title);

    // Description (truncated)
    const desc = document.createElement('p');
    desc.className = 'card-desc';
    desc.textContent = project.description;
    body.appendChild(desc);

    card.appendChild(body);

    /* ── Open modal on click / Enter key ── */
    card.addEventListener('click', function () { openModal(project); });
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModal(project);
      }
    });

    return card;
  }

  /** Map a tag string to a CSS class */
  function tagClass(tag) {
    const map = {
      unity:  'tag-engine',
      godot:  'tag-engine',
      unreal: 'tag-unreal',
      jam:    'tag-jam',
      mobile: 'tag-mobile',
    };
    return map[tag.toLowerCase()] || 'tag-spec';
  }

  /* ══════════════════════════════════════════════════════════
     3. FILTER BAR
  ══════════════════════════════════════════════════════════ */
  function initFilterBar() {
    const btns = document.querySelectorAll('.filter-btn');
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        btns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');

        const filter = btn.dataset.filter;
        filterCards(filter);
      });
    });
  }

  function filterCards(filter) {
    const cards = document.querySelectorAll('.project-card');
    cards.forEach(function (card) {
      if (filter === 'all') {
        card.classList.remove('hidden');
      } else {
        const tags = card.dataset.tags || '';
        if (tags.includes(filter)) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      }
    });
  }

  /* ══════════════════════════════════════════════════════════
     4. MODAL
  ══════════════════════════════════════════════════════════ */
  function initModal() {
    const modal    = document.getElementById('project-modal');
    const backdrop = modal.querySelector('.modal-backdrop');
    const closeBtn = document.getElementById('modal-close');

    backdrop.addEventListener('click', closeModal);
    closeBtn.addEventListener('click', closeModal);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });
  }

  function openModal(project) {
    const modal   = document.getElementById('project-modal');
    const mediaEl = document.getElementById('modal-media');
    const titleEl = document.getElementById('modal-title');
    const descEl  = document.getElementById('modal-description');
    const yearEl  = document.getElementById('modal-year');
    const tagsEl  = document.getElementById('modal-tags');
    const linksEl = document.getElementById('modal-links');

    // Clear previous content
    mediaEl.innerHTML = '';
    tagsEl.innerHTML  = '';
    linksEl.innerHTML = '';

    /* ── Media: YouTube iframe or fallback image ── */
    if (project.youtubeId) {
      const iframe = document.createElement('iframe');
      // autoplay=1 starts the video when modal opens
      // rel=0 hides unrelated recommendations at the end
      iframe.src             = 'https://www.youtube.com/embed/' + project.youtubeId + '?autoplay=1&rel=0';
      iframe.title           = project.title;
      iframe.allow           = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      iframe.style.width     = '100%';
      iframe.style.aspectRatio = '16/9';
      iframe.style.border    = 'none';
      iframe.style.display   = 'block';
      mediaEl.appendChild(iframe);

    } else if (project.imagePath) {
      const img = document.createElement('img');
      img.src   = project.imagePath;
      img.alt   = project.title;
      img.style.width = '100%';
      mediaEl.appendChild(img);
    }

    // Text fields
    titleEl.textContent = project.title;
    descEl.textContent  = project.description;
    yearEl.textContent  = project.year || '';

    // Tags
    (project.tags || []).forEach(function (tag) {
      const pill = document.createElement('span');
      pill.className = 'tag ' + tagClass(tag);
      pill.textContent = tag;
      tagsEl.appendChild(pill);
    });

    // Links
    (project.links || []).forEach(function (link) {
      const a = document.createElement('a');
      a.href      = link.href;
      a.target    = '_blank';
      a.rel       = 'noopener';
      a.className = 'btn btn-outline';
      a.innerHTML = (link.icon ? link.icon + ' ' : '') + link.label;
      linksEl.appendChild(a);
    });

    modal.hidden = false;
    document.body.style.overflow = 'hidden';

    // Trap focus
    setTimeout(function () {
      document.getElementById('modal-close').focus();
    }, 100);
  }

  function closeModal() {
    const modal   = document.getElementById('project-modal');
    const mediaEl = document.getElementById('modal-media');

    // Removing the iframe src stops the YouTube video & audio immediately
    mediaEl.innerHTML = '';

    modal.hidden = true;
    document.body.style.overflow = '';
  }

  /* ══════════════════════════════════════════════════════════
     5. SCROLL REVEAL (IntersectionObserver)
  ══════════════════════════════════════════════════════════ */
  function initScrollReveal() {
    const els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      // Fallback: just show everything
      els.forEach(function (el) { el.classList.add('visible'); });
      return;
    }

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    els.forEach(function (el) { observer.observe(el); });
  }

  /* ══════════════════════════════════════════════════════════
     6. NAVBAR (scroll state + active link)
  ══════════════════════════════════════════════════════════ */
  function initNavbar() {
    const navbar = document.getElementById('navbar');
    const links  = document.querySelectorAll('.nav-link');
    const sections = ['hero', 'about', 'portfolio', 'game', 'contact'];

    function onScroll() {
      // Scrolled state
      if (window.scrollY > 40) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }

      // Active link
      let current = 'hero';
      sections.forEach(function (id) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 80) current = id;
        }
      });

      links.forEach(function (link) {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + current) {
          link.classList.add('active');
        }
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ══════════════════════════════════════════════════════════
     7. MOBILE NAV TOGGLE
  ══════════════════════════════════════════════════════════ */
  function initMobileNav() {
    const toggle  = document.getElementById('nav-toggle');
    const navList = document.getElementById('nav-links');

    toggle.addEventListener('click', function () {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      navList.classList.toggle('open', !expanded);
    });

    // Close on link click
    navList.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        toggle.setAttribute('aria-expanded', 'false');
        navList.classList.remove('open');
      });
    });
  }

  /* ══════════════════════════════════════════════════════════
     8. TYPEWRITER EFFECT
  ══════════════════════════════════════════════════════════ */
  function initTypewriter() {
    const el = document.getElementById('typewriter');
    if (!el) return;

    let phraseIdx = 0;
    let charIdx   = 0;
    let deleting  = false;

    function tick() {
      const phrase = TYPEWRITER_PHRASES[phraseIdx];

      if (!deleting) {
        el.textContent = phrase.slice(0, charIdx + 1);
        charIdx++;
        if (charIdx === phrase.length) {
          setTimeout(function () { deleting = true; tick(); }, 2200);
          return;
        }
      } else {
        el.textContent = phrase.slice(0, charIdx - 1);
        charIdx--;
        if (charIdx === 0) {
          deleting  = false;
          phraseIdx = (phraseIdx + 1) % TYPEWRITER_PHRASES.length;
        }
      }

      const speed = deleting ? 35 : 58;
      setTimeout(tick, speed);
    }

    tick();
  }

  /* ══════════════════════════════════════════════════════════
     9. HERO CANVAS BACKGROUND (pixel rain / floating stars)
  ══════════════════════════════════════════════════════════ */
  function initHeroCanvas() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let W, H, drops;
    const COLS_COUNT = 40; // number of "rain" columns

    function resize() {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
      initDrops();
    }

    function initDrops() {
      drops = [];
      const spacing = W / COLS_COUNT;
      for (let i = 0; i < COLS_COUNT; i++) {
        drops.push({
          x:     i * spacing + spacing / 2 + (Math.random() - 0.5) * spacing * 0.5,
          y:     Math.random() * H,
          speed: 0.4 + Math.random() * 0.8,
          char:  randomChar(),
          alpha: 0.05 + Math.random() * 0.25,
          size:  10 + Math.random() * 8,
          timer: 0,
          interval: 8 + Math.floor(Math.random() * 20),
        });
      }
    }

    function randomChar() {
      const chars = '01▲▼◆■□▪▫◇◈⌂⌘♦♠♣♥★☆⊕⊗';
      return chars[Math.floor(Math.random() * chars.length)];
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      drops.forEach(function (drop) {
        ctx.save();
        ctx.globalAlpha = drop.alpha;
        ctx.font = drop.size + 'px Courier New, monospace';
        ctx.fillStyle = '#00e676';
        ctx.fillText(drop.char, drop.x, drop.y);
        ctx.restore();

        drop.y += drop.speed;
        drop.timer++;
        if (drop.timer >= drop.interval) {
          drop.timer = 0;
          drop.char  = randomChar();
        }
        if (drop.y > H + 20) {
          drop.y = -20;
          drop.x = Math.random() * W;
        }
      });

      requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize, { passive: true });
    draw();
  }

  /* ══════════════════════════════════════════════════════════
     10. FOOTER YEAR
  ══════════════════════════════════════════════════════════ */
  function initFooterYear() {
    const el = document.getElementById('footer-year');
    if (el) el.textContent = new Date().getFullYear();
  }

  /* ══════════════════════════════════════════════════════════
     11. SMOOTH SCROLL (for browsers that don't support it natively)
  ══════════════════════════════════════════════════════════ */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        const id = anchor.getAttribute('href').slice(1);
        const target = document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

})(); // end IIFE