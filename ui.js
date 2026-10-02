// ui.js - Global UI enhancements, side drawer & accessibility for Xenoi Biotech
(function () {
    // 1. Decorative Dashboard Accents (Corners)
    const corners = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
    corners.forEach(pos => {
        const corner = document.createElement('div');
        corner.className = 'dashboard-corner';
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

    // 3. Side Drawer Navigation System (Shared across all pages)
    function setupMobileDrawer() {
        // Ensure hamburger menu button has proper aria attributes
        let menuBtn = document.getElementById('mobile-menu-btn');
        if (!menuBtn) {
            const headerActions = document.querySelector('.header-actions');
            if (headerActions) {
                menuBtn = document.createElement('button');
                menuBtn.type = 'button';
                menuBtn.className = 'mobile-menu-btn';
                menuBtn.id = 'mobile-menu-btn';
                menuBtn.setAttribute('aria-label', 'Menu');
                menuBtn.setAttribute('aria-expanded', 'false');
                menuBtn.setAttribute('aria-controls', 'mobile-drawer');
                menuBtn.innerHTML = '<span class="menu-line"></span><span class="menu-line"></span><span class="menu-line"></span>';
                headerActions.appendChild(menuBtn);
            }
        } else {
            menuBtn.setAttribute('aria-label', 'Menu');
            menuBtn.setAttribute('aria-expanded', 'false');
            menuBtn.setAttribute('aria-controls', 'mobile-drawer');
        }

        if (!menuBtn) return;

        // Build backdrop & drawer if not present
        let backdrop = document.getElementById('mobile-drawer-backdrop');
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.id = 'mobile-drawer-backdrop';
            backdrop.className = 'drawer-backdrop';
            backdrop.setAttribute('aria-hidden', 'true');
            document.body.appendChild(backdrop);
        }

        let drawer = document.getElementById('mobile-drawer');
        if (!drawer) {
            drawer = document.createElement('div');
            drawer.id = 'mobile-drawer';
            drawer.className = 'mobile-drawer';
            drawer.setAttribute('role', 'dialog');
            drawer.setAttribute('aria-modal', 'true');
            drawer.setAttribute('aria-label', 'Navigation Menu');
            drawer.setAttribute('aria-hidden', 'true');

            // Current pathname detection
            const path = window.location.pathname.toLowerCase();
            const isHome = path === '/' || path.endsWith('/index.html') || path.endsWith('/');
            const isServices = path.includes('services.html');
            const isCareer = path.includes('career-navigator.html');
            const isInternships = path.includes('internships.html');
            const isCollab = path.includes('collaboration.html');
            const isProgrammes = isCareer || isInternships || isCollab;
            const isWorkshops = path.includes('workshops.html');
            const isAbout = path.includes('team.html');
            const isContact = path.includes('quote.html');

            drawer.innerHTML = `
                <div class="drawer-header">
                    <span class="drawer-title">Navigation</span>
                    <button type="button" class="drawer-close-btn" id="drawer-close-btn" aria-label="Close menu">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                <nav class="drawer-nav" aria-label="Mobile Navigation">
                    <ul class="drawer-links">
                        <li><a href="index.html" class="drawer-link ${isHome ? 'active' : ''}" ${isHome ? 'aria-current="page"' : ''}>Home</a></li>
                        <li><a href="services.html" class="drawer-link ${isServices ? 'active' : ''}" ${isServices ? 'aria-current="page"' : ''}>Services</a></li>
                        <li class="drawer-group">
                            <details class="drawer-accordion" id="drawer-programmes-details" ${isProgrammes ? 'open' : ''}>
                                <summary class="drawer-link drawer-summary ${isProgrammes ? 'active' : ''}">
                                    <span>Programmes</span>
                                    <svg class="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                </summary>
                                <ul class="drawer-sublinks">
                                    <li><a href="career-navigator.html" class="drawer-sublink ${isCareer ? 'active' : ''}" ${isCareer ? 'aria-current="page"' : ''}>Career Navigator</a></li>
                                    <li><a href="internships.html" class="drawer-sublink ${isInternships ? 'active' : ''}" ${isInternships ? 'aria-current="page"' : ''}>Internships</a></li>
                                    <li><a href="collaboration.html" class="drawer-sublink ${isCollab ? 'active' : ''}" ${isCollab ? 'aria-current="page"' : ''}>Collaboration</a></li>
                                </ul>
                            </details>
                        </li>
                        <li><a href="workshops.html" class="drawer-link ${isWorkshops ? 'active' : ''}" ${isWorkshops ? 'aria-current="page"' : ''}>Workshops</a></li>
                        <li><a href="team.html" class="drawer-link ${isAbout ? 'active' : ''}" ${isAbout ? 'aria-current="page"' : ''}>About</a></li>
                        <li><a href="quote.html" class="drawer-link ${isContact ? 'active' : ''}" ${isContact ? 'aria-current="page"' : ''}>Contact</a></li>
                    </ul>
                </nav>
                <div class="drawer-footer">
                    <a href="quote.html" class="btn btn-light drawer-cta">
                        Start a conversation
                        <span class="btn-icon">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                        </span>
                    </a>
                </div>
            `;
            document.body.appendChild(drawer);
        }

        const closeBtn = document.getElementById('drawer-close-btn');

        function openDrawer() {
            drawer.classList.add('open');
            backdrop.classList.add('open');
            document.body.classList.add('drawer-open');
            document.body.style.overflow = 'hidden';
            menuBtn.setAttribute('aria-expanded', 'true');
            drawer.setAttribute('aria-hidden', 'false');
            if (closeBtn) {
                closeBtn.focus();
            }
        }

        function closeDrawer() {
            drawer.classList.remove('open');
            backdrop.classList.remove('open');
            document.body.classList.remove('drawer-open');
            document.body.style.overflow = '';
            menuBtn.setAttribute('aria-expanded', 'false');
            drawer.setAttribute('aria-hidden', 'true');
            menuBtn.focus();
        }

        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (drawer.classList.contains('open')) {
                closeDrawer();
            } else {
                openDrawer();
            }
        });

        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                closeDrawer();
            });
        }

        backdrop.addEventListener('click', (e) => {
            e.stopPropagation();
            closeDrawer();
        });

        // Close on link click
        drawer.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                closeDrawer();
            });
        });

        // Keyboard handler: Escape & Focus Trap
        document.addEventListener('keydown', (e) => {
            if (!drawer.classList.contains('open')) return;

            if (e.key === 'Escape') {
                e.preventDefault();
                closeDrawer();
                return;
            }

            if (e.key === 'Tab') {
                const focusable = drawer.querySelectorAll('button, [href], input, select, textarea, details, [tabindex]:not([tabindex="-1"])');
                if (!focusable.length) return;
                const first = focusable[0];
                const last = focusable[focusable.length - 1];

                if (e.shiftKey) {
                    if (document.activeElement === first) {
                        e.preventDefault();
                        last.focus();
                    }
                } else {
                    if (document.activeElement === last) {
                        e.preventDefault();
                        first.focus();
                    }
                }
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupMobileDrawer);
    } else {
        setupMobileDrawer();
    }
})();
