var activeFilters = {
    type: [],
    location: [],
    surface: [],
    amenities: [],
    status: []
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('Locations page loaded');
    
    // Initializing filter 
    initializeFilters();
    document.getElementById('search-btn').addEventListener('click', function() {
        applyFilters();
    });
    
    //initial results
    displayResults(skatingLocations);
});

//filter buttons
function initializeFilters() {
    var filterButtons = document.querySelectorAll('.filter-btn');
    
    for (var i = 0; i < filterButtons.length; i++) {
        var button = filterButtons[i];
        
        if (button.classList.contains('active')) {
            var filterType = button.dataset.filter;
            var filterValue = button.dataset.value;
            activeFilters[filterType].push(filterValue);
        }
        
        button.addEventListener('click', function() {
            var filterType = this.dataset.filter;
            var filterValue = this.dataset.value;
            
            //active class
            this.classList.toggle('active');
            
            // active filters
            if (this.classList.contains('active')) {
                if (activeFilters[filterType].indexOf(filterValue) === -1) {
                    activeFilters[filterType].push(filterValue);
                }
            } else {
                var index = activeFilters[filterType].indexOf(filterValue);
                if (index > -1) {
                    activeFilters[filterType].splice(index, 1);
                }
            }
        });
    }
}

// filters and updated results
function applyFilters() {
    var filteredLocations = skatingLocations.slice(); 
    
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
    var resultsContainer = document.getElementById('results-container');
    resultsContainer.innerHTML = '';
    
    if (locations.length === 0) {
        resultsContainer.innerHTML = `
            <div class="no-results">
                <h3>No Results Found</h3>
                <p>Try adjusting your filters to see more skating locations.</p>
            </div>
        `;
        return;
    }
    
    for (var i = 0; i < locations.length; i++) {
        var location = locations[i];
        var statusClass = 'status-' + location.status.toLowerCase();
        
        var locationCard = document.createElement('div');
        locationCard.className = 'rink-card';
        locationCard.innerHTML = `
            <div class="rink-card-image" style="background-image: url('${location.imageUrl}')"></div>
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
    var daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    var today = new Date().getDay();
    var dayName = daysOfWeek[today];
    
    return openingHours[dayName] || 'Closed';
}