// Copy-email buttons, one behavior site-wide (Luke 2026-10-28): the footer and About "Copy email" buttons and the
// password gate's. Add data-copy-email to the button and data-copy-label to its text (or the button itself is the
// label): a click copies the address and the label reads "Copied!" for 2 seconds. Buttons built later in script
// (the gate) call window.bindCopyEmail(button).
(function () {
    var EMAIL = 'luke@lukeschenker.com';

    function bind(button) {
        var label = button.querySelector('[data-copy-label]') || button;
        var original = label.textContent;
        var timer;
        button.addEventListener('click', function () {
            navigator.clipboard.writeText(EMAIL).then(function () {
                label.textContent = 'Copied!'; // Luke's own copy [Luke 2026-10-28: "I like my energy"]
                clearTimeout(timer);
                timer = setTimeout(function () { label.textContent = original; }, 2000);
            }, function () {
                label.textContent = EMAIL; // clipboard blocked: show the address to copy by hand
            });
        });
    }

    window.bindCopyEmail = bind;
    document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('[data-copy-email]').forEach(bind);
    });
})();
