document.addEventListener('DOMContentLoaded', function() {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(function() {});

    // Dark mode
    (function() {
        var saved = localStorage.getItem('ice-wheels-theme');
        var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        var theme = saved || (prefersDark ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', theme);
        var icon = document.getElementById('theme-icon');
        if (icon) icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    })();
    var themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', function() {
            var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            var newTheme = isDark ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('ice-wheels-theme', newTheme);
            var icon = document.getElementById('theme-icon');
            if (icon) icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        });
    }

    // French language
    (function() {
        var lang = localStorage.getItem('ice-wheels-lang') || 'en';
        applyLang(lang);
        var langBtn = document.getElementById('lang-toggle');
        if (langBtn) {
            langBtn.textContent = lang === 'fr' ? 'EN' : 'FR';
            langBtn.dataset.langInit = '1';
            langBtn.addEventListener('click', function() {
                var cur = localStorage.getItem('ice-wheels-lang') || 'en';
                var next = cur === 'en' ? 'fr' : 'en';
                localStorage.setItem('ice-wheels-lang', next);
                applyLang(next);
                this.textContent = next === 'fr' ? 'EN' : 'FR';
                window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: next } }));
            });
        }
    })();

    function onDataReady() {
        var urlParams = new URLSearchParams(window.location.search);
        var rinkId = urlParams.get('id');
        if (rinkId) {
            trackRecentlyViewed(parseInt(rinkId));
            loadRinkDetails(rinkId);
        } else {
            displayError('No rink ID provided');
        }
    }

    if (window.skatingLocations) {
        onDataReady();
    } else {
        window.addEventListener('skatingDataReady', onDataReady, { once: true });
    }

    window.addEventListener('languageChanged', function() {
        var lang = localStorage.getItem('ice-wheels-lang') || 'en';
        applyLang(lang);
        var checkinBtn = document.getElementById('checkin-btn');
        var tripBtn = document.getElementById('trip-btn-detail');
        if (checkinBtn && window._detailsRinkId !== undefined) updateCheckinBtn(window._detailsRinkId, checkinBtn);
        if (tripBtn && window._detailsRinkId !== undefined) updateTripDetailBtn(window._detailsRinkId, tripBtn);
    });
});

function applyLang(lang) {
    document.querySelectorAll('[data-en]').forEach(function(el) {
        el.textContent = lang === 'fr' ? (el.dataset.fr || el.textContent) : el.dataset.en;
    });
    document.querySelectorAll('[data-placeholder-en]').forEach(function(el) {
        el.placeholder = lang === 'fr' ? (el.dataset.placeholderFr || el.placeholder) : el.dataset.placeholderEn;
    });
}

function trackRecentlyViewed(id) {
    try {
        var ids = JSON.parse(localStorage.getItem('ice-wheels-recently-viewed') || '[]');
        ids = ids.filter(function(i) { return i !== id; });
        ids.unshift(id);
        localStorage.setItem('ice-wheels-recently-viewed', JSON.stringify(ids.slice(0, 5)));
    } catch (e) {}
}

function loadRinkDetails(rinkId) {
    window._detailsRinkId = parseInt(rinkId);
    var rink = window.skatingLocations.find(function(l) { return l.id === parseInt(rinkId); });
    if (rink) { displayRinkData(rink); } else { displayError('Rink not found'); }
}

function displayRinkData(rink) {
    document.title = rink.name + ' - Ice & Wheels';
    document.getElementById('rink-name').textContent = rink.name;

    // JSON-LD structured data for SEO
    (function() {
        var schema = {
            '@context': 'https://schema.org',
            '@type': 'SportsActivityLocation',
            'name': rink.name,
            'description': rink.description || '',
            'address': {
                '@type': 'PostalAddress',
                'streetAddress': rink.address,
                'addressLocality': 'Toronto',
                'addressRegion': 'ON',
                'addressCountry': 'CA'
            },
            'geo': rink.coordinates ? {
                '@type': 'GeoCoordinates',
                'latitude': rink.coordinates.lat,
                'longitude': rink.coordinates.lng
            } : undefined,
            'image': rink.imageUrl ? ('https://ice-wheels.vercel.app/' + rink.imageUrl) : undefined,
            'url': window.location.href,
            'isAccessibleForFree': rink.entryFee === 'Free',
            'sportsActivityLocation': rink.type === 'ice' ? 'IceRink' : 'RollerSkating'
        };
        var el = document.createElement('script');
        el.type = 'application/ld+json';
        el.textContent = JSON.stringify(schema);
        document.head.appendChild(el);
    })();

    function setMeta(prop, content) {
        var el = document.querySelector('meta[property="' + prop + '"]');
        if (el) el.setAttribute('content', content);
    }
    setMeta('og:title', rink.name + ' - Ice & Wheels');
    setMeta('og:description', rink.description ? rink.description.substring(0, 155) + '…' : 'Toronto skating location details.');
    setMeta('og:image', (rink.gallery && rink.gallery[0]) || rink.imageUrl || 'images/harbourfront.jpg');

    // Favourite button
    var favBtnDetail = document.getElementById('fav-btn-detail');
    if (favBtnDetail) {
        var updateFavBtn = function() {
            var favs = JSON.parse(localStorage.getItem('ice-wheels-favourites') || '[]');
            var isFav = favs.indexOf(rink.id) > -1;
            favBtnDetail.innerHTML = isFav ? '<i class="fas fa-heart" style="color:#e74c3c"></i>' : '<i class="far fa-heart"></i>';
            favBtnDetail.title = isFav ? 'Remove from favourites' : 'Save to favourites';
        };
        updateFavBtn();
        favBtnDetail.addEventListener('click', function() {
            var favs = JSON.parse(localStorage.getItem('ice-wheels-favourites') || '[]');
            var idx = favs.indexOf(rink.id);
            if (idx > -1) { favs.splice(idx, 1); } else { favs.push(rink.id); }
            localStorage.setItem('ice-wheels-favourites', JSON.stringify(favs));
            updateFavBtn();
        });
    }

    // Share button
    var shareBtn = document.getElementById('share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', function() {
            var shareData = { title: rink.name + ' - Ice & Wheels', text: 'Check out ' + rink.name + ' for skating in Toronto!', url: window.location.href };
            if (navigator.share) {
                navigator.share(shareData);
            } else {
                navigator.clipboard.writeText(window.location.href).then(function() {
                    shareBtn.innerHTML = '<i class="fas fa-check"></i>';
                    shareBtn.title = 'Link copied!';
                    setTimeout(function() { shareBtn.innerHTML = '<i class="fas fa-share-nodes"></i>'; shareBtn.title = 'Share this location'; }, 2000);
                });
            }
        });
    }

    // Gallery
    renderGallery(rink);

    // Address + directions + TTC
    document.getElementById('address').textContent = rink.address;
    if (rink.coordinates) {
        var mapsUrl = 'https://www.google.com/maps/dir/?api=1&destination=' + rink.coordinates.lat + ',' + rink.coordinates.lng;
        var ttcUrl = 'https://www.google.com/maps/dir/?api=1&destination=' + rink.coordinates.lat + ',' + rink.coordinates.lng + '&travelmode=transit';
        document.getElementById('directions-container').innerHTML =
            '<a href="' + mapsUrl + '" target="_blank" rel="noopener noreferrer" class="directions-btn"><i class="fas fa-route"></i> Get Directions</a>' +
            '<a href="' + ttcUrl + '" target="_blank" rel="noopener noreferrer" class="directions-btn ttc-btn"><i class="fas fa-train-subway"></i> TTC Route</a>';
    }

    document.getElementById('opening-hours').textContent = formatOpeningHours(rink.openingHours);
    var entryFeeEl = document.getElementById('entry-fee');
    if (entryFeeEl) entryFeeEl.textContent = rink.entryFee || 'See venue for details';
    var amenitiesText = rink.amenities ? rink.amenities.map(formatAmenity).join(', ') : 'No amenities information available';
    document.getElementById('amenities').textContent = amenitiesText;
    document.getElementById('special-events').textContent = rink.specialEvents || 'No special events scheduled';
    document.getElementById('description').textContent = rink.description;

    if (rink.proTips && rink.proTips.length > 0) {
        var proTipsList = document.getElementById('pro-tips-list');
        proTipsList.innerHTML = '';
        for (var i = 0; i < rink.proTips.length; i++) {
            var li = document.createElement('li');
            li.textContent = rink.proTips[i];
            proTipsList.appendChild(li);
        }
    }

    // Action buttons
    renderActionButtons(rink);

    // Seasonal calendar
    renderSeasonalCalendar(rink);

    // Ice conditions
    renderIceConditions(rink);

    // Reviews
    var reviewsContainer = document.getElementById('reviews-container');
    if (reviewsContainer && typeof renderReviewsSection !== 'undefined') {
        renderReviewsSection(rink.id, reviewsContainer);
    }

    // Map
    if (rink.coordinates && typeof L !== 'undefined') {
        var map = L.map('rink-map').setView([rink.coordinates.lat, rink.coordinates.lng], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        L.marker([rink.coordinates.lat, rink.coordinates.lng])
            .addTo(map)
            .bindPopup('<strong>' + rink.name + '</strong><br>' + rink.address)
            .openPopup();
    }

    // Related locations
    var related = window.skatingLocations.filter(function(loc) { return loc.type === rink.type && loc.id !== rink.id; }).slice(0, 3);
    if (related.length > 0) {
        var relatedSection = document.getElementById('related-section');
        var relatedGrid = document.getElementById('related-grid');
        if (relatedSection && relatedGrid) {
            relatedSection.style.display = '';
            related.forEach(function(loc) {
                var card = document.createElement('a');
                card.href = 'details.html?id=' + loc.id;
                card.className = 'related-card';
                card.innerHTML =
                    '<img src="' + loc.imageUrl + '" alt="' + loc.name + '" onerror="this.src=\'images/ice-skating.jpg\'">' +
                    '<div class="related-card-info"><h4>' + loc.name + '</h4>' +
                    '<p><span class="status-indicator status-' + loc.status + '"></span>' + loc.area.replace('-', ' ') + '</p></div>';
                relatedGrid.appendChild(card);
            });
        }
    }
}

// ===== GALLERY =====
function renderGallery(rink) {
    var imgs = (rink.gallery && rink.gallery.length) ? rink.gallery : (rink.imageUrl ? [rink.imageUrl] : []);
    var container = document.getElementById('gallery-container');
    if (!container) {
        var rinkImage = document.getElementById('rink-image');
        if (rinkImage) { rinkImage.src = imgs[0] || ''; rinkImage.alt = rink.name; rinkImage.onerror = function() { this.src = 'images/ice-skating.jpg'; }; }
        return;
    }
    if (imgs.length <= 1) {
        container.innerHTML = '<div class="gallery-single"><img class="gallery-main-img" src="' + (imgs[0] || '') + '" alt="' + rink.name + '" onerror="this.src=\'images/ice-skating.jpg\'"></div>';
        var mainImg = container.querySelector('.gallery-main-img');
        if (mainImg) { mainImg.style.cursor = 'zoom-in'; mainImg.addEventListener('click', function() { openLightbox(imgs, 0); }); }
    } else {
        container.innerHTML = '<div class="gallery-strip">' +
            imgs.map(function(src, i) {
                return '<img class="gallery-thumb" src="' + src + '" alt="' + rink.name + ' ' + (i + 1) + '" data-idx="' + i + '" onerror="this.src=\'images/ice-skating.jpg\'">';
            }).join('') + '</div>';
        container.querySelectorAll('.gallery-thumb').forEach(function(img) {
            img.addEventListener('click', function() { openLightbox(imgs, parseInt(this.dataset.idx)); });
        });
    }
}

function openLightbox(imgs, startIdx) {
    var existing = document.getElementById('lightbox-overlay');
    if (existing) existing.remove();
    var idx = startIdx;
    var overlay = document.createElement('div');
    overlay.id = 'lightbox-overlay';
    overlay.className = 'lightbox-overlay';

    function render() {
        overlay.innerHTML =
            '<div class="lightbox-card">' +
            '<button class="lightbox-close" aria-label="Close">&times;</button>' +
            (imgs.length > 1 ? '<button class="lightbox-prev"><i class="fas fa-chevron-left"></i></button>' : '') +
            '<img class="lightbox-img" src="' + imgs[idx] + '" alt="Photo ' + (idx + 1) + '" onerror="this.src=\'images/ice-skating.jpg\'">' +
            (imgs.length > 1 ? '<button class="lightbox-next"><i class="fas fa-chevron-right"></i></button>' : '') +
            (imgs.length > 1 ? '<div class="lightbox-counter">' + (idx + 1) + ' / ' + imgs.length + '</div>' : '') +
            '</div>';
        overlay.querySelector('.lightbox-close').onclick = function() { overlay.classList.remove('visible'); setTimeout(function() { overlay.remove(); }, 250); };
        var prev = overlay.querySelector('.lightbox-prev');
        var next = overlay.querySelector('.lightbox-next');
        if (prev) prev.onclick = function() { idx = (idx - 1 + imgs.length) % imgs.length; render(); };
        if (next) next.onclick = function() { idx = (idx + 1) % imgs.length; render(); };
    }

    render();
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.querySelector('.lightbox-close').click(); });
    requestAnimationFrame(function() { overlay.classList.add('visible'); });
}

// ===== SEASONAL CALENDAR =====
function renderSeasonalCalendar(rink) {
    var container = document.getElementById('season-container');
    var section = document.getElementById('season-section');
    if (!container || !section) return;
    var months = rink.openMonths || [];
    if (!months.length) { section.style.display = 'none'; return; }
    var labels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    container.innerHTML = '<div class="month-grid">' +
        labels.map(function(lbl, i) {
            var open = months.indexOf(i + 1) > -1;
            return '<span class="month-pill ' + (open ? 'month-open' : 'month-closed') + '">' + lbl + '</span>';
        }).join('') + '</div>';
}

// ===== ICE CONDITIONS =====
function renderIceConditions(rink) {
    var section = document.getElementById('conditions-section');
    if (!section) return;
    if (!rink.iceConditions || rink.type !== 'ice') { section.style.display = 'none'; return; }
    section.style.display = '';
    var ic = rink.iceConditions;
    var stars = '';
    for (var i = 1; i <= 5; i++) stars += '<i class="' + (i <= ic.quality ? 'fas' : 'far') + ' fa-star conditions-star"></i>';
    document.getElementById('conditions-stars').innerHTML = stars;
    document.getElementById('conditions-resurfaced').textContent = 'Last resurfaced: ' + (ic.lastResurfaced || 'Unknown');
    document.getElementById('conditions-notes').textContent = ic.notes || '';
}

// ===== ACTION BUTTONS =====
function renderActionButtons(rink) {
    var checkinBtn = document.getElementById('checkin-btn');
    if (checkinBtn) {
        updateCheckinBtn(rink.id, checkinBtn);
        checkinBtn.addEventListener('click', function() { doCheckin(rink.id, this); });
    }

    var tripBtn = document.getElementById('trip-btn-detail');
    if (tripBtn && typeof isInTrip !== 'undefined') {
        tripBtn.dataset.id = rink.id;
        updateTripDetailBtn(rink.id, tripBtn);
        tripBtn.addEventListener('click', function() {
            if (isInTrip(rink.id)) { removeFromTrip(rink.id); } else { addToTrip(rink.id); }
            updateTripDetailBtn(rink.id, tripBtn);
        });
    }

    var buddyBtn = document.getElementById('buddy-btn');
    if (buddyBtn) buddyBtn.addEventListener('click', function() { openBuddyModal(rink); });

    var qrBtn = document.getElementById('qr-btn');
    if (qrBtn) qrBtn.addEventListener('click', function() { openQrModal(rink.name); });
}

function updateCheckinBtn(id, btn) {
    try {
        var checkins = JSON.parse(localStorage.getItem('ice-wheels-checkins') || '{}');
        var count = (checkins[String(id)] || []).length;
        var lang = localStorage.getItem('ice-wheels-lang') || 'en';
        if (count > 0) {
            var label = lang === 'fr' ? ('Visité ' + count + 'x') : ('Visited ' + count + 'x');
            btn.innerHTML = '<i class="fas fa-check-circle"></i> ' + label;
            btn.classList.add('checked-in');
        } else {
            var label2 = lang === 'fr' ? "S'enregistrer" : 'Check In';
            btn.innerHTML = '<i class="fas fa-flag-checkered"></i> ' + label2;
            btn.classList.remove('checked-in');
        }
    } catch (e) {}
}

function doCheckin(id, btn) {
    try {
        var checkins = JSON.parse(localStorage.getItem('ice-wheels-checkins') || '{}');
        var key = String(id);
        if (!checkins[key]) checkins[key] = [];
        checkins[key].push(Date.now());
        localStorage.setItem('ice-wheels-checkins', JSON.stringify(checkins));
        updateCheckinBtn(id, btn);
        btn.classList.add('checkin-pulse');
        setTimeout(function() { btn.classList.remove('checkin-pulse'); }, 600);
    } catch (e) {}
}

function updateTripDetailBtn(id, btn) {
    if (typeof isInTrip === 'undefined') return;
    var inTrip = isInTrip(id);
    var lang = localStorage.getItem('ice-wheels-lang') || 'en';
    btn.classList.toggle('active', inTrip);
    if (lang === 'fr') {
        btn.innerHTML = inTrip ? '<i class="fas fa-route"></i> Dans le voyage' : '<i class="fas fa-route"></i> Ajouter';
    } else {
        btn.innerHTML = inTrip ? '<i class="fas fa-route"></i> In Trip' : '<i class="fas fa-route"></i> Add to Trip';
    }
    btn.title = inTrip ? (lang === 'fr' ? 'Retirer du voyage' : 'Remove from trip') : (lang === 'fr' ? 'Ajouter au voyage' : 'Add to trip planner');
}

// ===== BUDDY MODAL =====
function openBuddyModal(rink) {
    var mapsUrl = rink.coordinates
        ? 'https://www.google.com/maps/dir/?api=1&destination=' + rink.coordinates.lat + ',' + rink.coordinates.lng
        : '#';
    var bodyHtml =
        '<div class="buddy-modal-body">' +
        '<p class="buddy-location"><i class="fas fa-location-dot"></i> ' + rink.name + '</p>' +
        '<p class="buddy-address">' + rink.address + '</p>' +
        '<label class="buddy-label">When?</label>' +
        '<div class="buddy-time-options">' +
            '<button class="buddy-time-btn active" data-val="Now">Now</button>' +
            '<button class="buddy-time-btn" data-val="In 1 hour">In 1 hour</button>' +
            '<button class="buddy-time-btn" data-val="In 2 hours">In 2 hours</button>' +
            '<input type="time" id="buddy-custom-time" class="buddy-time-input" title="Custom time">' +
        '</div>' +
        '<div class="buddy-actions">' +
            '<button class="buddy-send-btn buddy-whatsapp" id="buddy-wa"><i class="fab fa-whatsapp"></i> WhatsApp</button>' +
            '<button class="buddy-send-btn buddy-sms" id="buddy-sms"><i class="fas fa-comment-sms"></i> SMS</button>' +
        '</div></div>';

    if (typeof openModal !== 'undefined') openModal('Invite a Skating Buddy', bodyHtml);

    var selectedTime = 'Now';
    var modal = document.getElementById('shared-modal');
    if (!modal) return;

    modal.querySelectorAll('.buddy-time-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            modal.querySelectorAll('.buddy-time-btn').forEach(function(b) { b.classList.remove('active'); });
            this.classList.add('active');
            selectedTime = this.dataset.val;
        });
    });

    var customTime = modal.querySelector('#buddy-custom-time');
    if (customTime) customTime.addEventListener('change', function() {
        if (this.value) {
            modal.querySelectorAll('.buddy-time-btn').forEach(function(b) { b.classList.remove('active'); });
            selectedTime = this.value;
        }
    });

    function getMessage() {
        return 'Meet me at ' + rink.name + ' for skating!\n' + rink.address + '\nTime: ' + selectedTime + '\nDirections: ' + mapsUrl;
    }

    var waBtn = modal.querySelector('#buddy-wa');
    if (waBtn) waBtn.addEventListener('click', function() { window.open('https://wa.me/?text=' + encodeURIComponent(getMessage()), '_blank'); });

    var smsBtn = modal.querySelector('#buddy-sms');
    if (smsBtn) smsBtn.addEventListener('click', function() { window.open('sms:?body=' + encodeURIComponent(getMessage()), '_blank'); });
}

// ===== QR CODE =====
function openQrModal(name) {
    var bodyHtml =
        '<div class="qr-modal-body">' +
        '<div id="qr-canvas"></div>' +
        '<p class="qr-url">' + window.location.href + '</p>' +
        '<button class="button button-secondary qr-download-btn" id="qr-download">Download QR</button>' +
        '</div>';

    if (typeof openModal !== 'undefined') openModal('QR Code — ' + name, bodyHtml);

    var modal = document.getElementById('shared-modal');
    if (!modal) return;

    if (typeof QRCode !== 'undefined') {
        var qrDiv = modal.querySelector('#qr-canvas');
        new QRCode(qrDiv, { text: window.location.href, width: 200, height: 200, colorDark: '#1a0d06', colorLight: '#ffffff' });
        var dlBtn = modal.querySelector('#qr-download');
        if (dlBtn) dlBtn.addEventListener('click', function() {
            var img = qrDiv.querySelector('img');
            if (img) { var a = document.createElement('a'); a.href = img.src; a.download = 'qr-' + name.toLowerCase().replace(/\s+/g, '-') + '.png'; a.click(); }
        });
    } else {
        var qrDiv2 = modal.querySelector('#qr-canvas');
        if (qrDiv2) qrDiv2.innerHTML = '<p style="color:#666;padding:1rem">QR library not loaded. Please check your connection.</p>';
    }
}

function formatOpeningHours(hours) {
    if (!hours) return 'Hours not available';
    return (hours.weekdays || 'Varies') + ' (Weekdays) / ' + (hours.weekends || 'Varies') + ' (Weekends)';
}

function formatAmenity(amenity) {
    var map = { rentals: 'Skate rentals', washrooms: 'Washrooms', food: 'Food & drink', parking: 'Parking', 'hockey-boards': 'Hockey boards', lighting: 'Evening lighting' };
    return map[amenity] || amenity;
}

function displayError(message) {
    var container = document.getElementById('rink-details');
    if (container) {
        container.innerHTML =
            '<div style="text-align:center;padding:3rem;">' +
            '<h2 style="color:#8B4513;">Oops! Something went wrong</h2>' +
            '<p style="color:#666;margin:1rem 0;">' + message + '</p>' +
            '<a href="locations.html" class="button button-secondary">Back to Locations</a>' +
            '</div>';
    }
}
