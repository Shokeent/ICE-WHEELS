// ===== REVIEWS & RATINGS =====
// Storage: ice-wheels-reviews → { "1": [{rating,note,name,date},...] }

function getReviews(locationId) {
    try {
        var all = JSON.parse(localStorage.getItem('ice-wheels-reviews') || '{}');
        return all[String(locationId)] || [];
    } catch (e) { return []; }
}

function addReview(locationId, rating, note, name) {
    try {
        var all = JSON.parse(localStorage.getItem('ice-wheels-reviews') || '{}');
        var key = String(locationId);
        if (!all[key]) all[key] = [];
        all[key].unshift({
            rating: rating,
            note: (note || '').trim(),
            name: (name || 'Anonymous').trim() || 'Anonymous',
            date: new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })
        });
        if (all[key].length > 20) all[key] = all[key].slice(0, 20);
        localStorage.setItem('ice-wheels-reviews', JSON.stringify(all));
        return true;
    } catch (e) { return false; }
}

function getAverageRating(locationId) {
    var reviews = getReviews(locationId);
    if (!reviews.length) return 0;
    var sum = reviews.reduce(function(acc, r) { return acc + r.rating; }, 0);
    return Math.round((sum / reviews.length) * 10) / 10;
}

function renderStars(rating, max, interactive, onRate) {
    max = max || 5;
    var html = '<span class="star-display">';
    for (var i = 1; i <= max; i++) {
        var cls = i <= Math.round(rating) ? 'fas fa-star star-filled' : 'far fa-star star-empty';
        if (interactive) {
            html += '<i class="' + cls + ' star-interactive" data-val="' + i + '"></i>';
        } else {
            html += '<i class="' + cls + '"></i>';
        }
    }
    html += '</span>';
    return html;
}

function renderReviewsSection(locationId, container) {
    if (!container) return;
    var reviews = getReviews(locationId);
    var avg = getAverageRating(locationId);

    var html = '<div class="reviews-header">';
    if (reviews.length > 0) {
        html += '<div class="reviews-avg">' +
            renderStars(avg, 5, false) +
            '<span class="reviews-avg-num">' + avg.toFixed(1) + '</span>' +
            '<span class="reviews-count">(' + reviews.length + ' review' + (reviews.length !== 1 ? 's' : '') + ')</span>' +
            '</div>';
    } else {
        html += '<p class="reviews-none">No reviews yet — be the first!</p>';
    }
    html += '</div>';

    if (reviews.length > 0) {
        html += '<div class="reviews-list">';
        reviews.slice(0, 5).forEach(function(r) {
            html += '<div class="review-card">' +
                '<div class="review-card-top">' +
                    '<span class="review-author">' + escapeHtml(r.name) + '</span>' +
                    renderStars(r.rating, 5, false) +
                    '<span class="review-date">' + r.date + '</span>' +
                '</div>' +
                (r.note ? '<p class="review-note">' + escapeHtml(r.note) + '</p>' : '') +
                '</div>';
        });
        html += '</div>';
    }

    html += '<div class="review-form-wrap">' +
        '<h4>Leave a Review</h4>' +
        '<form class="review-form" id="review-form">' +
            '<input type="text" id="review-name" placeholder="Your name (optional)" maxlength="40" class="review-input">' +
            '<div class="star-picker" id="star-picker" aria-label="Rate this location">' +
                '<i class="far fa-star star-pick" data-val="1"></i>' +
                '<i class="far fa-star star-pick" data-val="2"></i>' +
                '<i class="far fa-star star-pick" data-val="3"></i>' +
                '<i class="far fa-star star-pick" data-val="4"></i>' +
                '<i class="far fa-star star-pick" data-val="5"></i>' +
            '</div>' +
            '<textarea id="review-note" placeholder="Share your experience (optional)" rows="3" class="review-textarea" maxlength="300"></textarea>' +
            '<button type="submit" class="button button-primary review-submit" disabled>Submit Review</button>' +
        '</form>' +
        '</div>';

    container.innerHTML = html;

    // Star picker interaction
    var selectedRating = 0;
    var picker = container.querySelector('#star-picker');
    var submitBtn = container.querySelector('.review-submit');

    if (picker) {
        var stars = picker.querySelectorAll('.star-pick');
        stars.forEach(function(star) {
            star.addEventListener('mouseover', function() {
                var val = parseInt(this.dataset.val);
                stars.forEach(function(s, idx) {
                    s.className = (idx < val) ? 'fas fa-star star-pick star-hover' : 'far fa-star star-pick';
                });
            });
            star.addEventListener('mouseleave', function() {
                stars.forEach(function(s, idx) {
                    s.className = (idx < selectedRating) ? 'fas fa-star star-pick star-selected' : 'far fa-star star-pick';
                });
            });
            star.addEventListener('click', function() {
                selectedRating = parseInt(this.dataset.val);
                stars.forEach(function(s, idx) {
                    s.className = (idx < selectedRating) ? 'fas fa-star star-pick star-selected' : 'far fa-star star-pick';
                });
                if (submitBtn) submitBtn.disabled = false;
            });
        });
    }

    var form = container.querySelector('#review-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            if (!selectedRating) return;
            var name = (container.querySelector('#review-name') || {}).value || '';
            var note = (container.querySelector('#review-note') || {}).value || '';
            addReview(locationId, selectedRating, note, name);
            renderReviewsSection(locationId, container);
        });
    }
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// Stars on location cards (called from locations.js)
function getCardStarHtml(locationId) {
    var avg = getAverageRating(locationId);
    var count = getReviews(locationId).length;
    if (!count) return '';
    var stars = '';
    for (var i = 1; i <= 5; i++) {
        stars += '<i class="' + (i <= Math.round(avg) ? 'fas' : 'far') + ' fa-star card-star"></i>';
    }
    return '<span class="card-stars" title="' + avg.toFixed(1) + ' / 5 (' + count + ' review' + (count !== 1 ? 's' : '') + ')">' + stars + ' <small>(' + count + ')</small></span>';
}
