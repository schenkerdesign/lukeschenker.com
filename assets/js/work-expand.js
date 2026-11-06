// The "View case studies" action in the Anew and Uber rows toggles that project's individual
// case studies open and closed. The image's hover action (data-expand="<panel id>") toggles the same panel.
document.addEventListener('DOMContentLoaded', function () {
    function setOpen(toggle, open) {
        toggle.setAttribute('aria-expanded', open);
        toggle.querySelector('.work-expand-text').textContent = open ? 'Hide case studies' : 'View case studies';
        // The image's hover label follows the same state ("Read about my role" stays as it is)
        document.querySelectorAll('[data-expand="' + toggle.getAttribute('aria-controls') + '"]').forEach(function (overlay) {
            const label = overlay.parentElement.querySelector('.media-overlay-label');
            if (!label) return;
            if (!label.dataset.closedText) label.dataset.closedText = label.firstChild.textContent;
            label.firstChild.textContent = open ? 'Hide case studies ' : label.dataset.closedText;
            label.querySelector('i').className = open ? 'ph-bold ph-caret-up' : 'ph-bold ph-caret-down';
        });
        const panel = document.getElementById(toggle.getAttribute('aria-controls'));
        panel.closest('.work-expand').classList.toggle('is-open', open);
        // The project's own row shrinks into a header for its case studies while they're open
        const row = toggle.closest('.work-row');
        row.classList.toggle('is-compact', open);
        // Desktop only: on open, bring the row's top to just below the top of the window so the row and its case studies
        // sit in view together. The row's top doesn't move while it shrinks, so the target is known up front.
        if (open && window.matchMedia('(min-width: 901px)').matches) {
            window.scrollTo({ top: row.getBoundingClientRect().top + window.scrollY - 32, behavior: 'smooth' });
        }
    }

    document.querySelectorAll('.work-expand-toggle').forEach(function (toggle) {
        toggle.addEventListener('click', function () {
            setOpen(toggle, toggle.getAttribute('aria-expanded') !== 'true');
        });
    });

    document.querySelectorAll('[data-expand]').forEach(function (trigger) {
        trigger.addEventListener('click', function () {
            const toggle = document.querySelector('.work-expand-toggle[aria-controls="' + trigger.dataset.expand + '"]');
            if (toggle) setOpen(toggle, toggle.getAttribute('aria-expanded') !== 'true');
        });
    });
});
