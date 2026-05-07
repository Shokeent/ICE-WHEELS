document.addEventListener('DOMContentLoaded', function() {
    if (typeof skatingLocations === 'undefined') {
        displayError("Data not loaded. Please refresh the page.");
        return;
    }

    var urlParams = new URLSearchParams(window.location.search);
    var rinkId = urlParams.get('id');

    if (rinkId) {
        loadRinkDetails(rinkId);
    } else {
        displayError("No rink ID provided");
    }
});

function loadRinkDetails(rinkId) {
    var rink = skatingLocations.find(function(location) {
        return location.id === parseInt(rinkId);
    });

    if (rink) {
        displayRinkData(rink);
    } else {
        displayError("Rink not found");
    }
}

function displayRinkData(rink) {
    document.title = rink.name + ' - Ice & Wheels';
    document.getElementById('rink-name').textContent = rink.name;

    // Favourite button
    const favBtnDetail = document.getElementById('fav-btn-detail');
    if (favBtnDetail) {
        const updateFavBtn = function() {
            const favs = JSON.parse(localStorage.getItem('ice-wheels-favourites') || '[]');
            const isFav = favs.indexOf(rink.id) > -1;
            favBtnDetail.innerHTML = isFav ? '❤️' : '🤍';
            favBtnDetail.title = isFav ? 'Remove from favourites' : 'Save to favourites';
        };
        updateFavBtn();
        favBtnDetail.addEventListener('click', function() {
            const favs = JSON.parse(localStorage.getItem('ice-wheels-favourites') || '[]');
            const idx = favs.indexOf(rink.id);
            if (idx > -1) {
                favs.splice(idx, 1);
            } else {
                favs.push(rink.id);
            }
            localStorage.setItem('ice-wheels-favourites', JSON.stringify(favs));
            updateFavBtn();
        });
    }

    // Image
    const rinkImage = document.getElementById('rink-image');
    if (rinkImage) {
        rinkImage.src = rink.imageUrl;
        rinkImage.alt = rink.name;
        rinkImage.onerror = function() { this.src = 'images/ice-skating.jpg'; };
    }

    // Address + directions
    document.getElementById('address').textContent = rink.address;
    if (rink.coordinates) {
        const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${rink.coordinates.lat},${rink.coordinates.lng}`;
        document.getElementById('directions-container').innerHTML =
            `<a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" class="directions-btn">📍 Get Directions</a>`;
    }

    // Opening hours
    document.getElementById('opening-hours').textContent = formatOpeningHours(rink.openingHours);

    // Amenities
    var amenitiesText = rink.amenities
        ? rink.amenities.map(formatAmenity).join(', ')
        : 'No amenities information available';
    document.getElementById('amenities').textContent = amenitiesText;

    // Special events
    document.getElementById('special-events').textContent = rink.specialEvents || 'No special events scheduled';

    // Description
    document.getElementById('description').textContent = rink.description;

    // Pro tips
    if (rink.proTips && rink.proTips.length > 0) {
        var proTipsList = document.getElementById('pro-tips-list');
        proTipsList.innerHTML = '';
        for (var i = 0; i < rink.proTips.length; i++) {
            var listItem = document.createElement('li');
            listItem.textContent = rink.proTips[i];
            proTipsList.appendChild(listItem);
        }
    }

    // Map
    if (rink.coordinates && typeof L !== 'undefined') {
        const map = L.map('rink-map').setView([rink.coordinates.lat, rink.coordinates.lng], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        L.marker([rink.coordinates.lat, rink.coordinates.lng])
            .addTo(map)
            .bindPopup('<strong>' + rink.name + '</strong><br>' + rink.address)
            .openPopup();
    }
}

function formatOpeningHours(hours) {
    if (!hours) return 'Hours not available';
    return (hours.weekdays || 'Varies') + ' (Weekdays) / ' + (hours.weekends || 'Varies') + ' (Weekends)';
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

function displayError(message) {
    var container = document.getElementById('rink-details');
    if (container) {
        container.innerHTML = `
            <div style="text-align:center;padding:3rem;">
                <h2 style="color:#8B4513;">Oops! Something went wrong</h2>
                <p style="color:#666;margin:1rem 0;">${message}</p>
                <a href="locations.html" class="button button-secondary">Back to Locations</a>
            </div>
        `;
    }
}
