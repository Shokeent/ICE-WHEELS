document.addEventListener('DOMContentLoaded', function() {
    // ===== CACHE AGE BANNER =====
    (function() {
        try {
            var raw = localStorage.getItem('ice-wheels-api-cache-v3');
            if (!raw) return;
            var cached = JSON.parse(raw);
            var ageMs = Date.now() - (cached.ts || 0);
            var ageH = Math.floor(ageMs / 3600000);
            if (ageH < 1) return; // fresh enough — no banner
            var banner = document.createElement('div');
            banner.className = 'cache-banner';
            banner.innerHTML =
                '<i class="fas fa-circle-info"></i>' +
                '<span>Location data is ' + ageH + ' hour' + (ageH !== 1 ? 's' : '') + ' old. ' +
                '<a id="cache-refresh-link">Refresh now</a></span>' +
                '<a id="cache-banner-dismiss" style="margin-left:auto;opacity:0.6;cursor:pointer" title="Dismiss">✕</a>';
            document.body.insertAdjacentElement('afterbegin', banner);
            document.getElementById('cache-refresh-link').addEventListener('click', function(e) {
                e.preventDefault();
                localStorage.removeItem('ice-wheels-api-cache-v3');
                location.reload();
            });
            document.getElementById('cache-banner-dismiss').addEventListener('click', function() {
                banner.remove();
            });
        } catch (e) {}
    })();

    // ===== SERVICE WORKER =====
    // Force-clear any old SW caches, then register fresh
    if ('caches' in window) {
        caches.keys().then(function(names) {
            names.forEach(function(name) {
                if (name !== 'ice-wheels-v3') caches.delete(name);
            });
        });
    }
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').then(function(reg) {
            // When a new SW is found, activate it immediately and reload once
            reg.addEventListener('updatefound', function() {
                var newWorker = reg.installing;
                newWorker.addEventListener('statechange', function() {
                    if (newWorker.state === 'activated') {
                        window.location.reload();
                    }
                });
            });
        }).catch(function() {});
    }

    // ===== DARK MODE =====
    (function() {
        var saved = localStorage.getItem('ice-wheels-theme');
        var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        var theme = saved || (prefersDark ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', theme);
        var icon = document.getElementById('theme-icon');
        if (icon) icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    })();
    var themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', function() {
            var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            var newTheme = isDark ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('ice-wheels-theme', newTheme);
            var icon = document.getElementById('theme-icon');
            if (icon) icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        });
    }

    // ===== FRENCH LANGUAGE TOGGLE =====
    (function() {
        var lang = localStorage.getItem('ice-wheels-lang') || 'en';
        applyLanguage(lang);
        var langBtn = document.getElementById('lang-toggle');
        if (langBtn) {
            langBtn.textContent = lang === 'fr' ? 'EN' : 'FR';
            langBtn.addEventListener('click', function() {
                var current = localStorage.getItem('ice-wheels-lang') || 'en';
                var next = current === 'en' ? 'fr' : 'en';
                localStorage.setItem('ice-wheels-lang', next);
                applyLanguage(next);
                this.textContent = next === 'fr' ? 'EN' : 'FR';
            });
        }
    })();

    // ===== FAQ =====
    document.querySelectorAll('.faq-question').forEach(function(question) {
        question.addEventListener('click', function() {
            var faqItem = this.parentElement;
            var isActive = faqItem.classList.contains('active');
            document.querySelectorAll('.faq-item').forEach(function(item) { item.classList.remove('active'); });
            if (!isActive) faqItem.classList.add('active');
        });
    });

    // ===== SMOOTH SCROLL =====
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
        anchor.addEventListener('click', function(e) {
            var target = document.querySelector(this.getAttribute('href'));
            if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        });
    });

    // ===== HAMBURGER =====
    var hamburgerBtn = document.getElementById('hamburger-btn');
    var navMenu = document.getElementById('nav-menu');
    if (hamburgerBtn && navMenu) {
        hamburgerBtn.addEventListener('click', function() {
            navMenu.classList.toggle('nav-open');
            hamburgerBtn.classList.toggle('active');
        });
        navMenu.querySelectorAll('.nav-link').forEach(function(link) {
            link.addEventListener('click', function() {
                navMenu.classList.remove('nav-open');
                hamburgerBtn.classList.remove('active');
            });
        });
    }

    // ===== CONTACT FORM =====
    var contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            contactForm.style.display = 'none';
            document.getElementById('form-success').classList.add('visible');
        });
    }

    // ===== WEATHER WIDGET =====
    var weatherWidget = document.getElementById('weather-widget');
    if (weatherWidget) {
        fetch('https://wttr.in/Toronto?format=j1')
            .then(function(r) { return r.json(); })
            .then(function(data) {
                var temp = parseInt(data.current_condition[0].temp_C);
                var icon, msg;
                if (temp <= 0)       { icon = '❄️'; msg = 'Perfect conditions for ice skating!'; }
                else if (temp <= 6)  { icon = '🌤️'; msg = 'Bundle up and hit the rink!'; }
                else if (temp <= 16) { icon = '⛅'; msg = 'Great day for outdoor skating!'; }
                else                 { icon = '☀️'; msg = 'Try indoor skating to cool off!'; }
                document.getElementById('weather-text').innerHTML =
                    '<strong>' + icon + ' ' + temp + '°C in Toronto</strong> &mdash; ' + msg;
                weatherWidget.style.display = 'inline-flex';
            })
            .catch(function() {});
    }

    // ===== SCROLL TO TOP =====
    var scrollBtn = document.createElement('button');
    scrollBtn.id = 'scroll-top-btn';
    scrollBtn.className = 'scroll-top-btn';
    scrollBtn.setAttribute('aria-label', 'Scroll to top');
    scrollBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
    document.body.appendChild(scrollBtn);
    window.addEventListener('scroll', function() {
        scrollBtn.classList.toggle('visible', window.scrollY > 300);
    }, { passive: true });
    scrollBtn.addEventListener('click', function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // ===== KEYBOARD SHORTCUTS =====
    document.addEventListener('keydown', function(e) {
        if (e.target.matches('input, textarea, select')) return;
        if (e.key === 'f' || e.key === 'F') {
            var search = document.getElementById('search-input');
            if (search) { e.preventDefault(); search.focus(); }
            else window.location.href = 'locations.html';
        } else if (e.key === 'm' || e.key === 'M') {
            window.location.href = 'map.html';
        } else if (e.key === 'Escape') {
            var modal = document.getElementById('shared-modal');
            if (modal) {
                modal.classList.remove('visible');
                setTimeout(function() { if (modal.parentNode) modal.remove(); }, 250);
            }
            var suggestions = document.getElementById('search-suggestions');
            if (suggestions) suggestions.style.display = 'none';
        }
    });

    // ===== KEYBOARD SHORTCUT HINT =====
    var hintBtn = document.createElement('button');
    hintBtn.className = 'shortcut-hint-btn';
    hintBtn.setAttribute('aria-label', 'Keyboard shortcuts');
    hintBtn.innerHTML = '<i class="fas fa-keyboard"></i>';
    document.body.appendChild(hintBtn);
    var hintTooltip = document.createElement('div');
    hintTooltip.className = 'shortcut-tooltip';
    hintTooltip.innerHTML =
        '<strong>Keyboard Shortcuts</strong>' +
        '<div><kbd>F</kbd> Focus search</div>' +
        '<div><kbd>M</kbd> Open map</div>' +
        '<div><kbd>Esc</kbd> Close modal</div>';
    hintBtn.appendChild(hintTooltip);
    hintBtn.addEventListener('click', function() { hintTooltip.classList.toggle('visible'); });
    document.addEventListener('click', function(e) {
        if (!hintBtn.contains(e.target)) hintTooltip.classList.remove('visible');
    });

    // ===== SURPRISE ME (homepage only) =====
    var surpriseBtn = document.getElementById('surprise-me-btn');
    if (surpriseBtn) {
        surpriseBtn.addEventListener('click', function() {
            var locs = window.skatingLocations || [];
            var open = locs.filter(function(l) { return l.status === 'open'; });
            var pool = open.length ? open : locs;
            if (!pool.length) return;
            var pick = pool[Math.floor(Math.random() * pool.length)];
            window.location.href = 'details.html?id=' + pick.id;
        });
    }

    // ===== RECENTLY VIEWED + HOMEPAGE STATS =====
    // Run immediately if data is already loaded, otherwise wait for the event
    function initHomepageData() {
        renderRecentlyViewed();
        var statTotal  = document.getElementById('stat-total');
        var statOpen   = document.getElementById('stat-open');
        var statVisits = document.getElementById('stat-visits');
        var locs = window.skatingLocations || [];
        if (statTotal) statTotal.textContent = locs.length || '—';
        if (statOpen) {
            statOpen.textContent = locs.filter(function(l) {
                return l.status === 'open';
            }).length;
        }
        if (statVisits) {
            try {
                var checkins = JSON.parse(localStorage.getItem('ice-wheels-checkins') || '{}');
                var total = Object.values(checkins).reduce(function(sum, arr) { return sum + arr.length; }, 0);
                statVisits.textContent = total;
            } catch (e) { statVisits.textContent = '0'; }
        }
    }

    if (window.skatingLocations) {
        initHomepageData();
    } else {
        window.addEventListener('skatingDataReady', initHomepageData, { once: true });
    }
});

function applyLanguage(lang) {
    document.querySelectorAll('[data-en]').forEach(function(el) {
        el.textContent = lang === 'fr' ? (el.dataset.fr || el.textContent) : el.dataset.en;
    });
}

function renderRecentlyViewed() {
    var section = document.getElementById('recently-viewed-section');
    if (!section || !window.skatingLocations) return;
    try {
        var ids = JSON.parse(localStorage.getItem('ice-wheels-recently-viewed') || '[]');
        if (!ids.length) return;
        var locs = ids.map(function(id) {
            return window.skatingLocations.find(function(l) { return l.id === id; });
        }).filter(Boolean);
        if (!locs.length) return;
        section.style.display = '';
        var grid = document.getElementById('recently-viewed-grid');
        if (!grid) return;
        grid.innerHTML = locs.map(function(loc) {
            return '<a href="details.html?id=' + loc.id + '" class="rv-card">' +
                '<img src="' + loc.imageUrl + '" alt="' + loc.name + '" loading="lazy" onerror="this.src=\'images/ice-skating.jpg\'">' +
                '<div class="rv-card-info">' +
                    '<span class="rv-card-name">' + loc.name + '</span>' +
                    '<span class="status-badge status-' + loc.status + '" style="font-size:0.7rem;padding:0.1rem 0.5rem">' + loc.status + '</span>' +
                '</div></a>';
        }).join('');
    } catch (e) {}
}

function _parseMin(str) {
    var m = str.trim().match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
    if (!m) return null;
    var h = parseInt(m[1]), min = parseInt(m[2]), ampm = m[3].toUpperCase();
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return h * 60 + min;
}
function _isOpenNow(oh) {
    var days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    var hrs = oh[days[new Date().getDay()]] || '';
    var match = hrs.match(/(\d{1,2}:\d{2}\s*[AP]M)\s*-\s*(\d{1,2}:\d{2}\s*[AP]M)/i);
    if (!match) return false;
    var o = _parseMin(match[1]), c = _parseMin(match[2]);
    if (o === null || c === null) return false;
    var now = new Date(), cur = now.getHours() * 60 + now.getMinutes();
    return cur >= o && cur < c;
}
