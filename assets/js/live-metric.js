// Live "hours saved" metric (portfolio go-live, 2026-10-27).
// Reads /assets/data/live-metric.json, which the nightly GitHub Action (.github/workflows/live-metric.yml)
// writes into this site from shrp-prod. The site itself never contacts production, and nothing in it
// points there [Luke 2026-10-27].
// Every [data-live-metric] element ships `hidden` and is shown only once the file loads, so a failed or
// missing read shows nothing: never a placeholder, never 0. A stale file still shows, with its real date.
// The number is static, no count-up [Luke-decided: "I think that distracts"].
(function () {
    function fill(data) {
        var parts = data.updated.split('-').map(Number);
        var fields = {
            // Already rounded down to the tenth at the source; this only adds the thousands separator.
            hours: Number(data.total_hours).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
            users: String(data.users_counted),
            // `updated` is a calendar date (YYYY-MM-DD, New York); format it without any timezone shift.
            updated: new Date(Date.UTC(parts[0], parts[1] - 1, parts[2])).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
        };
        document.querySelectorAll('[data-live-metric="total-hours-saved"]').forEach(function (el) {
            el.querySelectorAll('[data-live-field]').forEach(function (slot) {
                slot.textContent = fields[slot.getAttribute('data-live-field')];
            });
            el.hidden = false;
        });
    }

    // no-cache: revalidate with the server so a returning visitor gets last night's number, not a cached one.
    fetch('/assets/data/live-metric.json', { cache: 'no-cache' })
        .then(function (res) { return res.ok ? res.json() : null; })
        .then(function (data) {
            if (data && data.total_hours != null && /^\d{4}-\d{2}-\d{2}$/.test(data.updated || '')) fill(data);
        })
        .catch(function () { /* stay hidden */ });
})();
