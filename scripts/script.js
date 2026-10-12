/* Троттлинг через requestAnimationFrame - общий хелпер для скролл-эффектов */
function rafThrottle(fn) {
  var ticking = false;
  function run() {
    fn();
    ticking = false;
  }
  return function () {
    if (!ticking) {
      window.requestAnimationFrame(run);
      ticking = true;
    }
  };
}

var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Навигация в хедере */
(function () {
  var navLinks = document.querySelectorAll('.main-nav-link');
  if (!navLinks.length || !('IntersectionObserver' in window)) return;

  var linkByHash = new Map();
  navLinks.forEach(function (link) {
    var hash = link.getAttribute('href');
    if (hash && hash.charAt(0) === '#') {
      linkByHash.set(hash.slice(1), link);
    }
  });

  var sections = [];
  linkByHash.forEach(function (link, id) {
    var section = document.getElementById(id);
    if (section) sections.push(section);
  });
  if (!sections.length) return;

  function setActive(link) {
    navLinks.forEach(function (l) {
      l.classList.remove('is-active');
      l.removeAttribute('aria-current');
    });
    link.classList.add('is-active');
    link.setAttribute('aria-current', 'true');
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var link = linkByHash.get(entry.target.id);
        if (link) setActive(link);
      });
    },
    { rootMargin: '-50% 0px -50% 0px', threshold: 0 }
  );

  sections.forEach(function (section) {
    observer.observe(section);
  });
})();

(function () {
  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (canHover) return;

  var cards = document.querySelectorAll('.problem-card');
  if (!cards.length || !('IntersectionObserver' in window)) return;

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 }
  );

  cards.forEach(function (card) {
    observer.observe(card);
  });
})();

/* Параллакс фонового изображения + полосы-дивайдеры (фрейм 3) */
(function () {
  var section = document.querySelector('.solutions');
  if (!section || prefersReducedMotion) return;

  var bgImage = section.querySelector('[data-parallax]');
  var patternTop = section.querySelector('#solutionsStripesTop');
  var patternBottom = section.querySelector('#solutionsStripesBottom');

  var rotateTop = patternTop ? patternTop.getAttribute('patternTransform') : '';
  var rotateBottom = patternBottom ? patternBottom.getAttribute('patternTransform') : '';

  var AMPLITUDE = 150;
  var STRIPES_SPEED = 0.4;

  var update = rafThrottle(function () {
    if (bgImage) {
      var rect = section.getBoundingClientRect();
      var viewportH = window.innerHeight || document.documentElement.clientHeight;
      var sectionCenter = rect.top + rect.height / 2;
      var viewportCenter = viewportH / 2;
      var travel = (viewportH + rect.height) / 2;
      var progress = travel > 0 ? (sectionCenter - viewportCenter) / travel : 0;
      progress = Math.max(-1, Math.min(1, progress));

      var offset = (progress * AMPLITUDE).toFixed(2);
      bgImage.style.transform = 'translate(-50%, calc(-50% + ' + offset + 'px))';
    }

    var scrollOffset = window.scrollY * STRIPES_SPEED;
    if (patternTop) patternTop.setAttribute('patternTransform', 'translate(' + scrollOffset + ' 0) ' + rotateTop);
    if (patternBottom) patternBottom.setAttribute('patternTransform', 'translate(' + (-scrollOffset) + ' 0) ' + rotateBottom);
  });

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

/* Полосы-дивайдеры по краям окна теста Шульте (фрейм 6) */
(function () {
  var section = document.querySelector('.schulte');
  if (!section || prefersReducedMotion) return;

  var patternLeft = section.querySelector('#schulteStripesLeft');
  var patternRight = section.querySelector('#schulteStripesRight');
  if (!patternLeft && !patternRight) return;

  var rotateLeft = patternLeft ? patternLeft.getAttribute('patternTransform') : '';
  var rotateRight = patternRight ? patternRight.getAttribute('patternTransform') : '';

  var STRIPES_SPEED = 0.4;

  var update = rafThrottle(function () {
    var scrollOffset = window.scrollY * STRIPES_SPEED;
    if (patternLeft) patternLeft.setAttribute('patternTransform', 'translate(0 ' + (-scrollOffset) + ') ' + rotateLeft);
    if (patternRight) patternRight.setAttribute('patternTransform', 'translate(0 ' + scrollOffset + ') ' + rotateRight);
  });

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

/* Переключение проектов (фрейм 4) */
(function () {
  var buttons = document.querySelectorAll('.project-btn');
  var titles = document.querySelectorAll('.project-detail-title');
  var statsTrack = document.getElementById('projectsStatsTrack');
  var scrollers = document.querySelectorAll('.project-detail-stats');
  var prevBtn = document.querySelector('[data-stats-prev]');
  var nextBtn = document.querySelector('[data-stats-next]');
  var panel = document.querySelector('.projects-panel');
  var card = document.querySelector('.projects-card');
  var bridge = document.querySelector('.projects-highlight-bridge');
  var notchLeft = document.querySelector('.projects-highlight-notch-left');
  var notchRight = document.querySelector('.projects-highlight-notch-right');
  var notchFillLeft = document.querySelector('.projects-highlight-notch-fill-left');
  var notchFillRight = document.querySelector('.projects-highlight-notch-fill-right');
  if (!buttons.length || !statsTrack || !scrollers.length) return;

  var activeIndex = 0;
  var reduceMotion = prefersReducedMotion;

  function updateHighlightBridge(options) {
    var animateReveal = !!(options && options.animateReveal);
    var instant = !!(options && options.instant);

    if (!bridge || !panel || !card) return;
    if (getComputedStyle(bridge).display === 'none') return;

    var activeBtn = buttons[activeIndex];
    if (!activeBtn) return;

    var panelRect = panel.getBoundingClientRect();
    var btnRect = activeBtn.getBoundingClientRect();
    var cardRect = card.getBoundingClientRect();
    var OVERLAP = 24;
    var NOTCH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--radius-card')) || 20;
    var EPS = 0.5;
    var TOP_OVERLAP = 3;

    var left = btnRect.left - panelRect.left;
    var width = btnRect.width;
    var top = btnRect.bottom - panelRect.top - TOP_OVERLAP;
    var height = Math.max(cardRect.top - panelRect.top - top + OVERLAP, 0);
    var collapsedTop = top + height;

    bridge.style.left = left + 'px';
    bridge.style.width = width + 'px';

    if (animateReveal && !reduceMotion) {
      bridge.style.transition = 'none';
      bridge.style.top = collapsedTop + 'px';
      bridge.style.height = '0px';
      void bridge.offsetHeight;
      bridge.style.transition = '';
    } else if (instant) {
      bridge.style.transition = 'none';
    }

    bridge.style.top = top + 'px';
    bridge.style.height = height + 'px';

    if (instant && !animateReveal) {
      void bridge.offsetHeight;
      bridge.style.transition = '';
    }

    var cardTop = cardRect.top - panelRect.top;
    var cardLeft = cardRect.left - panelRect.left;
    var cardRight = cardRect.right - panelRect.left;
    var btnRight = left + width;

    function placeNotchPair(notchEl, fillEl, x, y, visible) {
      [notchEl, fillEl].forEach(function (el) {
        if (!el) return;
        if (!visible) {
          el.style.display = 'none';
          return;
        }

        el.style.display = 'block';
        el.style.left = x + 'px';

        if (animateReveal && !reduceMotion) {
          el.style.transition = 'none';
          el.style.top = (collapsedTop - NOTCH) + 'px';
          void el.offsetHeight;
          el.style.transition = '';
        } else if (instant) {
          el.style.transition = 'none';
        }

        el.style.top = y + 'px';

        if (instant && !animateReveal) {
          void el.offsetHeight;
          el.style.transition = '';
        }
      });
    }

    placeNotchPair(notchRight, notchFillRight, btnRight, cardTop - NOTCH, btnRight < cardRight - EPS);
    placeNotchPair(notchLeft, notchFillLeft, left - NOTCH, cardTop - NOTCH, left > cardLeft + EPS);
  }

  /* ---- переезд карточек-цифр внутри рамки из стрелок ---- */

  function slideStepPx() {
    var trackRect = statsTrack.getBoundingClientRect();
    var gapPx = parseFloat(getComputedStyle(statsTrack).columnGap || getComputedStyle(statsTrack).gap) || 0;
    return trackRect.width + gapPx;
  }

  function applyTrackPosition() {
    statsTrack.style.transform = 'translateX(-' + (activeIndex * slideStepPx()) + 'px)';
  }

  function goTo(index) {
    activeIndex = index;

    buttons.forEach(function (btn, i) {
      var isActive = i === index;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    titles.forEach(function (title, i) {
      var isActive = i === index;
      title.classList.toggle('is-active', isActive);
      title.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    });

    applyTrackPosition();
    updateHighlightBridge({ animateReveal: true });
    updateStatsNavState();
  }

  window.addEventListener('resize', function () {
    applyTrackPosition();
    updateHighlightBridge({ instant: true });
    updateStatsNavState();
  });

  buttons.forEach(function (btn, index) {
    btn.addEventListener('click', function () {
      goTo(index);
    });
  });

  /* ---- скролл карточек-результатов внутри активного проекта ---- */

  function cardStep(scroller) {
    var cardEl = scroller.querySelector('.stat-card');
    if (!cardEl) return scroller.clientWidth;
    var gap = parseFloat(getComputedStyle(scroller).columnGap || getComputedStyle(scroller).gap) || 0;
    return cardEl.getBoundingClientRect().width + gap;
  }

  function updateStatsNavState() {
    var scroller = scrollers[activeIndex];
    if (!scroller) return;

    var maxScroll = scroller.scrollWidth - scroller.clientWidth;
    var atEnd = maxScroll <= scroller.scrollLeft + 1;
    var atStart = scroller.scrollLeft <= 1;
    var noOverflow = maxScroll <= 0;

    scroller.classList.toggle('is-at-end', atEnd || noOverflow);
    if (prevBtn) prevBtn.disabled = atStart || noOverflow;
    if (nextBtn) nextBtn.disabled = atEnd || noOverflow;
  }

  scrollers.forEach(function (scroller, i) {
    scroller.addEventListener('scroll', function () {
      if (i === activeIndex) updateStatsNavState();
    }, { passive: true });

    scroller.addEventListener('wheel', function (e) {
      if (i !== activeIndex) return;
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      if (scroller.scrollWidth <= scroller.clientWidth) return;
      e.preventDefault();
      scroller.scrollLeft += e.deltaY;
    }, { passive: false });
  });

  if (prevBtn) {
    prevBtn.addEventListener('click', function () {
      var scroller = scrollers[activeIndex];
      if (!scroller) return;
      scroller.scrollBy({ left: -cardStep(scroller), behavior: 'smooth' });
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', function () {
      var scroller = scrollers[activeIndex];
      if (!scroller) return;
      scroller.scrollBy({ left: cardStep(scroller), behavior: 'smooth' });
    });
  }

  /* ---- автоскролл карточек-результатов активного проекта ---- */

  if (!reduceMotion) {
    var SPEED = 0.6; // px за кадр
    var pausedByIndex = {};

    scrollers.forEach(function (scroller, i) {
      var direction = 1;

      function pause() { pausedByIndex[i] = true; }
      function resume() { pausedByIndex[i] = false; }

      function tick() {
        if (!pausedByIndex[i] && i === activeIndex) {
          var maxScroll = scroller.scrollWidth - scroller.clientWidth;
          if (maxScroll > 0) {
            scroller.scrollLeft += direction * SPEED;
            if (scroller.scrollLeft >= maxScroll - 1) direction = -1;
            else if (scroller.scrollLeft <= 1) direction = 1;
          }
        }
        requestAnimationFrame(tick);
      }

      scroller.addEventListener('mouseenter', pause);
      scroller.addEventListener('mouseleave', resume);
      scroller.addEventListener('pointerdown', pause);
      scroller.addEventListener('pointerup', resume);
      scroller.addEventListener('pointercancel', resume);

      requestAnimationFrame(tick);
    });

    if (prevBtn) {
      prevBtn.addEventListener('mouseenter', function () { pausedByIndex[activeIndex] = true; });
      prevBtn.addEventListener('mouseleave', function () { pausedByIndex[activeIndex] = false; });
    }
    if (nextBtn) {
      nextBtn.addEventListener('mouseenter', function () { pausedByIndex[activeIndex] = true; });
      nextBtn.addEventListener('mouseleave', function () { pausedByIndex[activeIndex] = false; });
    }
  }

  applyTrackPosition();
  updateHighlightBridge();
  updateStatsNavState();

  function recalcInstantly() {
    applyTrackPosition();
    updateHighlightBridge({ instant: true });
    updateStatsNavState();
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(recalcInstantly);
  }

  window.addEventListener('load', recalcInstantly);
})();

/* Бегущая лента: общая логика для "кинопленки" (фрейм 5) и команды (фрейм 7) */
function createMarquee(track, options) {
  if (!track) return;

  var direction = options.direction || 1;
  var speed = options.speed || 40;
  var pausable = !!options.pausable;

  track.innerHTML = track.innerHTML + track.innerHTML;
  if (prefersReducedMotion) return;

  var setWidth = 0;
  var offset = 0;

  function measure() {
    var prevSetWidth = setWidth;
    setWidth = track.scrollWidth / 2;
    if (prevSetWidth > 0 && setWidth > 0) offset = (offset / prevSetWidth) * setWidth;
  }
  measure();
  if (direction > 0) offset = -setWidth;
  window.addEventListener('resize', measure);

  var paused = false;
  if (pausable) {
    track.addEventListener('mouseenter', function () { paused = true; });
    track.addEventListener('mouseleave', function () { paused = false; });
  }

  var lastTime = null;
  function tick(time) {
    if (lastTime === null) lastTime = time;
    var dt = (time - lastTime) / 1000;
    lastTime = time;

    if (!paused && setWidth > 0) {
      offset += direction * speed * dt;
      if (direction > 0 && offset >= 0) offset -= setWidth;
      if (direction < 0 && offset <= -setWidth) offset += setWidth;
      track.style.transform = 'translateX(' + offset + 'px)';
    }

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* Бегущая лента с квадратиками "кинопленки" (фрейм 5, дивайдеры сверху и снизу) */
(function () {
  var tracks = document.querySelectorAll('.filmstrip-track');
  tracks.forEach(function (track) {
    var squares = '';
    for (var i = 0; i < 40; i++) squares += '<span class="filmstrip-square"></span>';
    track.innerHTML = squares;
    createMarquee(track, { direction: 1, speed: 40, pausable: false });
  });
})();

/* Бегущая строка с карточками команды (фрейм 7) */
(function () {
  var track = document.getElementById('teamMarqueeTrack');
  createMarquee(track, { direction: -1, speed: 40, pausable: true });
})();

/* Открытие видео на полный экран по кнопке */
(function () {
  var expandBtn = document.getElementById('videoExpandBtn');
  var previewVideo = document.querySelector('.video-frame-video');
  var modal = document.getElementById('videoModal');
  var dialog = document.querySelector('.video-modal-dialog');
  var modalVideo = document.getElementById('videoModalVideo');
  var closeBtn = document.getElementById('videoModalClose');
  if (!expandBtn || !modal || !modalVideo) return;

  var lastFocused = null;
  var idleTimer = null;
  var IDLE_DELAY = 2500;

  function showChrome() {
    if (dialog) dialog.classList.remove('is-idle');
  }

  function scheduleIdle() {
    clearTimeout(idleTimer);
    if (modalVideo.paused) return;
    idleTimer = setTimeout(function () {
      if (dialog) dialog.classList.add('is-idle');
    }, IDLE_DELAY);
  }

  function handleActivity() {
    showChrome();
    scheduleIdle();
  }

  function handleLeave() {
    clearTimeout(idleTimer);
    if (!modalVideo.paused) {
      if (dialog) dialog.classList.add('is-idle');
    }
  }

  function openModal() {
    lastFocused = document.activeElement;

    if (previewVideo) previewVideo.pause();

    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    showChrome();

    modalVideo.muted = false;
    modalVideo.currentTime = 0;
    var playPromise = modalVideo.play();
    if (playPromise && playPromise.catch) playPromise.catch(function () {});

    closeBtn.focus();
    document.addEventListener('keydown', handleKeydown);
  }

  function closeModal() {
    modalVideo.pause();
    modal.hidden = true;
    document.body.style.overflow = '';
    document.removeEventListener('keydown', handleKeydown);
    clearTimeout(idleTimer);
    showChrome();

    if (previewVideo) {
      var resumePromise = previewVideo.play();
      if (resumePromise && resumePromise.catch) resumePromise.catch(function () {});
    }

    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    if (document.activeElement === expandBtn) expandBtn.blur();
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') closeModal();
  }

  expandBtn.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  if (dialog) {
    dialog.addEventListener('mousemove', handleActivity);
    dialog.addEventListener('mouseenter', handleActivity);
    dialog.addEventListener('mouseleave', handleLeave);
  }
  modalVideo.addEventListener('play', scheduleIdle);
  modalVideo.addEventListener('pause', showChrome);

  document.querySelectorAll('[data-video-modal-close]').forEach(function (el) {
    el.addEventListener('click', closeModal);
  });
})();

/* Форма обратной связи: счётчик символов и отправка */
(function () {
  var form = document.getElementById('contactForm');
  if (!form) return;

  var goalField = document.getElementById('cfGoal');
  var goalCounter = document.getElementById('cfGoalCounter');
  var phoneField = document.getElementById('cfPhone');
  var toast = document.getElementById('contactFormToast');
  var toastTimer = null;

  if (goalField && goalCounter) {
    var maxLength = goalField.getAttribute('maxlength') || 500;

    function updateCounter() {
      goalCounter.textContent = goalField.value.length + '/' + maxLength;
    }

    goalField.addEventListener('input', updateCounter);
    updateCounter();
  }

  /* Телефон: всегда приводим к формату +7 (999) 999-99-99,
     независимо от того, что и как вводит пользователь */
  if (phoneField) {
    function formatPhone(raw) {
      var digits = raw.replace(/\D/g, '');

      if (digits.charAt(0) === '7' || digits.charAt(0) === '8') {
        digits = digits.slice(1);
      }
      digits = digits.slice(0, 10);

      var out = '+7';
      if (digits.length > 0) out += ' (' + digits.slice(0, 3);
      if (digits.length >= 3) out += ')';
      if (digits.length > 3) out += ' ' + digits.slice(3, 6);
      if (digits.length > 6) out += '-' + digits.slice(6, 8);
      if (digits.length > 8) out += '-' + digits.slice(8, 10);

      return out;
    }

    phoneField.addEventListener('focus', function () {
      if (!phoneField.value) phoneField.value = '+7 ';
    });

    phoneField.addEventListener('input', function () {
      phoneField.value = formatPhone(phoneField.value);
    });

    phoneField.addEventListener('blur', function () {
      if (phoneField.value.replace(/\D/g, '') === '7') {
        phoneField.value = '';
      }
    });
  }

  function showToast() {
    if (!toast) return;
    clearTimeout(toastTimer);
    toast.classList.add('is-visible');
    toastTimer = setTimeout(function () {
      toast.classList.remove('is-visible');
    }, 4000);
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    if (!form.reportValidity()) return;

    /* Реальная отправка данных подключается здесь */

    showToast();
    form.reset();
    if (goalCounter) goalCounter.textContent = '0/' + (goalField ? goalField.getAttribute('maxlength') : 500);
  });
})();
