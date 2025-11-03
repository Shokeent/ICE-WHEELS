const activeFilters = {
    type: [],
    location: [],
    surface: [],
    amenities: [],
    status: []
};

document.addEventListener('DOMContentLoaded', function() {
    // Initializing filter 
    initializeFilters();
    
    // Check if data exists and display
    if (typeof skatingLocations !== 'undefined' && skatingLocations.length > 0) {
        displayResults(skatingLocations);
    } else {
        const resultsContainer = document.getElementById('results-container');
        if (resultsContainer) {
            resultsContainer.innerHTML = '<div style="text-align: center; padding: 2rem; color: #666;"><h3>Loading locations...</h3><p>If this message persists, please refresh the page.</p></div>';
        }
    }
});

//filter buttons
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
            //active class
            this.classList.toggle('active');
            // active filters
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
            // Instantly apply filters when a filter button is clicked
            applyFilters();
        });
    }
}

// filters and updated results
function applyFilters() {
    let filteredLocations = skatingLocations.slice(); 
    // Filter by type
    if (activeFilters.type.length > 0) {
        filteredLocations = filteredLocations.filter(function(location) {
            return activeFilters.type.indexOf(location.type) > -1;
        });
    }
    // Filter by location
    if (activeFilters.location.length > 0) {
        filteredLocations = filteredLocations.filter(function(location) {
            return activeFilters.location.indexOf(location.area) > -1;
        });
    }
    // Filter by surface
    if (activeFilters.surface.length > 0) {
        filteredLocations = filteredLocations.filter(function(location) {
            return activeFilters.surface.indexOf(location.surface) > -1;
        });
    }
    // Filter by amenities
    if (activeFilters.amenities.length > 0) {
        filteredLocations = filteredLocations.filter(function(location) {
            return activeFilters.amenities.every(function(amenity) {
                return location.amenities && location.amenities.indexOf(amenity) > -1;
            });
        });
    }
    // Filter by status
    if (activeFilters.status.length > 0) {
        filteredLocations = filteredLocations.filter(function(location) {
            return activeFilters.status.indexOf(location.status) > -1;
        });
    }
    // filtered results
    displayResults(filteredLocations);
}

// displaying results based on filters
function displayResults(locations) {
    const resultsContainer = document.getElementById('results-container');
    if (!resultsContainer) {
        return;
    }
    
    resultsContainer.innerHTML = '';
    if (!locations || locations.length === 0) {
        resultsContainer.innerHTML = `
            <div class="no-results">
                <h3>No Results Found</h3>
                <p>Try adjusting your filters to see more skating locations.</p>
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

// getting today's hours
function getTodayHours(openingHours) {
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = new Date().getDay();
    const dayName = daysOfWeek[today];
    return openingHours[dayName] || 'Closed';
}