// ui.js - Global UI enhancements & accessible navigation for Xenoi Biotech

document.addEventListener('DOMContentLoaded', () => {
    // 1. Dashboard Accents (Corners)
    const corners = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
    corners.forEach(pos => {
        const corner = document.createElement('div');
        corner.style.position = 'fixed';
        corner.style.width = '20px';
        corner.style.height = '20px';
        corner.style.border = '2px solid rgba(50, 229, 166, 0.25)';
        corner.style.zIndex = '9000';
        corner.style.pointerEvents = 'none';

        if (pos.includes('top')) {
            corner.style.top = '20px';
            corner.style.borderBottom = 'none';
        } else {
            corner.style.bottom = '20px';
            corner.style.borderTop = 'none';
        }

        if (pos.includes('left')) {
            corner.style.left = '20px';
            corner.style.borderRight = 'none';
        } else {
            corner.style.right = '20px';
            corner.style.borderLeft = 'none';
        }

        document.body.appendChild(corner);
    });

    // 2. Subtle Data Stream Overlay
    const dataStream = document.createElement('div');
    dataStream.id = 'xenoi-seq-ticker';
    dataStream.className = 'xenoi-seq-ticker';
    dataStream.style.position = 'fixed';
    dataStream.style.bottom = '20px';
    dataStream.style.left = '50px';
    dataStream.style.fontFamily = "'Fira Code', monospace";
    dataStream.style.fontSize = '10px';
    dataStream.style.color = 'rgba(50, 229, 166, 0.4)';
    dataStream.style.zIndex = '9000';
    dataStream.style.pointerEvents = 'none';
    dataStream.style.letterSpacing = '0.1em';
    document.body.appendChild(dataStream);

    setInterval(() => {
        const hex = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0').toUpperCase();
        dataStream.innerText = `XENOI.SEQ // 0x${hex}`;
    }, 150);

    // 3. Home Page Navigation Persistence (Only on pages without .inner)
    if (!document.body.classList.contains('inner')) {
        const nav = document.getElementById('main-nav');
        if (nav) {
            window.addEventListener('scroll', () => {
                if (window.scrollY > 100) {
                    nav.classList.add('nav-fixed-top');
                } else {
                    nav.classList.remove('nav-fixed-top');
                }
            });
        }
    }

    // 4. Inner Pages Top Navigation & Mobile Menu Disclosure
    const menuBtn = document.getElementById('mobile-menu-btn');
    const topNav = document.getElementById('top-nav');

    if (menuBtn && topNav) {
        function toggleMenu(forceClose = false) {
            const isExpanded = menuBtn.getAttribute('aria-expanded') === 'true';
            const shouldOpen = forceClose ? false : !isExpanded;

            menuBtn.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
            if (shouldOpen) {
                topNav.classList.add('open');
                document.body.classList.add('nav-open');
            } else {
                topNav.classList.remove('open');
                document.body.classList.remove('nav-open');
            }
        }

        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMenu();
        });

        // Close when pressing Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') {
                toggleMenu(true);
                menuBtn.focus();
            }
        });

        // Close when tapping/clicking any link inside nav
        topNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                toggleMenu(true);
            });
        });

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (menuBtn.getAttribute('aria-expanded') === 'true' && !topNav.contains(e.target) && !menuBtn.contains(e.target)) {
                toggleMenu(true);
            }
        });
    }
});
