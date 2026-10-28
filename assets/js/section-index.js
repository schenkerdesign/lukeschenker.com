// Section index for the case studies (portfolio go-live, 2026-10-27; spec in the go-live build handoff, §3).
// Purpose [Luke]: "If you skim the index, you can kind of get an idea of what the entire story here is."
//
// Built from the page's own headings at load, so it never drifts from the content:
//   "Summary" first, jumping to just below the title and meta row [Luke 2026-10-27: "the summary should go
//             underneath the meta information"];
//   level 1 = the h2 sections;
//   level 2 = the h3s directly in #article (not the centered table titles), the bet cards labelled
//             "Bet #N: name" [Luke-decided: a bare name doesn't say it's a bet], the timeline cards, the
//             finding headers, and the AI-org lettered parts ("A. ...").
// Everything before the first h2 is the summary (e.g. the SHRP results headline) and gets no entries of its own.
// Set in the page's HTML: data-index-label on an h2 gives it a short index title ("The Design Bets"),
// data-index-skip leaves an h2 and its subsections out, and data-index-sections-only on #article drops the
// level-2 entries (SHRP: "just links to the main sections ... are good enough") [Luke 2026-10-27].
//
// The current section is bolded. Subsections open only while the mouse is over their section (CSS), never from
// scrolling [Luke 2026-10-27: "I only want that to expand and be shown when the mouse is hovering"].
// Wide screens (CSS, >= 1384px): on the left, starting level with the page title, scrolling up with the page and
// pinning below the nav bar. A caret button folds it to a round button and back. It hides while a block wider
// than the widest cards (the full-width AI-org diagrams) passes under it.
// Narrower screens: a floating menu button that opens the same index as a card over the dimmed page
// [Luke 2026-10-27].
// Phones, where a page asks for it with [data-section-index-inline] (SHRP: under the summary cards): an inline
// contents card of the section titles as well [Luke 2026-10-27].
(function () {
    var article = document.getElementById('article');
    if (!article) return;

    var SELECTOR = '#article > h2, #article > h3:not(.centered-title), #article .bet, #article .timeline-card > h3, ' +
        '#article .finding-header > h3, #article .lettered-heading > h3';
    var WIDE = window.matchMedia('(min-width: 1384px)'); // keep in step with the breakpoint in project-styles.css

    function text(el) {
        return el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
    }

    function slug(label) {
        return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'section';
    }

    // One entry per index line: what it's called, which element it jumps to, and its level.
    var entries = [{ label: 'Summary', target: article, level: 1, summary: true }];
    var meta = article.parentElement.querySelector('.info-container'); // the Company / Role / Team ... row
    var sectionsOnly = article.hasAttribute('data-index-sections-only');
    var seenH2 = false, skipping = false;
    document.querySelectorAll(SELECTOR).forEach(function (el) {
        if (el.tagName === 'H2') {
            seenH2 = true;
            skipping = el.hasAttribute('data-index-skip');
        }
        if (!seenH2 || skipping || (sectionsOnly && el.tagName !== 'H2')) return;
        var entry;
        if (el.classList.contains('bet')) {
            entry = { label: text(el.querySelector('.bet-eyebrow')) + ': ' + text(el.querySelector('.bet-content h3')), target: el };
        } else if (el.parentElement.classList.contains('lettered-heading')) {
            var marker = el.parentElement.querySelector('.letter-marker');
            entry = { label: (marker ? marker.getAttribute('data-letter') + '. ' : '') + text(el), target: el.parentElement };
        } else if (el.parentElement.classList.contains('finding-header') || el.parentElement.classList.contains('timeline-card')) {
            entry = { label: text(el), target: el.parentElement };
        } else {
            entry = { label: el.getAttribute('data-index-label') || text(el), target: el };
        }
        entry.level = el.tagName === 'H2' ? 1 : 2;
        entries.push(entry);
    });
    if (entries.length < 2) return;

    // Existing ids stay (e.g. #valuable, #part-A); the rest get a readable one from their label.
    var used = {};
    entries.forEach(function (entry, i) {
        entry.parent = entry.level === 1 ? i : entries[i - 1].parent;
        if (!entry.target.id) {
            var id = slug(entry.label), n = 2;
            while (used[id] || document.getElementById(id)) id = slug(entry.label) + '-' + n++;
            entry.target.id = id;
        }
        used[entry.target.id] = true;
        entry.target.setAttribute('data-section-target', '');
    });

    function jump(entry) {
        if (entry.summary && meta) {
            // The meta row's bottom edge at the top of the window: the usual 96px landing would leave its last line
            // peeking out behind the nav bar. The address stays bare rather than showing #article.
            window.scrollTo({ top: meta.getBoundingClientRect().bottom + window.scrollY, behavior: 'smooth' });
            history.replaceState(null, '', location.pathname + location.search);
            return;
        }
        entry.target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(null, '', '#' + entry.target.id);
    }

    // One index list; each section's subsections nest inside it so hovering the section (CSS) can open them.
    // Built twice: for the wide-screen rail and for the narrow-screen card.
    var lists = [];
    function buildNav(onPick) {
        var nav = document.createElement('nav');
        nav.className = 'section-index';
        nav.setAttribute('aria-label', 'Contents');
        var root = document.createElement('ol'), lis = [], subList = null;
        entries.forEach(function (entry) {
            var li = document.createElement('li');
            li.className = 'section-index-item section-index-item--l' + entry.level;
            var a = document.createElement('a');
            a.href = '#' + entry.target.id;
            a.textContent = entry.label;
            a.addEventListener('click', function (e) {
                e.preventDefault();
                onPick();
                jump(entry);
            });
            li.appendChild(a);
            if (entry.level === 1) {
                root.appendChild(li);
                subList = null;
            } else {
                if (!subList) {
                    var wrap = document.createElement('div');
                    wrap.className = 'section-index-sub';
                    subList = document.createElement('ol');
                    wrap.appendChild(subList);
                    lis[entry.parent].appendChild(wrap);
                }
                subList.appendChild(li);
            }
            lis.push(li);
        });
        nav.appendChild(root);
        lists.push(lis);
        return nav;
    }

    // Wide screens. The rail spans the page from the title to the end of the article and the index is
    // position: sticky inside it, so it starts level with the title, scrolls up with the page, pins below the nav
    // bar, and leaves with the article's end. Sticky (not a script-moved fixed box) keeps it in step with the page.
    var nav = buildNav(function () {});
    var rail = document.createElement('div');
    rail.className = 'section-index-rail';
    rail.appendChild(nav);
    document.body.appendChild(rail);

    // A round button above Summary hides the list and brings it back; the button stays put and only its icon
    // changes [Luke 2026-10-27]. The choice is remembered in this browser (it may be unavailable, e.g. in a private
    // window; then the index simply starts open).
    var collapse = document.createElement('button');
    collapse.type = 'button';
    collapse.className = 'section-index-collapse';
    nav.insertBefore(collapse, nav.firstChild);
    function setCollapsed(collapsed, remember) {
        nav.classList.toggle('is-collapsed', collapsed);
        collapse.setAttribute('aria-expanded', String(!collapsed));
        collapse.setAttribute('aria-label', collapsed ? 'Show contents' : 'Hide contents');
        // Folded it shows the menu icon, like the narrow-screen button [Luke 2026-10-27]; open, a caret to fold it.
        collapse.innerHTML = '<i class="ph-bold ' + (collapsed ? 'ph-list' : 'ph-caret-left') + '" aria-hidden="true"></i>';
        if (remember) {
            try { localStorage.setItem('section-index-collapsed', collapsed ? '1' : '0'); } catch (e) { /* not remembered */ }
        }
    }
    var startCollapsed = false;
    try { startCollapsed = localStorage.getItem('section-index-collapsed') === '1'; } catch (e) { /* start open */ }
    setCollapsed(startCollapsed, false);
    collapse.addEventListener('click', function () {
        setCollapsed(!nav.classList.contains('is-collapsed'), true);
        onScroll(); // the index's box changed size, so re-check what it overlaps
    });

    // Narrow screens: the button, the dimmed backdrop, and the card.
    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'section-index-toggle';
    toggle.setAttribute('aria-label', 'Contents');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = '<i class="ph-bold ph-list" aria-hidden="true"></i>';

    var overlay = document.createElement('div');
    overlay.className = 'section-index-overlay';

    var card = document.createElement('div');
    card.className = 'section-index-card';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'true');
    card.setAttribute('aria-label', 'Contents');
    var head = document.createElement('div');
    head.className = 'section-index-card-head';
    head.innerHTML = '<p>Contents</p><button type="button" class="section-index-close" aria-label="Close">' +
        '<i class="ph-bold ph-x" aria-hidden="true"></i></button>';
    card.appendChild(head);
    card.appendChild(buildNav(function () { setOpen(false, true); }));
    [toggle, overlay, card].forEach(function (el) { document.body.appendChild(el); });

    // Inline contents card (phones; CSS shows it). Section titles only, and no Summary: the card sits in it.
    var inline = article.querySelector('[data-section-index-inline]');
    if (inline) {
        var inlineLabel = document.createElement('p');
        inlineLabel.className = 'section-index-inline-label';
        inlineLabel.textContent = 'Contents';
        var inlineList = document.createElement('ol');
        entries.forEach(function (entry) {
            if (entry.level !== 1 || entry.summary) return;
            var li = document.createElement('li');
            var a = document.createElement('a');
            a.href = '#' + entry.target.id;
            a.innerHTML = '<span></span><i class="ph-bold ph-arrow-down" aria-hidden="true"></i>';
            a.firstChild.textContent = entry.label;
            a.addEventListener('click', function (e) {
                e.preventDefault();
                jump(entry);
            });
            li.appendChild(a);
            inlineList.appendChild(li);
        });
        inline.appendChild(inlineLabel);
        inline.appendChild(inlineList);
    }

    // jumping: closing because a link was picked, so focus doesn't move back to the button mid-scroll.
    function setOpen(open, jumping) {
        document.body.classList.toggle('section-index-open', open);
        toggle.setAttribute('aria-expanded', String(open));
        if (open) head.querySelector('button').focus({ preventScroll: true });
        else if (!jumping) toggle.focus({ preventScroll: true });
    }
    toggle.addEventListener('click', function () { setOpen(true); });
    overlay.addEventListener('click', function () { setOpen(false); });
    head.querySelector('button').addEventListener('click', function () { setOpen(false); });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && document.body.classList.contains('section-index-open')) setOpen(false);
    });

    var title = article.parentElement.querySelector('h1') || article;
    var blockers = [];

    function placeRail() {
        var start = title.getBoundingClientRect().top + window.scrollY;
        var end = article.getBoundingClientRect().bottom + window.scrollY;
        rail.style.top = start + 'px';
        rail.style.height = Math.max(0, end - start) + 'px';
    }

    // Blocks whose left edge reaches under the index. Recomputed on resize; none when the rail is hidden.
    function findBlockers() {
        blockers = [];
        if (!WIDE.matches) return;
        var edge = nav.getBoundingClientRect().right + 16;
        article.querySelectorAll('*').forEach(function (el) {
            var r = el.getBoundingClientRect();
            if (r.width > 0 && r.left < edge && !blockers.some(function (b) { return b.contains(el); })) blockers.push(el);
        });
    }

    var current = -1, ticking = false;
    function update() {
        ticking = false;
        var vh = window.innerHeight;

        // Current = the last section whose top has passed 35% of the screen; Summary until the first one has.
        var now = 0;
        for (var i = 1; i < entries.length; i++) {
            if (entries[i].target.getBoundingClientRect().top <= vh * 0.35) now = i; else break;
        }
        if (now !== current) {
            current = now;
            var section = entries[now].parent;
            lists.forEach(function (lis) {
                lis.forEach(function (li, j) {
                    li.classList.toggle('is-current', j === now || j === section);
                });
            });
        }

        var box = nav.getBoundingClientRect();
        var covered = blockers.some(function (b) {
            var r = b.getBoundingClientRect();
            return r.bottom > box.top && r.top < box.bottom;
        });
        nav.classList.toggle('is-visible', !covered);
        // The button waits until the reader is into the page, so it doesn't sit on the header video.
        toggle.classList.toggle('is-visible', title.getBoundingClientRect().top < vh * 0.5);
    }

    function onScroll() {
        if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }

    function relayout() {
        if (WIDE.matches && document.body.classList.contains('section-index-open')) setOpen(false, true);
        placeRail();
        findBlockers();
        onScroll();
    }

    placeRail();
    findBlockers();
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', relayout);
    // Videos, images and fonts finishing late move the title and the article's end.
    if (window.ResizeObserver) new ResizeObserver(relayout).observe(document.body);

    // A shared link to a generated id (#how-i-tested-it) loads before this script adds the id; jump to it now.
    if (location.hash && used[location.hash.slice(1)]) {
        var target = document.getElementById(location.hash.slice(1));
        if (target) target.scrollIntoView({ behavior: 'instant', block: 'start' }); // instant: the page's CSS smooth scroll would glide from the top
    }
})();
