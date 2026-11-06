// One full-screen viewer for images and YouTube videos, shared across pages. Desktop
// (mouse) only: on touch screens video links keep their normal behavior, so YouTube opens its app. (PDFs were tried
// here too and dropped: the browser's own reader in a new tab is cleaner.)
// Video links opt in with data-viewer; data-caption and data-date set the line above the player:
//   <a href="https://youtu.be/ID" data-viewer="video" data-youtube="ID" data-caption="..." data-date="2023">...</a>
// Images are opened from code: window.MediaViewer.open({ type: 'image', src, alt, link: { href, label } }).
(function () {
    const desktop = window.matchMedia('(hover: hover) and (pointer: fine)');
    let viewer = null;
    let returnFocus = null;

    function build() {
        viewer = document.createElement('div');
        viewer.className = 'media-viewer';
        viewer.setAttribute('role', 'dialog');
        viewer.setAttribute('aria-modal', 'true');
        viewer.innerHTML = '<div class="media-viewer-bar"><a class="media-viewer-link" href="#"></a>' +
            '<button type="button" class="media-viewer-close" aria-label="Close"><i class="ph-bold ph-x"></i></button></div>' +
            '<div class="media-viewer-stage"></div>';
        viewer.addEventListener('click', function (e) {
            if (e.target === viewer || e.target.classList.contains('media-viewer-bar') ||
                e.target.classList.contains('media-viewer-stage') || e.target.closest('.media-viewer-close')) close();
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && viewer.classList.contains('is-open')) close();
        });
        document.body.appendChild(viewer);
    }

    function open(opts) {
        if (!viewer) build();
        returnFocus = document.activeElement;
        const stage = viewer.querySelector('.media-viewer-stage');
        stage.innerHTML = '';
        viewer.dataset.type = opts.type;

        if (opts.type === 'image') {
            const img = document.createElement('img');
            // Tall images (the citation diagram) get a smaller cap so they don't fill the window
            img.onload = function () { img.classList.toggle('is-tall', img.naturalWidth / img.naturalHeight < 1.5); };
            img.src = opts.src;
            img.alt = opts.alt || '';
            stage.appendChild(img);
        } else {
            // Video: an optional caption row (title left, date right) sits on the player's top edge
            const media = document.createElement('div');
            media.className = 'media-viewer-media';
            if (opts.caption) {
                const cap = document.createElement('div');
                cap.className = 'media-viewer-caption';
                cap.innerHTML = '<span></span><span></span>';
                cap.children[0].textContent = opts.caption;
                cap.children[1].textContent = opts.date || '';
                media.appendChild(cap);
            }
            const frame = document.createElement('iframe');
            frame.className = 'media-viewer-frame';
            frame.title = opts.caption || opts.title || '';
            {
                frame.src = 'https://www.youtube-nocookie.com/embed/' + opts.youtube + '?autoplay=1&rel=0&enablejsapi=1&origin=' +
                    encodeURIComponent(location.origin);
                frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
                frame.allowFullscreen = true;
                // Captions off by default. YouTube has no parameter for this (captions follow the viewer's own setting), so
                // once the player loads we ask it to unload its captions module. Repeated for a few seconds because the
                // player only accepts commands once it is ready. Viewers can still turn captions on with the CC button.
                frame.addEventListener('load', function () {
                    let tries = 0;
                    const timer = setInterval(function () {
                        if (!frame.contentWindow || ++tries > 8) { clearInterval(timer); return; }
                        frame.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'unloadModule', args: ['captions'] }), '*');
                    }, 500);
                });
            }
            media.appendChild(frame);
            stage.appendChild(media);
        }

        const a = viewer.querySelector('.media-viewer-link');
        a.hidden = !opts.link;
        a.removeAttribute('download');
        a.removeAttribute('target');
        if (opts.link) {
            a.href = opts.link.href;
            a.innerHTML = opts.link.label;
            if (opts.link.download) a.setAttribute('download', '');
            if (opts.link.external) { a.target = '_blank'; a.rel = 'noopener'; }
        }

        viewer.classList.add('is-open');
        document.documentElement.style.overflow = 'hidden';
        viewer.querySelector('.media-viewer-close').focus();
    }

    function close() {
        viewer.classList.remove('is-open');
        // Emptying the stage unloads the player, so a video stops when the viewer closes
        viewer.querySelector('.media-viewer-stage').innerHTML = '';
        document.documentElement.style.overflow = '';
        if (returnFocus && returnFocus.focus) returnFocus.focus();
    }

    // Links that open in the viewer on desktop
    document.addEventListener('click', function (e) {
        const link = e.target.closest('a[data-viewer]');
        if (!link || !desktop.matches || e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        const title = link.textContent.trim();
        if (link.dataset.viewer === 'video') {
            open({ type: 'video', youtube: link.dataset.youtube, title: title, caption: link.dataset.caption, date: link.dataset.date,
                link: { href: link.href, label: 'Watch on YouTube <i class="ph-bold ph-arrow-up-right"></i>', external: true } });
        }
    });

    window.MediaViewer = { open: open, close: close, desktop: desktop };
})();
