// Scroll-linked reveal for the homepage project rows.
// No timers: each row's opacity and offset are a pure function of where it sits in the window, so a fast scroll reveals
// fast and a slow scroll reveals slowly, and nothing ever holds the reader back. A row starts fading in as its top
// crosses the bottom of the window and is fully solid by the time it reaches 60% down the window, so whatever is
// mid-screen is always fully readable for a fast skim.
// The image leads and the text follows slightly behind. Turned off entirely for "reduce motion".
(function () {
    // Switched off. Set to true to bring the reveal back.
    const ENABLED = false;
    if (!ENABLED) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const START = 1.0;   // row top at the bottom edge of the window: fully transparent
    const END = 0.6;     // row top at 60% down the window: fully solid
    const TEXT_LAG = 0.12; // the text block's ramp trails the image's by this share of the ramp
    const RISE = 28;     // px the row rises while fading in

    let parts = [];
    let ticking = false;

    function ease(t) { return 1 - (1 - t) * (1 - t); } // fast then slow

    function progress(top, lag) {
        const vh = window.innerHeight;
        const t = (START * vh - top) / ((START - END) * vh) - lag;
        return Math.min(1, Math.max(0, t / (1 - lag)));
    }

    function update() {
        ticking = false;
        parts.forEach(function (p) {
            const e = ease(progress(p.row.getBoundingClientRect().top, p.lag));
            p.el.style.opacity = e;
            p.el.style.transform = e === 1 ? '' : 'translateY(' + ((1 - e) * RISE).toFixed(1) + 'px)';
        });
    }

    function onScroll() {
        if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }

    document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('.work-row').forEach(function (row) {
            const media = row.querySelector('.work-row-media');
            const text = row.querySelector('.work-row-text');
            if (media) parts.push({ row: row, el: media, lag: 0 });
            if (text) parts.push({ row: row, el: text, lag: TEXT_LAG });
        });
        update();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
    });
})();
