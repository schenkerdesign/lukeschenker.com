// Making sure the animated gradient on the homepage is always the right height.
function syncHeight() {
  const headerBottom = document.querySelector("#header-bottom");
  const meshContainer = document.querySelector("#mesh-container");
  const offset = headerBottom.getBoundingClientRect().top;
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

    // If on homescreen, resize dynamic gradient.
    if (window.location.pathname === "/" || window.location.pathname.endsWith("index.html")) {
        syncHeight();
        window.addEventListener("resize", syncHeight);
    }

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

    // Email copy functionality
    const button = document.getElementById("copy-email");
    const email = "luke@lukeschenker.com";
    const successMsg = document.getElementById("copy-text");

    if (button){
        button.addEventListener("click", () => {
            // Use the Clipboard API
            navigator.clipboard.writeText(email)
                .then(() => {
                    successMsg.textContent = "Copied!"
                })
                .catch(err => {
                    console.error("Failed to copy email: ", err);
                });
        });
    }

    // Little last touch :)
    console.log("%cWebsite made by Luke with %c❤️", 
        "font-size:14px;", 
        "color: red; font-size:14px;"
    );
});



