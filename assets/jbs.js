/* JBS トップページスクリプト（依存ライブラリなし） */
(function () {
  'use strict';

  function initNavigation() {
    const body = document.body;
    const burger = document.querySelector('.jbs-burger');
    const gnav = document.getElementById('jbs-gnav');
    const backdrop = document.querySelector('.jbs-gnav__bg');
    const mobileQuery = window.matchMedia('(max-width:900px)');

    if (!burger || !gnav) return;

    const closeNav = (returnFocus) => {
      if (!body.classList.contains('jbs-nav-open')) return;
      body.classList.remove('jbs-nav-open');
      burger.setAttribute('aria-expanded', 'false');
      if (returnFocus) burger.focus();
    };

    const openNav = () => {
      body.classList.add('jbs-nav-open');
      burger.setAttribute('aria-expanded', 'true');
    };

    burger.addEventListener('click', () => {
      body.classList.contains('jbs-nav-open') ? closeNav(true) : openNav();
    });

    if (backdrop) {
      backdrop.addEventListener('click', () => closeNav(true));
    }

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeNav(true);
    });

    const handleBreakpoint = (event) => {
      if (!event.matches) closeNav(false);
    };

    if (mobileQuery.addEventListener) {
      mobileQuery.addEventListener('change', handleBreakpoint);
    } else {
      mobileQuery.addListener(handleBreakpoint);
    }

    gnav.querySelectorAll('.jbs-gnav__list > li').forEach((item) => {
      const submenu = item.querySelector(':scope > ul');
      const toggle = item.querySelector(':scope > .jbs-gnav__tgl');
      if (!submenu) return;

      item.classList.add('jbs-has-sub');
      if (!toggle) return;

      toggle.addEventListener('click', () => {
        const isOpen = item.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });
    });
  }

  function initHero() {
    const hero = document.querySelector('[data-jbs-rotate]');
    if (!hero) return;

    const slides = Array.from(hero.querySelectorAll('.jbs-hero__slides > figure'));
    const dots = Array.from(hero.querySelectorAll('.jbs-hero__dots button'));
    const copies = Array.from(hero.querySelectorAll('[data-hero-copy]'));
    if (slides.length < 2) return;

    const interval = Number.parseInt(hero.getAttribute('data-interval'), 10) || 6000;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    let current = Math.max(0, slides.findIndex((slide) => slide.classList.contains('is-active')));
    let timer = null;

    const show = (index) => {
      current = (index + slides.length) % slides.length;

      slides.forEach((slide, i) => {
        slide.classList.toggle('is-active', i === current);
        if (dots[i]) dots[i].setAttribute('aria-selected', i === current ? 'true' : 'false');
      });

      copies.forEach((copy, i) => {
        const isActive = i === current;
        copy.classList.toggle('is-active', isActive);
        copy.setAttribute('aria-hidden', isActive ? 'false' : 'true');
      });
    };

    const stop = () => {
      if (!timer) return;
      clearInterval(timer);
      timer = null;
    };

    const start = () => {
      stop();
      if (reduceMotion) return;
      timer = window.setInterval(() => show(current + 1), interval);
    };

    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        show(index);
        start();
      });
    });

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    document.addEventListener('visibilitychange', () => {
      document.hidden ? stop() : start();
    });

    show(current);
    start();
  }

  function initBannerSlider() {
    const slider = document.querySelector('[data-vb-slider]');
    if (!slider) return;

    const track = slider.querySelector('.jbs-vb__track');
    const prevButton = slider.querySelector('.jbs-vb__nav--prev');
    const nextButton = slider.querySelector('.jbs-vb__nav--next');
    const dots = slider.parentElement?.querySelector('.jbs-vb__dots');
    if (!track || !prevButton || !nextButton || !dots) return;

    const originals = Array.from(track.querySelectorAll('.jbs-vb__item'), (item) => item.cloneNode(true));
    const total = originals.length;
    if (!total) return;

    let currentIndex = 0;
    let cloneCount = 0;
    let physicalIndex = 0;
    let isAnimating = false;
    let resizeTimer = null;

    const visibleCount = () => {
      if (window.innerWidth <= 600) return 1;
      if (window.innerWidth <= 900) return 2;
      return 4;
    };

    const itemStep = () => {
      const first = track.querySelector('.jbs-vb__item');
      if (!first) return 0;
      const styles = getComputedStyle(track);
      const gap = Number.parseFloat(styles.columnGap || styles.gap || 0) || 0;
      return first.getBoundingClientRect().width + gap;
    };

    const setTransform = (animate) => {
      const step = itemStep();
      if (!step) return;
      track.style.transition = animate ? 'transform .35s ease' : 'none';
      track.style.transform = `translateX(${-physicalIndex * step}px)`;
    };

    const updateDots = () => {
      Array.from(dots.children).forEach((dot, index) => {
        dot.setAttribute('aria-selected', index === currentIndex ? 'true' : 'false');
      });
    };

    const waitForTransform = (callback) => {
      const done = (event) => {
        if (event.propertyName !== 'transform') return;
        track.removeEventListener('transitionend', done);
        callback();
      };
      track.addEventListener('transitionend', done);
    };

    const buildDots = () => {
      dots.replaceChildren();

      for (let index = 0; index < total; index += 1) {
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('aria-label', `${index + 1}枚目を左端に表示`);
        button.addEventListener('click', () => {
          if (isAnimating || index === currentIndex) return;
          currentIndex = index;
          physicalIndex = cloneCount + currentIndex;
          isAnimating = true;
          updateDots();
          setTransform(true);
          waitForTransform(() => { isAnimating = false; });
        });
        dots.appendChild(button);
      }

      updateDots();
    };

    const rebuild = () => {
      cloneCount = Math.min(visibleCount(), total);
      track.replaceChildren();

      for (let index = total - cloneCount; index < total; index += 1) {
        const clone = originals[index].cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        track.appendChild(clone);
      }

      originals.forEach((item) => track.appendChild(item.cloneNode(true)));

      for (let index = 0; index < cloneCount; index += 1) {
        const clone = originals[index].cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        track.appendChild(clone);
      }

      physicalIndex = cloneCount + currentIndex;
      requestAnimationFrame(() => setTransform(false));
    };

    const finishMove = (direction) => {
      if (direction === 'next' && physicalIndex >= cloneCount + total) {
        physicalIndex = cloneCount;
        setTransform(false);
      } else if (direction === 'prev' && physicalIndex < cloneCount) {
        physicalIndex = cloneCount + total - 1;
        setTransform(false);
      }
      isAnimating = false;
      updateDots();
    };

    const move = (direction) => {
      if (isAnimating) return;
      isAnimating = true;

      if (direction === 'next') {
        currentIndex = (currentIndex + 1) % total;
        physicalIndex += 1;
      } else {
        currentIndex = (currentIndex - 1 + total) % total;
        physicalIndex -= 1;
      }

      setTransform(true);
      waitForTransform(() => finishMove(direction));
    };

    prevButton.addEventListener('click', () => move('prev'));
    nextButton.addEventListener('click', () => move('next'));

    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        isAnimating = false;
        rebuild();
      }, 100);
    });

    buildDots();
    rebuild();
  }

  function initFreshBadges() {
    const parseLocalDate = (value) => {
      const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (!match) return null;
      return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayMs = 24 * 60 * 60 * 1000;

    document.querySelectorAll('[data-fresh-mode]').forEach((list) => {
      const mode = list.getAttribute('data-fresh-mode');

      list.querySelectorAll('li').forEach((item) => {
        const link = item.querySelector('a');
        const time = item.querySelector('time[datetime]');
        if (!link || !time) return;

        const target = parseLocalDate(time.getAttribute('datetime'));
        if (!target) return;

        const diff = Math.round((today - target) / dayMs);
        const active = mode === 'same-day' ? diff === 0 : diff >= 0 && diff <= 3;
        const oldBadge = link.querySelector('.jbs-fresh');

        if (active && !oldBadge) {
          const badge = document.createElement('span');
          badge.className = `jbs-fresh ${mode === 'same-day' ? 'jbs-fresh--today' : 'jbs-fresh--new'}`;
          badge.textContent = mode === 'same-day' ? 'TODAY' : 'NEW';
          link.appendChild(badge);
        } else if (!active && oldBadge) {
          oldBadge.remove();
        }
      });
    });
  }

  initNavigation();
  initHero();
  initBannerSlider();
  initFreshBadges();
})();
