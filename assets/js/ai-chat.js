// AI chat case study: the pan box for its wide diagrams. Same behaviour as the AI-org page's diagrams:
// when the window is narrower than a diagram's minimum readable width, the diagram sits in an outlined box
// that can be dragged with the mouse or swiped on touch.
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.diagram-wrap').forEach(box => {
        const scroller = box.querySelector('.diagram-scroll');
        if (!scroller) return;
        const update = () => box.classList.toggle('is-pannable', scroller.scrollWidth > scroller.clientWidth + 1);
        new ResizeObserver(update).observe(scroller);
        update();

        let startX = 0, startScroll = 0, down = false;
        scroller.addEventListener('pointerdown', e => {
            if (e.pointerType !== 'mouse' || !box.classList.contains('is-pannable')) return; // touch pans natively
            down = true; startX = e.clientX; startScroll = scroller.scrollLeft;
            scroller.classList.add('dragging');
        });
        window.addEventListener('pointermove', e => {
            if (!down) return;
            scroller.scrollLeft = startScroll - (e.clientX - startX);
        });
        window.addEventListener('pointerup', () => {
            if (!down) return;
            down = false; scroller.classList.remove('dragging');
        });
    });
});
