// Foldable summary rows. When .cs-top has .is-foldable, each row's bullets open on a click anywhere in the row.
(function () {
    const top = document.querySelector('.cs-top');
    if (!top) return;
    const beats = [...top.querySelectorAll('.cs-beat')];
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)');
    const running = new WeakMap();
    // Height, gap and fade animate together, and the rows below slide with it. A click mid-way turns around from where it is.
    function flip(beat) {
        const list = beat.querySelector('.cs-list');
        const open = beat.dataset.fold !== 'open';
        beat.dataset.fold = open ? 'open' : 'closed';
        beat.querySelector('.cs-head').setAttribute('aria-expanded', String(open));
        // Measured before the row is shown, so a closed row starts from nothing
        const from = list.getBoundingClientRect().height;
        const start = from ? getComputedStyle(list) : null;
        const fromGap = start ? parseFloat(start.marginTop) : 0;
        const fromFade = start ? parseFloat(start.opacity) : 0;
        if (running.has(list)) running.get(list).cancel();
        beat.classList.add('is-open');
        if (calm.matches) {
            beat.classList.toggle('is-open', open);
            return;
        }
        const motion = list.animate(
            [
                { height: from + 'px', marginTop: fromGap + 'px', opacity: fromFade, overflow: 'hidden' },
                { height: (open ? list.scrollHeight : 0) + 'px', marginTop: (open ? 8 : 0) + 'px', opacity: open ? 1 : 0, overflow: 'hidden' }
            ],
            { duration: open ? 280 : 220, easing: 'cubic-bezier(0.2, 0, 0, 1)' }
        );
        running.set(list, motion);
        motion.onfinish = function () {
            running.delete(list);
            beat.classList.toggle('is-open', open);
        };
    }
    function sync() {
        const foldable = top.classList.contains('is-foldable');
        beats.forEach(function (beat) {
            const head = beat.querySelector('.cs-head');
            if (foldable) {
                head.setAttribute('role', 'button');
                head.setAttribute('tabindex', '0');
                head.setAttribute('aria-expanded', String(beat.classList.contains('is-open')));
            } else {
                head.removeAttribute('role');
                head.removeAttribute('tabindex');
                head.removeAttribute('aria-expanded');
            }
        });
    }
    beats.forEach(function (beat) {
        const head = beat.querySelector('.cs-head');
        const icon = document.createElement('i');
        icon.className = 'ph ph-caret-down cs-fold-icon';
        icon.setAttribute('aria-hidden', 'true');
        head.appendChild(icon);
        beat.addEventListener('click', function (e) {
            if (top.classList.contains('is-foldable') && !e.target.closest('.cs-list')) flip(beat);
        });
        head.addEventListener('keydown', function (e) {
            if (top.classList.contains('is-foldable') && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); flip(beat); }
        });
    });
    new MutationObserver(sync).observe(top, { attributes: true, attributeFilter: ['class'] });
    sync();
})();
