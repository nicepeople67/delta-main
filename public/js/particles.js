(function() {
    var particlesInitialized = false;
    
    function initParticles() {
        if (localStorage.getItem('delta_particles') === 'disabled') {
            return;
        }
        
        if (!document.getElementById('particles-js')) {
            var div = document.createElement('div');
            div.id = 'particles-js';
            div.style.position = 'fixed';
            div.style.top = '0';
            div.style.left = '0';
            div.style.width = '100%';
            div.style.height = '100%';
            div.style.zIndex = '0';
            div.style.pointerEvents = 'none';
            document.body.appendChild(div);
        }

        var script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/particles.js@2.0.0/particles.min.js';
        script.onload = function() {
            particlesJS('particles-js', {
                particles: {
                    number: { value: 100 },
                    color: { value: '#5481CC' },
                    shape: { type: localStorage.getItem('particleShape') || 'circle' },
                    opacity: { value: 0.2 },
                    size: { value: 5 },
                    move: { enable: true, speed: 0.5 },
                    line_linked: { enable: false }
                },
                interactivity: {
                    events: { onhover: { enable: true, mode: 'repulse' } }
                }
            });
            particlesInitialized = true;
        };
        document.head.appendChild(script);
    }

    window.updateParticleConfig = function() {
        if (!document.getElementById('particles-js') || typeof particlesJS === 'undefined') return;
        particlesJS('particles-js', {
            particles: {
                number: { value: 100 },
                color: { value: '#5481CC' },
                shape: { type: localStorage.getItem('particleShape') || 'circle' },
                opacity: { value: 0.2 },
                size: { value: 5 },
                move: { enable: true, speed: 0.5 },
                line_linked: { enable: false }
            },
            interactivity: {
                events: { onhover: { enable: true, mode: 'repulse' } }
            }
        });
    };

    window.toggleParticles = function(enable) {
        var particlesEl = document.getElementById('particles-js');
        if (enable) {
            localStorage.removeItem('delta_particles');
            if (particlesEl) {
                particlesEl.style.display = 'block';
            } else {
                initParticles();
            }
        } else {
            localStorage.setItem('delta_particles', 'disabled');
            if (particlesEl) {
                particlesEl.style.display = 'none';
            }
        }
    };

    window.isParticlesEnabled = function() {
        return localStorage.getItem('delta_particles') !== 'disabled';
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initParticles);
    } else {
        initParticles();
    }
})();

function loadFontAwesomeCSS() {
    const linkExists = document.querySelector('link[href*="font-awesome"]');
    if (linkExists) {
        console.log("Font Awesome CSS already loaded. Skipping.");
        return;
    }

    const link = document.createElement('link');

    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';

    document.head.appendChild(link);
}

loadFontAwesomeCSS()
