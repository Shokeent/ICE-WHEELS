const activeFilters = {
    type: [],
    location: [],
    surface: [],
    amenities: [],
    status: []
};

let searchQuery = '';
let showFavouritesOnly = false;

function getFavourites() {
    try {
        return JSON.parse(localStorage.getItem('ice-wheels-favourites') || '[]');
    } catch (e) {
        return [];
    }
}

function saveFavourites(favs) {
    localStorage.setItem('ice-wheels-favourites', JSON.stringify(favs));
}

function toggleFavourite(id) {
    const favs = getFavourites();
    const idx = favs.indexOf(id);
    if (idx > -1) {
        favs.splice(idx, 1);
    } else {
        favs.push(id);
    }
    saveFavourites(favs);
}

document.addEventListener('DOMContentLoaded', function() {
    initializeFilters();
    initializeSearch();
    initializeClearFilters();
    initializeFavouritesFilter();
    initializeSort();

    // Pre-fill search from URL param (e.g. from homepage search bar)
    const urlParams = new URLSearchParams(window.location.search);
    const urlSearch = urlParams.get('search');
    if (urlSearch) {
        searchQuery = urlSearch.trim().toLowerCase();
        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.value = urlSearch;
    }

    if (typeof skatingLocations !== 'undefined' && skatingLocations.length > 0) {
        applyFilters();
    } else {
        const resultsContainer = document.getElementById('results-container');
        if (resultsContainer) {
            resultsContainer.innerHTML = '<div style="text-align:center;padding:2rem;color:#666;"><h3>Loading locations...</h3><p>If this message persists, please refresh the page.</p></div>';
        }
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
        updateFilterUI();
        applyFilters();
    });
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
            return activeFilters.amenities.every(function(amenity) {
                return loc.amenities && loc.amenities.indexOf(amenity) > -1;
            });
        });
    }
    if (activeFilters.status.length > 0) {
        filtered = filtered.filter(function(loc) { return activeFilters.status.indexOf(loc.status) > -1; });
    }
    if (searchQuery.length > 0) {
        filtered = filtered.filter(function(loc) {
            return loc.name.toLowerCase().indexOf(searchQuery) > -1 ||
                   loc.address.toLowerCase().indexOf(searchQuery) > -1;
        });
    }

    // Sort
    const sortSelect = document.getElementById('sort-select');
    const sortBy = sortSelect ? sortSelect.value : 'default';
    const statusOrder = { 'open': 0, 'maintenance': 1, 'closed': 2 };
    if (sortBy === 'open-first') {
        filtered.sort(function(a, b) {
            return (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
        });
    } else if (sortBy === 'name-asc') {
        filtered.sort(function(a, b) { return a.name.localeCompare(b.name); });
    } else if (sortBy === 'area') {
        filtered.sort(function(a, b) { return a.area.localeCompare(b.area); });
    }

    displayResults(filtered);
    updateResultsCount(filtered.length);
    updateFilterUI();
}

function updateResultsCount(count) {
    const countEl = document.getElementById('results-count');
    if (!countEl) return;
    countEl.innerHTML = 'Showing <strong>' + count + '</strong> location' + (count !== 1 ? 's' : '');
}

function displayResults(locations) {
    const resultsContainer = document.getElementById('results-container');
    if (!resultsContainer) return;

    resultsContainer.innerHTML = '';
    if (!locations || locations.length === 0) {
        const msg = showFavouritesOnly
            ? '<h3>No Favourites Yet</h3><p>Tap the ❤️ on any location card to save it here.</p>'
            : '<h3>No Results Found</h3><p>Try adjusting your filters or search to see more skating locations.</p>';
        resultsContainer.innerHTML = '<div class="no-results">' + msg + '</div>';
        return;
    }

    const favs = getFavourites();
    for (let i = 0; i < locations.length; i++) {
        const location = locations[i];
        const statusClass = 'status-' + location.status.toLowerCase();
        const isFav = favs.indexOf(location.id) > -1;
        const locationCard = document.createElement('div');
        locationCard.className = 'rink-card';
        locationCard.innerHTML = `
            <div class="rink-card-image">
                <img src="${location.imageUrl}" alt="${location.name}" onerror="this.src='images/ice-skating.jpg'" />
                <button class="fav-btn${isFav ? ' active' : ''}" data-id="${location.id}" title="${isFav ? 'Remove from favourites' : 'Save to favourites'}">
                    ${isFav ? '<i class="fas fa-heart" style="color:#e74c3c"></i>' : '<i class="far fa-heart"></i>'}
                </button>
            </div>
            <div class="rink-card-content">
                <h3>${location.name}</h3>
                <span class="rink-type">${location.type === 'ice' ? '<i class="fas fa-snowflake"></i> Ice Skating' : '<i class="fas fa-person-skating"></i> Roller Skating'}</span>
                <span class="status-badge status-${location.status}">
                    <i class="fas fa-circle" style="font-size:0.45rem;vertical-align:middle"></i>
                    ${location.status.charAt(0).toUpperCase() + location.status.slice(1)}
                </span>
                <div class="rink-details">
                    <p><i class="fas fa-location-dot" style="color:#a0785a;margin-right:0.3rem"></i>${location.address}</p>
                    <p><i class="fas fa-clock" style="color:#a0785a;margin-right:0.3rem"></i>${getTodayHours(location.openingHours)}</p>
                </div>
                <a href="details.html?id=${location.id}" class="view-details-btn">View Details <i class="fas fa-arrow-right" style="font-size:0.8rem;margin-left:0.3rem"></i></a>
            </div>
        `;

        const favBtn = locationCard.querySelector('.fav-btn');
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

        resultsContainer.appendChild(locationCard);
    }
}

function getTodayHours(openingHours) {
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = new Date().getDay();
    return openingHours[daysOfWeek[today]] || 'Closed';
}
