const activeFilters = {
    type: [],
    location: [],
    surface: [],
    amenities: [],
    status: []
};

let searchQuery = '';

document.addEventListener('DOMContentLoaded', function() {
    initializeFilters();
    initializeSearch();
    initializeClearFilters();

    if (typeof skatingLocations !== 'undefined' && skatingLocations.length > 0) {
        displayResults(skatingLocations);
        updateResultsCount(skatingLocations.length);
    } else {
        const resultsContainer = document.getElementById('results-container');
        if (resultsContainer) {
            resultsContainer.innerHTML = '<div style="text-align: center; padding: 2rem; color: #666;"><h3>Loading locations...</h3><p>If this message persists, please refresh the page.</p></div>';
        }
    }
});

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
        // Reset all filter arrays
        Object.keys(activeFilters).forEach(function(key) {
            activeFilters[key] = [];
        });
        // Deactivate all filter buttons
        document.querySelectorAll('.filter-btn').forEach(function(btn) {
            btn.classList.remove('active');
        });
        // Clear search
        searchQuery = '';
        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.value = '';

        updateFilterUI();
        applyFilters();
    });
}

function initializeFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    for (let i = 0; i < filterButtons.length; i++) {
        const button = filterButtons[i];
        if (button.classList.contains('active')) {
            const filterType = button.dataset.filter;
            const filterValue = button.dataset.value;
            activeFilters[filterType].push(filterValue);
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
                if (index > -1) {
                    activeFilters[filterType].splice(index, 1);
                }
            }
            updateFilterUI();
            applyFilters();
        });
    }
}

function updateFilterUI() {
    const totalActive = Object.values(activeFilters).reduce(function(sum, arr) {
        return sum + arr.length;
    }, 0);

    const badge = document.getElementById('filter-count-badge');
    const clearBtn = document.getElementById('clear-filters-btn');

    if (badge) {
        if (totalActive > 0) {
            badge.textContent = totalActive;
            badge.classList.add('visible');
        } else {
            badge.classList.remove('visible');
        }
    }
    if (clearBtn) {
        if (totalActive > 0 || searchQuery.length > 0) {
            clearBtn.classList.add('visible');
        } else {
            clearBtn.classList.remove('visible');
        }
    }
}

function applyFilters() {
    let filtered = skatingLocations.slice();

    if (activeFilters.type.length > 0) {
        filtered = filtered.filter(function(loc) {
            return activeFilters.type.indexOf(loc.type) > -1;
        });
    }
    if (activeFilters.location.length > 0) {
        filtered = filtered.filter(function(loc) {
            return activeFilters.location.indexOf(loc.area) > -1;
        });
    }
    if (activeFilters.surface.length > 0) {
        filtered = filtered.filter(function(loc) {
            return activeFilters.surface.indexOf(loc.surface) > -1;
        });
    }
    if (activeFilters.amenities.length > 0) {
        filtered = filtered.filter(function(loc) {
            return activeFilters.amenities.every(function(amenity) {
                return loc.amenities && loc.amenities.indexOf(amenity) > -1;
            });
        });
    }
    if (activeFilters.status.length > 0) {
        filtered = filtered.filter(function(loc) {
            return activeFilters.status.indexOf(loc.status) > -1;
        });
    }
    if (searchQuery.length > 0) {
        filtered = filtered.filter(function(loc) {
            return (
                loc.name.toLowerCase().indexOf(searchQuery) > -1 ||
                loc.address.toLowerCase().indexOf(searchQuery) > -1
            );
        });
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
        resultsContainer.innerHTML = `
            <div class="no-results">
                <h3>No Results Found</h3>
                <p>Try adjusting your filters or search to see more skating locations.</p>
            </div>
        `;
        return;
    }
    for (let i = 0; i < locations.length; i++) {
        const location = locations[i];
        const statusClass = 'status-' + location.status.toLowerCase();
        const locationCard = document.createElement('div');
        locationCard.className = 'rink-card';
        locationCard.innerHTML = `
            <div class="rink-card-image">
                <img src="${location.imageUrl}" alt="${location.name}" onerror="this.src='images/ice-skating.jpg'" />
            </div>
            <div class="rink-card-content">
                <h3>${location.name}</h3>
                <span class="rink-type">${location.type === 'ice' ? 'Ice Skating' : 'Roller Skating'}</span>
                <div class="rink-details">
                    <p><strong>Address:</strong> ${location.address}</p>
                    <p>
                        <span class="status-indicator ${statusClass}"></span>
                        <strong>Status:</strong> ${location.status}
                    </p>
                    <p><strong>Today's Hours:</strong> ${getTodayHours(location.openingHours)}</p>
                </div>
                <a href="details.html?id=${location.id}" class="view-details-btn">View Details</a>
            </div>
        `;
        resultsContainer.appendChild(locationCard);
    }
}

function getTodayHours(openingHours) {
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = new Date().getDay();
    const dayName = daysOfWeek[today];
    return openingHours[dayName] || 'Closed';
}
