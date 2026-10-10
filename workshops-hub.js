// workshops-hub.js - Accessible category filter for Xenoi Biotech Workshops Hub
(function() {
    'use strict';

    function initWorkshopsHub() {
        const filterTabs = document.querySelectorAll('.workshop-filters .filter-tab');
        const cards = document.querySelectorAll('.workshop-hub-card');

        if (!filterTabs.length || !cards.length) return;

        filterTabs.forEach((tab, index) => {
            tab.addEventListener('click', () => {
                const filter = tab.getAttribute('data-filter');

                // Update aria-pressed and active classes
                filterTabs.forEach(t => {
                    const isActive = (t === tab);
                    t.setAttribute('aria-pressed', isActive ? 'true' : 'false');
                    t.classList.toggle('active', isActive);
                });

                // Filter cards (without JS, all cards remain visible in HTML)
                cards.forEach(card => {
                    const group = card.getAttribute('data-group');
                    if (filter === 'all' || group === filter) {
                        card.removeAttribute('hidden');
                        card.style.display = '';
                    } else {
                        card.setAttribute('hidden', '');
                        card.style.display = 'none';
                    }
                });
            });

            // Keyboard navigation between tabs with Arrow keys
            tab.addEventListener('keydown', (e) => {
                let targetTab = null;
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                    targetTab = filterTabs[(index + 1) % filterTabs.length];
                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                    targetTab = filterTabs[(index - 1 + filterTabs.length) % filterTabs.length];
                }
                if (targetTab) {
                    e.preventDefault();
                    targetTab.focus();
                    targetTab.click();
                }
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWorkshopsHub);
    } else {
        initWorkshopsHub();
    }
})();
