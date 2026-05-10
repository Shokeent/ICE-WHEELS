// Fetches real rink data from City of Toronto Open Data + live status API
// Outdoor rinks: https://open.toronto.ca/dataset/outdoor-artificial-ice-rinks/
// Indoor rinks:  https://open.toronto.ca/dataset/indoor-ice-rinks/
// Live status:   https://www.toronto.ca/data/parks/live/skate_allupdates.json

(function () {
    var OUTDOOR_URL = 'https://ckan0.cf.opendata.inter.prod-toronto.ca/dataset/e51b5d31-a53c-4fc5-a204-36c43243dd3b/resource/2ae3625b-30f1-4470-bf80-ecc56ab2d674/download/outdoor-ice-rinks-4326.geojson';
    var INDOOR_URL  = 'https://ckan0.cf.opendata.inter.prod-toronto.ca/dataset/96e9989d-eca5-4e0b-824b-9789a39aea58/resource/3732a863-a629-4d71-8629-f331a83fd61f/download/indoor-ice-rinks-4326.geojson';
    var STATUS_URL  = 'https://www.toronto.ca/data/parks/live/skate_allupdates.json';

    function areaFromCouncil(council) {
        if (!council) return 'downtown';
        var c = council.toLowerCase();
        if (c.includes('north york')) return 'north-york';
        if (c.includes('etobicoke')) return 'etobicoke';
        if (c.includes('scarborough')) return 'scarborough';
        return 'downtown'; // Toronto and East York covers the inner city
    }

    function coordsFromGeometry(geometry) {
        if (!geometry || !geometry.coordinates) return null;
        // GeoJSON coordinates: [lng, lat] — MultiPoint or Point
        var raw = geometry.type === 'MultiPoint'
            ? geometry.coordinates[0]
            : geometry.coordinates;
        if (!raw || raw.length < 2) return null;
        return { lat: raw[1], lng: raw[0] };
    }

    function buildStatusMap(statusData) {
        var map = {};
        statusData.forEach(function (s) {
            // key by AssetID; also keep by AssetName for fuzzy fallback
            if (s.AssetID) map[s.AssetID] = s;
        });
        return map;
    }

    function statusCode(liveEntry) {
        if (!liveEntry) return null;
        if (liveEntry.Status === 1) return 'open';
        if (liveEntry.Status === 2) return 'maintenance';
        return 'closed';
    }

    function outdoorHours() {
        return {
            monday:    '10:00 AM - 10:00 PM',
            tuesday:   '10:00 AM - 10:00 PM',
            wednesday: '10:00 AM - 10:00 PM',
            thursday:  '10:00 AM - 10:00 PM',
            friday:    '10:00 AM - 10:00 PM',
            saturday:  '9:00 AM - 10:00 PM',
            sunday:    '9:00 AM - 10:00 PM',
            weekdays:  '10:00 AM - 10:00 PM',
            weekends:  '9:00 AM - 10:00 PM'
        };
    }

    function indoorHours() {
        return {
            monday:    '6:00 AM - 11:00 PM',
            tuesday:   '6:00 AM - 11:00 PM',
            wednesday: '6:00 AM - 11:00 PM',
            thursday:  '6:00 AM - 11:00 PM',
            friday:    '6:00 AM - 11:00 PM',
            saturday:  '6:00 AM - 11:00 PM',
            sunday:    '6:00 AM - 11:00 PM',
            weekdays:  '6:00 AM - 11:00 PM',
            weekends:  '6:00 AM - 11:00 PM'
        };
    }

    function outdoorTips(p) {
        var tips = ['Free to skate — bring your own skates or rent nearby'];
        if (p['Rink is Lit'] === 'Yes') tips.push('Lit for evening skating');
        if (p['Boards (Ice Rink)'] === 'Yes') tips.push('Boards installed — suitable for hockey');
        tips.push('Hours may vary — verify current schedule at toronto.ca');
        return tips;
    }

    function indoorTips() {
        return [
            'Public skating schedule varies — check toronto.ca or call ahead',
            'Skate rentals and sharpening typically available on-site',
            'Year-round skating regardless of weather'
        ];
    }

    function padDesc(p) {
        var len = p['Pad Length (ft.)'] || p['Pad Length'] || '';
        var wid = p['Pad Width (ft.)']  || p['Pad Width']  || '';
        return (len && wid) ? ' (' + len + '\u00d7' + wid + ' ft)' : '';
    }

    function transformOutdoor(features, statusMap) {
        var results = [];
        features.forEach(function (f) {
            var p = f.properties;
            var coords = coordsFromGeometry(f.geometry);
            if (!coords) return; // skip if no geometry
            var assetId = parseInt(p['Asset ID']) || null;
            var live = assetId ? statusMap[assetId] : null;
            var name = p['Public Name'] || p['Asset Name'] || 'Unnamed Rink';
            results.push({
                id: assetId || (10000 + results.length),
                name: name,
                type: 'ice',
                area: areaFromCouncil(p['Community Council Area']),
                surface: 'outdoor',
                address: (p['Address'] || '') + ', Toronto, ON ' + (p['Postal Code'] || ''),
                coordinates: coords,
                status: statusCode(live) || 'closed',
                liveStatusReason: live ? (live.Reason || '') : '',
                assetId: assetId,
                amenities: ['washrooms'],
                openingHours: outdoorHours(),
                rentals: { available: false },
                entryFee: 'Free',
                imageUrl: 'images/ice-skating.jpg',
                gallery: ['images/ice-skating.jpg'],
                description: name + ' is a City of Toronto outdoor artificial ice rink' +
                    padDesc(p) +
                    (p['Rink is Lit'] === 'Yes' ? ', lit for evening skating' : '') +
                    '. Free public skating during the winter season in ' +
                    (p['Community Council Area'] || 'Toronto') + '.',
                specialEvents: '',
                openMonths: [11, 12, 1, 2, 3],
                iceConditions: {
                    quality: 3,
                    lastResurfaced: null,
                    notes: (p['Ice Pad Type'] || 'Artificial') + ' ice, maintained by City of Toronto'
                },
                proTips: outdoorTips(p),
                sourceUrl: 'https://www.toronto.ca/explore-enjoy/recreation/skating/'
            });
        });
        return results;
    }

    function transformIndoor(features, statusMap) {
        // Deduplicate by Parent Asset Name — one card per arena, not per pad
        var seen = {};
        var results = [];
        features.forEach(function (f) {
            var p = f.properties;
            var parentName = p['Parent Asset Name'] || p['Asset Name'] || 'Unnamed Arena';
            if (seen[parentName]) return;
            seen[parentName] = true;
            var coords = coordsFromGeometry(f.geometry);
            if (!coords) return;
            var assetId = parseInt(p['Asset ID']) || null;
            var live = assetId ? statusMap[assetId] : null;
            var name = p['Public Name'] || parentName;
            results.push({
                id: assetId || (20000 + results.length),
                name: name,
                type: 'ice',
                area: areaFromCouncil(p['Community Council Area']),
                surface: 'indoor',
                address: (p['Address'] || '') + ', Toronto, ON ' + (p['Postal Code'] || ''),
                coordinates: coords,
                status: statusCode(live) || 'open',
                liveStatusReason: live ? (live.Reason || '') : '',
                assetId: assetId,
                amenities: ['rentals', 'washrooms', 'parking'],
                openingHours: indoorHours(),
                rentals: {
                    available: true,
                    items: ['Ice Skates', 'Helmets'],
                    prices: { skates: '$8', helmets: '$4' }
                },
                entryFee: '$5 adults / $3 youth (approx.)',
                imageUrl: 'images/ice-skating.jpg',
                gallery: ['images/ice-skating.jpg'],
                description: parentName + ' is a City of Toronto indoor ice arena offering year-round public skating sessions' +
                    padDesc(p) +
                    '. Located in ' + (p['Community Council Area'] || 'Toronto') + '.',
                specialEvents: 'Public skating sessions — check schedule online',
                openMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                iceConditions: {
                    quality: 4,
                    lastResurfaced: null,
                    notes: 'Indoor refrigerated ice — consistent quality year-round'
                },
                proTips: indoorTips(),
                sourceUrl: 'https://www.toronto.ca/explore-enjoy/recreation/skating/'
            });
        });
        return results;
    }

    function dispatch(locations) {
        window.skatingLocations = locations;
        window.dispatchEvent(new CustomEvent('skatingDataReady'));
    }

    Promise.all([
        fetch(OUTDOOR_URL).then(function (r) { return r.json(); }),
        fetch(INDOOR_URL).then(function (r) { return r.json(); }),
        fetch(STATUS_URL).then(function (r) { return r.json(); })
    ]).then(function (all) {
        var statusMap = buildStatusMap(all[2]);
        var outdoor = transformOutdoor((all[0].features || []), statusMap);
        var indoor  = transformIndoor((all[1].features || []), statusMap);
        dispatch(outdoor.concat(indoor));
    }).catch(function (err) {
        console.error('[ICE-WHEELS] Failed to load City of Toronto data:', err);
        // Dispatch with empty array so the UI shows a proper empty state
        dispatch([]);
    });
})();
