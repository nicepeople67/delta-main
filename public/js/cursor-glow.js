document.addEventListener('DOMContentLoaded', () => {
    const cursorGlow = document.createElement('div');
    cursorGlow.id = 'cursor-glow';
    cursorGlow.style.cssText = `
        position: fixed;
        pointer-events: none;
        width: 150px;
        height: 150px;
        border-radius: 50%;
        background: radial-gradient(circle, var(--color-accent-soft, rgba(100, 200, 255, 0.18)) 0%, transparent 70%);
        transform: translate(-50%, -50%);
        z-index: 9999;
        opacity: 0;
        transition: opacity 0.3s ease;
        mix-blend-mode: screen;
    `;
    document.body.appendChild(cursorGlow);

    let mouseX = 0;
    let mouseY = 0;
    let currentX = 0;
    let currentY = 0;
    let isVisible = false;
    let isEnabled = localStorage.getItem('delta_cursor_glow') !== 'disabled';

    function updateVisibility() {
        isEnabled = localStorage.getItem('delta_cursor_glow') !== 'disabled';
        if (!isEnabled) {
            cursorGlow.style.opacity = '0';
        }
    }

    window.toggleCursorGlow = function(enable) {
        if (enable) {
            localStorage.removeItem('delta_cursor_glow');
            isEnabled = true;
        } else {
            localStorage.setItem('delta_cursor_glow', 'disabled');
            isEnabled = false;
            cursorGlow.style.opacity = '0';
        }
    };

    window.isCursorGlowEnabled = function() {
        return localStorage.getItem('delta_cursor_glow') !== 'disabled';
    };

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        if (!isVisible && isEnabled) {
            isVisible = true;
            cursorGlow.style.opacity = '1';
        }
    });

    document.addEventListener('mouseleave', () => {
        isVisible = false;
        cursorGlow.style.opacity = '0';
    });

    document.addEventListener('mouseenter', () => {
        if (isEnabled) {
            isVisible = true;
            cursorGlow.style.opacity = '1';
        }
    });

    function animateCursor() {
        const ease = 0.5;
        currentX += (mouseX - currentX) * ease;
        currentY += (mouseY - currentY) * ease;
        
        cursorGlow.style.left = currentX + 'px';
        cursorGlow.style.top = currentY + 'px';
        
        requestAnimationFrame(animateCursor);
    }

    animateCursor();
});
