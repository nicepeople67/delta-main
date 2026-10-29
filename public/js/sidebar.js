document.addEventListener('DOMContentLoaded', () => {
    if (typeof window.route !== 'function') {
        console.error("SPA routing function 'route(event)' is not defined.");
    }
    const sidebarHtml = `
<aside id="main-sidebar" class="sidebar-nav fixed left-0 top-0 h-full bg-dark-surface border-r border-baby-blue/30 flex flex-col py-6 z-50 overflow-hidden">
    <div id="mouse-highlight-follower" class="absolute w-20 h-20 rounded-full bg-baby-blue/10 blur-xl pointer-events-none" style="opacity: 0; transition: opacity 0.2s ease-out;"></div>
    <a href="/" onclick="route(event)" class="flex items-center w-full px-4 mb-10 h-16 relative z-10">
        <img id="sidebar-logo" src="https://cdn.jsdelivr.net/gh/ethanlb34/delta-icons@main/default.png" alt="Delta V10 Logo" class="w-11 h-11 rounded-lg shrink-0">
        <span class="nav-label text-2xl font-extrabold ml-4 sidebar-logo-text">Delta V10</span>
    </a>
    <nav class="flex flex-col flex-grow space-y-3 w-full px-3 relative z-10">
        <a href="/index" onclick="route(event)" title="Home" class="sidebar-link flex items-center py-3.5 px-3 rounded-xl text-baby-blue hover:bg-baby-blue/10 transition duration-200 font-semibold">
            <i class="fas fa-home w-6 h-6 shrink-0"></i>
            <span class="nav-label text-base font-medium">Home</span>
        </a>
        <a href="/games" onclick="route(event)" title="Games" class="sidebar-link flex items-center py-3.5 px-3 rounded-xl text-gray-300 hover:text-baby-blue hover:bg-baby-blue/10 transition duration-200">
            <i class="fas fa-gamepad w-6 h-6 shrink-0"></i>
            <span class="nav-label text-base font-medium">Games</span>
        </a>
        <a href="/proxy" onclick="route(event)" title="Proxy" class="sidebar-link flex items-center py-3.5 px-3 rounded-xl text-gray-300 hover:text-baby-blue hover:bg-baby-blue/10 transition duration-200">
            <i class="fas fa-globe w-6 h-6 shrink-0"></i> 
            <span class="nav-label text-base font-medium">Proxy</span>
        </a>
        <a href="/ai" onclick="route(event)" title="AI Assistant" class="sidebar-link flex items-center py-3.5 px-3 rounded-xl text-gray-300 hover:text-baby-blue hover:bg-baby-blue/10 transition duration-200">
            <i class="fas fa-robot w-6 h-6 shrink-0"></i>
            <span class="nav-label text-base font-medium">AI Chatbot</span>
        </a>
        <a href="/chat" onclick="route(event)" title="Chat" id="chat-sidebar-link" class="sidebar-link flex items-center py-3.5 px-3 rounded-xl text-gray-300 hover:text-baby-blue hover:bg-baby-blue/10 transition duration-200">
            <div class="relative w-6 h-6 shrink-0">
                <i class="fas fa-comment w-full h-full"></i>
                <span id="chat-notification-badge" class="absolute bottom-0 left-0 w-5 h-5 bg-red-600 rounded-full text-xs font-bold flex items-center justify-center text-white ring-2 ring-dark-surface hidden" style="transform: translate(-35%, 35%);">0</span>
            </div>
            <span class="nav-label text-base font-medium">Chat</span>
        </a>
        <a href="/more" onclick="route(event)" title="More" class="sidebar-link flex items-center py-3.5 px-3 rounded-xl text-gray-300 hover:text-baby-blue hover:bg-baby-blue/10 transition duration-200">
                    <i class="fas fa-ellipsis w-6 h-6 shrink-0"></i> <span class="nav-label text-base font-medium">More</span>
                </a>
        <div class="flex-grow"></div>
        <a href="/settings" onclick="route(event)" title="Settings" class="sidebar-link flex items-center py-3.5 px-3 rounded-xl text-gray-300 hover:text-baby-blue hover:bg-baby-blue/10 transition duration-200">
            <i class="fas fa-cog w-6 h-6 shrink-0"></i>
            <span class="nav-label text-base font-medium">Settings</span>
        </a>
    </nav>
</aside>
    `;

document.body.insertAdjacentHTML('afterbegin', sidebarHtml);
document.body.insertAdjacentHTML('afterbegin', convPanelHtml);

    if (window.applyCurrentTheme) {
        window.applyCurrentTheme();
    }

    const sidebar = document.getElementById('main-sidebar');
    const follower = document.getElementById('mouse-highlight-follower');

    const MANUAL_X_CORRECTION = -68; 
    const MANUAL_Y_CORRECTION = -20.5; 

    if (sidebar && follower) {
        sidebar.addEventListener('mousemove', (e) => {
            const rect = sidebar.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const adjustedX = mouseX + MANUAL_X_CORRECTION;
            const adjustedY = mouseY + MANUAL_Y_CORRECTION; 

            follower.style.transform = `translate3d(${adjustedX}px, ${adjustedY}px, 0) translate(-50%, -50%)`;

            follower.style.opacity = '1';
        });

        sidebar.addEventListener('mouseleave', () => {
            follower.style.opacity = '0';
        });
    }
});