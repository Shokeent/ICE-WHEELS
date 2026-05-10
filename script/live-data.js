// Fetches real rink data from City of Toronto Open Data + live status API
// Outdoor rinks: https://open.toronto.ca/dataset/outdoor-artificial-ice-rinks/
// Indoor rinks:  https://open.toronto.ca/dataset/indoor-ice-rinks/
// Live status:   https://www.toronto.ca/data/parks/live/skate_allupdates.json

(function () {
    var OUTDOOR_URL = 'https://ckan0.cf.opendata.inter.prod-toronto.ca/dataset/e51b5d31-a53c-4fc5-a204-36c43243dd3b/resource/2ae3625b-30f1-4470-bf80-ecc56ab2d674/download/outdoor-ice-rinks-4326.geojson';
    var INDOOR_URL  = 'https://ckan0.cf.opendata.inter.prod-toronto.ca/dataset/96e9989d-eca5-4e0b-824b-9789a39aea58/resource/3732a863-a629-4d71-8629-f331a83fd61f/download/indoor-ice-rinks-4326.geojson';
    var STATUS_URL  = 'https://www.toronto.ca/data/parks/live/skate_allupdates.json';

    var CACHE_KEY = 'ice-wheels-api-cache';
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

    function imageForLocation(name, type, surface) {
        var n = (name || '').toLowerCase();
        // Named landmark matches
        if (n.includes('nathan phillips'))                           return 'images/nathan-phillips.jpg';
        if (n.includes('harbourfront') || n.includes('harbour front')) return 'images/harbourfront.jpg';
        if (n.includes('bentway'))                                   return 'images/bentway.jpg';
        if (n.includes('colonel samuel smith') || n.includes('colonel smith')) return 'images/colonel-smith.jpg';
        if (n.includes('greenwood'))                                 return 'images/greenwood.jpg';
        if (n.includes('north york civic'))                          return 'images/north-york-civic.jpg';
        if (n.includes('scarborough civic') || n.includes('scarborough centre')) return 'images/scarborough-civic.jpg';
        if (n.includes('wheel excitement') || n.includes('harbourfront centre')) return 'images/waterfront-trail.jpg';
        if (n.includes('dufferin grove'))                            return 'images/riverdale-roller.jpg';
        if (n.includes('scooter'))                                   return 'images/rollerskating2.jpg';
        if (n.includes('paradise'))                                  return 'images/north-york-roll.jpg';
        if (n.includes('west end') || n.includes('west-end'))        return 'images/west-end-wheels.jpg';
        if (n.includes('riverdale') || n.includes('broadview'))      return 'images/greenwood.jpg';
        if (n.includes('waterfront') || n.includes('quay') || n.includes('martin goodman')) return 'images/waterfront-trail.jpg';
        // Fallback by type/surface
        if (type === 'roller')    return 'images/rollerskating.jpg';
        if (surface === 'outdoor') return 'images/ice-skating.jpg';
        return 'images/ice-skating.jpeg';
    }

    function galleryForLocation(name, type, surface) {
        var primary = imageForLocation(name, type, surface);
        var extras = type === 'roller'
            ? ['images/rollerskating2.jpg', 'images/urban-roller.jpg', 'images/roller-skate.jpg']
            : ['images/ice-skate-close.jpg', 'images/ice-skating.jpg'];
        var gallery = [primary];
        extras.forEach(function (img) { if (img !== primary) gallery.push(img); });
        return gallery.slice(0, 3);
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
            if (!coords) return;
            var assetId = parseInt(p['Asset ID']) || null;
            var live = assetId ? statusMap[assetId] : null;
            var name = p['Public Name'] || p['Asset Name'] || 'Unnamed Rink';
            var area = areaFromCouncil(p['Community Council Area']);
            var img = imageForLocation(name, 'ice', 'outdoor');
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
                amenities: ['washrooms'],
                openingHours: outdoorHours(),
                rentals: { available: false },
                entryFee: 'Free',
                imageUrl: img,
                gallery: galleryForLocation(name, 'ice', 'outdoor'),
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
            var area = areaFromCouncil(p['Community Council Area']);
            var img = imageForLocation(name, 'ice', 'indoor');
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
                entryFee: '$5 adults / $3 youth (approx.)',
                imageUrl: img,
                gallery: galleryForLocation(name, 'ice', 'indoor'),
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
            imageUrl: 'images/waterfront-trail.jpg',
            gallery: ['images/waterfront-trail.jpg', 'images/rollerskating.jpg', 'images/roller-skate.jpg'],
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
            imageUrl: 'images/riverdale-roller.jpg',
            gallery: ['images/riverdale-roller.jpg', 'images/rollerskating.jpg', 'images/urban-roller.jpg'],
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
