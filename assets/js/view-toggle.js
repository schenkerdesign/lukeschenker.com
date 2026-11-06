// Homepage layout toggle. "Large" is the existing project rows, unchanged. "Compact" is a
// slim list: dates, title, summary and action, then a strip of images. The compact list is built
// from the large rows (copy lives in one place); each row's images come from its data-thumbs attribute. The choice is
// remembered per browser.
document.addEventListener('DOMContentLoaded', function () {
    const buttons = document.querySelectorAll('.view-btn');
    if (!buttons.length) return;

    const column = document.querySelector('.column');
    const compact = document.createElement('div');
    compact.id = 'work-compact';
    compact.className = 'work-compact';

    // Rebuild each section (label + rows) in compact form, in page order
    document.querySelectorAll('.column > .work-section-label').forEach(function (label) {
        compact.appendChild(label.cloneNode(true));
        const list = label.nextElementSibling;
        if (!list || !list.classList.contains('work-list')) return;
        list.querySelectorAll(':scope > .work-row').forEach(function (row) {
            compact.appendChild(buildEntry(row));
        });
    });
    const lastList = [...document.querySelectorAll('.column > .work-list')].pop();
    lastList.after(compact);

    // Desktop (mouse) gets the full-screen image viewer; touch screens follow links instead
    const desktop = window.matchMedia('(hover: hover) and (pointer: fine)');

    function buildEntry(row) {
        const text = row.querySelector('.work-row-text');
        const entry = document.createElement('article');
        entry.className = 'cw-entry';

        // Where this project's text goes: its "Read case study", else its title link (Anew/Uber overview); John Hancock: none
        const cta = text.querySelector(':scope > a.work-row-cta');
        const titleLink = text.querySelector('.work-row-title a');
        const entryHref = (cta && cta.getAttribute('href')) || (titleLink && titleLink.getAttribute('href')) || null;

        // The whole text block (title, dates, summary, action) is one link; hovering anywhere lights up the action
        const block = document.createElement(entryHref ? 'a' : 'div');
        block.className = 'cw-text';
        if (entryHref) block.href = entryHref;

        const head = document.createElement('div');
        head.className = 'cw-head';
        const title = document.createElement('h2');
        title.className = 'cw-title';
        title.textContent = text.querySelector('.work-row-title').textContent;
        head.appendChild(title);
        const dates = text.querySelector('.work-row-eyebrow').cloneNode(true);
        dates.className = 'cw-dates';
        head.appendChild(dates);
        block.appendChild(head);
        const summary = text.querySelector('.work-row-summary').cloneNode(true);
        summary.className = 'cw-summary';
        block.appendChild(summary);
        if (cta) { // as a span inside the block link (no nested links)
            const action = document.createElement('span');
            action.className = 'work-row-cta';
            action.innerHTML = cta.innerHTML;
            block.appendChild(action);
        }
        const note = text.querySelector(':scope > .work-row-note'); // e.g. John Hancock's "Case study not published"
        if (note) block.appendChild(note.cloneNode(true));
        entry.appendChild(block);

        const strip = document.createElement('div');
        strip.className = 'cw-strip';
        let thumbs = [];
        try { thumbs = JSON.parse(row.dataset.thumbs || '[]'); } catch (e) { thumbs = []; }
        thumbs.forEach(function (t) {
            // Screens and stills (SHRP, AI org, John Hancock) open full-screen on desktop; on touch, SHRP and AI org go to
            // the case study. Case-study images (Anew, Uber) always link straight to their case study.
            const href = t.href || (t.zoom ? entryHref : null);
            const item = document.createElement(href ? 'a' : (t.zoom ? 'button' : 'div'));
            item.className = 'cw-thumb';
            if (href) item.href = href;
            if (item.tagName === 'BUTTON') item.type = 'button';
            const media = document.createElement('span');
            media.className = 'cw-thumb-media';
            const img = document.createElement('img');
            img.src = t.src;
            img.alt = t.cap || '';
            img.loading = 'lazy';
            media.appendChild(img);
            if (t.zoom || href) {
                const hover = document.createElement('span');
                hover.className = 'cw-thumb-hover';
                hover.innerHTML = t.zoom
                    ? 'View image <i class="ph-bold ph-arrows-out-simple"></i>'
                    : (t.hover || 'Read case study') + ' <i class="ph-bold ph-arrow-right"></i>';
                media.appendChild(hover);
            }
            item.appendChild(media);
            if (t.zoom) {
                item.addEventListener('click', function (e) {
                    if (!href || desktop.matches) {
                        e.preventDefault();
                        // SHRP's case study has the video demo; the AI org's has the full write-up; John Hancock has none
                        // No arrow on the label: it would point at the X beside it
                        const link = href && (href === '/shrp/'
                            ? { href: href, label: 'View video demo in case study' }
                            : { href: href, label: 'View the full case study' });
                        window.MediaViewer.open({ type: 'image', src: t.full || t.src, alt: img.alt, link: link });
                    }
                });
            }
            if (t.cap) {
                const cap = document.createElement('span');
                cap.className = 'cw-thumb-cap';
                cap.textContent = t.cap;
                item.appendChild(cap);
            }
            if (t.date) { // case-study dates under the title, same type (Anew)
                const date = document.createElement('span');
                date.className = 'cw-thumb-cap cw-thumb-date';
                date.textContent = t.date;
                item.appendChild(date);
            }
            strip.appendChild(item);
        });
        entry.appendChild(strip);
        return entry;
    }

    // The full-screen viewer itself lives in media-viewer.js (shared with the video and PDF links)

    function setView(view) {
        document.body.classList.toggle('view-compact', view === 'compact');
        buttons.forEach(function (b) {
            const on = b.dataset.view === view;
            b.classList.toggle('is-active', on);
            b.setAttribute('aria-pressed', on);
        });
        try { localStorage.setItem('homepage-view', view); } catch (e) {}
    }

    buttons.forEach(function (b) {
        b.addEventListener('click', function () { setView(b.dataset.view); });
    });

    let saved = 'large';
    try { saved = localStorage.getItem('homepage-view') || 'large'; } catch (e) {}
    setView(saved);
});
