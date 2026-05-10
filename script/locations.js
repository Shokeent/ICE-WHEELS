// ===== STATE =====
const activeFilters = {
    type: [],
    location: [],
    surface: [],
    amenities: [],
    status: []
};

let searchQuery = '';
let showFavouritesOnly = false;
let userCoords = null;
let viewMode = 'list';
let locMap = null;
let locMarkerGroup = null;

// ===== SERVICE WORKER =====
function registerSW() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(function() {});
    }
}

// ===== DARK MODE =====
function initTheme() {
    const saved = localStorage.getItem('ice-wheels-theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcon(theme);

    const btn = document.getElementById('theme-toggle');
    if (btn) {
        btn.addEventListener('click', function() {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            const newTheme = isDark ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('ice-wheels-theme', newTheme);
            updateThemeIcon(newTheme);
            if (locMap) locMap.invalidateSize();
        });
    }
}

function updateThemeIcon(theme) {
    const icon = document.getElementById('theme-icon');
    if (icon) icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// ===== FAVOURITES =====
function getFavourites() {
    try { return JSON.parse(localStorage.getItem('ice-wheels-favourites') || '[]'); }
    catch (e) { return []; }
}

function saveFavourites(favs) {
    localStorage.setItem('ice-wheels-favourites', JSON.stringify(favs));
}

function toggleFavourite(id) {
    const favs = getFavourites();
    const idx = favs.indexOf(id);
    if (idx > -1) { favs.splice(idx, 1); } else { favs.push(id); }
    saveFavourites(favs);
}

// ===== TIME / STATUS UTILS =====
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
    return (now.getHours() * 60 + now.getMinutes()) >= openMin &&
           (now.getHours() * 60 + now.getMinutes()) < closeMin;
}

function getLiveStatus(location) {
    if (location.status === 'maintenance') return 'maintenance';
    return isOpenNow(location.openingHours) ? 'open' : 'closed';
}

function haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getTodayHours(openingHours) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return openingHours[days[new Date().getDay()]] || 'Closed';
}

// ===== URL FILTER STATE =====
function encodeFiltersToURL() {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    Object.keys(activeFilters).forEach(function(key) {
        if (activeFilters[key].length > 0) params.set(key, activeFilters[key].join(','));
    });
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect && sortSelect.value !== 'default') params.set('sort', sortSelect.value);
    if (showFavouritesOnly) params.set('favs', '1');
    const qs = params.toString();
    history.replaceState(null, '', window.location.pathname + (qs ? '?' + qs : ''));
}

function decodeFiltersFromURL() {
    const params = new URLSearchParams(window.location.search);

    const q = params.get('q') || params.get('search');
    if (q) {
        searchQuery = q.trim().toLowerCase();
        const el = document.getElementById('search-input');
        if (el) el.value = q.trim();
    }

    Object.keys(activeFilters).forEach(function(key) {
        const val = params.get(key);
        if (val) {
            activeFilters[key] = val.split(',').filter(Boolean);
            document.querySelectorAll('.filter-btn[data-filter="' + key + '"]').forEach(function(btn) {
                if (activeFilters[key].indexOf(btn.dataset.value) > -1) btn.classList.add('active');
            });
        }
    });

    const sort = params.get('sort');
    if (sort && sort !== 'near-me') {
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) sortSelect.value = sort;
    }

    if (params.get('favs') === '1') {
        showFavouritesOnly = true;
        const favBtn = document.getElementById('favourites-filter-btn');
        if (favBtn) favBtn.classList.add('active');
    }
}

// ===== INITIALISATION =====
document.addEventListener('DOMContentLoaded', function() {
    registerSW();
    initTheme();
    decodeFiltersFromURL();
    initializeFilters();
    initializeSearch();
    initializeClearFilters();
    initializeFavouritesFilter();
    initializeSort();
    initializeViewToggle();
    initializeAutocomplete();

    function onDataReady() {
        if (window.skatingLocations && window.skatingLocations.length > 0) {
            applyFilters();
            if (typeof updateTripUI !== 'undefined') updateTripUI();
            if (typeof updateCompareUI !== 'undefined') updateCompareUI();
        } else if (window.skatingLocations && window.skatingLocations.length === 0) {
            const rc = document.getElementById('results-container');
            if (rc) rc.innerHTML = '<div class="no-results"><h3>Could not load location data</h3><p>Check your connection or <a href="">refresh</a>.</p></div>';
        }
    }

    if (window.skatingLocations) {
        onDataReady();
    } else {
        window.addEventListener('skatingDataReady', onDataReady, { once: true });
    }
});

function initializeFavouritesFilter() {
    const favBtn = document.getElementById('favourites-filter-btn');
    if (!favBtn) return;
    favBtn.addEventListener('click', function() {
        showFavouritesOnly = !showFavouritesOnly;
        this.classList.toggle('active', showFavouritesOnly);
        updateFilterUI();
        applyFilters();
    });
}

function initializeSort() {
    const sortSelect = document.getElementById('sort-select');
    if (!sortSelect) return;
    sortSelect.addEventListener('change', function() {
        if (this.value === 'near-me') {
            requestNearMe(this);
            return;
        }
        userCoords = null;
        updateFilterUI();
        applyFilters();
    });
}

function requestNearMe(selectEl) {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser.');
        selectEl.value = 'default';
        return;
    }
    selectEl.disabled = true;
    navigator.geolocation.getCurrentPosition(
        function(pos) {
            selectEl.disabled = false;
            userCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            updateFilterUI();
            applyFilters();
        },
        function() {
            selectEl.disabled = false;
            selectEl.value = 'default';
            userCoords = null;
            alert('Unable to get your location. Please allow location access and try again.');
        }
    );
}

function initializeSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;
    searchInput.addEventListener('input', function() {
        searchQuery = this.value.trim().toLowerCase();
        applyFilters();
    });
}

function initializeClearFilters() {
    const clearBtn = document.getElementById('clear-filters-btn');
    if (!clearBtn) return;
    clearBtn.addEventListener('click', function() {
        Object.keys(activeFilters).forEach(function(key) { activeFilters[key] = []; });
        document.querySelectorAll('.filter-btn').forEach(function(btn) { btn.classList.remove('active'); });
        searchQuery = '';
        showFavouritesOnly = false;
        userCoords = null;
        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.value = '';
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) sortSelect.value = 'default';
        updateFilterUI();
        applyFilters();
    });
}

function initializeFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn:not(#favourites-filter-btn)');
    for (let i = 0; i < filterButtons.length; i++) {
        const button = filterButtons[i];
        if (button.classList.contains('active')) {
            activeFilters[button.dataset.filter].push(button.dataset.value);
        }
        button.addEventListener('click', function() {
            const filterType = this.dataset.filter;
            const filterValue = this.dataset.value;
            this.classList.toggle('active');
            if (this.classList.contains('active')) {
                if (activeFilters[filterType].indexOf(filterValue) === -1) {
                    activeFilters[filterType].push(filterValue);
                }
            } else {
                const index = activeFilters[filterType].indexOf(filterValue);
                if (index > -1) activeFilters[filterType].splice(index, 1);
            }
            updateFilterUI();
            applyFilters();
        });
    }
}

function initializeViewToggle() {
    const listBtn = document.getElementById('view-list-btn');
    const mapBtn  = document.getElementById('view-map-btn');
    if (!listBtn || !mapBtn) return;

    listBtn.addEventListener('click', function() {
        if (viewMode === 'list') return;
        viewMode = 'list';
        listBtn.classList.add('active');
        mapBtn.classList.remove('active');
        const rc = document.getElementById('results-container');
        const mc = document.getElementById('map-view-container');
        if (rc) rc.style.display = '';
        if (mc) mc.style.display = 'none';
    });

    mapBtn.addEventListener('click', function() {
        if (viewMode === 'map') return;
        viewMode = 'map';
        mapBtn.classList.add('active');
        listBtn.classList.remove('active');
        const rc = document.getElementById('results-container');
        const mc = document.getElementById('map-view-container');
        if (rc) rc.style.display = 'none';
        if (mc) mc.style.display = '';
        applyFilters();
        if (locMap) setTimeout(function() { locMap.invalidateSize(); }, 50);
    });
}

function initializeAutocomplete() {
    const input = document.getElementById('search-input');
    const suggestionsEl = document.getElementById('search-suggestions');
    if (!input || !suggestionsEl) return;

    let activeIdx = -1;

    function getSuggestions(query) {
        if (!query || query.length < 1) return [];
        const q = query.toLowerCase();
        const results = [];
        const seen = new Set();

        skatingLocations.forEach(function(loc) {
            if (loc.name.toLowerCase().includes(q) && !seen.has(loc.name)) {
                results.push({ text: loc.name, sub: loc.area.replace(/-/g, ' ') });
                seen.add(loc.name);
            }
        });

        const areas = ['Downtown', 'Midtown', 'North York', 'Etobicoke', 'Scarborough'];
        areas.forEach(function(area) {
            if (area.toLowerCase().includes(q) && !seen.has(area)) {
                results.push({ text: area, sub: 'area' });
                seen.add(area);
            }
        });

        return results.slice(0, 6);
    }

    function renderSuggestions(query) {
        const items = getSuggestions(query);
        activeIdx = -1;
        if (items.length === 0) { suggestionsEl.hidden = true; return; }
        suggestionsEl.innerHTML = items.map(function(item) {
            return '<div class="suggestion-item" data-value="' + item.text + '">' +
                '<span class="suggestion-text">' + item.text + '</span>' +
                '<span class="suggestion-sub">' + item.sub + '</span>' +
                '</div>';
        }).join('');
        suggestionsEl.hidden = false;

        suggestionsEl.querySelectorAll('.suggestion-item').forEach(function(el) {
            el.addEventListener('mousedown', function(e) {
                e.preventDefault();
                input.value = this.dataset.value;
                searchQuery = this.dataset.value.toLowerCase();
                suggestionsEl.hidden = true;
                applyFilters();
            });
        });
    }

    input.addEventListener('input', function() { renderSuggestions(this.value.trim()); });
    input.addEventListener('blur', function() {
        setTimeout(function() { suggestionsEl.hidden = true; }, 150);
    });
    input.addEventListener('focus', function() {
        if (this.value.trim()) renderSuggestions(this.value.trim());
    });

    input.addEventListener('keydown', function(e) {
        if (suggestionsEl.hidden) return;
        const items = suggestionsEl.querySelectorAll('.suggestion-item');
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            activeIdx = Math.min(activeIdx + 1, items.length - 1);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeIdx = Math.max(activeIdx - 1, -1);
        } else if (e.key === 'Enter' && activeIdx > -1) {
            e.preventDefault();
            items[activeIdx].dispatchEvent(new MouseEvent('mousedown'));
            return;
        } else if (e.key === 'Escape') {
            suggestionsEl.hidden = true;
            activeIdx = -1;
            return;
        } else { return; }

        items.forEach(function(item, i) { item.classList.toggle('active', i === activeIdx); });
        if (activeIdx > -1) input.value = items[activeIdx].dataset.value;
    });
}

// ===== FILTER UI =====
function updateFilterUI() {
    const totalActive = Object.values(activeFilters).reduce(function(sum, arr) {
        return sum + arr.length;
    }, 0) + (showFavouritesOnly ? 1 : 0);

    const badge = document.getElementById('filter-count-badge');
    const clearBtn = document.getElementById('clear-filters-btn');
    const sortSelect = document.getElementById('sort-select');
    const sortChanged = sortSelect && sortSelect.value !== 'default';

    if (badge) {
        badge.textContent = totalActive;
        badge.classList.toggle('visible', totalActive > 0);
    }
    if (clearBtn) {
        clearBtn.classList.toggle('visible', totalActive > 0 || searchQuery.length > 0 || sortChanged);
    }
}

// ===== CORE FILTER + SORT =====
function applyFilters() {
    let filtered = skatingLocations.slice();

    if (showFavouritesOnly) {
        const favs = getFavourites();
        filtered = filtered.filter(function(loc) { return favs.indexOf(loc.id) > -1; });
    }
    if (activeFilters.type.length > 0) {
        filtered = filtered.filter(function(loc) { return activeFilters.type.indexOf(loc.type) > -1; });
    }
    if (activeFilters.location.length > 0) {
        filtered = filtered.filter(function(loc) { return activeFilters.location.indexOf(loc.area) > -1; });
    }
    if (activeFilters.surface.length > 0) {
        filtered = filtered.filter(function(loc) { return activeFilters.surface.indexOf(loc.surface) > -1; });
    }
    if (activeFilters.amenities.length > 0) {
        filtered = filtered.filter(function(loc) {
            return activeFilters.amenities.every(function(a) {
                return loc.amenities && loc.amenities.indexOf(a) > -1;
            });
        });
    }
    if (activeFilters.status.length > 0) {
        filtered = filtered.filter(function(loc) { return activeFilters.status.indexOf(loc.status) > -1; });
    }
    if (searchQuery.length > 0) {
        filtered = filtered.filter(function(loc) {
            return loc.name.toLowerCase().includes(searchQuery) ||
                   loc.address.toLowerCase().includes(searchQuery);
        });
    }

    const sortSelect = document.getElementById('sort-select');
    const sortBy = sortSelect ? sortSelect.value : 'default';
    const statusOrder = { open: 0, maintenance: 1, closed: 2 };

    if (sortBy === 'open-first') {
        filtered.sort(function(a, b) { return (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0); });
    } else if (sortBy === 'name-asc') {
        filtered.sort(function(a, b) { return a.name.localeCompare(b.name); });
    } else if (sortBy === 'area') {
        filtered.sort(function(a, b) { return a.area.localeCompare(b.area); });
    } else if (sortBy === 'near-me' && userCoords) {
        filtered.sort(function(a, b) {
            return haversineKm(userCoords.lat, userCoords.lng, a.coordinates.lat, a.coordinates.lng) -
                   haversineKm(userCoords.lat, userCoords.lng, b.coordinates.lat, b.coordinates.lng);
        });
    }

    if (viewMode === 'map') {
        displayMap(filtered);
    } else {
        displayResults(filtered, sortBy);
    }
    updateResultsCount(filtered.length);
    updateFilterUI();
    encodeFiltersToURL();
}

function updateResultsCount(count) {
    const countEl = document.getElementById('results-count');
    if (!countEl) return;
    countEl.innerHTML = 'Showing <strong>' + count + '</strong> location' + (count !== 1 ? 's' : '');
}

// ===== LIST VIEW =====
function displayResults(locations, sortBy) {
    const resultsContainer = document.getElementById('results-container');
    if (!resultsContainer) return;

    resultsContainer.innerHTML = '';
    if (!locations || locations.length === 0) {
        const msg = showFavouritesOnly
            ? '<h3>No Favourites Yet</h3><p>Tap the heart on any location card to save it here.</p>'
            : '<h3>No Results Found</h3><p>Try adjusting your filters or search to see more skating locations.</p>';
        resultsContainer.innerHTML = '<div class="no-results">' + msg + '</div>';
        return;
    }

    const favs = getFavourites();
    const showDistance = sortBy === 'near-me' && userCoords;

    locations.forEach(function(location) {
        const liveStatus = getLiveStatus(location);
        const liveLabel = liveStatus === 'open' ? 'Open Now' : (liveStatus.charAt(0).toUpperCase() + liveStatus.slice(1));
        const isFav = favs.indexOf(location.id) > -1;

        let distanceHtml = '';
        if (showDistance) {
            const km = haversineKm(userCoords.lat, userCoords.lng, location.coordinates.lat, location.coordinates.lng);
            distanceHtml = '<span class="distance-badge"><i class="fas fa-location-crosshairs"></i> ' + km.toFixed(1) + ' km away</span>';
        }

        var cardStars = (typeof getCardStarHtml !== 'undefined') ? getCardStarHtml(location.id) : '';
        var inTrip = (typeof isInTrip !== 'undefined') ? isInTrip(location.id) : false;
        var inCompare = (typeof getCompareIds !== 'undefined') ? (getCompareIds().indexOf(location.id) > -1) : false;

        const card = document.createElement('div');
        card.className = 'rink-card';
        card.innerHTML =
            '<div class="rink-card-image">' +
                '<img loading="lazy" src="' + location.imageUrl + '" alt="' + location.name + '" onerror="this.src=\'images/ice-skating.jpg\'" />' +
                '<button class="fav-btn' + (isFav ? ' active' : '') + '" data-id="' + location.id + '" title="' + (isFav ? 'Remove from favourites' : 'Save to favourites') + '">' +
                    (isFav ? '<i class="fas fa-heart" style="color:#e74c3c"></i>' : '<i class="far fa-heart"></i>') +
                '</button>' +
            '</div>' +
            '<div class="rink-card-content">' +
                '<h3>' + location.name + '</h3>' +
                (cardStars ? '<div class="card-stars-row">' + cardStars + '</div>' : '') +
                '<span class="rink-type">' + (location.type === 'ice' ? '<i class="fas fa-snowflake"></i> Ice Skating' : '<i class="fas fa-person-skating"></i> Roller Skating') + '</span>' +
                '<span class="status-badge status-' + liveStatus + '">' +
                    '<i class="fas fa-circle" style="font-size:0.45rem;vertical-align:middle"></i> ' + liveLabel +
                '</span>' +
                '<div class="rink-details">' +
                    '<p><i class="fas fa-location-dot" style="color:#a0785a;margin-right:0.3rem"></i>' + location.address + '</p>' +
                    '<p><i class="fas fa-clock" style="color:#a0785a;margin-right:0.3rem"></i>' + getTodayHours(location.openingHours) + '</p>' +
                '</div>' +
                distanceHtml +
                '<div class="card-action-row">' +
                    '<a href="details.html?id=' + location.id + '" class="view-details-btn">View Details <i class="fas fa-arrow-right" style="font-size:0.8rem;margin-left:0.3rem"></i></a>' +
                    '<button class="card-trip-btn add-trip-btn' + (inTrip ? ' active' : '') + '" data-id="' + location.id + '" title="' + (inTrip ? 'Remove from trip' : 'Add to trip') + '">' +
                        '<i class="fas fa-route"></i>' +
                    '</button>' +
                    '<button class="card-compare-btn compare-btn' + (inCompare ? ' active' : '') + '" data-id="' + location.id + '" title="Compare this location">' +
                        '<i class="fas fa-' + (inCompare ? 'check' : 'sliders') + '"></i>' +
                    '</button>' +
                '</div>' +
            '</div>';

        const favBtn = card.querySelector('.fav-btn');
        favBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const id = parseInt(this.dataset.id);
            toggleFavourite(id);
            const nowFav = getFavourites().indexOf(id) > -1;
            this.classList.toggle('active', nowFav);
            this.innerHTML = nowFav ? '<i class="fas fa-heart" style="color:#e74c3c"></i>' : '<i class="far fa-heart"></i>';
            this.title = nowFav ? 'Remove from favourites' : 'Save to favourites';
            if (showFavouritesOnly) applyFilters();
        });

        var tripBtn = card.querySelector('.card-trip-btn');
        if (tripBtn && typeof addToTrip !== 'undefined') {
            tripBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                var id = parseInt(this.dataset.id);
                if (isInTrip(id)) { removeFromTrip(id); } else { addToTrip(id); }
                updateTripUI();
            });
        }

        var compareBtn = card.querySelector('.card-compare-btn');
        if (compareBtn && typeof toggleCompare !== 'undefined') {
            compareBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                toggleCompare(parseInt(this.dataset.id));
            });
        }

        resultsContainer.appendChild(card);
    });
}

// ===== MAP VIEW =====
function displayMap(locations) {
    if (typeof L === 'undefined') return;
    const mapContainer = document.getElementById('locations-map');
    if (!mapContainer) return;

    if (!locMap) {
        locMap = L.map('locations-map').setView([43.706, -79.38], 11);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(locMap);
        locMarkerGroup = L.layerGroup().addTo(locMap);
    }

    locMarkerGroup.clearLayers();

    const statusColors = { open: '#28a745', closed: '#dc3545', maintenance: '#f0a500' };
    const typeColors   = { ice: '#3b82f6', roller: '#8b5cf6' };

    locations.forEach(function(loc) {
        const liveStatus  = getLiveStatus(loc);
        const statusColor = statusColors[liveStatus] || '#666';
        const typeColor   = typeColors[loc.type] || '#666';
        const liveLabel   = liveStatus === 'open' ? 'Open Now' : (liveStatus.charAt(0).toUpperCase() + liveStatus.slice(1));
        const typeIcon    = loc.type === 'ice' ? '🧊' : '🛼';

        const icon = L.divIcon({
            className: '',
            html: '<div style="width:26px;height:26px;border-radius:50%;background:' + statusColor +
                  ';border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;">' +
                  '<div style="width:10px;height:10px;border-radius:50%;background:' + typeColor + ';"></div></div>',
            iconSize: [26, 26], iconAnchor: [13, 13], popupAnchor: [0, -15]
        });

        const marker = L.marker([loc.coordinates.lat, loc.coordinates.lng], { icon: icon });
        marker.bindPopup(
            '<div class="map-popup">' +
            '<div class="map-popup-title">' + typeIcon + ' ' + loc.name + '</div>' +
            '<div class="map-popup-status" style="color:' + statusColor + '">&#9679; ' + liveLabel + '</div>' +
            '<div class="map-popup-address"><i class="fas fa-location-dot"></i> ' + loc.address + '</div>' +
            '<div class="map-popup-hours"><i class="fas fa-clock"></i> ' + getTodayHours(loc.openingHours) + '</div>' +
            '<a href="details.html?id=' + loc.id + '" class="map-popup-link">View Details <i class="fas fa-arrow-right"></i></a>' +
            '</div>',
            { maxWidth: 260 }
        );
        locMarkerGroup.addLayer(marker);
    });

    if (locations.length > 0) {
        const layers = locMarkerGroup.getLayers();
        if (layers.length > 0) {
            locMap.fitBounds(L.featureGroup(layers).getBounds().pad(0.1));
        }
    }
}
