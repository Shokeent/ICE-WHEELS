// Fetches real rink data from City of Toronto Open Data + live status API
// Outdoor rinks: https://open.toronto.ca/dataset/outdoor-artificial-ice-rinks/
// Indoor rinks:  https://open.toronto.ca/dataset/indoor-ice-rinks/
// Live status:   https://www.toronto.ca/data/parks/live/skate_allupdates.json

(function () {
    var OUTDOOR_URL = '/api/outdoor-rinks';
    var INDOOR_URL  = '/api/indoor-rinks';
    var STATUS_URL  = '/api/status';

    var CACHE_KEY = 'ice-wheels-api-cache-v4';
    var CACHE_TTL = 60 * 60 * 1000; // 1 hour

    function loadFromCache() {
        try {
            var raw = localStorage.getItem(CACHE_KEY);
            if (!raw) return null;
            var cached = JSON.parse(raw);
            if (Date.now() - cached.ts > CACHE_TTL) return null;
            return cached.data;
        } catch (e) { return null; }
    }

    function saveToCache(data) {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: data }));
        } catch (e) {}
    }

    function areaFromCouncil(council, lat) {
        if (!council) return 'downtown';
        var c = council.toLowerCase();
        if (c.includes('north york')) return 'north-york';
        if (c.includes('etobicoke')) return 'etobicoke';
        if (c.includes('scarborough')) return 'scarborough';
        // Toronto and East York: split by latitude — above Bloor (~43.67°N) = midtown
        if (lat && lat > 43.67) return 'midtown';
        return 'downtown';
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
        // Actual API shape: {locations: {id_123: [{Status:1,...}], ...}}
        if (statusData && statusData.locations && typeof statusData.locations === 'object') {
            Object.keys(statusData.locations).forEach(function(key) {
                var assetId = parseInt(key.replace('id_', ''), 10);
                var entries = statusData.locations[key];
                if (Array.isArray(entries) && entries.length > 0) {
                    map[assetId] = entries[0];
                }
            });
            return map;
        }
        // Fallback: legacy array shape [{AssetID:123, Status:1}, ...]
        if (Array.isArray(statusData)) {
            statusData.forEach(function(s) {
                if (s.AssetID) map[s.AssetID] = s;
            });
        }
        return map;
    }

    function statusCode(liveEntry) {
        if (!liveEntry) return null;
        if (liveEntry.Status === 1) return 'open';
        if (liveEntry.Status === 2) return 'maintenance';
        return 'closed';
    }

    function aerialUrl(coords) {
        var d = 0.003;
        return 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export' +
            '?bbox=' + (coords.lng - d) + ',' + (coords.lat - d) + ',' + (coords.lng + d) + ',' + (coords.lat + d) +
            '&bboxSR=4326&size=600,300&format=png&f=image';
    }

    function imageForLocation(name, type, surface, coords) {
        var n = (name || '').toLowerCase();
        // Named landmark — verified Wikimedia Commons photos (CC-licensed, real photos of these venues)
        if (n.includes('nathan phillips'))
            return 'https://upload.wikimedia.org/wikipedia/commons/b/b8/Nathan_Phillips_Square_skaters_%2846965685982%29.jpg';
        if (n.includes('harbourfront') || n.includes('harbour front'))
            return 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Harbourfront_Toronto_Skating_Rink.jpg';
        if (n.includes('bentway'))
            return 'https://upload.wikimedia.org/wikipedia/commons/8/8b/The_Bentway_near_Garrison_Common_2023.jpg';
        if (n.includes('colonel samuel smith') || n.includes('colonel smith'))
            return 'https://upload.wikimedia.org/wikipedia/commons/f/fc/Colonel_Samuel_Smith_Park_%2893962%29.jpg';
        if (n.includes('north york civic'))
            return 'https://upload.wikimedia.org/wikipedia/commons/0/06/North_York_Civic_Centre_2023.jpg';
        if (n.includes('scarborough civic') || n.includes('scarborough centre'))
            return 'https://upload.wikimedia.org/wikipedia/commons/e/e5/Scarborough_Civic_Centre.jpg';
        if (n.includes('dufferin grove'))
            return 'https://upload.wikimedia.org/wikipedia/commons/b/ba/Dufferin_Grove_Park_2022.jpg';
        // Unnamed ice rinks — aerial satellite photo of the actual location
        if (coords && type !== 'roller') return aerialUrl(coords);
        // Roller venues (curated, no coords-based aerial needed)
        if (type === 'roller') return 'images/rollerskating.jpg';
        return 'images/ice-skating.jpg';
    }

    function galleryForLocation(name, type, surface, coords) {
        var primary = imageForLocation(name, type, surface, coords);
        var isExternal = primary.startsWith('https://');
        if (!isExternal) return [primary];
        // External image (Wikimedia or aerial) — add one contextual second image
        var extra = type === 'roller' ? 'images/rollerskating2.jpg' : 'images/ice-skate-close.jpg';
        return [primary, extra];
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
        var tips = ['Free to skate — bring your own skates; rental shops are available nearby'];
        if (p['Rink is Lit'] === 'Yes') tips.push('Evening skating available — rink is lit until closing');
        if (p['Boards (Ice Rink)'] === 'Yes') tips.push('Boards installed — suitable for recreational hockey and public skating');
        var len = p['Pad Length (ft.)'] || p['Pad Length'] || '';
        var wid = p['Pad Width (ft.)'] || p['Pad Width'] || '';
        if (len && wid) tips.push('Rink size: ' + len + ' × ' + wid + ' ft');
        tips.push('Call 311 or check toronto.ca for current ice conditions before visiting');
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
            if (!coords) return;
            var assetId = parseInt(p['Asset ID']) || null;
            var live = assetId ? statusMap[assetId] : null;
            var name = p['Public Name'] || p['Asset Name'] || 'Unnamed Rink';
            var area = areaFromCouncil(p['Community Council Area'], coords.lat);
            var img = imageForLocation(name, 'ice', 'outdoor', coords);
            var amenities = ['washrooms'];
            if (p['Boards (Ice Rink)'] === 'Yes') amenities.push('hockey-boards');
            if (p['Rink is Lit'] === 'Yes') amenities.push('lighting');
            results.push({
                id: assetId || (10000 + results.length),
                name: name,
                type: 'ice',
                area: area,
                surface: 'outdoor',
                address: (p['Address'] || '') + ', Toronto, ON ' + (p['Postal Code'] || ''),
                coordinates: coords,
                status: statusCode(live) || 'closed',
                liveStatusReason: live ? (live.Reason || '') : '',
                assetId: assetId,
                amenities: amenities,
                openingHours: outdoorHours(),
                rentals: { available: false },
                entryFee: 'Free',
                imageUrl: img,
                gallery: galleryForLocation(name, 'ice', 'outdoor', coords),
                description: name + ' is a City of Toronto outdoor artificial ice rink' +
                    padDesc(p) +
                    (p['Rink is Lit'] === 'Yes' ? ', lit for evening skating' : '') +
                    (p['Boards (Ice Rink)'] === 'Yes' ? ', with boards for hockey' : '') +
                    '. Free public skating during the winter season in ' +
                    (p['Community Council Area'] || 'Toronto') + '.',
                specialEvents: p['Boards (Ice Rink)'] === 'Yes' ? 'Recreational hockey and public skating' : 'Free public skating',
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
            var area = areaFromCouncil(p['Community Council Area'], coords.lat);
            var img = imageForLocation(name, 'ice', 'indoor', coords);
            results.push({
                id: assetId || (20000 + results.length),
                name: name,
                type: 'ice',
                area: area,
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
                entryFee: 'Approx. $5–$8 adults, $3–$5 youth (check toronto.ca for current rates)',
                imageUrl: img,
                gallery: galleryForLocation(name, 'ice', 'indoor', coords),
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

    // Curated roller skating venues — no public Toronto Open Data API exists for these
    var ROLLER_VENUES = [
        {
            id: 90001,
            name: 'Wheel Excitement — Harbourfront',
            type: 'roller',
            area: 'downtown',
            surface: 'outdoor',
            address: '39 Queens Quay W, Toronto, ON M5J 2H2',
            coordinates: { lat: 43.6397, lng: -79.3812 },
            status: 'open',
            amenities: ['rentals', 'washrooms'],
            openingHours: {
                monday: 'Closed', tuesday: 'Closed',
                wednesday: '12:00 PM - 8:00 PM', thursday: '12:00 PM - 8:00 PM',
                friday: '12:00 PM - 9:00 PM', saturday: '10:00 AM - 9:00 PM',
                sunday: '10:00 AM - 7:00 PM'
            },
            rentals: { available: true, items: ['Inline skates', 'Quad skates', 'Helmets', 'Pads'], prices: { skates: '$15/hr' } },
            entryFee: 'Free (rentals extra)',
            imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/0a/Harbourfront-Centre.jpg',
            gallery: ['https://upload.wikimedia.org/wikipedia/commons/0/0a/Harbourfront-Centre.jpg', 'images/rollerskating.jpg', 'images/roller-skate.jpg'],
            description: 'Wheel Excitement at Harbourfront Centre is Toronto\'s premier waterfront roller skating destination. Skate along the scenic Lake Ontario shoreline with rental equipment available on-site.',
            specialEvents: 'Themed skate nights, lessons available',
            openMonths: [5, 6, 7, 8, 9, 10],
            iceConditions: null,
            proTips: [
                'Great waterfront views — best at sunset',
                'Book lessons in advance during peak summer months',
                'Paved trail extends east along the waterfront'
            ],
            sourceUrl: 'https://www.harbourfrontcentre.com'
        },
        {
            id: 90002,
            name: 'Dufferin Grove Roller Rink',
            type: 'roller',
            area: 'downtown',
            surface: 'outdoor',
            address: '875 Dufferin St, Toronto, ON M6H 3L6',
            coordinates: { lat: 43.6533, lng: -79.4338 },
            status: 'open',
            amenities: ['washrooms', 'food'],
            openingHours: {
                monday: '10:00 AM - 8:00 PM', tuesday: '10:00 AM - 8:00 PM',
                wednesday: '10:00 AM - 8:00 PM', thursday: '10:00 AM - 8:00 PM',
                friday: '10:00 AM - 9:00 PM', saturday: '9:00 AM - 9:00 PM',
                sunday: '9:00 AM - 8:00 PM'
            },
            rentals: { available: false },
            entryFee: 'Free',
            imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/ba/Dufferin_Grove_Park_2022.jpg',
            gallery: ['https://upload.wikimedia.org/wikipedia/commons/b/ba/Dufferin_Grove_Park_2022.jpg', 'images/rollerskating.jpg'],
            description: 'The Dufferin Grove roller rink is a beloved community outdoor skating surface in one of Toronto\'s most vibrant parks. The park also features a cob oven and weekly farmers market.',
            specialEvents: 'Friday Night Skate, community events',
            openMonths: [4, 5, 6, 7, 8, 9, 10],
            iceConditions: null,
            proTips: [
                'Bring your own skates — no rentals on-site',
                'Visit on Friday evenings for the popular community skate',
                'The park bakery oven is often running on weekends'
            ],
            sourceUrl: 'https://www.toronto.ca/explore-enjoy/parks-gardens-beaches/parks/dufferin-grove-park/'
        },
        {
            id: 90003,
            name: 'Scooter\'s Roller Palace',
            type: 'roller',
            area: 'scarborough',
            surface: 'indoor',
            address: '2665 Lawrence Ave E, Scarborough, ON M1P 2S2',
            coordinates: { lat: 43.7595, lng: -79.2685 },
            status: 'open',
            amenities: ['rentals', 'washrooms', 'food', 'parking'],
            openingHours: {
                monday: 'Closed', tuesday: 'Closed',
                wednesday: '7:00 PM - 10:00 PM', thursday: '7:00 PM - 10:00 PM',
                friday: '7:00 PM - 11:00 PM', saturday: '1:00 PM - 5:00 PM',
                sunday: '1:00 PM - 5:00 PM'
            },
            rentals: { available: true, items: ['Quad skates', 'Inline skates'], prices: { skates: '$5' } },
            entryFee: '$8–$10',
            imageUrl: 'images/rollerskating2.jpg',
            gallery: ['images/rollerskating2.jpg', 'images/urban-roller.jpg', 'images/roller-skate.jpg'],
            description: 'Scooter\'s Roller Palace is Toronto\'s classic indoor roller rink, a nostalgic favourite offering quad and inline skating with a full snack bar and DJ nights.',
            specialEvents: 'DJ nights, birthday party packages, disco sessions',
            openMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
            iceConditions: null,
            proTips: [
                'Friday night DJ sessions are very popular — arrive early',
                'Great for birthday parties — book the party room in advance',
                'Quad rental skates available for all ages'
            ],
            sourceUrl: 'https://scootersrollerpalace.com'
        },
        {
            id: 90004,
            name: 'Paradise Rinks Inline Hockey & Skating',
            type: 'roller',
            area: 'north-york',
            surface: 'indoor',
            address: '2000 Lawrence Ave W, North York, ON M9N 1H4',
            coordinates: { lat: 43.7134, lng: -79.5035 },
            status: 'open',
            amenities: ['rentals', 'washrooms', 'parking'],
            openingHours: {
                monday: '6:00 AM - 10:00 PM', tuesday: '6:00 AM - 10:00 PM',
                wednesday: '6:00 AM - 10:00 PM', thursday: '6:00 AM - 10:00 PM',
                friday: '6:00 AM - 10:00 PM', saturday: '8:00 AM - 8:00 PM',
                sunday: '8:00 AM - 8:00 PM'
            },
            rentals: { available: true, items: ['Inline skates', 'Helmets', 'Pads'], prices: { skates: '$10' } },
            entryFee: '$10 adults / $7 youth',
            imageUrl: 'images/north-york-roll.jpg',
            gallery: ['images/north-york-roll.jpg', 'images/rollerskating.jpg', 'images/urban-roller.jpg'],
            description: 'Paradise Rinks offers year-round inline skating and roller hockey in a dedicated indoor facility in North York. Leagues, drop-in sessions, and lessons for all ages.',
            specialEvents: 'Adult & youth inline hockey leagues, learn-to-skate programs',
            openMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
            iceConditions: null,
            proTips: [
                'Drop-in sessions available most evenings',
                'Inline hockey leagues run year-round — register online',
                'Helmet and full gear required for hockey sessions'
            ],
            sourceUrl: 'https://www.toronto.ca'
        }
    ];

    function dispatch(locations) {
        window.skatingLocations = locations;
        window.dispatchEvent(new CustomEvent('skatingDataReady'));
    }

    var cached = loadFromCache();
    if (cached) {
        dispatch(cached);
    } else {
        Promise.all([
            fetch(OUTDOOR_URL).then(function (r) { return r.json(); }),
            fetch(INDOOR_URL).then(function (r) { return r.json(); }),
            fetch(STATUS_URL).then(function (r) { return r.json(); })
        ]).then(function (all) {
            var statusMap = buildStatusMap(all[2]);
            var outdoor = transformOutdoor((all[0].features || []), statusMap);
            var indoor  = transformIndoor((all[1].features || []), statusMap);
            var locations = outdoor.concat(indoor).concat(ROLLER_VENUES);
            saveToCache(locations);
            dispatch(locations);
        }).catch(function (err) {
            console.error('[ICE-WHEELS] Failed to load City of Toronto data:', err);
            dispatch(ROLLER_VENUES);
        });
    }
})();
