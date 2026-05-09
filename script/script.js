// FAQ functionality and smooth scrolling
document.addEventListener('DOMContentLoaded', function() {
    // SW registration
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(function() {});

    // Dark mode init
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
    // FAQ toggle functionality
    const faqQuestions = document.querySelectorAll('.faq-question');

    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            const faqItem = this.parentElement;
            const isActive = faqItem.classList.contains('active');

            // Close all FAQ items
            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('active');
            });

            // Toggle current item
            if (!isActive) {
                faqItem.classList.add('active');
            }
        });
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Hamburger menu toggle
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const navMenu = document.getElementById('nav-menu');
    if (hamburgerBtn && navMenu) {
        hamburgerBtn.addEventListener('click', function() {
            navMenu.classList.toggle('nav-open');
            hamburgerBtn.classList.toggle('active');
        });
        navMenu.querySelectorAll('.nav-link').forEach(function(link) {
            link.addEventListener('click', function() {
                navMenu.classList.remove('nav-open');
                hamburgerBtn.classList.remove('active');
            });
        });
    }

    // Contact form handler
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            contactForm.style.display = 'none';
            document.getElementById('form-success').classList.add('visible');
        });
    }

    // Weather widget (homepage only — wttr.in, no API key required)
    const weatherWidget = document.getElementById('weather-widget');
    if (weatherWidget) {
        fetch('https://wttr.in/Toronto?format=j1')
            .then(function(r) { return r.json(); })
            .then(function(data) {
                const temp = parseInt(data.current_condition[0].temp_C);
                let icon, msg;
                if (temp <= 0)       { icon = '❄️'; msg = 'Perfect conditions for ice skating!'; }
                else if (temp <= 6)  { icon = '🌤️'; msg = 'Bundle up and hit the rink!'; }
                else if (temp <= 16) { icon = '⛅'; msg = 'Great day for outdoor skating!'; }
                else                 { icon = '☀️'; msg = 'Try indoor skating to cool off!'; }
                document.getElementById('weather-text').innerHTML =
                    '<strong>' + icon + ' ' + temp + '°C in Toronto</strong> &mdash; ' + msg;
                weatherWidget.style.display = 'inline-flex';
            })
            .catch(function() { /* silently fail if API unreachable */ });
    }
});