document.addEventListener('DOMContentLoaded', function() {
    // Check if data is loaded
    if (typeof skatingLocations === 'undefined') {
        displayError("Data not loaded. Please refresh the page.");
        return;
    }
    
    //rink ID from URL
    var urlParams = new URLSearchParams(window.location.search);
    var rinkId = urlParams.get('id');
    
    if (rinkId) {
        // Finding rink data by ID
        loadRinkDetails(rinkId);
    } else {
        displayError("No rink ID provided");
    }
});

// rink details based on ID
function loadRinkDetails(rinkId) {
    // Finding rink in data
    var rink = skatingLocations.find(function(location) {
        return location.id === parseInt(rinkId);
    });
    
    if (rink) {
        displayRinkData(rink);
    } else {
        displayError("Rink not found");
    }
}

//rink data on the page
function displayRinkData(rink) {
    // Set page title
    document.title = rink.name + ' - Ice & Wheels';
    
    // Set rink name and image
    document.getElementById('rink-name').textContent = rink.name;
    
    // Set rink image
    const rinkImage = document.getElementById('rink-image');
    if (rinkImage) {
        rinkImage.src = rink.imageUrl;
        rinkImage.alt = rink.name;
        rinkImage.onerror = function() {
            this.src = 'images/ice-skating.jpg';
        };
    }
    
    // rink details
    document.getElementById('address').textContent = rink.address;
    
    //opening hours
    var formattedHours = formatOpeningHours(rink.openingHours);
    document.getElementById('opening-hours').textContent = formattedHours;

    
    //amenities
    var amenitiesText = rink.amenities ? 
        rink.amenities.map(function(amenity) { 
            return formatAmenity(amenity); 
        }).join(', ') : 
        "No amenities information available";
    document.getElementById('amenities').textContent = amenitiesText;
    
    //special events
    document.getElementById('special-events').textContent = rink.specialEvents || "No special events scheduled";
    
    //  description
    document.getElementById('description').textContent = rink.description;
    
    // image
    if (rink.imageUrl) {
        document.getElementById('rink-image').src = rink.imageUrl;
        document.getElementById('rink-image').alt = rink.name;
    } 
    // pro tips
    if (rink.proTips && rink.proTips.length > 0) {
        var proTipsList = document.getElementById('pro-tips-list');
        proTipsList.innerHTML = '';
        
        for (var i = 0; i < rink.proTips.length; i++) {
            var listItem = document.createElement('li');
            listItem.textContent = rink.proTips[i];
            proTipsList.appendChild(listItem);
        }
    }
}

function formatOpeningHours(hours) {
    if (!hours) return "Hours not available";
    
    return (hours.weekdays || "Varies") + " (Weekdays) / " + (hours.weekends || "Varies") + " (Weekends)";
}

function formatAmenity(amenity) {
    var amenityMap = {
        'rentals': 'Skate rentals',
        'washrooms': 'Washrooms',
        'food': 'Food & drink vendors',
        'parking': 'Parking'
    };
    
    return amenityMap[amenity] || amenity;
}

//error message
function displayError(message) {
    var container = document.querySelector('.rink-details-content');
    container.innerHTML = `
        <div class="error-message">
            <h2>Oops! Something went wrong</h2>
            <p>${message}</p>
            <a href="locations.html" class="cta-button">Back to Locations</a>
        </div>
    `;
}