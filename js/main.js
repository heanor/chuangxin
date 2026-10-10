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
  '.section__head, .about__text, .about__stats, .product-card, .advantage, .news__item, .join__inner, .mission-card'
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
  const playBtn = banner.querySelector('.banner__play-btn');
  const total = slides.length;
  const interval = 7000;
  let current = 0;
  let rafId = null;
  let slideStart = 0;        // timestamp when current slide started playing
  let elapsedBeforePause = 0; // accumulated elapsed ms across pauses
  let isPlaying = true;

  // Inject progress fill into each dot
  dots.forEach(dot => {
    const fill = document.createElement('span');
    fill.className = 'banner__dot-fill';
    dot.appendChild(fill);
  });

  const setProgress = (dot, percent) => {
    const fill = dot.querySelector('.banner__dot-fill');
    if (!fill) return;
    fill.style.transition = 'none';
    fill.style.width = percent + '%';
  };

  const updatePlayButton = () => {
    if (!playBtn) return;
    playBtn.classList.toggle('is-playing', isPlaying);
    playBtn.setAttribute('aria-label', isPlaying ? '暂停轮播' : '播放轮播');
  };

  // Single rAF loop drives BOTH the progress bar and the slide switch,
  // so they can never drift out of sync.
  const tick = () => {
    if (!isPlaying) return;
    const elapsed = Date.now() - slideStart + elapsedBeforePause;
    const progress = Math.min(elapsed / interval * 100, 100);
    const activeDot = dots[current];
    if (activeDot) setProgress(activeDot, progress);

    if (elapsed >= interval) {
      go(current + 1);
    } else {
      rafId = requestAnimationFrame(tick);
    }
  };

  const go = (index) => {
    current = (index + total) % total;
    slides.forEach((s, i) => s.classList.toggle('is-active', i === current));
    dots.forEach((d, i) => {
      const fill = d.querySelector('.banner__dot-fill');
      if (fill) { fill.style.transition = 'none'; fill.style.width = '0'; }
      d.classList.toggle('is-active', i === current);
    });
    slideStart = Date.now();
    elapsedBeforePause = 0;
    if (isPlaying) {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(tick);
    }
  };
  const next = () => go(current + 1);
  const prev = () => go(current - 1);

  const play = () => {
    if (isPlaying) return;
    isPlaying = true;
    slideStart = Date.now();
    rafId = requestAnimationFrame(tick);
    updatePlayButton();
  };

  const pause = () => {
    if (!isPlaying) return;
    isPlaying = false;
    if (rafId) cancelAnimationFrame(rafId);
    elapsedBeforePause += Date.now() - slideStart;
    updatePlayButton();
  };

  const togglePlay = () => { isPlaying ? pause() : play(); };

  prevBtn.addEventListener('click', prev);
  nextBtn.addEventListener('click', next);
  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      go(parseInt(dot.dataset.index, 10));
    });
  });

  if (playBtn) {
    playBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePlay();
    });
  }

  // Touch swipe
  let touchX = 0;
  banner.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
  banner.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) { dx < 0 ? next() : prev(); }
  }, { passive: true });

  // Init
  updatePlayButton();
  go(0);
})();

// ---- Banner canvas particle animation (slide 4) ----
(() => {
  const cv = document.querySelector('.banner__canvas');
  if (!cv) return;
  const box = document.querySelector('.banner');
  const ctx = cv.getContext('2d');
  const COLS = 120, ROWS = 52;

  const sprite = (rgb, blur) => {
    const s = 64, c = document.createElement('canvas');
    c.width = c.height = s;
    const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    const st = blur === 0 ? [[0, 1], [.35, .95], [.5, .5], [1, 0]]
      : blur === 1 ? [[0, .85], [.4, .6], [.75, .2], [1, 0]]
      : [[0, .5], [.5, .3], [.85, .1], [1, 0]];
    st.forEach(([o, a]) => r.addColorStop(o, 'rgba(' + rgb + ',' + a + ')'));
    g.fillStyle = r; g.fillRect(0, 0, s, s); return c;
  };
  const SP = [['30,100,255'], ['80,200,255'], ['255,50,90']].map(([c]) => [0, 1, 2].map(b => sprite(c, b)));

  const dots = [];
  for (let i = 0; i < COLS; i++) for (let j = 0; j < ROWS; j++) {
    const r = Math.random();
    dots.push({
      x: -1.25 + i / (COLS - 1) * 2.9 + (Math.random() - .5) * .012,
      z: j / (ROWS - 1),
      k: r < .04 ? 2 : (r < .3 ? 1 : 0),
      sz: .7 + Math.random() * .6,
      tw: Math.random() * 6.28
    });
  }

  let W, H, D, mx = 0, my = 0, sx = 0, sy = 0;
  const size = () => {
    const r = box.getBoundingClientRect();
    D = Math.min(devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    cv.width = W * D; cv.height = H * D;
    ctx.setTransform(D, 0, 0, D, 0, 0);
  };
  size();
  addEventListener('resize', size);
  box.addEventListener('mousemove', e => {
    const r = box.getBoundingClientRect();
    mx = (e.clientX - r.left) / W - .5;
    my = (e.clientY - r.top) / H - .5;
  });

  const sm = (a, b, x) => { x = Math.max(0, Math.min(1, (x - a) / (b - a))); return x * x * (3 - 2 * x); };
  const slow = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0.2 : 1;
  const t0 = performance.now();
  let running = true;

  const draw = (now) => {
    if (!running) { requestAnimationFrame(draw); return; }
    const t = (now - t0) / 1000 * slow;
    sx += (mx - sx) * .04; sy += (my - sy) * .04;
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    const mob = W <= 820, fx = W * (mob ? 1.15 : .62), fy = H * (mob ? .55 : .95), oy = H * (mob ? .78 : .5);
    for (const d of dots) {
      const x = d.x, z = d.z;
      const env = sm(-.9, 1.1, x) * (.55 + .45 * z) + .12;
      let y = (Math.sin(x * 3.4 + z * 2.2 - t * .55) * .5 + Math.sin(x * 6.2 - z * 3.1 + t * .4) * .28 + Math.sin(x * 11 + z * 5 - t * .8) * .1) * .38 * env;
      const rg = x - (-.75 + z * 1.05);
      y += .42 * Math.exp(-rg * rg / .006) * sm(-1.1, -.2, x) * (1 - z * .4);
      const Z = 1 + z * 2.4 + sy * .2;
      const px = W * (mob ? .5 : .52) + (x - .15 - sx * .25) * fx / Z;
      const py = oy + (.62 - y * 1.6) * fy / Z * (mob ? .9 : 1) - fy * .2;
      if (px < -40 || px > W + 40 || py < -40 || py > H + 40) continue;
      const h = Math.max(0, Math.min(1, (y / .38 + .6) / 1.4));
      let a = (.24 + .76 * h * h) * (1 - z * .35) * (.9 + .1 * Math.sin(t * 2 + d.tw));
      if (a < .03) continue;
      const blur = z < .2 ? 2 : (z < .34 ? 1 : (d.k == 1 && z > .75 ? 1 : 0));
      const size = (7.5 / Z) * d.sz * (blur === 0 ? 1 : blur === 1 ? 2.2 : 4.2) * (mob ? .9 : 1) * (W / 1400 + .4);
      ctx.globalAlpha = Math.min(1, a * (blur === 2 ? .9 : 1));
      const k = h > .78 && d.k != 2 ? 1 : d.k;
      ctx.drawImage(SP[k][blur], px - size / 2, py - size / 2, size, size);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    requestAnimationFrame(draw);
  };

  // Pause canvas when slide 4 is not active
  const slide4 = document.querySelector('.banner__slide--canvas');
  if (slide4) {
    const mo = new MutationObserver(() => { running = slide4.classList.contains('is-active'); });
    mo.observe(slide4, { attributes: true, attributeFilter: ['class'] });
    running = slide4.classList.contains('is-active');
  }

  requestAnimationFrame(draw);
})();

// ---- Banner CX3 logo particle animation (slide 1) ----
(() => {
  const cv = document.querySelector('.banner__canvas--logo');
  if (!cv) return;
  const box = document.querySelector('.banner');
  const ctx = cv.getContext('2d');

  const sprite = (rgb, blur) => {
    const n = 64, c = document.createElement('canvas');
    c.width = c.height = n;
    const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    const st = blur === 0 ? [[0, 1], [.32, .95], [.45, .4], [.52, 0]]
      : blur === 1 ? [[0, .85], [.4, .6], [.75, .2], [1, 0]]
      : [[0, .5], [.5, .3], [.85, .1], [1, 0]];
    st.forEach(([o, a]) => r.addColorStop(o, 'rgba(' + rgb + ',' + a + ')'));
    g.fillStyle = r; g.fillRect(0, 0, n, n); return c;
  };
  // 0 blue, 1 bright blue, 2 red, 3 bright red
  const SP = ['30,100,255', '60,140,255', '255,50,70', '255,90,110'].map(c => [0, 1, 2].map(b => sprite(c, b)));

  const N = 480, V = 10, HW = .075, raw = [], push = (x, y, f) => raw.push([x, y, f || 0]);
  const cx0 = .655, cy0 = .257, rr = .196, vx = .65;
  const Aa = Math.hypot(cx0, cy0), th = Math.atan2(cy0, cx0) + Math.asin(rr / Aa), mm = Math.tan(th);
  const Tx = cx0 - rr * Math.sin(th), Ty = cy0 + rr * Math.cos(th), bt = Math.PI / 2 + th;
  const A2 = Math.hypot(vx - cx0, cy0), ac = Math.atan2(cy0, vx - cx0) - Math.acos(rr / A2);
  const ea = .406, eb = .4, eh = -Math.sqrt(ea * ea + eb * eb / (mm * mm)), ql = Math.atan2(-eb, mm * ea), qu = -ql;
  const Ql = [eh + ea * Math.cos(ql), eb * Math.sin(ql)];
  push(0, 0);
  for (let k = 1; k <= 60; k++) push(Ql[0] * k / 60, Ql[1] * k / 60);
  for (let k = 1; k <= 500; k++) { const q = ql - (ql - (qu - 2 * Math.PI)) * k / 500; push(eh + ea * Math.cos(q), eb * Math.sin(q)); }
  for (let k = 1; k <= 60; k++) push(Ql[0] * (1 - k / 60), -Ql[1] * (1 - k / 60));
  for (let k = 1; k <= 100; k++) push(Tx * k / 100, -Ty * k / 100);
  for (let k = 1; k <= 400; k++) { const q = -bt + (ac + bt) * k / 400; push(cx0 + rr * Math.cos(q), -cy0 + rr * Math.sin(q)); }
  push(vx, 0, 1);
  for (let k = 0; k <= 400; k++) { const q = -ac + (bt + ac) * k / 400; push(cx0 + rr * Math.cos(q), cy0 + rr * Math.sin(q)); }
  for (let k = 1; k <= 100; k++) push(Tx * (1 - k / 100), Ty * (1 - k / 100));
  const cum = [0]; for (let i = 1; i < raw.length; i++) cum.push(cum[i - 1] + Math.hypot(raw[i][0] - raw[i - 1][0], raw[i][1] - raw[i - 1][1]));
  const TL = cum[cum.length - 1]; let sV = 0; raw.forEach((p, i) => { if (p[2]) sV = cum[i]; });
  const X = [], Y = []; let jj = 0;
  for (let i = 0; i < N; i++) { const g = i / N * TL; while (cum[jj + 1] < g) jj++; const u = (g - cum[jj]) / ((cum[jj + 1] - cum[jj]) || 1); X.push(raw[jj][0] + (raw[jj + 1][0] - raw[jj][0]) * u); Y.push(raw[jj][1] + (raw[jj + 1][1] - raw[jj][1]) * u); }
  let i2 = 0, bd = 9; for (let i = Math.floor(N * .2); i < N * .8; i++) { const dd = Math.hypot(X[i], Y[i]); if (dd < bd) { bd = dd; i2 = i; } }
  const Pl = [cx0 + rr * Math.cos(ac), -cy0 + rr * Math.sin(ac)], Pu = [Pl[0], -Pl[1]], un = (x, y) => { const l = Math.hypot(x, y); return [x / l, y / l]; };
  const t1 = un(vx - Pl[0], -Pl[1]), t2 = un(Pu[0] - vx, Pu[1]), n1 = [-t1[1], t1[0]], n2 = [-t2[1], t2[0]], dn = 1 + n1[0] * n2[0] + n1[1] * n2[1], mb = [(n1[0] + n2[0]) / dn, (n1[1] + n2[1]) / dn], W0 = .14;
  const P = [];
  for (let i = 0; i < N; i++) { const a = (i + N - 2) % N, b = (i + 2) % N; let tx = X[b] - X[a], ty = Y[b] - Y[a]; const l = Math.hypot(tx, ty) || 1; let nx = -ty / l, ny = tx / l; const sg = i / N * TL - sV; if (Math.abs(sg) < W0) { const u = sg < 0 ? (sg + W0) / W0 : sg / W0, A1 = sg < 0 ? n1 : mb, B1 = sg < 0 ? mb : n2; nx = A1[0] * (1 - u) + B1[0] * u; ny = A1[1] * (1 - u) + B1[1] * u; } const f = i / N, fc2 = i2 / N, g = f < fc2 ? f / fc2 : 1 + (f - fc2) / (1 - fc2); P.push({ x: X[i], y: Y[i], nx, ny, z: .18 * Math.cos(Math.PI * g), f, w: 1 }); }
  const dots = [];
  for (let i = 0; i < N; i++) for (let j = 0; j < V; j++) dots.push({ i, v: (j / (V - 1) - .5) * 2, r: Math.random(), sz: .8 + Math.random() * .5, dust: 0 });
  for (let k = 0; k < 500; k++) dots.push({ i: Math.floor(Math.random() * N), v: 0, r: Math.random(), sz: 1.2 + Math.random() * 1.7, dust: 1, ox: (Math.random() - .5) * .75, oy: (Math.random() - .5) * .58, oz: (Math.random() - .5) * .85, ph: Math.random() * 6.28 });
  const AMB = []; for (let k = 0; k < 1400; k++) { const isBk = k < 32; AMB.push({ u: Math.random(), v: Math.random(), d: isBk ? (.88 + Math.random() * .12) : Math.pow(Math.random(), 1.5), vx: (Math.random() - .42) * (isBk ? .006 : .014), vy: -(.005 + Math.random() * .015), r: Math.random(), tw: Math.random() * 6.28, fr: .8 + Math.random() * 2.4, sz: isBk ? (4 + Math.random() * 4.5) : (.55 + Math.random() * .9), bk: isBk }); }
  const STR = []; for (let k = 0; k < 160; k++) STR.push({ f: Math.random(), sp: .03 + Math.random() * .05, off: (Math.random() - .5) * .4, oz: (Math.random() - .5) * .25, r: Math.random() });

  let W, H, D, mx = 0, my = 0, sx = 0, sy = 0, live = true, t = 0, lt = performance.now();
  const size = () => { const r = box.getBoundingClientRect(); D = Math.min(devicePixelRatio || 1, 2); W = r.width; H = r.height; cv.width = W * D; cv.height = H * D; ctx.setTransform(D, 0, 0, D, 0, 0); };
  size(); addEventListener('resize', size);
  box.addEventListener('mousemove', e => { const r = box.getBoundingClientRect(); mx = (e.clientX - r.left) / W - .5; my = (e.clientY - r.top) / H - .5; });
  const slow = matchMedia('(prefers-reduced-motion: reduce)').matches ? .2 : 1;

  const draw = (now) => {
    if (!live) { requestAnimationFrame(draw); return; }
    const dt = (now - lt) / 1000 * slow; t += dt; lt = now; sx += (mx - sx) * .025; sy += (my - sy) * .025;
    ctx.clearRect(0, 0, W, H); ctx.globalCompositeOperation = 'lighter';
    const mob = W <= 820, cx = mob ? W * .5 : W * .68, cy = mob ? H * .68 : H * .5, A = mob ? Math.min(W * .38, H * .35) : Math.min(W * .3, H * .46);
    const ay = Math.sin(t * .14) * .4 + sx * .5, ax = .3 + sy * .35, ca = Math.cos(ay), sa = Math.sin(ay), cb = Math.cos(ax), sb = Math.sin(ax);
    const pulse = (t * .1) % 1, sc = 1, F = 4.5;
    const proj = (x, y, z) => { let X = x * ca + z * sa, Z = -x * sa + z * ca, Y = y * cb - Z * sb; Z = y * sb + Z * cb; const s = F / (F + Z); return [cx + X * A * s, cy + Y * A * s, Z, s]; };
    for (const q of AMB) {
      const u = ((q.u + t * q.vx) % 1 + 1) % 1, v = ((q.v + t * q.vy) % 1 + 1) % 1;
      const px = u * W - sx * 80 * q.d, py = v * H - sy * 55 * q.d;
      const sh = Math.sin(t * q.fr + q.tw);
      if (q.bk) { const sz = (32 + q.d * 36) * (W / 1400 + .5); const a = (.14 + .18 * Math.abs(sh)) * ((u < .45 && !mob) ? .6 : 1); const isRed = q.r < .18; ctx.globalAlpha = a; ctx.drawImage(SP[isRed ? 2 : 1][2], px - sz / 2, py - sz / 2, sz, sz); }
      else { const bl = q.d > .75 ? 2 : q.d > .45 ? 1 : 0; const sz = (2.4 + q.d * 5.5) * q.sz * (bl === 0 ? 1 : bl === 1 ? 1.8 : 2.8) * (W / 1400 + .5); const a = (.32 + .5 * Math.abs(sh)) * (bl === 0 ? 1 : bl === 1 ? .6 : .32) * ((u < .45 && !mob) ? .5 : 1); const isRed = q.r < (u > .55 ? .28 : .07); ctx.globalAlpha = a; ctx.drawImage(SP[(isRed ? 2 : 0) + (q.d < .35 && q.r > .82 ? 1 : 0)][bl], px - sz / 2, py - sz / 2, sz, sz); }
    }
    for (const d of dots) {
      const c = P[d.i]; let x, y, z, nz = 1, g = 0;
      if (!d.dust) { const ph = .9 * Math.sin(c.f * 12.566 + t * .5), cs = Math.cos(ph), sn = Math.sin(ph), w = Math.sin(c.f * 37.699 - t * 1.4 + d.v * 1.8) * .025; x = c.x + c.nx * d.v * HW * c.w * cs; y = c.y + c.ny * d.v * HW * c.w * cs; z = c.z + d.v * HW * c.w * sn + w; nz = Math.abs(cs); }
      else { x = c.x + d.ox + Math.sin(t * .3 + d.ph) * .02; y = c.y + d.oy; z = c.z + d.oz; }
      x *= sc; y *= sc; z *= sc;
      let X = x * ca + z * sa, Z = -x * sa + z * ca, Y = y * cb - Z * sb; Z = y * sb + Z * cb;
      const s = F / (F + Z), px = cx + X * A * s, py = cy + Y * A * s;
      let dd = Math.abs(c.f - pulse); dd = Math.min(dd, 1 - dd); g = Math.max(0, 1 - dd / .07);
      let a = d.dust ? (.12 + .1 * Math.sin(t * 1.5 + d.ph)) * (.7 + .3 * s) : (.26 + .5 * (.3 + .7 * nz) + g * .4) * (1 - Z * .2);
      a = Math.max(0, Math.min(1, a)); if (a < .03) continue;
      const az = Math.abs(Z), blur = d.dust ? (az < .3 ? 1 : 2) : (az < .3 ? 0 : az < .65 ? 1 : 2);
      const sz = A * .022 * s * d.sz * (blur === 0 ? 1 : blur === 1 ? 1.8 : 2.8) * (d.dust ? 1.3 : 1);
      const u = Math.max(0, Math.min(1, (c.x + .45) / .3)), red = d.r < u, br = a > .8 ? 1 : 0;
      ctx.globalAlpha = Math.min(1, a * (blur === 0 ? 1 : blur === 1 ? .55 : .28));
      ctx.drawImage(SP[(red ? 2 : 0) + br][blur], px - sz / 2, py - sz / 2, sz, sz);
    }
    for (const q of STR) { q.f = (q.f + q.sp * dt) % 1; for (let k = 0; k < 5; k++) { const fk = ((q.f - k * .005) % 1 + 1) % 1, c = P[Math.floor(fk * N) % N]; const [px, py, Z, s] = proj((c.x + c.nx * q.off * HW * 2.2) * sc, (c.y + c.ny * q.off * HW * 2.2) * sc, (c.z + q.oz) * sc); const red = q.r < Math.max(0, Math.min(1, (c.x + .45) / .3)), sz = A * .016 * s * (1 - k * .12); ctx.globalAlpha = Math.max(0, (.8 - k * .16) * (1 - Z * .2)); ctx.drawImage(SP[red ? 3 : 1][0], px - sz / 2, py - sz / 2, sz, sz); } }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    requestAnimationFrame(draw);
  };

  // Pause when slide 1 is not active
  const slide1 = document.querySelector('.banner__slide--logo');
  if (slide1) {
    const mo = new MutationObserver(() => { live = slide1.classList.contains('is-active'); if (live) { lt = performance.now(); requestAnimationFrame(draw); } });
    mo.observe(slide1, { attributes: true, attributeFilter: ['class'] });
    live = slide1.classList.contains('is-active');
  }

  requestAnimationFrame(draw);
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

// ---- Honors auto-scroll + manual controls ----
(() => {
  const viewport = document.querySelector('.honors__viewport');
  if (!viewport) return;
  const track = viewport.querySelector('.honors__track');
  const cards = track.querySelectorAll('.honor-card');
  const prevBtn = document.querySelector('.honors__btn--prev');
  const nextBtn = document.querySelector('.honors__btn--next');

  let offset = 0;
  let paused = false;
  const speed = 0.4; // px per frame — slower scroll

  const getHalfWidth = () => track.scrollWidth / 2;
  const getStep = () => cards[0].offsetWidth + parseFloat(getComputedStyle(track).gap);

  const render = () => {
    track.style.transform = `translateX(${offset}px)`;
  };

  const tick = () => {
    if (!paused) {
      offset -= speed;
      const half = getHalfWidth();
      if (offset <= -half) offset += half;
      render();
    }
    requestAnimationFrame(tick);
  };

  // Pause on hover
  viewport.addEventListener('mouseenter', () => { paused = true; });
  viewport.addEventListener('mouseleave', () => { paused = false; });

  // Manual buttons — smooth move by one card
  const smoothMove = (delta) => {
    track.classList.add('is-smooth');
    offset += delta;
    const half = getHalfWidth();
    if (offset > 0) offset -= half;
    if (offset <= -half) offset += half;
    render();
    setTimeout(() => track.classList.remove('is-smooth'), 520);
  };

  prevBtn.addEventListener('click', () => smoothMove(getStep()));
  nextBtn.addEventListener('click', () => smoothMove(-getStep()));

  // Infinite loop — buttons always enabled
  prevBtn.disabled = false;
  nextBtn.disabled = false;

  // Touch swipe
  let touchX = 0;
  viewport.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
  viewport.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) smoothMove(dx > 0 ? getStep() : -getStep());
  }, { passive: true });

  tick();
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
      images: ['images/ys1.jpg', 'images/domain_aorta.jpg', 'images/banner1.jpg'],
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
      images: ['images/ys2.jpg', 'images/domain_peripheral.jpg', 'images/banner2.jpg'],
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
      images: ['images/ys3.jpg', 'images/domain_consumables.jpg', 'images/banner3.jpg'],
      desc: '配套血管介入全手术流程的标准化医用耗材，覆盖主动脉、外周介入术中辅助操作需求，以精工智造保障每一台手术的精准与安全。',
      list: [
        '双证齐全 —— 2024 年取得医疗器械注册证 + 生产许可证',
        '临床用途 —— 用于血管内异物、脱落支架/栓塞物等的精准抓捕与取出',
        '操作便捷 —— 适配多种输送鞘管，抓捕范围广，操作灵活',
        '配套耗材 —— 同时配套介入导丝、血管鞘管、输送辅助耗材、术中辅助配件等全系列产品'
      ]
    }
  ];

  const track = modal.querySelector('#productModalTrack');
  const dotsWrap = modal.querySelector('#productModalDots');
  const prevBtn = modal.querySelector('#productModalPrev');
  const nextBtn = modal.querySelector('#productModalNext');
  let curImg = 0;
  let totalImg = 0;

  const renderCarousel = (images, alt) => {
    track.innerHTML = images.map(src =>
      `<div class="product-carousel__slide"><img src="${src}" alt="${alt}"></div>`
    ).join('');
    dotsWrap.innerHTML = images.map((_, i) =>
      `<span class="product-carousel__dot${i === 0 ? ' is-active' : ''}" data-index="${i}"></span>`
    ).join('');
    totalImg = images.length;
    curImg = 0;
    track.style.transform = 'translateX(0)';
  };

  const goImg = (idx) => {
    curImg = (idx + totalImg) % totalImg;
    track.style.transform = `translateX(-${curImg * 100}%)`;
    dotsWrap.querySelectorAll('.product-carousel__dot').forEach((d, i) =>
      d.classList.toggle('is-active', i === curImg)
    );
  };

  const open = (idx) => {
    const p = products[idx];
    if (!p) return;
    renderCarousel(p.images, p.title);
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

  prevBtn.addEventListener('click', () => goImg(curImg - 1));
  nextBtn.addEventListener('click', () => goImg(curImg + 1));
  dotsWrap.addEventListener('click', e => {
    const dot = e.target.closest('.product-carousel__dot');
    if (dot) goImg(parseInt(dot.dataset.index, 10));
  });

  // Touch swipe
  let touchX = 0;
  track.parentElement.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
  track.parentElement.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) dx > 0 ? goImg(curImg - 1) : goImg(curImg + 1);
  }, { passive: true });

  overlay.addEventListener('click', close);
  closeBtn.addEventListener('click', close);
  document.addEventListener('keydown', e => {
    if (!modal.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') goImg(curImg - 1);
    if (e.key === 'ArrowRight') goImg(curImg + 1);
  });
})();

// ---- Product Detail Media Carousel ----
(() => {
  const carousels = document.querySelectorAll('.product-detail__media .product-carousel');
  if (!carousels.length) return;

  carousels.forEach(carousel => {
    const track = carousel.querySelector('.product-carousel__track');
    const slides = carousel.querySelectorAll('.product-carousel__slide');
    const prevBtn = carousel.querySelector('.product-carousel__btn--prev');
    const nextBtn = carousel.querySelector('.product-carousel__btn--next');
    const dots = carousel.querySelectorAll('.product-carousel__dot');
    const total = slides.length;
    let current = 0;

    const go = (idx) => {
      current = (idx + total) % total;
      track.style.transform = `translateX(-${current * 100}%)`;
      slides.forEach((s, i) => s.classList.toggle('is-active', i === current));
      dots.forEach((d, i) => d.classList.toggle('is-active', i === current));
    };

    prevBtn.addEventListener('click', () => go(current - 1));
    nextBtn.addEventListener('click', () => go(current + 1));
    dots.forEach(dot => {
      dot.addEventListener('click', () => go(parseInt(dot.dataset.index, 10)));
    });

    // Touch swipe
    let touchX = 0;
    carousel.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
    carousel.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) dx > 0 ? go(current - 1) : go(current + 1);
    }, { passive: true });
  });
})();

// ---- News Category Tabs ----
(() => {
  const tabsContainer = document.querySelector('.news-tabs');
  const tabs = document.querySelectorAll('.news-tab');
  const items = document.querySelectorAll('[data-cat]:not(.news-tab)');
  if (!tabs.length || !items.length) return;

  const updateIndicator = () => {
    const active = tabsContainer.querySelector('.news-tab.is-active');
    if (active) {
      tabsContainer.style.setProperty('--indicator-left', active.offsetLeft + 'px');
      tabsContainer.style.setProperty('--indicator-width', active.offsetWidth + 'px');
    }
  };

  const filter = (cat) => {
    tabs.forEach(t => t.classList.toggle('is-active', t.dataset.cat === cat));
    items.forEach(item => {
      const match = cat === 'all' || item.dataset.cat === cat;
      item.style.display = match ? '' : 'none';
    });
    updateIndicator();
  };

  tabs.forEach(tab => {
    tab.addEventListener('click', () => filter(tab.dataset.cat));
  });

  updateIndicator();
  window.addEventListener('resize', updateIndicator);
})();

// ---- News Detail Modal ----
(() => {
  const modal = document.getElementById('newsModal');
  if (!modal) return;
  const overlay = modal.querySelector('.modal__overlay');
  const closeBtn = modal.querySelector('.modal__close');

  const newsData = [
    {
      id: 0,
      title: '国产 A 型主动脉夹层全腔内系统临床攻坚收官，获国际突破性器械认证',
      date: '2025.06.04',
      views: 2860,
      img: 'images/news1.jpg',
      summary: '历经多年自主研发与临床验证，国产A型主动脉夹层全腔内治疗系统已完成全部临床入组与长期随访工作，成功打破国外厂商在该领域的长期技术垄断。',
      content: [
        '深圳市创心医疗科技有限公司自主研发的全球首创 Stanford A 型主动脉夹层全腔内重建系统，历经多年技术攻坚与临床验证，近日正式完成全部人体临床试验入组与长期随访工作。这一里程碑式的进展，标志着国产高端血管介入器械在原创性技术领域取得重大突破。',
        'Stanford A 型主动脉夹层是最凶险的心血管急症之一，发病后 48 小时内死亡率高达 50%，传统治疗方案需开胸并在深低温停循环下进行人工血管置换，手术创伤巨大、并发症多、术后恢复周期长，且对高龄及合并基础疾病患者极不友好。',
        '针对这一临床痛点，创心医疗团队创新性地提出全腔内微创重建理念，通过自主研发的分支支架系统与精准定位技术，在无需开胸的前提下实现主动脉弓部分支血管的腔内重建，将原本需要 6-8 小时的巨创手术缩短至 2-3 小时，患者术后次日即可下床活动。',
        '本次临床试验覆盖全国多家顶尖心血管中心，入组患者涵盖不同年龄段与复杂病变类型。长期随访数据显示，手术成功率、围手术期死亡率、主要不良事件发生率等关键指标均显著优于传统开胸手术，充分验证了全腔内重建技术的安全性与有效性。',
        '凭借卓越的创新性与临床价值，该产品已获美国 FDA 突破性器械（Breakthrough Device）认定，这是继临床研究成果发表于国际心胸外科顶级期刊 JTCVS 之后，中国原创血管介入技术再次获得国际权威机构的高度认可。',
        '业内专家表示，该系统的成功研发不仅打破了国外厂商在该领域的长期技术垄断，更为全球 Stanford A 型主动脉夹层患者提供了全新的微创治疗路径，有望推动该疾病治疗模式的根本性变革。创心医疗将持续推进产品注册上市进程，让中国原创技术早日惠及更多患者。'
      ]
    },
    {
      id: 1,
      title: '国内首款血透通路药物涂层覆膜支架完成全部多中心临床',
      date: '2025.06.04',
      views: 1920,
      img: 'images/news2.jpg',
      summary: '针对透析患者血管通路反复狭窄的临床难题，国内首款血透通路药物涂层覆膜支架通过创新药物涂层技术持续抑制血管内膜增生。',
      content: [
        '公司自主研发的国内首款血透通路药物涂层覆膜支架系统，近日已完成全部百余例多中心临床试验入组，初步数据分析结果表现优异，为透析患者血管通路反复狭窄这一世界性临床难题提供了全新的国产解决方案。',
        '血液透析是终末期肾病患者维持生命的重要治疗方式，而血管通路则是透析患者的"生命线"。然而，长期反复穿刺与血流动力学改变极易导致血管内膜增生、狭窄甚至闭塞，严重影响透析充分性与患者生存质量，如何维持血管通路长期通畅一直是临床亟待解决的痛点。',
        '针对这一难题，创心医疗团队创新性地将抗增殖药物涂层与覆膜结构相结合：覆膜结构物理隔离血流与血管壁，减少平滑肌细胞迁移；药物涂层持续缓慢释放，精准抑制局部内膜增生。双重机制协同作用，从源头降低再狭窄发生率。',
        '本次多中心临床试验由国内多家知名三甲医院共同参与，入组患者涵盖不同血管条件与通路类型。数据显示，术后 6 个月、12 个月靶病变通畅率均显著高于国内外同类产品，且不良事件发生率低，安全性与有效性得到充分验证。',
        '据悉，该产品已完成全部随访工作，即将进入注册申报阶段。业内人士指出，作为国内首款获批临床的血透通路药物涂层覆膜支架，其上市后将填补国内在该细分领域的空白，大幅降低患者治疗成本，让更多透析患者受益于国产生物医学工程的创新成果。'
      ]
    },
    {
      id: 2,
      title: '专精特新血管器械企业搭建标准化产研体系，夯实三类医械智造底座',
      date: '2025.06.04',
      views: 1540,
      img: 'images/news3.jpg',
      summary: '作为专精特新血管器械企业，公司建成符合GMP标准的万级洁净车间与全自动化产线，建立覆盖全流程的质量管理体系。',
      content: [
        '作为深耕血管介入赛道的专精特新企业，创心医疗持续加大产研基础设施投入，近日建成符合 GMP 标准的万级洁净车间与全自动化产线，标志着公司在高端医疗器械智能制造领域迈出重要一步。',
        '新建产线配备了行业领先的精密加工、涂层制备、无菌灌装与自动化检测设备，可实现从原材料入库到成品出库的全流程数字化管控，年产能可满足数十万套血管介入器械的规模化生产需求。',
        '在质量管理体系方面，公司建立了覆盖设计开发验证、注册检验、批量生产、售后追溯的全流程质量闭环，引入六西格玛管理方法与 SPC 统计过程控制技术，确保每一件产品的精度与一致性达到国际先进水平。',
        '与此同时，公司持续完善研发创新体系，搭建了材料学、生物力学、精密制造、临床医学等多学科交叉的研发平台，与国内多家顶尖高校及科研院所建立产学研合作，加速原创性技术成果的工程化转化。',
        '标准化产研体系的搭建，不仅为公司后续多款核心产品的产业化落地奠定了坚实基础，也标志着企业从研发创新型公司向规模化智造企业的关键跨越。未来，创心医疗将以更高标准、更优品质服务全球临床，推动国产高端血管介入器械产业升级。'
      ]
    },
    {
      id: 3,
      title: '资深产业团队深耕血管介入赛道，医工融合驱动源头创新',
      date: '2025.06.04',
      views: 1680,
      img: 'images/news4.jpg',
      summary: '资深产业团队汇聚材料学、临床医学与精密制造等领域资深专家，与多家三甲医院共建联合实验室，深度推进医工交叉融合。',
      content: [
        '创心医疗核心团队汇聚了材料学、临床医学、精密制造、生物力学等多个领域的资深专家，核心成员均拥有十余年血管介入器械产业经验，曾主导多款国内外知名产品的研发与产业化，具备深厚的产业背景与全球化视野。',
        '团队始终坚持"以临床需求为源头"的创新理念，与国内多家顶尖三甲医院心血管中心共建联合实验室，临床专家深度参与产品从概念设计到临床验证的全流程，确保每一项技术创新都源自真实临床痛点、服务于真实临床需求。',
        '在医工交叉融合方面，公司建立了常态化的临床-工程沟通机制，定期组织多学科研讨会，让临床医生与工程技术人员围绕复杂病例、手术难点展开深度讨论，将临床经验转化为可工程化实现的产品设计方案。',
        '目前，团队已在主动脉全腔内重建、外周血管药物涂层支架、介入耗材等多个方向形成原创性技术储备，累计申请国内外专利数十项。多款核心产品进入临床或注册阶段，展现出强劲的源头创新能力。',
        '业内评价认为，创心医疗的医工融合模式走出了一条"临床驱动创新、创新服务临床"的良性循环之路，为国产高端医疗器械的原创性发展提供了可借鉴的范式。未来团队将继续深耕血管介入赛道，以持续的源头创新推动产业进步。'
      ]
    },
    {
      id: 4,
      title: '国产血管介入器械加速全球化布局，国内外专利与海外临床双线并进',
      date: '2025.06.04',
      views: 2130,
      img: 'images/news5.jpg',
      summary: '国产血管介入器械正加速全球化布局，公司已在东南亚、欧洲等地区完成多项产品注册与临床合作。',
      content: [
        '随着国产血管介入器械技术实力与临床数据的持续积累，创心医疗正加速推进全球化布局，公司已在东南亚、欧洲等地区完成多项产品注册与临床合作，国产高端医疗器械出海步伐持续加快。',
        '在知识产权布局方面，公司核心产品已斩获十余项国际专利，覆盖主动脉全腔内重建、外周血管支架、药物涂层技术等关键技术方向，形成了较为完善的海外知识产权保护体系，为产品全球化销售奠定了坚实基础。',
        '在海外临床合作方面，公司与多家国际知名心血管中心建立了临床研究合作关系，核心产品的海外多中心临床试验正在稳步推进。国际临床数据的积累，将为产品在海外市场的注册申报与商业化推广提供强有力的循证医学支持。',
        '与此同时，公司积极参与国际学术交流，连续多次受邀在美国心胸外科年会（AATS）、欧洲心血管介入大会（EuroPCR）等国际顶级学术会议上做专题报告，向全球医学界展示中国原创血管介入技术的创新成果。',
        '业内人士表示，创心医疗的全球化战略代表了国产高端医疗器械从"进口替代"向"全球创新"的升级方向。随着更多国产原创技术走向世界舞台，中国医疗器械企业的国际影响力将持续提升，为全球患者贡献中国智慧与中国方案。'
      ]
    },
    {
      id: 5,
      title: 'Stanford A 型主动脉夹层系统临床研究发表于国际心胸外科顶刊 JTCVS',
      date: '2025.05.20',
      views: 3120,
      img: 'images/news1.jpg',
      summary: '公司自主研发的全球首创 Stanford A 型主动脉夹层全腔内重建系统临床研究成果，正式发表于国际心胸外科顶级期刊 JTCVS。',
      content: [
        '公司自主研发的全球首创 Stanford A 型主动脉夹层全腔内重建系统临床研究成果，正式发表于国际心胸外科顶级期刊《The Journal of Thoracic and Cardiovascular Surgery》（JTCVS），标志着中国原创血管介入技术获得国际学术界的高度认可。',
        'JTCVS 是心胸外科领域历史最悠久、影响力最大的学术期刊之一，对研究设计的严谨性、数据质量与临床意义有着极为严苛的评审标准。此次研究成果的发表，充分体现了国际同行对该技术创新性与临床价值的高度肯定。',
        '该研究为前瞻性、多中心临床试验，系统评估了全腔内重建技术在 Stanford A 型主动脉夹层治疗中的安全性与有效性。研究纳入了大量复杂病例，包括主动脉弓部受累、合并迷走锁骨下动脉等传统手术高风险患者，具有很强的临床代表性。',
        '研究结果显示，全腔内重建手术的技术成功率、30 天死亡率、神经系统并发症发生率、内漏发生率等关键指标均达到或优于国际同类研究水平，且患者术后恢复时间显著缩短，充分证明了该技术的临床优越性。',
        '此次发表不仅为 Stanford A 型主动脉夹层的全腔内治疗提供了重要的循证医学证据，也为该技术在全球范围内的推广应用奠定了学术基础。公司表示，将继续深化临床研究，持续积累更多长期随访数据，推动中国原创技术在国际舞台上发挥更大影响力。'
      ]
    },
    {
      id: 6,
      title: '血管介入医疗器械行业国产化进程加速，创新企业迎发展机遇',
      date: '2025.05.08',
      views: 1870,
      img: 'images/news2.jpg',
      summary: '随着国家集采政策深入推进与国产替代需求持续释放，血管介入医疗器械行业国产化进程显著加速。',
      content: [
        '随着国家集采政策的深入推进与国产替代需求的持续释放，血管介入医疗器械行业国产化进程显著加速，市场规模快速增长，具备核心技术与临床数据积累的创新企业迎来重要发展机遇期。',
        '长期以来，血管介入高端器械市场被国外厂商占据主导地位，产品价格高昂，给患者与医保体系带来沉重负担。近年来，在国家政策引导与产业资本助力下，一批国产创新企业迅速崛起，在主动脉、外周、冠脉等多个细分领域实现技术突破，加速进口替代进程。',
        '从竞争格局来看，行业正从"渠道驱动"向"技术驱动"转型。拥有原创性技术、扎实临床数据与规模化产研能力的企业将在新一轮竞争中占据优势。单纯依赖仿制或低价竞争的企业面临较大转型压力，行业集中度有望持续提升。',
        '创心医疗作为深耕血管介入赛道的专精特新企业，始终坚持以原始创新驱动产品迭代。目前公司已在主动脉全腔内重建、外周血管药物涂层支架等方向形成全球首创或国内首创的技术储备，多款核心产品进入临床或注册阶段，为把握国产化历史机遇奠定了坚实基础。',
        '展望未来，随着国产创新产品的陆续上市与临床认可度的不断提升，血管介入医疗器械行业将迎来更加广阔的发展空间。创心医疗将继续加大研发投入，深化医工融合，为临床提供更多安全、有效、可及的国产血管介入解决方案，助力健康中国建设。'
      ]
    }
  ];

  const open = (id) => {
    const news = newsData.find(n => n.id === id);
    if (!news) return;
    modal.querySelector('#newsModalImg').src = news.img;
    modal.querySelector('#newsModalImg').alt = news.title;
    modal.querySelector('#newsModalTitle').textContent = news.title;
    modal.querySelector('#newsModalDate').textContent = news.date;
    modal.querySelector('#newsModalViews').textContent = news.views.toLocaleString() + ' 次浏览';
    modal.querySelector('#newsModalSummary').textContent = news.summary;
    const contentEl = modal.querySelector('#newsModalContent');
    contentEl.innerHTML = news.content.map(p => `<p>${p}</p>`).join('');
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  };

  const close = () => {
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
  };

  document.querySelectorAll('.js-news-detail').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      open(parseInt(el.dataset.newsId, 10));
    });
  });

  overlay.addEventListener('click', close);
  closeBtn.addEventListener('click', close);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
  });
})();

// ---- Careers: Position Accordion & Filter ----
(() => {
  const toggles = document.querySelectorAll('.js-pos-toggle');
  if (toggles.length) {
    toggles.forEach(toggle => {
      toggle.addEventListener('click', () => {
        const item = toggle.closest('.pos-item');
        item.classList.toggle('is-open');
      });
    });
  }

  const tabsContainer = document.querySelector('.pos-tabs');
  const tabs = document.querySelectorAll('.pos-tab');
  const items = document.querySelectorAll('.pos-item');
  if (tabs.length && items.length) {
    const updateIndicator = () => {
      const active = tabsContainer.querySelector('.pos-tab.is-active');
      if (active) {
        tabsContainer.style.setProperty('--indicator-left', active.offsetLeft + 'px');
        tabsContainer.style.setProperty('--indicator-width', active.offsetWidth + 'px');
      }
    };
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('is-active'));
        tab.classList.add('is-active');
        const dept = tab.dataset.dept;
        items.forEach(item => {
          item.style.display = (dept === 'all' || item.dataset.dept === dept) ? '' : 'none';
        });
        updateIndicator();
      });
    });
    updateIndicator();
    window.addEventListener('resize', updateIndicator);
  }

  // 投递简历按钮打开弹窗
  const joinModal = document.getElementById('joinModal');
  if (joinModal) {
    const openJoin = () => {
      joinModal.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    };
    document.querySelectorAll('.js-apply-btn, .js-apply').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        openJoin();
      });
    });
  }
})();
