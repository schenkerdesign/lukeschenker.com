// Making sure the animated gradient on the homepage is always the right height: from the top of the page to
// 20px below the top of the company logos. The logos took the anchor over from the header quote when the
// quote was removed (2026-10-27); they land exactly where the quote started, so the gradient is unchanged.
// Measured in page coordinates (+ scrollY): a viewport-relative top went negative on a refresh while
// scrolled down, the browser rejected the negative height, and the gradient never showed.
function syncHeight() {
  const anchor = document.querySelector("#companies-container");
  const meshContainer = document.querySelector("#mesh-container");
  if (!anchor || !meshContainer) return; // only the homepage has the gradient
  const offset = anchor.getBoundingClientRect().top + window.scrollY;
  meshContainer.style.height = offset + 20 + "px"; // or "+ 150" for bigger gradient background
}

// Debug toggle on/off
var animationsOn = true;

document.addEventListener('DOMContentLoaded', function() {

    if (!animationsOn) {
        document.querySelectorAll('.fade').forEach(el => el.classList.remove("fade"));
    } else {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        });

        document.querySelectorAll('.fade').forEach(el => observer.observe(el));
    }

    // Size the homepage's dynamic gradient (a no-op on pages without it). Keyed on the elements, not the URL:
    // the old pathname check also matched /shrp/index.html, where it threw and skipped the setup below.
    syncHeight();
    window.addEventListener("resize", syncHeight);

    // Nav bar fade in/out
    let lastScrollTop = 0;
    const header = document.getElementById('header');

    function handleScroll() {
        const scrollTop = window.pageYOffset;
        
        if (scrollTop > lastScrollTop && scrollTop > 40) {
            // Scrolling down - hide header
            header.classList.add('hidden');
        } else {
            // Scrolling up - show header
            header.classList.remove('hidden');
        }
        
        lastScrollTop = scrollTop;
    }

    window.addEventListener('scroll', handleScroll);

    // Copy-email buttons: /assets/js/copy-email.js (shared with the password gate, 2026-10-28)

    // Little last touch :)
    console.log("%cWebsite made by Luke with %c❤️", 
        "font-size:14px;", 
        "color: red; font-size:14px;"
    );
});



