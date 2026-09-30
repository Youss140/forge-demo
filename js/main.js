(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- header : fond solide dès qu'on quitte le haut de page ---- */
  var header = document.getElementById('header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-stuck', window.scrollY > 24);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---- menu mobile ---- */
  var burger = document.getElementById('burger');
  var mobileNav = document.getElementById('mobile-nav');
  if (burger && mobileNav) {
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!open));
      burger.setAttribute('aria-label', open ? 'Ouvrir le menu' : 'Fermer le menu');
      mobileNav.classList.toggle('is-open', !open);
    });
    mobileNav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        burger.setAttribute('aria-expanded', 'false');
        mobileNav.classList.remove('is-open');
      }
    });
  }

  /* ---- apparition au scroll ---- */
  var reveals = document.querySelectorAll('.reveal');
  if (reduced || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(reveals, function (el) { el.classList.add('is-in'); });
  } else {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          revealObs.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    Array.prototype.forEach.call(reveals, function (el) { revealObs.observe(el); });
  }

  /* ---- compteurs de la bande de chiffres ---- */
  var counters = document.querySelectorAll('[data-count]');
  var runCounter = function (el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduced) { el.textContent = target + suffix; return; }
    var start = performance.now();
    var dur = 1100;
    var step = function (now) {
      var p = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if (counters.length) {
    if (!('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(counters, runCounter);
    } else {
      var countObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            runCounter(entry.target);
            countObs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.4 });
      Array.prototype.forEach.call(counters, function (el) { countObs.observe(el); });
    }
  }

  /* ---- timeline de la méthode : ligne qui se remplit + phase active ---- */
  var method = document.getElementById('method');
  var fill = document.getElementById('method-fill');
  if (method && fill) {
    var phases = method.querySelectorAll('.phase');
    var updateMethod = function () {
      var rect = method.getBoundingClientRect();
      var anchor = window.innerHeight * 0.52;
      var travelled = anchor - rect.top;
      var ratio = Math.max(0, Math.min(travelled / rect.height, 1));
      fill.style.height = (ratio * (rect.height - 16)) + 'px';

      Array.prototype.forEach.call(phases, function (p) {
        var pr = p.getBoundingClientRect();
        p.classList.toggle('is-on', pr.top < anchor && pr.bottom > 0);
      });
    };
    updateMethod();
    window.addEventListener('scroll', updateMethod, { passive: true });
    window.addEventListener('resize', updateMethod);
  }

  /* ---- sélecteur de programme (3 questions -> recommandation) ---- */
  var finder = document.getElementById('finder');
  if (finder) {
    var steps = finder.querySelectorAll('.finder-step');
    var bars = finder.querySelectorAll('.finder-progress i');
    var result = finder.querySelector('.finder-result');
    var score = { socle: 0, charge: 0, pic: 0 };
    var current = 0;

    var plans = {
      socle: {
        name: 'Socle',
        price: '159 € / mois',
        why: "Une séance encadrée par semaine pour poser la technique, plus un programme écrit à suivre en autonomie. C'est le format qui demande le moins de temps et qui suffit largement pour démarrer proprement.",
        href: 'programmes.html#socle'
      },
      charge: {
        name: 'Charge',
        price: '269 € / mois',
        why: "Deux séances encadrées par semaine, le rythme qui débloque le plus de situations : assez fréquent pour progresser vite, assez souple pour tenir sur la durée avec un emploi du temps chargé.",
        href: 'programmes.html#charge'
      },
      pic: {
        name: 'Pic',
        price: '379 € / mois',
        why: "Trois séances par semaine et un plan nutrition, parce qu'une échéance datée demande de piloter aussi la récupération et l'alimentation, pas seulement l'entraînement.",
        href: 'programmes.html#pic'
      }
    };

    var showStep = function (i) {
      Array.prototype.forEach.call(steps, function (s, idx) {
        s.classList.toggle('is-active', idx === i);
      });
      Array.prototype.forEach.call(bars, function (b, idx) {
        b.classList.toggle('is-done', idx <= i);
      });
    };

    var finish = function () {
      var best = 'charge';
      var bestScore = -1;
      Object.keys(score).forEach(function (k) {
        if (score[k] > bestScore) { bestScore = score[k]; best = k; }
      });
      var plan = plans[best];
      Array.prototype.forEach.call(steps, function (s) { s.classList.remove('is-active'); });
      Array.prototype.forEach.call(bars, function (b) { b.classList.add('is-done'); });
      result.querySelector('.res-name').textContent = plan.name;
      result.querySelector('.res-price').textContent = plan.price;
      result.querySelector('.res-why').textContent = plan.why;
      result.querySelector('.res-link').setAttribute('href', plan.href);
      result.classList.add('is-active');
    };

    finder.addEventListener('click', function (e) {
      var opt = e.target.closest('.finder-opt');
      if (opt) {
        var weights = (opt.getAttribute('data-score') || '').split(',');
        weights.forEach(function (w) {
          var parts = w.split(':');
          if (parts.length === 2 && score.hasOwnProperty(parts[0])) {
            score[parts[0]] += parseInt(parts[1], 10) || 0;
          }
        });
        current++;
        if (current < steps.length) showStep(current);
        else finish();
        return;
      }
      if (e.target.closest('.finder-restart')) {
        score = { socle: 0, charge: 0, pic: 0 };
        current = 0;
        result.classList.remove('is-active');
        Array.prototype.forEach.call(bars, function (b) { b.classList.remove('is-done'); });
        showStep(0);
      }
    });
  }

  /* ---- FAQ ---- */
  var faqButtons = document.querySelectorAll('.faq-q');
  Array.prototype.forEach.call(faqButtons, function (btn) {
    btn.addEventListener('click', function () {
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      panel.style.maxHeight = open ? null : panel.scrollHeight + 'px';
    });
  });

  /* ---- formulaire de contact ---- */
  var form = document.getElementById('contact-form');
  if (form) {
    var showError = function (field, msg) {
      field.classList.add('has-error');
      field.querySelector('.err').textContent = msg;
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      Array.prototype.forEach.call(form.querySelectorAll('.field'), function (f) {
        f.classList.remove('has-error');
      });

      var nom = form.querySelector('#nom');
      if (!nom.value.trim()) { showError(nom.closest('.field'), 'Indique ton prénom.'); ok = false; }

      var email = form.querySelector('#email');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
        showError(email.closest('.field'), 'Adresse e-mail invalide.');
        ok = false;
      }

      var objectif = form.querySelector('#objectif');
      if (!objectif.value) { showError(objectif.closest('.field'), 'Choisis un objectif.'); ok = false; }

      if (!ok) {
        form.querySelector('.has-error input, .has-error select, .has-error textarea').focus();
        return;
      }

      var box = document.getElementById('form-ok');
      form.reset();
      box.classList.add('is-on');
      box.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    });
  }
})();
