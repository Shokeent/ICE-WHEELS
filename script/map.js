document.addEventListener('DOMContentLoaded', function() {
    // SW registration
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(function() {});

    // Dark mode
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
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const navMenu = document.getElementById('nav-menu');
    if (hamburgerBtn && navMenu) {
        hamburgerBtn.addEventListener('click', function() {
            this.classList.toggle('active');
            navMenu.classList.toggle('nav-open');
        });
    }

    function initMap() {
        if (!window.skatingLocations) return;

        var countEl = document.getElementById('map-location-count');
        if (countEl) {
            countEl.textContent = skatingLocations.length + ' locations across Toronto — click a marker for details';
        }

        const map = L.map('full-map').setView([43.706, -79.38], 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);

    const statusColors = {
        open: '#28a745',
        closed: '#dc3545',
        maintenance: '#f0a500'
    };

    const typeColors = {
        ice: '#3b82f6',
        roller: '#8b5cf6'
    };

    function getTodayHours(openingHours) {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        return openingHours[days[new Date().getDay()]] || 'Closed';
    }

    function parseTimeToMinutes(str) {
        const m = str.trim().match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
        if (!m) return null;
        let h = parseInt(m[1]);
        const min = parseInt(m[2]);
        const ampm = m[3].toUpperCase();
        if (ampm === 'PM' && h !== 12) h += 12;
        if (ampm === 'AM' && h === 12) h = 0;
        return h * 60 + min;
    }

    function isOpenNow(openingHours) {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const todayHours = openingHours[days[new Date().getDay()]] || '';
        const match = todayHours.match(/(\d{1,2}:\d{2}\s*[AP]M)\s*-\s*(\d{1,2}:\d{2}\s*[AP]M)/i);
        if (!match) return false;
        const openMin = parseTimeToMinutes(match[1]);
        const closeMin = parseTimeToMinutes(match[2]);
        if (openMin === null || closeMin === null) return false;
        const now = new Date();
        const currentMin = now.getHours() * 60 + now.getMinutes();
        return currentMin >= openMin && currentMin < closeMin;
    }

    function getLiveStatus(loc) {
        if (loc.status === 'maintenance') return 'maintenance';
        return isOpenNow(loc.openingHours) ? 'open' : 'closed';
    }

    skatingLocations.forEach(function(loc) {
        const liveStatus = getLiveStatus(loc);
        const statusColor = statusColors[liveStatus] || '#666';
        const typeColor = typeColors[loc.type] || '#666';
        const todayHours = getTodayHours(loc.openingHours);
        const typeIcon = loc.type === 'ice' ? '🧊' : '🛼';
        const liveLabel = liveStatus === 'open' ? 'Open Now' : (liveStatus.charAt(0).toUpperCase() + liveStatus.slice(1));

        // Outer ring shows status colour; inner dot shows type colour
        const icon = L.divIcon({
            className: '',
            html: '<div style="width:28px;height:28px;border-radius:50%;background:' + statusColor + ';border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;">' +
                  '<div style="width:12px;height:12px;border-radius:50%;background:' + typeColor + ';"></div></div>',
            iconSize: [28, 28],
            iconAnchor: [14, 14],
            popupAnchor: [0, -16]
        });

        const marker = L.marker([loc.coordinates.lat, loc.coordinates.lng], { icon: icon });

        marker.bindPopup(
            '<div class="map-popup">' +
            '<div class="map-popup-title">' + typeIcon + ' ' + loc.name + '</div>' +
            '<div class="map-popup-status" style="color:' + statusColor + '">' +
            '&#9679; ' + liveLabel +
            '</div>' +
            '<div class="map-popup-address"><i class="fas fa-location-dot"></i> ' + loc.address + '</div>' +
            '<div class="map-popup-hours"><i class="fas fa-clock"></i> ' + todayHours + '</div>' +
            '<a href="details.html?id=' + loc.id + '" class="map-popup-link">View Details <i class="fas fa-arrow-right"></i></a>' +
            '</div>',
            { maxWidth: 260 }
        );

        marker.addTo(map);
    });
}

    if (window.skatingLocations) {
        initMap();
    } else {
        window.addEventListener('skatingDataReady', initMap, { once: true });
    }
});
