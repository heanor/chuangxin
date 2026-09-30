// 创心医疗官网 — Interactions

// ---- Navigation scroll state ----
const nav = document.getElementById('nav');
const onScroll = () => {
  if (window.scrollY > 40) nav.classList.add('is-scrolled');
  else nav.classList.remove('is-scrolled');
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ---- Mobile burger ----
const burger = document.getElementById('burger');
const menu = document.querySelector('.nav__menu');
burger.addEventListener('click', () => {
  menu.classList.toggle('is-open');
});
menu.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => menu.classList.remove('is-open'));
});

// ---- Reveal on scroll ----
const revealEls = document.querySelectorAll(
  '.section__head, .about__text, .about__stats, .product-card, .advantage, .news__item, .join__inner'
);
revealEls.forEach(el => el.classList.add('reveal'));

const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

revealEls.forEach(el => io.observe(el));

// ---- Number counter animation ----
const counters = document.querySelectorAll('.stat__num[data-target]');
const counterIO = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const target = parseInt(el.dataset.target, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1600;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.floor(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = target + suffix;
    };
    requestAnimationFrame(tick);
    counterIO.unobserve(el);
  });
}, { threshold: 0.5 });
counters.forEach(c => counterIO.observe(c));

// ---- Banner carousel ----
(() => {
  const banner = document.querySelector('.banner');
  if (!banner) return;

  const slides = banner.querySelectorAll('.banner__slide');
  const dots = banner.querySelectorAll('.banner__dot');
  const prevBtn = banner.querySelector('.banner__arrow--prev');
  const nextBtn = banner.querySelector('.banner__arrow--next');
  const total = slides.length;
  let current = 0;
  let timer = null;
  const interval = 5500;
  let slideStart = 0;
  let pausedAt = 0;

  // Inject progress fill into each dot
  dots.forEach(dot => {
    const fill = document.createElement('span');
    fill.className = 'banner__dot-fill';
    dot.appendChild(fill);
  });

  const setFillDuration = (dot, durationMs) => {
    const fill = dot.querySelector('.banner__dot-fill');
    if (!fill) return;
    fill.style.transition = 'none';
    fill.style.width = '0';
    void fill.offsetWidth;
    fill.style.transition = `width ${durationMs}ms linear`;
    fill.style.width = '100%';
  };

  const go = (index) => {
    current = (index + total) % total;
    slides.forEach((s, i) => s.classList.toggle('is-active', i === current));
    dots.forEach((d, i) => {
      const fill = d.querySelector('.banner__dot-fill');
      if (fill) { fill.style.transition = 'none'; fill.style.width = '0'; }
      d.classList.toggle('is-active', i === current);
    });
    const activeDot = dots[current];
    if (activeDot) setFillDuration(activeDot, interval);
    slideStart = Date.now();
    pausedAt = 0;
  };
  const next = () => go(current + 1);
  const prev = () => go(current - 1);

  const start = () => { stop(); timer = setInterval(next, interval); };
  const stop = () => { if (timer) { clearInterval(timer); timer = null; } };

  prevBtn.addEventListener('click', () => { prev(); start(); });
  nextBtn.addEventListener('click', () => { next(); start(); });
  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      go(parseInt(dot.dataset.index, 10));
      start();
    });
  });

  // Pause on hover (timer + progress fill)
  banner.addEventListener('mouseenter', () => {
    stop();
    pausedAt = Date.now();
    const activeDot = banner.querySelector('.banner__dot.is-active');
    if (!activeDot) return;
    const fill = activeDot.querySelector('.banner__dot-fill');
    if (!fill) return;
    const computed = getComputedStyle(fill);
    const fillWidth = parseFloat(computed.width) / activeDot.offsetWidth;
    fill.style.transition = 'none';
    fill.style.width = (fillWidth * 100) + '%';
  });
  banner.addEventListener('mouseleave', () => {
    const activeDot = banner.querySelector('.banner__dot.is-active');
    if (!activeDot) { start(); return; }
    const fill = activeDot.querySelector('.banner__dot-fill');
    const fillWidth = fill ? parseFloat(getComputedStyle(fill).width) / activeDot.offsetWidth : 0;
    const remaining = interval * (1 - fillWidth);
    if (fill) {
      void fill.offsetWidth;
      fill.style.transition = `width ${remaining}ms linear`;
      fill.style.width = '100%';
    }
    timer = setTimeout(next, remaining);
    pausedAt = 0;
  });

  // Touch swipe
  let touchX = 0;
  banner.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
  banner.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) { dx < 0 ? next() : prev(); start(); }
  }, { passive: true });

  start();
})();

// ---- Timeline carousel (about page) ----
(function () {
  const viewport = document.querySelector('.timeline__viewport');
  if (!viewport) return;

  const track = viewport.querySelector('.timeline__track');
  const items = track.querySelectorAll('.timeline__item');
  const prevBtn = document.querySelector('.timeline__btn--prev');
  const nextBtn = document.querySelector('.timeline__btn--next');

  const total = items.length;
  const step = 3; // scroll 3 years per click
  let current = 0;

  const getItemHeight = () => items[0].offsetHeight;

  const go = (idx) => {
    current = Math.max(0, Math.min(idx, total - 1));
    track.style.transform = `translateY(-${current * getItemHeight()}px)`;
  };

  prevBtn.addEventListener('click', () => go(current - step));
  nextBtn.addEventListener('click', () => go(current + step));

  // Touch swipe (vertical)
  let touchY = 0;
  viewport.addEventListener('touchstart', e => { touchY = e.touches[0].clientY; }, { passive: true });
  viewport.addEventListener('touchend', e => {
    const dy = e.changedTouches[0].clientY - touchY;
    if (Math.abs(dy) > 50) dy > 0 ? go(current - step) : go(current + step);
  }, { passive: true });

  // Recalculate on resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => go(current), 150);
  });
})();

// ---- Honors carousel ----
(() => {
  const viewport = document.querySelector('.honors__viewport');
  if (!viewport) return;
  const track = viewport.querySelector('.honors__track');
  const cards = track.querySelectorAll('.honor-card');
  const prevBtn = document.querySelector('.honors__btn--prev');
  const nextBtn = document.querySelector('.honors__btn--next');
  const total = cards.length;
  let page = 0;

  const getPerPage = () => window.innerWidth <= 768 ? 2 : 4;

  const update = () => {
    const perPage = getPerPage();
    const maxPage = Math.max(0, Math.ceil(total / perPage) - 1);
    if (page > maxPage) page = maxPage;
    const cardWidth = cards[0].offsetWidth;
    const gap = parseFloat(getComputedStyle(track).gap);
    track.style.transform = `translateX(-${page * perPage * (cardWidth + gap)}px)`;
    prevBtn.disabled = page === 0;
    nextBtn.disabled = page >= maxPage;
    viewport.classList.toggle('is-end', page >= maxPage);
  };

  prevBtn.addEventListener('click', () => { page--; update(); });
  nextBtn.addEventListener('click', () => { page++; update(); });

  // Touch swipe
  let touchX = 0;
  viewport.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
  viewport.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) dx > 0 ? (page--, update()) : (page++, update());
  }, { passive: true });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(update, 150);
  });

  update();
})();

// ---- Lightbox for honor certificates ----
(() => {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;
  const img = lightbox.querySelector('.lightbox__img');
  const overlay = lightbox.querySelector('.lightbox__overlay');
  const closeBtn = lightbox.querySelector('.lightbox__close');

  const open = (src, alt) => {
    img.src = src;
    img.alt = alt || '';
    lightbox.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  };
  const close = () => {
    lightbox.classList.remove('is-open');
    document.body.style.overflow = '';
  };

  document.querySelectorAll('.honor-card').forEach(card => {
    card.addEventListener('click', () => {
      const el = card.querySelector('img');
      if (el) open(el.src, el.alt);
    });
  });

  overlay.addEventListener('click', close);
  closeBtn.addEventListener('click', close);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && lightbox.classList.contains('is-open')) close();
  });
})();

// ---- Join Us Modal ----
(() => {
  const modal = document.getElementById('joinModal');
  if (!modal) return;
  const overlay = modal.querySelector('.modal__overlay');
  const closeBtn = modal.querySelector('.modal__close');

  const open = () => {
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  };
  const close = () => {
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
  };

  // 绑定所有"加入我们"和"留言咨询"按钮
  document.querySelectorAll('.join a[href="#contact"], .join__btn, .js-open-join').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      open();
    });
  });

  overlay.addEventListener('click', close);
  closeBtn.addEventListener('click', close);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
  });
})();

// ---- Business Layout tabs ----
(() => {
  const tabs = document.querySelectorAll('.business__tab');
  const panels = document.querySelectorAll('.business__panel-item');
  const hotspots = document.querySelectorAll('.business__hotspot');
  if (!tabs.length) return;

  const setActive = (idx) => {
    tabs.forEach((t, i) => t.classList.toggle('is-active', i === idx));
    panels.forEach((p, i) => p.classList.toggle('is-active', i === idx));
    hotspots.forEach((h, i) => h.classList.toggle('is-active', i === idx));
  };

  tabs.forEach(tab => {
    tab.addEventListener('click', () => setActive(parseInt(tab.dataset.idx, 10)));
  });
  hotspots.forEach(hs => {
    hs.addEventListener('click', () => setActive(parseInt(hs.dataset.target, 10)));
  });
})();

// ---- Message Modal (留言咨询) ----
(() => {
  const modal = document.getElementById('messageModal');
  if (!modal) return;
  const overlay = modal.querySelector('.modal__overlay');
  const closeBtn = modal.querySelector('.modal__close');

  const open = () => {
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  };
  const close = () => {
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
  };

  document.querySelectorAll('.js-open-message').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      open();
    });
  });

  overlay.addEventListener('click', close);
  closeBtn.addEventListener('click', close);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
  });
})();

// ---- Product Detail Modal ----
(() => {
  const modal = document.getElementById('productModal');
  if (!modal) return;
  const overlay = modal.querySelector('.modal__overlay');
  const closeBtn = modal.querySelector('.modal__close');

  const products = [
    {
      tag: 'Aortic Intervention · 核心明星产品',
      title: 'Stanford A 型主动脉夹层全腔内重建系统',
      img: 'images/ys1.jpg',
      desc: '聚焦主动脉夹层、主动脉病变等重症大血管疾病，打造全球领先的全腔内重建解决方案。该产品为全球首创，打破传统 Stanford A 型主动脉夹层只能开胸手术的局限，实现全腔内微创重建。',
      list: [
        '全球首创 —— 打破传统 Stanford A 型主动脉夹层只能开胸手术的局限，实现全腔内微创重建',
        'FDA 突破性器械认证 —— 获美国 FDA 突破性器械（Breakthrough Device）认定',
        '临床进展 —— 已完成全部人体临床试验入组，相关研究发表于国际心胸外科顶级期刊 JTCVS',
        '国际认可 —— 连续 2 次受邀参加第 104、105 届美国心胸外科年会 AATS 并做专题报告'
      ]
    },
    {
      tag: 'Peripheral Intervention · 核心管线',
      title: '药物涂层血管覆膜支架系统',
      img: 'images/ys2.jpg',
      desc: '深耕全身外周血管、中心静脉狭窄等血管通路病症，面向透析患者、下肢血管病变人群开发创新植介入器械，填补国内临床空白。',
      list: [
        '国内首款 —— 首款治疗中心静脉狭窄的药物涂层血管覆膜支架系统',
        '临床进展 —— 已完成全部百余例多中心临床试验入组',
        '临床价值 —— 为全国近百万血透患者带来新的福音和希望，显著改善透析血管通路通畅率',
        '创新设计 —— 药物涂层 + 覆膜结构双重机制，有效抑制内膜增生与再狭窄'
      ]
    },
    {
      tag: 'Routine Consumables · 已上市产品',
      title: '血管异物抓捕器',
      img: 'images/ys3.jpg',
      desc: '配套血管介入全手术流程的标准化医用耗材，覆盖主动脉、外周介入术中辅助操作需求，以精工智造保障每一台手术的精准与安全。',
      list: [
        '双证齐全 —— 2024 年取得医疗器械注册证 + 生产许可证',
        '临床用途 —— 用于血管内异物、脱落支架/栓塞物等的精准抓捕与取出',
        '操作便捷 —— 适配多种输送鞘管，抓捕范围广，操作灵活',
        '配套耗材 —— 同时配套介入导丝、血管鞘管、输送辅助耗材、术中辅助配件等全系列产品'
      ]
    }
  ];

  const open = (idx) => {
    const p = products[idx];
    if (!p) return;
    modal.querySelector('#productModalImg').src = p.img;
    modal.querySelector('#productModalImg').alt = p.title;
    modal.querySelector('#productModalTag').textContent = p.tag;
    modal.querySelector('#productModalTitle').textContent = p.title;
    modal.querySelector('#productModalDesc').textContent = p.desc;
    const listEl = modal.querySelector('#productModalList');
    listEl.innerHTML = p.list.map(item => `<li>${item}</li>`).join('');
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  };
  const close = () => {
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
  };

  document.querySelectorAll('.js-product-detail').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      open(parseInt(btn.dataset.product, 10));
    });
  });

  overlay.addEventListener('click', close);
  closeBtn.addEventListener('click', close);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
  });
})();

// ---- Marquee (JS driven for smooth speed change) ----
(() => {
  const marquee = document.querySelector('.marquee');
  if (!marquee) return;
  const track = marquee.querySelector('.marquee__track');

  let pos = 0;
  let isHover = false;
  let lastTime = performance.now();
  const NORMAL_SPEED = 50; // px/s
  const HOVER_SPEED = 15;  // px/s (slower on hover)

  const animate = (now) => {
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;
    const speed = isHover ? HOVER_SPEED : NORMAL_SPEED;
    pos -= speed * dt;
    const half = track.scrollWidth / 2;
    if (Math.abs(pos) >= half) pos += half;
    track.style.transform = `translateX(${pos}px)`;
    requestAnimationFrame(animate);
  };

  marquee.addEventListener('mouseenter', () => { isHover = true; });
  marquee.addEventListener('mouseleave', () => { isHover = false; });

  requestAnimationFrame(animate);
})();
