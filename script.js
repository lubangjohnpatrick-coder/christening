(function () {
  'use strict';

  /* ========== CONFIG ==========
     Two ways to collect guest confirmations:

     1) GOOGLE FORM (easiest, recommended):
        - Run setup.gs once (follow its header instructions).
        - Paste the EMBED URL it prints into formUrl below.
        - The invitation's RSVP window will then show the Google
          Form itself, and every answer saves to your spreadsheet.

     2) APPS SCRIPT WEB APP (custom form):
        - Paste the web app URL from Extensions > Apps Script >
          Deploy > Web app into scriptUrl below.

     Leave both blank to keep the built-in form (guests see a
     "not connected" note until one is configured). */
  var CONFIG = {
    formUrl: 'https://docs.google.com/forms/d/e/1Eq6BglWI8FDb8IpabYKt5h3VuU5zfARG0_yxIkNH5OU/viewform?embedded=true',
    scriptUrl: ''
  };

  function rsvpConnected() {
    return typeof CONFIG.scriptUrl === 'string' &&
      CONFIG.scriptUrl.indexOf('PASTE_') !== 0 &&
      CONFIG.scriptUrl.length > 8;
  }

  function useEmbeddedForm() {
    return typeof CONFIG.formUrl === 'string' &&
      CONFIG.formUrl.indexOf('docs.google.com/forms') !== -1;
  }

  /* ========== Cover / pre-invitation ========== */
  var cover = document.getElementById('cover');
  if (cover) {
    document.body.style.overflow = 'hidden';

    function openCover() {
      if (cover.classList.contains('opening')) return;
      cover.classList.add('opening');
      window.setTimeout(function () {
        cover.classList.add('gone');
        document.body.classList.add('revealed');
        document.body.style.overflow = '';
      }, 700);
    }

    cover.addEventListener('pointerdown', openCover);
    cover.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); openCover(); }
    });
  }

  /* ========== Countdown ========== */
  var targetDate = new Date('2026-09-19T10:00:00').getTime();
  var cdEl = document.getElementById('countdown');
  var timerId = null;

  function buildLabel(days, hours, minutes, seconds) {
    var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
    return 'Counting down ' +
      '<span class="unit">' + days + '</span> days ' +
      '<span class="unit">' + pad(hours) + '</span> hrs ' +
      '<span class="unit">' + pad(minutes) + '</span> min ' +
      '<span class="unit">' + pad(seconds) + '</span> sec';
  }

  function render() {
    var diff = targetDate - Date.now();
    if (diff <= 0) {
      cdEl.classList.add('hidden');
      if (timerId) window.clearInterval(timerId);
      return;
    }
    var days = Math.floor(diff / 86400000);
    var hours = Math.floor((diff % 86400000) / 3600000);
    var minutes = Math.floor((diff % 3600000) / 60000);
    var seconds = Math.floor((diff % 60000) / 1000);
    cdEl.innerHTML = buildLabel(days, hours, minutes, seconds);
  }

  if (cdEl) {
    render();
    timerId = window.setInterval(render, 1000);
  }

  /* ========== RSVP ========== */
  var rsvpBtn = document.getElementById('rsvp-btn');
  var rsvpOverlay = document.getElementById('rsvp-overlay');
  var rsvpClose = document.getElementById('rsvp-close');
  var form = document.getElementById('rsvp-form');
  var statusEl = document.getElementById('rsvp-status');
  var submitBtn = document.getElementById('rsvp-submit');
  var guestCountField = document.getElementById('guest-count-field');
  var companionsField = document.getElementById('companions-field');
  var gformWrap = document.getElementById('gform-wrap');
  var gformIframe = document.getElementById('gform-iframe');
  var rsvpCustom = document.getElementById('rsvp-custom');

  /* If a Google Form link is configured, show it instead of the built-in form. */
  if (useEmbeddedForm() && gformWrap && gformIframe && rsvpCustom) {
    rsvpCustom.hidden = true;
    gformWrap.hidden = false;
    gformIframe.src = CONFIG.formUrl;
  }

  function openRsvp() {
    rsvpOverlay.hidden = false;
    document.body.style.overflow = 'hidden';
    var first = document.getElementById('guest-name');
    if (first) first.focus();
  }

  function closeRsvp() {
    rsvpOverlay.hidden = true;
    document.body.style.overflow = '';
    setStatus('', '');
  }

  if (rsvpBtn && rsvpOverlay) {
    rsvpBtn.addEventListener('click', openRsvp);
  }
  if (rsvpClose) {
    rsvpClose.addEventListener('click', closeRsvp);
  }
  if (rsvpOverlay) {
    rsvpOverlay.addEventListener('click', function (ev) {
      if (ev.target === rsvpOverlay) closeRsvp();
    });
  }
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && rsvpOverlay && !rsvpOverlay.hidden) closeRsvp();
  });

  function setStatus(msg, kind) {
    statusEl.textContent = msg;
    statusEl.className = 'rsvp-status' + (kind ? ' ' + kind : '');
  }

  var attendRadios = form.querySelectorAll('input[name="attend"]');
  function syncAttendFields() {
    var attending = form.querySelector('input[name="attend"]:checked').value === 'Will Attend';
    guestCountField.classList.toggle('disabled', !attending);
    companionsField.classList.toggle('disabled', !attending);
    var inputs = [].slice.call(guestCountField.querySelectorAll('select'))
      .concat([].slice.call(companionsField.querySelectorAll('input, textarea')));
    inputs.forEach(function (el) { el.disabled = !attending; });
  }

  attendRadios.forEach(function (radio) {
    radio.addEventListener('change', syncAttendFields);
  });
  syncAttendFields();

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();

    var name = document.getElementById('guest-name').value.trim();
    if (!name) {
      setStatus('Please enter your full name.', 'error');
      return;
    }

    var attending = form.querySelector('input[name="attend"]:checked').value === 'Will Attend';
    var payload = {
      name: name,
      phone: document.getElementById('guest-phone').value.trim(),
      attend: form.querySelector('input[name="attend"]:checked').value,
      guestCount: attending
        ? document.getElementById('guest-count').value
        : 0,
      companions: attending ? document.getElementById('guest-companions').value.trim() : ''
    };

    setStatus('Sending your confirmation...', 'sending');
    submitBtn.disabled = true;

    if (!rsvpConnected()) {
      submitBtn.disabled = false;
      setStatus('RSVP service is not connected yet. Please contact the host.', 'error');
      return;
    }

    fetch(CONFIG.scriptUrl, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
      .then(function (res) { return res.text(); })
      .then(function (text) {
        submitBtn.disabled = false;
        var data = null;
        try { data = JSON.parse(text); } catch (e) { /* ignore */ }
        if (data && data.success) {
          setStatus('Thank you! Your confirmation has been received.', 'success');
          form.reset();
          syncAttendFields();
        } else {
          setStatus('Something went wrong on our side. Please try again.', 'error');
        }
      })
      .catch(function () {
        submitBtn.disabled = false;
        setStatus('Network error. Please check your connection and try again.', 'error');
      });
  });

  /* ========== Background music (Web Audio) ========== */
  /* Generates a gentle looping melody in the browser itself.
     No external files or YouTube needed — fully offline. */
  var AudioCtxClass = window.AudioContext || window.webkitAudioContext;
  var ctx = null;
  var master = null;
  var filter = null;
  var musicEvents = [];
  var evIndex = 0;
  var nextTime = 0;
  var scheduler = null;
  var soundOn = false;
  var isPlaying = false;
  var unlocked = false;
  var musicBar = document.getElementById('music-bar');
  var musicToggle = document.getElementById('music-toggle');
  var musicSound = document.getElementById('music-sound');
  var musicIcon = document.getElementById('music-icon');
  var musicLabel = document.getElementById('music-label');
  var hintEl = document.getElementById('music-hint');
  var bpm = 112;
  var spb = 60 / bpm;

  function midiToFreq(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  /* 16 bars of 4 beats each (64 beats = one loop)
     Upbeat, bouncy party tune inspired by the Po Pow Pay vibe. */
  var melody = [
    [67, 0.5], [69, 0.5], [72, 1], [76, 1], [74, 0.5], [72, 0.5],
    [74, 0.5], [72, 0.5], [69, 2], [67, 1],
    [67, 0.5], [69, 0.5], [72, 1], [76, 1], [79, 0.5], [76, 0.5],
    [74, 0.5], [72, 0.5], [69, 2], [67, 1],
    [64, 0.5], [67, 0.5], [72, 1], [74, 1], [76, 0.5], [74, 0.5],
    [74, 0.5], [72, 0.5], [69, 1], [67, 1], [64, 0.5], [67, 0.5],
    [69, 0.5], [71, 0.5], [74, 2], [72, 1],
    [67, 3], [60, 1],
    [67, 0.5], [69, 0.5], [72, 1], [76, 1], [74, 0.5], [72, 0.5],
    [74, 0.5], [72, 0.5], [69, 2], [67, 1],
    [67, 0.5], [69, 0.5], [72, 1], [76, 1], [79, 0.5], [76, 0.5],
    [74, 0.5], [72, 0.5], [69, 2], [67, 1],
    [64, 0.5], [67, 0.5], [72, 1], [74, 1], [76, 0.5], [74, 0.5],
    [74, 0.5], [72, 0.5], [69, 1], [67, 1], [64, 0.5], [67, 0.5],
    [69, 0.5], [71, 0.5], [74, 2], [72, 1],
    [72, 3], [60, 1]
  ];
  /* one root note per bar (C, G, Am, F pattern), fifth comes with it */
  var bass = [
    48, 43, 45, 41,
    48, 43, 45, 43,
    48, 43, 45, 41,
    48, 43, 45, 48
  ];

  function buildEvents() {
    var ev = [];
    var beat = 0;
    var bassIdx = 0;
    melody.forEach(function (n) {
      if (bassIdx < bass.length && beat >= bassIdx * 4) {
        var root = bass[bassIdx];
        ev.push({ t: beat, freq: midiToFreq(root), dur: 2 * spb, type: 'bass' });
        ev.push({ t: beat + 2 * spb, freq: midiToFreq(root + 7), dur: 2 * spb, type: 'bass' });
        bassIdx++;
      }
      if (n[0]) ev.push({ t: beat, freq: midiToFreq(n[0]), dur: n[1] * spb, type: 'mel' });
      beat += n[1];
    });
    return ev;
  }

  function ensureCtx() {
    if (ctx) return true;
    if (!AudioCtxClass) return false;
    ctx = new AudioCtxClass();
    master = ctx.createGain();
    master.gain.value = 0.0001;
    filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2400;
    var comp = ctx.createDynamicsCompressor();
    filter.connect(comp);
    comp.connect(master);
    master.connect(ctx.destination);
    musicEvents = buildEvents();
    evIndex = 0;
    return true;
  }

  function scheduleEvent(ev, t) {
    var peak = ev.type === 'bass' ? 0.12 : 0.16;
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = ev.type === 'bass' ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(ev.freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + ev.dur);
    osc.connect(g);
    g.connect(filter);
    osc.start(t);
    osc.stop(t + ev.dur + 0.05);

    if (ev.type === 'mel') {
      var sparkle = ctx.createOscillator();
      var g2 = ctx.createGain();
      sparkle.type = 'sine';
      sparkle.frequency.setValueAtTime(ev.freq * 2, t);
      g2.gain.setValueAtTime(0.0001, t);
      g2.gain.linearRampToValueAtTime(0.04, t + 0.02);
      g2.gain.exponentialRampToValueAtTime(0.0001, t + ev.dur);
      sparkle.connect(g2);
      g2.connect(filter);
      sparkle.start(t);
      sparkle.stop(t + ev.dur + 0.05);
    }
  }

  function tick() {
    if (!ctx) return;
    var horizon = ctx.currentTime + 0.4;
    while (nextTime < horizon) {
      if (evIndex >= musicEvents.length) { evIndex = 0; nextTime += 0.15; }
      scheduleEvent(musicEvents[evIndex], nextTime);
      nextTime += musicEvents[evIndex].dur;
      evIndex++;
    }
  }

  function startMusic() {
    if (!ensureCtx()) {
      if (musicBar) musicBar.classList.add('hidden');
      return false;
    }
    if (ctx.state === 'suspended') {
      ctx.resume().then(function () {
        if (unlocked && isPlaying) setSoundUi(true);
      }).catch(function () { /* ignore */ });
    }
    if (!scheduler) {
      nextTime = ctx.currentTime + 0.15;
      evIndex = 0;
      scheduler = window.setInterval(tick, 90);
    }
    tick();
    isPlaying = true;
    setPlayUi(true);
    return true;
  }

  function pauseMusic() {
    isPlaying = false;
    setPlayUi(false);
    if (scheduler) { window.clearInterval(scheduler); scheduler = null; }
    if (ctx && ctx.state === 'running') ctx.suspend().catch(function () { /* ignore */ });
  }

  function setPlayUi(playing) {
    if (!musicToggle) return;
    musicToggle.classList.toggle('playing', playing);
    musicToggle.setAttribute('aria-pressed', playing ? 'true' : 'false');
    musicIcon.innerHTML = playing ? '&#9835;' : '&#9834;';
    musicLabel.textContent = playing ? 'Pause' : 'Play';
  }

  function setSoundUi(on) {
    soundOn = on;
    if (master) {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(on ? 0.9 : 0.0001, ctx.currentTime, 0.05);
    }
    if (musicSound) {
      musicSound.classList.toggle('muted', !on);
      musicSound.setAttribute('aria-label', on ? 'Mute music' : 'Unmute music');
    }
    if (hintEl) {
      hintEl.classList.toggle('hidden', on);
      hintEl.textContent = unlocked ? 'Muted' : 'Tap for sound';
    }
  }

  function unlockSound() {
    if (unlocked || !ctx) return;
    unlocked = true;
    if (ctx.state === 'suspended' && isPlaying) {
      ctx.resume().then(function () { setSoundUi(true); }).catch(function () { /* ignore */ });
    } else {
      setSoundUi(true);
    }
  }

  if (musicToggle) {
    musicToggle.addEventListener('click', function () {
      if (isPlaying) { pauseMusic(); } else { startMusic(); }
    });
  }

  if (musicSound) {
    musicSound.addEventListener('click', function () {
      if (!ctx) return;
      if (soundOn) { setSoundUi(false); } else { setSoundUi(true); }
    });
  }

  /* Try to autoplay (browsers will hold the sound until first tap) */
  if (startMusic()) {
    document.addEventListener('pointerdown', unlockSound, { once: true });
    document.addEventListener('touchstart', unlockSound, { once: true });
    document.addEventListener('keydown', unlockSound, { once: true });
  }
})();