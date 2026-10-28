// Password gate UI for the protected case studies (Luke 2026-10-28). Styles: /assets/css/case-study-gate.css.
//
// One gate, two places:
//   - the gate page itself, which a protected page (today /shrp/) serves before the password (built by StatiCrypt from
//     _tools/gate/password_template.html): direct visits, and every visit on a phone;
//   - a modal over the homepage on desktop: loaded there with data-gate-links, it catches clicks on links to a
//     protected page when this browser hasn't unlocked yet.
// The modal checks the password against the encrypted page with StatiCrypt's own engine and saves it exactly as the
// gate page does, so the case study then opens without asking again. If anything here can't run, the link simply
// goes to the gate page, which always works.
//
// Gate content (title, copy, video, email subject and body) comes from /assets/data/case-study-gates.json, which
// _tools/encrypt-case-studies.mjs writes from the pages themselves; the gate page gets its own entry inlined.
(function () {
    var EMAIL = 'luke@lukeschenker.com';
    var WIDE = window.matchMedia('(min-width: 701px)'); // phones (the site's 700px breakpoint) get the plain gate page
    // StatiCrypt's localStorage keys, the same as in the gate template, so both places share one remembered password
    var TEMPLATE_CONFIG = {
        rememberExpirationKey: 'staticrypt_expiration',
        rememberPassphraseKey: 'staticrypt_passphrase',
        replaceHtmlCallback: function () { /* the modal only checks; it never replaces the homepage */ },
        clearLocalStorageCallback: null
    };

    function el(tag, className, text) {
        var node = document.createElement(tag);
        if (className) node.className = className;
        if (text != null) node.textContent = text;
        return node;
    }

    // mode 'modal' (over the homepage) or 'page' (the gate page). onSubmit(password) resolves true when it unlocked.
    function render(gate, mode, onSubmit, onClose) {
        var root = el('div', 'cs-gate cs-gate--' + mode);
        root.setAttribute('role', 'dialog');
        root.setAttribute('aria-modal', 'true');
        root.setAttribute('aria-labelledby', 'cs-gate-title');

        var close = el('button', 'cs-gate-close');
        close.type = 'button';
        close.setAttribute('aria-label', mode === 'modal' ? 'Close' : 'Back to the homepage');
        close.innerHTML = '<i class="ph-bold ph-x" aria-hidden="true"></i>';
        close.addEventListener('click', onClose);
        root.appendChild(close);

        var panel = el('div', 'cs-gate-panel');
        root.appendChild(panel);

        // The video only on wider screens; phones don't download it at all.
        if (WIDE.matches && gate.video) {
            var frame = el('div', 'cs-gate-video');
            var video = document.createElement('video');
            video.src = gate.video.src;
            if (gate.video.poster) video.poster = gate.video.poster;
            if (gate.video.label) video.setAttribute('aria-label', gate.video.label);
            video.autoplay = video.muted = video.loop = video.playsInline = true;
            frame.appendChild(video);
            panel.appendChild(frame);
            if (window.attachVideoScrub) window.attachVideoScrub(video);
        }

        var body = el('div', 'cs-gate-body');
        var text = el('div', 'cs-gate-text');
        var title = el('h2', 'cs-gate-title', gate.title);
        title.id = 'cs-gate-title';
        text.appendChild(title);
        // *Starred* parts of the copy are highlighted in white [Luke 2026-10-28]; the rest stays grey.
        var lead = el('p', 'cs-gate-lead');
        String(gate.lead || '').split('*').forEach(function (part, i) {
            if (part) lead.appendChild(i % 2 ? el('span', 'cs-gate-em', part) : document.createTextNode(part));
        });
        text.appendChild(lead);
        body.appendChild(text);

        var form = el('form', 'cs-gate-form');
        // A plain text field [Luke-decided: "We don't have to make it terribly sneaky"]. Phone keyboards would
        // capitalize, autocorrect or add a space and break the password, so all of that is off and spaces are trimmed.
        var input = el('input', 'cs-gate-input');
        input.type = 'text';
        input.name = 'case-study-password';
        input.placeholder = 'Password';
        input.setAttribute('aria-label', 'Password');
        ['autocomplete', 'autocorrect', 'autocapitalize'].forEach(function (a) { input.setAttribute(a, 'off'); });
        input.spellcheck = false;
        var submit = el('button', 'cs-gate-submit', 'View private case study');
        submit.type = 'submit';
        var error = el('p', 'cs-gate-error', "That password didn't work. Please try again.");
        error.setAttribute('role', 'alert');
        error.hidden = true;

        // Two ways to ask for the password [Luke 2026-10-28]: copy the address, or open a ready-made email.
        var emailRow = el('div', 'cs-gate-email');
        var copy = el('button');
        copy.type = 'button';
        copy.innerHTML = '<i class="ph-bold ph-copy" aria-hidden="true"></i><span data-copy-label>Copy email</span>';
        if (window.bindCopyEmail) window.bindCopyEmail(copy); // the site-wide copy-email behavior (copy-email.js)
        var mail = el('a');
        mail.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(gate.subject || '') +
            '&body=' + encodeURIComponent(gate.body || '');
        mail.innerHTML = '<i class="ph-bold ph-envelope-simple" aria-hidden="true"></i><span>Email me</span>';
        emailRow.appendChild(copy);
        emailRow.appendChild(mail);
        // Under the copy that mentions them [Luke 2026-10-28]; the password form follows.
        text.appendChild(emailRow);

        // Phones only (CSS): a short rule and a label between the email buttons and the field [Luke 2026-10-28].
        form.appendChild(el('hr', 'cs-gate-rule'));
        var label = el('label', 'cs-gate-label', 'Enter the password provided to you');
        label.htmlFor = input.id = 'cs-gate-password';
        form.appendChild(label);
        form.appendChild(input);
        form.appendChild(submit);
        form.appendChild(error);
        body.appendChild(form);
        panel.appendChild(body);

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var password = input.value.trim();
            if (!password) return;
            submit.disabled = true;
            error.hidden = true;
            Promise.resolve(onSubmit(password)).then(function (ok) {
                if (!ok) {
                    submit.disabled = false;
                    error.hidden = false;
                    input.select();
                }
            }, function () {
                submit.disabled = false;
                error.hidden = false;
            });
        });

        if (mode === 'modal') {
            root.addEventListener('click', function (e) { if (e.target === root) onClose(); });
        }
        function onKey(e) { if (e.key === 'Escape') onClose(); }
        document.addEventListener('keydown', onKey);

        document.body.appendChild(root);
        requestAnimationFrame(function () { root.classList.add('is-open'); });
        input.focus({ preventScroll: true });

        return {
            remove: function () {
                document.removeEventListener('keydown', onKey);
                root.remove();
            }
        };
    }

    window.CaseStudyGate = { render: render };

    // ---- Homepage modal (desktop) ----
    var me = document.currentScript;
    if (!me || !me.hasAttribute('data-gate-links')) return;

    function remembered() {
        try { return !!localStorage.getItem(TEMPLATE_CONFIG.rememberPassphraseKey); } catch (e) { return false; }
    }

    var gates = null;
    fetch('/assets/data/case-study-gates.json', { cache: 'no-cache' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (data) { gates = data; })
        .catch(function () { /* no modal: links go to the gate pages */ });

    var engine = null;
    function loadEngine() {
        if (engine) return engine;
        engine = new Promise(function (resolve, reject) {
            var s = document.createElement('script');
            s.src = '/assets/js/staticrypt-engine.js';
            s.onload = function () { window.staticryptInitiator ? resolve(window.staticryptInitiator) : reject(); };
            s.onerror = reject;
            document.head.appendChild(s);
        });
        return engine;
    }

    // The encrypted page carries its StatiCrypt settings (ciphertext + salt) as JSON in #staticrypt-config.
    function loadConfig(href) {
        return fetch(href, { cache: 'no-cache' })
            .then(function (r) { return r.text(); })
            .then(function (html) {
                var node = new DOMParser().parseFromString(html, 'text/html').getElementById('staticrypt-config');
                return node ? JSON.parse(node.textContent) : null;
            });
    }

    function openModal(path, href) {
        var lockScroll = document.documentElement.style.overflow;
        document.documentElement.style.overflow = 'hidden';
        var config = loadConfig(href).catch(function () { return null; });
        loadEngine().catch(function () {});
        var ui = render(gates[path], 'modal', function (password) {
            return Promise.all([config, loadEngine()]).then(function (got) {
                if (!got[0]) { window.location.href = href; return true; } // can't check here: the gate page will
                var staticrypt = got[1].init(got[0], TEMPLATE_CONFIG);
                return staticrypt.handleDecryptionOfPage(password, true).then(function (result) {
                    if (result.isSuccessful) window.location.href = href; // remembered now, so it opens unlocked
                    return result.isSuccessful;
                });
            }, function () { window.location.href = href; return true; });
        }, function () {
            document.documentElement.style.overflow = lockScroll;
            ui.remove();
        });
    }

    document.addEventListener('click', function (e) {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        var a = e.target.closest && e.target.closest('a[href]');
        if (!a) return;
        var url = new URL(a.href, window.location.href);
        if (url.origin !== window.location.origin || !gates || !gates[url.pathname]) return;
        if (!WIDE.matches || remembered()) return; // phones and unlocked visitors go straight to the page
        e.preventDefault();
        openModal(url.pathname, url.pathname);
    });
})();
