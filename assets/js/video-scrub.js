// Hover controls for header loop videos (Luke 2026-10-26). Add data-scrub to a <video>: while the pointer is over it, a
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
    v.addEventListener('click', function () { toggle(); });
    // touch devices (no hover): a tap shows the controls for 3 s; mouse users rely on :hover only
    var hideT; v.addEventListener('pointerup', function (e) { if (e.pointerType !== 'mouse') { wrap.classList.add('show-scrub'); clearTimeout(hideT); hideT = setTimeout(function () { wrap.classList.remove('show-scrub'); }, 3000); } });
  }
  document.querySelectorAll('video[data-scrub]').forEach(attach);
  window.attachVideoScrub = attach;
})();
