// ===== TRIP PLANNER =====
// Storage: ice-wheels-trip → [id, id, ...]

function getTripIds() {
    try { return JSON.parse(localStorage.getItem('ice-wheels-trip') || '[]'); }
    catch (e) { return []; }
}

function saveTripIds(ids) {
    localStorage.setItem('ice-wheels-trip', JSON.stringify(ids));
}

function addToTrip(id) {
    var ids = getTripIds();
    if (ids.indexOf(id) === -1 && ids.length < 8) ids.push(id);
    saveTripIds(ids);
    updateTripUI();
}

function removeFromTrip(id) {
    var ids = getTripIds().filter(function(i) { return i !== id; });
    saveTripIds(ids);
    updateTripUI();
}

function clearTrip() {
    saveTripIds([]);
    updateTripUI();
}

function isInTrip(id) {
    return getTripIds().indexOf(id) > -1;
}

function buildMapsURL(ids) {
    if (!ids.length || typeof skatingLocations === 'undefined') return '#';
    var locs = ids.map(function(id) {
        return skatingLocations.find(function(l) { return l.id === id; });
    }).filter(Boolean);
    if (!locs.length) return '#';
    if (locs.length === 1) {
        return 'https://www.google.com/maps/dir/?api=1&destination=' + locs[0].coordinates.lat + ',' + locs[0].coordinates.lng;
    }
    var dest = locs[locs.length - 1];
    var waypoints = locs.slice(0, -1).map(function(l) {
        return l.coordinates.lat + ',' + l.coordinates.lng;
    }).join('|');
    return 'https://www.google.com/maps/dir/?api=1&waypoints=' + encodeURIComponent(waypoints) +
           '&destination=' + dest.coordinates.lat + ',' + dest.coordinates.lng;
}

function buildShareText(ids) {
    if (!ids.length || typeof skatingLocations === 'undefined') return '';
    var locs = ids.map(function(id) {
        return skatingLocations.find(function(l) { return l.id === id; });
    }).filter(Boolean);
    var text = 'My skating trip plan:\n\n';
    locs.forEach(function(l, i) {
        text += (i + 1) + '. ' + l.name + '\n   ' + l.address + '\n';
    });
    text += '\nPlan your trip at: ' + window.location.origin + '/locations.html';
    return text;
}

function updateTripUI() {
    var ids = getTripIds();
    var tray = document.getElementById('trip-tray');
    if (!tray) return;

    // Update add-to-trip buttons everywhere
    document.querySelectorAll('.add-trip-btn').forEach(function(btn) {
        var id = parseInt(btn.dataset.id);
        var inTrip = ids.indexOf(id) > -1;
        btn.classList.toggle('active', inTrip);
        btn.title = inTrip ? 'Remove from trip' : 'Add to trip';
        btn.innerHTML = inTrip
            ? '<i class="fas fa-route"></i> In Trip'
            : '<i class="fas fa-route"></i> Add to Trip';
    });

    if (!ids.length) {
        tray.classList.remove('visible');
        return;
    }
    tray.classList.add('visible');

    var chipsEl = document.getElementById('trip-chips');
    var countEl = document.getElementById('trip-count');
    if (countEl) countEl.textContent = ids.length;

    if (chipsEl && typeof skatingLocations !== 'undefined') {
        chipsEl.innerHTML = ids.map(function(id) {
            var loc = skatingLocations.find(function(l) { return l.id === id; });
            if (!loc) return '';
            return '<span class="trip-chip">' +
                '<span class="trip-chip-name">' + loc.name + '</span>' +
                '<button class="trip-chip-remove" data-id="' + id + '" title="Remove">&times;</button>' +
                '</span>';
        }).join('');

        chipsEl.querySelectorAll('.trip-chip-remove').forEach(function(btn) {
            btn.addEventListener('click', function() {
                removeFromTrip(parseInt(this.dataset.id));
            });
        });
    }
}

// ===== LOCATION COMPARISON =====
// Storage: ice-wheels-compare → [id, id] (max 2)

function getCompareIds() {
    try { return JSON.parse(localStorage.getItem('ice-wheels-compare') || '[]'); }
    catch (e) { return []; }
}

function saveCompareIds(ids) {
    localStorage.setItem('ice-wheels-compare', JSON.stringify(ids));
}

function toggleCompare(id) {
    var ids = getCompareIds();
    var idx = ids.indexOf(id);
    if (idx > -1) {
        ids.splice(idx, 1);
    } else {
        if (ids.length >= 2) ids.shift();
        ids.push(id);
    }
    saveCompareIds(ids);
    updateCompareUI();
}

function updateCompareUI() {
    var ids = getCompareIds();
    var bar = document.getElementById('compare-bar');

    document.querySelectorAll('.compare-btn').forEach(function(btn) {
        var id = parseInt(btn.dataset.id);
        var inCompare = ids.indexOf(id) > -1;
        btn.classList.toggle('active', inCompare);
        btn.title = inCompare ? 'Remove from comparison' : 'Compare this location';
        btn.innerHTML = '<i class="fas fa-' + (inCompare ? 'check' : 'sliders') + '"></i> Compare';
    });

    if (!bar) return;
    if (!ids.length) { bar.classList.remove('visible'); return; }

    bar.classList.add('visible');
    var namesEl = document.getElementById('compare-names');
    var compareBtn = document.getElementById('compare-now-btn');

    if (namesEl && typeof skatingLocations !== 'undefined') {
        namesEl.innerHTML = ids.map(function(id) {
            var loc = skatingLocations.find(function(l) { return l.id === id; });
            return loc ? ('<span class="compare-name-chip">' + loc.name + '</span>') : '';
        }).join('<span class="compare-vs">vs</span>');
    }
    if (compareBtn) compareBtn.disabled = ids.length < 2;
}

function openCompareModal() {
    var ids = getCompareIds();
    if (ids.length < 2 || typeof skatingLocations === 'undefined') return;

    var locs = ids.map(function(id) {
        return skatingLocations.find(function(l) { return l.id === id; });
    }).filter(Boolean);
    if (locs.length < 2) return;

    function amenityList(arr) {
        if (!arr || !arr.length) return 'None listed';
        var map = { rentals: 'Skate Rentals', washrooms: 'Washrooms', food: 'Food', parking: 'Parking' };
        return arr.map(function(a) { return map[a] || a; }).join(', ');
    }

    var rows = [
        ['Type', function(l) { return l.type === 'ice' ? '🧊 Ice Skating' : '🛼 Roller Skating'; }],
        ['Area', function(l) { return l.area.replace('-', ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); }); }],
        ['Surface', function(l) { return l.surface.charAt(0).toUpperCase() + l.surface.slice(1); }],
        ['Entry Fee', function(l) { return l.entryFee || 'N/A'; }],
        ['Weekday Hours', function(l) { return (l.openingHours && l.openingHours.weekdays) || 'N/A'; }],
        ['Weekend Hours', function(l) { return (l.openingHours && l.openingHours.weekends) || 'N/A'; }],
        ['Amenities', function(l) { return amenityList(l.amenities); }],
        ['Rentals', function(l) { return l.rentals && l.rentals.available ? 'Available' : 'Not available'; }]
    ];

    var tableHtml = '<table class="compare-table"><thead><tr>' +
        '<th></th>' +
        '<th><img src="' + locs[0].imageUrl + '" class="compare-thumb" alt="' + locs[0].name + '"><br>' + locs[0].name + '</th>' +
        '<th><img src="' + locs[1].imageUrl + '" class="compare-thumb" alt="' + locs[1].name + '"><br>' + locs[1].name + '</th>' +
        '</tr></thead><tbody>';

    rows.forEach(function(row) {
        var val0 = row[1](locs[0]);
        var val1 = row[1](locs[1]);
        tableHtml += '<tr><td class="compare-row-label">' + row[0] + '</td>' +
            '<td>' + val0 + '</td>' +
            '<td>' + val1 + '</td></tr>';
    });
    tableHtml += '</tbody></table>';

    openModal('Compare Locations', tableHtml);
}

// ===== SHARED MODAL HELPER =====
function openModal(title, bodyHtml) {
    var existing = document.getElementById('shared-modal');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'shared-modal';
    overlay.innerHTML =
        '<div class="modal-card">' +
            '<div class="modal-header">' +
                '<h3 class="modal-title">' + title + '</h3>' +
                '<button class="modal-close" aria-label="Close">&times;</button>' +
            '</div>' +
            '<div class="modal-body">' + bodyHtml + '</div>' +
        '</div>';

    document.body.appendChild(overlay);
    requestAnimationFrame(function() { overlay.classList.add('visible'); });

    overlay.querySelector('.modal-close').addEventListener('click', closeModal);
    overlay.addEventListener('click', function(e) { if (e.target === overlay) closeModal(); });
}

function closeModal() {
    var overlay = document.getElementById('shared-modal');
    if (overlay) {
        overlay.classList.remove('visible');
        setTimeout(function() { if (overlay.parentNode) overlay.remove(); }, 250);
    }
}
