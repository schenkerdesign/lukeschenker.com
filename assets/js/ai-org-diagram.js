// AI-org case study: the session diagram's interactivity.
// 1) Letters: hover a bubble or a diagram part to light that part; click to hold it (its section also moves
//    to the top, right under the diagram).
//    A held highlight stays until you click it again, click another part, or click anywhere else.
//    Clicking a bubble also scrolls the diagram into view if it's off screen.
// 2) Pan box: when the window is too narrow for the diagram's minimum readable width, the diagram
//    sits in an outlined box you can drag (mouse) or swipe (touch) to explore.
document.addEventListener('DOMContentLoaded', () => {
    const svg = document.querySelector('.session-diagram');
    if (!svg) return;
    const wrap = document.getElementById('session-diagram');
    const markers = document.querySelectorAll('.letter-marker');
    let held = null;

    const show = letter => {
        if (letter) svg.dataset.focus = letter; else delete svg.dataset.focus;
        markers.forEach(m => m.classList.toggle('active', m.dataset.letter === letter));
    };
    // The held part's section moves to the top, right under the diagram (FLIP animation so it visibly slides)
    const sections = [...document.querySelectorAll('.part-section')];
    const reorder = letter => {
        const before = new Map(sections.map(sec => [sec, sec.getBoundingClientRect().top]));
        sections.forEach(sec => sec.classList.toggle('is-first', sec.dataset.part === letter));
        sections.forEach(sec => {
            const dy = before.get(sec) - sec.getBoundingClientRect().top;
            if (!dy) return;
            sec.animate([{ transform: `translateY(${dy}px)` }, { transform: 'translateY(0)' }], { duration: 350, easing: 'ease-out' });
        });
    };
    const hold = letter => { held = (held === letter) ? null : letter; show(held); reorder(held); };

    markers.forEach(m => {
        m.addEventListener('mouseenter', () => show(m.dataset.letter));
        m.addEventListener('mouseleave', () => show(held));
        m.addEventListener('click', e => {
            e.stopPropagation();
            hold(m.dataset.letter);
            const r = wrap.getBoundingClientRect();
            if (held && (r.top < 0 || r.bottom > window.innerHeight)) wrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    });

    let dragged = false;
    svg.querySelectorAll('[data-part]').forEach(el => {
        el.addEventListener('mouseenter', () => show(el.dataset.part));
        el.addEventListener('mouseleave', () => show(held));
        el.addEventListener('click', e => { e.stopPropagation(); if (!dragged) hold(el.dataset.part); });
    });

    // Click anywhere else (or press Escape) to show the whole diagram again
    document.addEventListener('click', () => { if (!dragged && held) { held = null; show(null); reorder(null); } });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { held = null; show(null); reorder(null); } });

    // Pan box (every diagram on the page)
    document.querySelectorAll('.diagram-wrap').forEach(box => {
        const scroller = box.querySelector('.diagram-scroll');
        const update = () => box.classList.toggle('is-pannable', scroller.scrollWidth > scroller.clientWidth + 1);
        new ResizeObserver(update).observe(scroller);
        update();

        let startX = 0, startScroll = 0, down = false;
        scroller.addEventListener('pointerdown', e => {
            if (e.pointerType !== 'mouse' || !box.classList.contains('is-pannable')) return; // touch pans natively
            down = true; dragged = false; startX = e.clientX; startScroll = scroller.scrollLeft;
            scroller.classList.add('dragging');
        });
        window.addEventListener('pointermove', e => {
            if (!down) return;
            const dx = e.clientX - startX;
            if (Math.abs(dx) > 4) dragged = true;
            scroller.scrollLeft = startScroll - dx;
        });
        window.addEventListener('pointerup', () => {
            if (!down) return;
            down = false; scroller.classList.remove('dragging');
            setTimeout(() => { dragged = false; }, 0); // let the click after a drag see `dragged`
        });
    });
});
