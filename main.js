(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = t => t * t * (3 - 2 * t);

  /* ---------- Language FR / EN ---------- */
  const setLang = lang => {
    root.dataset.lang = lang;
    root.lang = lang;
    document.querySelectorAll('[data-set-lang]').forEach(b =>
      b.setAttribute('aria-pressed', String(b.dataset.setLang === lang)));
    try { localStorage.setItem('ck-lang', lang); } catch (e) {}
  };
  let initial = 'fr';
  try { initial = localStorage.getItem('ck-lang') || (navigator.language || 'fr').slice(0, 2); } catch (e) {}
  setLang(['en', 'pt'].includes(initial) ? initial : 'fr');
  document.querySelectorAll('[data-set-lang]').forEach(b =>
    b.addEventListener('click', () => setLang(b.dataset.setLang)));

  /* ---------- Events: hide past dates ---------- */
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const eventItems = [...document.querySelectorAll('.event[data-date]')];
  eventItems.forEach(ev => {
    const d = new Date(ev.dataset.date + 'T23:59:59');
    if (d < today) ev.remove();
  });
  if (!document.querySelector('.event')) {
    document.querySelector('.events__list').remove();
    document.querySelector('.events__empty').hidden = false;
  }

  /* ---------- Elements ---------- */
  const nav = document.getElementById('nav');
  const hero = document.getElementById('hero');
  const sun = hero.querySelector('.hero__sun');
  const sky = hero.querySelector('.hero__sky');
  const palmL = hero.querySelector('.hero__palm--l');
  const palmR = hero.querySelector('.hero__palm--r');
  const hib = hero.querySelector('.hero__hibiscus');
  const tour = document.getElementById('escales');
  const rail = tour.querySelector('.tour__rail');
  const stops = [...tour.querySelectorAll('.stop')];
  const dots = [...tour.querySelectorAll('.route li')];
  const route = tour.querySelector('.route');
  const depthEls = [...document.querySelectorAll('[data-depth]')];
  const heroPhoto = hero.querySelector('.hero__photo');

  /* ---------- Reveal on view ---------- */
  const revealTargets = document.querySelectorAll('.section-head, .offer, .event, .kitchen__text, .rum h2, .book__card');
  revealTargets.forEach(el => el.classList.add('reveal'));
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.18 });
  revealTargets.forEach(el => io.observe(el));

  const shelf = document.querySelector('.shelf');
  new IntersectionObserver((entries, obs) => {
    if (entries[0].isIntersecting) { shelf.classList.add('is-filled'); obs.disconnect(); }
  }, { threshold: 0.4 }).observe(shelf);

  /* ---------- Scroll progress bar ---------- */
  const setProgress = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    root.style.setProperty('--progress', max > 0 ? clamp(scrollY / max).toFixed(4) : 0);
  };
  addEventListener('scroll', setProgress, { passive: true });
  addEventListener('resize', setProgress);
  setProgress();

  /* ---------- Smooth scroll for in-page links ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      const target = id.length > 1 && document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      history.pushState(null, '', id);
    });
  });

  /* ---------- Draw-on checkmarks in the tasting tiers ---------- */
  document.querySelectorAll('.offer__tiers').forEach(list => {
    list.classList.add('has-ticks');
    list.querySelectorAll('li').forEach(li => li.insertAdjacentHTML('afterbegin',
      '<svg class="tick" viewBox="0 0 24 24" aria-hidden="true"><path pathLength="1" d="M4 12.5l5 5L20 6.5"/></svg>'));
    new IntersectionObserver((entries, obs) => {
      if (entries[0].isIntersecting) { list.classList.add('is-drawn'); obs.disconnect(); }
    }, { threshold: 0.5 }).observe(list);
  });

  /* ---------- Count-up on prices (final value stays in the HTML) ---------- */
  if (!reduce) {
    const countUp = el => {
      const end = +el.dataset.count, t0 = performance.now(), dur = 1100;
      const tick = now => {
        const k = clamp((now - t0) / dur);
        el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const countIO = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { countUp(e.target); countIO.unobserve(e.target); } });
    }, { threshold: 0.6 });
    document.querySelectorAll('.count[data-count]').forEach(el => countIO.observe(el));
  }

  if (reduce) {
    stops.forEach(s => s.classList.add('is-stamped'));
    addEventListener('scroll', () => nav.classList.toggle('is-solid', scrollY > 40), { passive: true });
    return;
  }

  /* ---------- Sparkles on button hover ---------- */
  document.querySelectorAll('.btn, .channel').forEach(btn => {
    let last = 0;
    btn.addEventListener('pointerenter', e => {
      if (e.pointerType === 'touch' || performance.now() - last < 600) return;
      last = performance.now();
      for (let i = 0; i < 6; i++) {
        const s = document.createElement('span');
        s.className = 'spark';
        const a = Math.random() * Math.PI * 2, r = 22 + Math.random() * 26;
        s.style.setProperty('--sx', (15 + Math.random() * 70) + '%');
        s.style.setProperty('--sy', (20 + Math.random() * 60) + '%');
        s.style.setProperty('--dx', Math.cos(a) * r + 'px');
        s.style.setProperty('--dy', Math.sin(a) * r + 'px');
        s.style.animationDelay = (i * 40) + 'ms';
        s.addEventListener('animationend', () => s.remove());
        btn.appendChild(s);
      }
    });
  });

  /* ---------- Scroll timeline ---------- */
  let active = -1;
  const setActive = i => {
    if (i === active) return;
    active = i;
    tour.style.setProperty('--ground', stops[i].dataset.ground);
    tour.style.setProperty('--accent', stops[i].dataset.accent);
    dots.forEach((d, k) => d.classList.toggle('is-done', k <= i));
  };
  setActive(0);

  const frame = () => {
    const vh = innerHeight;
    const y = scrollY;

    nav.classList.toggle('is-solid', y > 40);

    // Hero: sun sets, palms drift at different depths, sky warms
    const hp = clamp(y / vh);
    sun.style.transform = `translate3d(0, ${hp * 38}vh, 0) scale(${1 + hp * 0.12})`;
    sky.style.filter = `saturate(${1 + hp * 0.5}) hue-rotate(${-hp * 14}deg) brightness(${1 - hp * 0.15})`;
    palmL.style.transform = `translate3d(0, ${hp * -6}vh, 0) rotate(${hp * -4}deg)`;
    palmR.style.transform = `scaleX(-1) translate3d(0, ${hp * -14}vh, 0)`;
    hib.style.transform = `translate3d(0, ${hp * -28}vh, 0) rotate(${hp * 90}deg)`;
    // Hero photo: frame drifts up a touch, picture inside drifts down (gentle parallax)
    if (heroPhoto) {
      heroPhoto.style.translate = `0 ${hp * -7}vh`;
      const img = heroPhoto.querySelector('img');
      if (img) img.style.transform = `translate3d(0, ${hp * 6}%, 0)`;
    }

    // Island tour: horizontal rail with a hold on each boarding pass
    const r = tour.getBoundingClientRect();
    const span = tour.offsetHeight - vh;
    const p = clamp(-r.top / span);
    const n = stops.length;
    const seg = p * (n - 1);
    const idx = Math.min(n - 2, Math.floor(seg));
    const frac = seg - idx;
    const eased = idx + smooth(clamp((frac - 0.4) / 0.6));
    const pos = Math.min(n - 1, eased);
    rail.style.transform = `translate3d(${-pos * 100}vw, 0, 0)`;
    route.style.setProperty('--route', (pos / (n - 1)).toFixed(4));
    const current = Math.round(pos);
    setActive(current);
    stops.forEach((s, k) => {
      if (Math.abs(pos - k) < 0.12) s.classList.add('is-stamped');
    });

    // Kitchen photos: gentle parallax
    depthEls.forEach(el => {
      const b = el.getBoundingClientRect();
      const c = (b.top + b.height / 2 - vh / 2) / vh;
      el.style.translate = `0 ${c * parseFloat(el.dataset.depth) * 240}px`;
    });

    ticking = false;
  };

  let ticking = false;
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  frame();
})();
