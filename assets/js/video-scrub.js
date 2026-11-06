// Hover controls for header loop videos. Add data-scrub to a <video>: while the pointer is over it, a
// play/pause button + scrub bar show along the bottom; click/drag the bar seeks; clicking the video toggles play/pause.
// window.attachVideoScrub(video) adds the same controls to a video created later (the password gate builds its
// video in script, 2026-10-28).
(function () {
  function attach(v) {
    var wrap = document.createElement('div'); wrap.className = 'video-scrub';
    v.parentNode.insertBefore(wrap, v); wrap.appendChild(v);
    var bar = document.createElement('div'); bar.className = 'video-scrub-bar';
    bar.innerHTML = '<button class="video-scrub-play" type="button" aria-label="Pause"><i class="ph-fill ph-pause"></i></button><div class="video-scrub-track"><div class="video-scrub-fill"></div><div class="video-scrub-knob"></div></div>';
    wrap.appendChild(bar);
    var fill = bar.querySelector('.video-scrub-fill'), knob = bar.querySelector('.video-scrub-knob'), track = bar.querySelector('.video-scrub-track');
    var btn = bar.querySelector('.video-scrub-play'), ico = btn.querySelector('i');
    var dragging = false, wasPlaying = false;
    function syncBtn() { var p = v.paused; ico.className = 'ph-fill ' + (p ? 'ph-play' : 'ph-pause'); btn.setAttribute('aria-label', p ? 'Play' : 'Pause'); }
    function toggle() { if (v.paused) v.play(); else v.pause(); }
    // data-center-controls: replay + play/pause as two circles in the middle of the video, shown on hover
    // or tap. They replace the small play button in the bar; the scrub track stays.
    var cIco = null;
    if (v.hasAttribute('data-center-controls')) {
      wrap.classList.add('has-center-controls');
      var c = document.createElement('div'); c.className = 'video-center-controls';
      c.innerHTML = '<button class="video-center-btn" type="button" aria-label="Replay from the beginning"><i class="ph-bold ph-arrow-counter-clockwise"></i></button><button class="video-center-btn" type="button" aria-label="Pause"><i class="ph-fill ph-pause"></i></button>';
      wrap.appendChild(c);
      var cBtns = c.querySelectorAll('button'); cIco = cBtns[1].querySelector('i');
      // Replay gets out of the way: controls stay hidden until the pointer leaves and comes back.
      // e.detail is 0 for a keyboard press, so keyboard users keep the controls they're on.
      cBtns[0].addEventListener('click', function (e) { e.stopPropagation(); v.currentTime = 0; v.play(); if (e.detail > 0) { wrap.classList.add('controls-dismissed'); wrap.classList.remove('show-scrub'); } });
      wrap.addEventListener('pointerleave', function () { wrap.classList.remove('controls-dismissed'); });
      cBtns[1].addEventListener('click', function (e) { e.stopPropagation(); var wasIdle = wrap.classList.contains('is-idle'); toggle(); if (wasIdle) goFull(); });
      v.addEventListener('play', function () { cIco.className = 'ph-fill ph-pause'; cBtns[1].setAttribute('aria-label', 'Pause'); });
      v.addEventListener('pause', function () { cIco.className = 'ph-fill ph-play'; cBtns[1].setAttribute('aria-label', 'Play'); });
      if (v.paused) { cIco.className = 'ph-fill ph-play'; cBtns[1].setAttribute('aria-label', 'Play'); }
    }
    v.addEventListener('play', syncBtn); v.addEventListener('pause', syncBtn); syncBtn();
    btn.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    btn.addEventListener('click', function (e) { e.stopPropagation(); toggle(); });
    function draw() { var p = v.duration ? v.currentTime / v.duration : 0; fill.style.width = (p * 100) + '%'; knob.style.left = (p * 100) + '%'; }
    (function tick() { if (!dragging) draw(); requestAnimationFrame(tick); })();
    function seekTo(e) { var r = track.getBoundingClientRect(); var p = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)); if (v.duration) v.currentTime = p * v.duration; draw(); }
    track.addEventListener('pointerdown', function (e) { dragging = true; wasPlaying = !v.paused; v.pause(); track.setPointerCapture(e.pointerId); seekTo(e); wrap.classList.add('is-scrubbing'); });
    track.addEventListener('pointermove', function (e) { if (dragging) seekTo(e); });
    function end(e) { if (!dragging) return; dragging = false; wrap.classList.remove('is-scrubbing'); if (wasPlaying) v.play(); }
    track.addEventListener('pointerup', end); track.addEventListener('pointercancel', end);
    // With center controls, a tap on a touch screen only reveals them; a mouse click still toggles.
    var lastPointer = 'mouse'; wrap.addEventListener('pointerdown', function (e) { lastPointer = e.pointerType; }, true);
    v.addEventListener('click', function () {
      wrap.classList.remove('controls-dismissed');
      var idle = wrap.classList.contains('is-idle');
      if (cIco && lastPointer !== 'mouse' && !idle) return;
      toggle(); if (idle) goFull();
    });
    // data-touch-fullscreen: on a phone, starting the video opens it full screen, where the screens are readable.
    function goFull() {
      if (!v.hasAttribute('data-touch-fullscreen') || lastPointer === 'mouse' || window.innerWidth > 700) return;
      try {
        var f = v.requestFullscreen || v.webkitRequestFullscreen;
        if (f) { var p = f.call(v); if (p && p.catch) p.catch(function () {}); }
        else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();
      } catch (e) {}
    }
    // data-click-to-play: waits on its still with a play circle, only one such video plays at a time,
    // controls stay up while paused, and it returns to the still when it ends.
    if (v.hasAttribute('data-click-to-play')) {
      wrap.classList.add('is-idle');
      v.addEventListener('play', function () {
        wrap.classList.remove('is-idle', 'is-paused');
        document.querySelectorAll('video[data-click-to-play]').forEach(function (o) { if (o !== v && !o.paused) o.pause(); });
      });
      v.addEventListener('pause', function () { if (!v.ended) wrap.classList.add('is-paused'); });
      v.addEventListener('ended', function () { wrap.classList.remove('is-paused'); wrap.classList.add('is-idle'); v.load(); });
      // An optional [data-play-btn] in the same figure starts it; shown only while the video waits on its still.
      var fig = wrap.closest('figure'), pb = fig && fig.querySelector('[data-play-btn]');
      if (pb) {
        pb.addEventListener('pointerdown', function (e) { lastPointer = e.pointerType; });
        pb.addEventListener('click', function () { v.play(); goFull(); });
        var syncPb = function () { pb.style.visibility = wrap.classList.contains('is-idle') ? 'visible' : 'hidden'; };
        v.addEventListener('play', syncPb); v.addEventListener('ended', syncPb); syncPb();
      }
    }
    // touch devices (no hover): a tap shows the controls for 3 s; mouse users rely on :hover only
    var hideT; v.addEventListener('pointerup', function (e) { if (e.pointerType !== 'mouse') { wrap.classList.add('show-scrub'); clearTimeout(hideT); hideT = setTimeout(function () { wrap.classList.remove('show-scrub'); }, 3000); } });
  }
  document.querySelectorAll('video[data-scrub]').forEach(attach);

  // data-play-in-view: the video waits at its first frame and starts from the beginning just before it
  // reaches the screen, so the reader never sees it start late or jump. Give it its real first frame as the poster. It
  // pauses once fully off screen and resumes where it was on return. If the reader paused it, scrolling never restarts it.
  document.querySelectorAll('video[data-play-in-view]').forEach(function (v) {
    var ours = false, userPaused = false;
    v.addEventListener('pause', function () { if (!ours) userPaused = true; ours = false; });
    v.addEventListener('play', function () { userPaused = false; });
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          if (v.paused && !userPaused) { var p = v.play(); if (p) p.catch(function () {}); }
        } else if (!v.paused) { ours = true; v.pause(); }
      });
    }, { rootMargin: '0px 0px 100px 0px', threshold: 0 }).observe(v);
  });
  window.attachVideoScrub = attach;
})();
