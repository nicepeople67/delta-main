const disguises = {
    "None": { title: "Delta V10", sub: "Default title and favicon", iconPath: "https://cdn.jsdelivr.net/gh/ethanlb34/delta-icons@main/default.png" }, 
    "Clever": { title: "Clever | Log in", sub: "Mimics the Clever login page", iconPath: "https://www.clever.com/wp-content/uploads/2023/06/cropped-Favicon-512px-32x32.png" },
    "Canvas": { title: "Dashboard", sub: "Mimics a typical Canvas dashboard", iconPath: "https://instructure-uploads.s3.amazonaws.com/account_96810000000000001/attachments/1049/Canvas_logo_gray2.png" },
    "Google Drive": { title: "My Drive - Google Drive", sub: "Mimics the Google Drive application", iconPath: "https://drive.google.com/favicon.ico" },
    "Edpuzzle": { title: "Edpuzzle | Student", sub: "Mimics an active Edpuzzle assignment", iconPath: "https://images.edpuzzle.com/favicons/favicon-32.png" }, // The last time I used this crap was in 2020 when they made us watch crappy videos recorded by teachers with their crappy integrated microphones that were so noisy they picked up the tiniest breath
    "Kahoot!": { title: "Kahoot! - Play & Create Quizzes", sub: "Mimics the Kahoot quiz platform", iconPath: "https://kahoot.it/favicon.ico" },
    "Google": { title: "Google", sub: "Mimics Google search.", iconPath: "https://www.google.com/favicon.ico" },
    "CodeHS": { title: "CodeHS | Learn Computer Science", sub: "Mimics the CodeHS learning platform", iconPath: "https://codehs.com/favicon.ico" }, // I hate this platform with a burning passion but here we are
};

const updatePageFavicon = (path) => {
    document.querySelectorAll('link[rel*="icon"]').forEach(el => el.remove());

    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = path.endsWith('.ico') ? 'image/x-icon' : 'image/png';
    link.href = path + '?v=' + Date.now(); 
    document.head.appendChild(link);
};



const applyDisguise = (selectedDisguiseValue) => {
    const disguise = disguises[selectedDisguiseValue] || disguises["None"];
    
    document.title = disguise.title;
    
    updatePageFavicon(disguise.iconPath); 

    const disguiseTitle = document.getElementById('disguise-title');
    const disguiseSub = document.getElementById('disguise-sub');
    const disguiseFaviconImg = document.getElementById('disguise-favicon-preview-img'); 

    if (disguiseTitle) disguiseTitle.textContent = disguise.title;
    if (disguiseSub) disguiseSub.textContent = disguise.sub;
    if (disguiseFaviconImg) disguiseFaviconImg.src = disguise.iconPath;
};


window.applyCurrentDisguise = () => {
    const savedDisguise = localStorage.getItem('deltaV9_disguise') || 'None';
    applyDisguise(savedDisguise);
};

window.applyCurrentDisguise();

const themes = {
    'theme-default': { name: 'Default', class: '', icon: 'https://cdn.jsdelivr.net/gh/ethanlb34/delta-icons@main/default.png' },
    'theme-magma-40': { name: 'Red', class: 'theme-red', icon: 'https://cdn.jsdelivr.net/gh/ethanlb34/delta-icons@main/red.png' },
    'theme-oak-sapling': { name: 'Green', class: 'theme-green', icon: 'https://cdn.jsdelivr.net/gh/ethanlb34/delta-icons@main/green.png' },
    'theme-grape-blast': { name: 'Purple', class: 'theme-grape-blast', icon: 'https://cdn.jsdelivr.net/gh/ethanlb34/delta-icons@main/purple.png' },
    'theme-tangerine-flow': { name: 'Orange', class: 'theme-tangerine-flow', icon: 'https://cdn.jsdelivr.net/gh/ethanlb34/delta-icons@main/orange.png' },
    'theme-candy-cane': { name: 'Pink', class: 'theme-candy-cane', icon: 'https://cdn.jsdelivr.net/gh/ethanlb34/delta-icons@main/pink.png' },
    'theme-sun-delight': { name: 'Yellow', class: 'theme-sun-delight', icon: 'https://cdn.jsdelivr.net/gh/ethanlb34/delta-icons@main/yellow.png' },
    /* These are festive themes and should only be uncommented at an appropriate time of the year. 
    MAKE SURE TO ALSO UNCOMMENT THE RESPECTIVE LIST ITEMS IN INDEX.HTML!
    'theme-halloween': { name: 'Halloween (Orange & Purple)', class: 'theme-halloween', icon: 'https://cdn.jsdelivr.net/gh/ethanlb34/delta-icons@main/orange.png' }
    'theme-christmas': { name: 'Christmas', class: 'theme-christmas', icon: 'https://cdn.jsdelivr.net/gh/ethanlb34/delta-icons@main/white.png' },
    'theme-new-year': { name: 'New Year', class: 'theme-new-year', icon: 'https://cdn.jsdelivr.net/gh/ethanlb34/delta-icons@main/red.png'}
    */
   // Dude does anybody even use these? "Oh yeah please add themes" yeah and you don't end even end up using them. I hate my users but here we are
};

const staticThemeColors = {
    'theme-default': {
        background: '#031120',
        surface: '#0a1a33',
        accent: '#5481cc',
        accentShadow: 'rgba(84,129,204,0.6)',
        accentSoft: 'rgba(84,129,204,0.3)'
    },
    'theme-magma-40': {
        background: '#110303',
        surface: '#250909',
        accent: '#ff4444',
        accentShadow: 'rgba(255,68,68,0.6)',
        accentSoft: 'rgba(255,68,68,0.3)'
    },
    'theme-oak-sapling': {
        background: '#081003',
        surface: '#101f0d',
        accent: '#9CFF64',
        accentShadow: 'rgba(156,255,100,0.6)',
        accentSoft: 'rgba(156,255,100,0.3)'
    },
    'theme-grape-blast': {
        background: '#0d0312',
        surface: '#1a0829',
        accent: '#aa44ff',
        accentShadow: 'rgba(170,68,255,0.6)',
        accentSoft: 'rgba(170,68,255,0.3)'
    },
    'theme-tangerine-flow': {
        background: '#120801',
        surface: '#261405',
        accent: '#ffa500',
        accentShadow: 'rgba(255,165,0,0.6)',
        accentSoft: 'rgba(255,165,0,0.3)'
    },
    'theme-candy-cane': {
        background: '#120308',
        surface: '#260915',
        accent: '#ff69b4',
        accentShadow: 'rgba(255,105,180,0.6)',
        accentSoft: 'rgba(255,105,180,0.3)'
    },
    'theme-sun-delight': {
        background: '#0d0a01',
        surface: '#1f1803',
        accent: '#ffff00',
        accentShadow: 'rgba(255,255,0,0.6)',
        accentSoft: 'rgba(255,255,0,0.3)'
    },
    'theme-wavy-beach': {
        background: '#120801',
        surface: '#261405',
        accent: '#FF8C42',
        accentShadow: 'rgba(255,140,66,0.6)',
        accentSoft: 'rgba(255,140,66,0.3)'
    },
    'theme-aurora': {
        background: '#081003',
        surface: '#101f0d',
        accent: '#00D9FF',
        accentShadow: 'rgba(0,217,255,0.6)',
        accentSoft: 'rgba(0,217,255,0.3)'
    },
    'theme-sunset-glow': {
        background: '#120308',
        surface: '#260915',
        accent: '#FFB347',
        accentShadow: 'rgba(255,179,71,0.6)',
        accentSoft: 'rgba(255,179,71,0.3)'
    },
    'theme-ocean-wave': {
        background: '#081003',
        surface: '#101f0d',
        accent: '#0EA5E9',
        accentShadow: 'rgba(14,165,233,0.6)',
        accentSoft: 'rgba(14,165,233,0.3)'
    },
    'theme-lava-flow': {
        background: '#110303',
        surface: '#250909',
        accent: '#DC2626',
        accentShadow: 'rgba(220,38,38,0.6)',
        accentSoft: 'rgba(220,38,38,0.3)'
    },
    'theme-cotton-candy': {
        background: '#120308',
        surface: '#260915',
        accent: '#EC4899',
        accentShadow: 'rgba(236,72,153,0.6)',
        accentSoft: 'rgba(236,72,153,0.3)'
    },
    'theme-midnight-neon': {
        background: '#0a0a0a',
        surface: '#191919',
        accent: '#00FFFF',
        accentShadow: 'rgba(0,255,255,0.6)',
        accentSoft: 'rgba(0,255,255,0.3)'
    }
};

const applyTheme = (themeId) => {
    const theme = themes[themeId] || themes['theme-default'];
    
    Object.values(themes).forEach(t => {
        if (t.class) {
            const classArray = t.class.split(' ');
            classArray.forEach(cls => {
                document.documentElement.classList.remove(cls);
            });
        }
    });
    
    document.documentElement.style.removeProperty('--color-accent');
    document.documentElement.style.removeProperty('--color-accent-shadow');
    document.documentElement.style.removeProperty('--color-accent-soft');
    document.documentElement.style.removeProperty('--color-background');
    document.documentElement.style.removeProperty('--color-surface');
    if (themeId !== 'theme-custom') {
        document.body.style.removeProperty('background-image');
        document.body.style.removeProperty('background-attachment');
        document.body.style.removeProperty('background-size');
        document.body.style.removeProperty('background-repeat');
    }
    
    if (theme.class) {
        const classArray = theme.class.split(' ');
        classArray.forEach(cls => {
            document.documentElement.classList.add(cls);
        });
    }
    
    const themeTitle = document.getElementById('theme-title');
    if (themeTitle) {
        themeTitle.textContent = theme.name;
    }
    
    const sidebarLogo = document.getElementById('sidebar-logo');
    if (sidebarLogo) {
        sidebarLogo.src = theme.icon;
    }
    
    if (window.updateParticlesTheme) {
        setTimeout(window.updateParticlesTheme, 50);
    }
    
    if (window.themeAnimationInterval) {
        clearInterval(window.themeAnimationInterval);
    }
    
    if (themeId === 'theme-custom') {
        applyCustomTheme();
    } else if (theme.class && theme.class.includes('theme-animated')) {
        window.startThemeAnimation(themeId);
    } else {
        const colors = staticThemeColors[themeId];
        if (colors) {
            document.documentElement.style.setProperty('--color-background', colors.background);
            document.documentElement.style.setProperty('--color-surface', colors.surface);
            document.documentElement.style.setProperty('--color-accent', colors.accent);
            document.documentElement.style.setProperty('--color-accent-shadow', colors.accentShadow);
            document.documentElement.style.setProperty('--color-accent-soft', colors.accentSoft);
        }
    }
};

const animatedThemeColors = {
    'theme-wavy-beach': [
        { accent: '#FF8C42', shadow: 'rgba(255, 140, 66, 0.6)', soft: 'rgba(255, 140, 66, 0.3)' },
        { accent: '#FF5A36', shadow: 'rgba(255, 90, 54, 0.6)', soft: 'rgba(255, 90, 54, 0.3)' }
    ],
    'theme-aurora': [
        { accent: '#00D9FF', shadow: 'rgba(0, 217, 255, 0.6)', soft: 'rgba(0, 217, 255, 0.3)' },
        { accent: '#00FF88', shadow: 'rgba(0, 255, 136, 0.6)', soft: 'rgba(0, 255, 136, 0.3)' }
    ],
    'theme-sunset-glow': [
        { accent: '#FFB347', shadow: 'rgba(255, 179, 71, 0.6)', soft: 'rgba(255, 179, 71, 0.3)' },
        { accent: '#D946EF', shadow: 'rgba(217, 70, 239, 0.6)', soft: 'rgba(217, 70, 239, 0.3)' }
    ],
    'theme-ocean-wave': [
        { accent: '#0EA5E9', shadow: 'rgba(14, 165, 233, 0.6)', soft: 'rgba(14, 165, 233, 0.3)' },
        { accent: '#06B6D4', shadow: 'rgba(6, 182, 212, 0.6)', soft: 'rgba(6, 182, 212, 0.3)' }
    ],
    'theme-lava-flow': [
        { accent: '#DC2626', shadow: 'rgba(220, 38, 38, 0.6)', soft: 'rgba(220, 38, 38, 0.3)' },
        { accent: '#F97316', shadow: 'rgba(249, 115, 22, 0.6)', soft: 'rgba(249, 115, 22, 0.3)' }
    ],
    'theme-cotton-candy': [
        { accent: '#EC4899', shadow: 'rgba(236, 72, 153, 0.6)', soft: 'rgba(236, 72, 153, 0.3)' },
        { accent: '#A855F7', shadow: 'rgba(168, 85, 247, 0.6)', soft: 'rgba(168, 85, 247, 0.3)' }
    ],
    'theme-midnight-neon': [
        { accent: '#00FFFF', shadow: 'rgba(0, 255, 255, 0.6)', soft: 'rgba(0, 255, 255, 0.3)' },
        { accent: '#FF00FF', shadow: 'rgba(255, 0, 255, 0.6)', soft: 'rgba(255, 0, 255, 0.3)' }
    ]
};

window.startThemeAnimation = (themeId) => {
    const colors = animatedThemeColors[themeId];
    if (!colors) return;
    
    const staticColors = staticThemeColors[themeId];
    if (staticColors) {
        document.documentElement.style.setProperty('--color-background', staticColors.background);
        document.documentElement.style.setProperty('--color-surface', staticColors.surface);
    }
    
    let colorIndex = 0;
    const animationDuration = 8000; 
    const updateInterval = 50; 
    const totalFrames = animationDuration / updateInterval;
    let currentFrame = 0;
    
    window.themeAnimationInterval = setInterval(() => {
        currentFrame++;
        
        let progress;
        const frameInCycle = currentFrame % (totalFrames / 2);
        if (currentFrame % totalFrames < totalFrames / 2) {
            progress = frameInCycle / (totalFrames / 2);
        } else {
            progress = 1 - (frameInCycle / (totalFrames / 2));
        }
        
        const color1 = colors[0];
        const color2 = colors[1];
        
        const updateColor = (hex, fromHex, toHex) => {
            const fromRgb = parseInt(fromHex.slice(1), 16);
            const toRgb = parseInt(toHex.slice(1), 16);
            
            const r1 = (fromRgb >> 16) & 255;
            const g1 = (fromRgb >> 8) & 255;
            const b1 = fromRgb & 255;
            
            const r2 = (toRgb >> 16) & 255;
            const g2 = (toRgb >> 8) & 255;
            const b2 = toRgb & 255;
            
            const r = Math.round(r1 + (r2 - r1) * progress);
            const g = Math.round(g1 + (g2 - g1) * progress);
            const b = Math.round(b1 + (b2 - b1) * progress);
            
            return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
        };
        
        const newAccent = updateColor('--color-accent', color1.accent, color2.accent);
        
        const fromShadow = color1.shadow;
        const toShadow = color2.shadow;
        const fromSoft = color1.soft;
        const toSoft = color2.soft;
        
        document.documentElement.style.setProperty('--color-accent', newAccent);
        document.documentElement.style.setProperty('--color-accent-shadow', `rgba(${Math.round(parseInt(newAccent.slice(1, 3), 16) + (parseInt(color2.accent.slice(1, 3), 16) - parseInt(color1.accent.slice(1, 3), 16)) * progress)}, ${Math.round(parseInt(newAccent.slice(3, 5), 16) + (parseInt(color2.accent.slice(3, 5), 16) - parseInt(color1.accent.slice(3, 5), 16)) * progress)}, ${Math.round(parseInt(newAccent.slice(5, 7), 16) + (parseInt(color2.accent.slice(5, 7), 16) - parseInt(color1.accent.slice(5, 7), 16)) * progress)}, 0.6)`);
        document.documentElement.style.setProperty('--color-accent-soft', `rgba(${Math.round(parseInt(newAccent.slice(1, 3), 16) + (parseInt(color2.accent.slice(1, 3), 16) - parseInt(color1.accent.slice(1, 3), 16)) * progress)}, ${Math.round(parseInt(newAccent.slice(3, 5), 16) + (parseInt(color2.accent.slice(3, 5), 16) - parseInt(color1.accent.slice(3, 5), 16)) * progress)}, ${Math.round(parseInt(newAccent.slice(5, 7), 16) + (parseInt(color2.accent.slice(5, 7), 16) - parseInt(color1.accent.slice(5, 7), 16)) * progress)}, 0.3)`);
    }, updateInterval);
};

window.handleThemeChange = (themeId) => {
    applyTheme(themeId);
    localStorage.setItem('theme', themeId);
};

window.applyCurrentTheme = () => {
    const savedTheme = localStorage.getItem('theme') || 'theme-default';
    applyTheme(savedTheme);
};

window.applyCustomTheme = () => {
    const bg = localStorage.getItem('custom_bg');
    const surface = localStorage.getItem('custom_surface');
    const accent = localStorage.getItem('custom_accent');
    const image = localStorage.getItem('custom_bg_image');
    if (bg) document.documentElement.style.setProperty('--color-background', bg);
    if (surface) document.documentElement.style.setProperty('--color-surface', surface);
    if (accent) document.documentElement.style.setProperty('--color-accent', accent);
    if (image) {
        document.body.style.backgroundImage = `url('${image}')`;
        document.body.style.backgroundAttachment = 'fixed';
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundRepeat = 'no-repeat';
    } else {
        document.body.style.removeProperty('background-image');
        document.body.style.removeProperty('background-attachment');
        document.body.style.removeProperty('background-size');
        document.body.style.removeProperty('background-repeat');
    }
};

window.saveCustomTheme = () => {
    const bg = document.getElementById('customBackgroundColor')?.value;
    const surface = document.getElementById('customSurfaceColor')?.value;
    const accent = document.getElementById('customAccentColor')?.value;
    const image = document.getElementById('customBackgroundImage')?.value;
    if (bg) localStorage.setItem('custom_bg', bg);
    if (surface) localStorage.setItem('custom_surface', surface);
    if (accent) localStorage.setItem('custom_accent', accent);
    if (image !== undefined && image.trim() !== '') {
        localStorage.setItem('custom_bg_image', image);
    } else {
        localStorage.removeItem('custom_bg_image');
    }
    applyCustomTheme();
};

window.resetCustomBackgroundColor = () => {
    document.getElementById('customBackgroundColor').value = '#031120';
    saveCustomTheme();
};

window.resetCustomSurfaceColor = () => {
    document.getElementById('customSurfaceColor').value = '#0a1a33';
    saveCustomTheme();
};

window.resetCustomAccentColor = () => {
    document.getElementById('customAccentColor').value = '#5481cc';
    saveCustomTheme();
};

window.removeCustomBackgroundImage = () => {
    document.getElementById('customBackgroundImage').value = '';
    saveCustomTheme();
};

window.updateCustomThemeControls = () => {
    const select = document.getElementById('themeSelect');
    const controls = document.getElementById('customThemeControls');
    if (!select || !controls) return;
    controls.style.display = select.value === 'theme-custom' ? 'block' : 'none';
    if (select.value === 'theme-custom') {
        const bg = localStorage.getItem('custom_bg') || '#031120';
        const surface = localStorage.getItem('custom_surface') || '#0a1a33';
        const accent = localStorage.getItem('custom_accent') || '#5481cc';
        const image = localStorage.getItem('custom_bg_image') || '';
        document.getElementById('customBackgroundColor').value = bg;
        document.getElementById('customSurfaceColor').value = surface;
        document.getElementById('customAccentColor').value = accent;
        document.getElementById('customBackgroundImage').value = image;
    }
};

window.applyCurrentTheme(); 

window.setPaginationMode = (mode) => {
    if (mode === 'letters' || mode === 'pages') {
        window.paginationMode = mode;
        localStorage.setItem('paginationmode', mode);
        if (typeof renderGames === 'function') {
            window.currentPage = 1;
            window.currentLetter = 'A';
            renderGames();
        }
    }
};

window.applyCurrentPaginationMode = () => {
    const savedMode = localStorage.getItem('paginationmode') || 'pages';
    window.paginationMode = savedMode;
    updatePaginationModeRadios();
};

window.setParticleShape = (shape) => {
    localStorage.setItem('particleShape', shape);
    if (typeof updateParticleConfig === 'function') {
        updateParticleConfig();
    }
};

window.updateParticleShapeSelection = () => {
    const select = document.getElementById('particleShapeSelect');
    if (select) {
        select.value = localStorage.getItem('particleShape') || 'circle';
    }
};

window.applyCurrentParticleShape = () => {
    const shape = localStorage.getItem('particleShape') || 'circle';
    const select = document.getElementById('particleShapeSelect');
    if (select) select.value = shape;
};

window.updatePaginationModeRadios = () => {
    const mode = localStorage.getItem('paginationmode') || 'pages';
    const pagesRadio = document.getElementById('paginationPages');
    const lettersRadio = document.getElementById('paginationLetters');
    
    if (mode === 'pages') {
        if (pagesRadio) pagesRadio.checked = true;
        if (lettersRadio) lettersRadio.checked = false;
    } else if (mode === 'letters') {
        if (pagesRadio) pagesRadio.checked = false;
        if (lettersRadio) lettersRadio.checked = true;
    }
};

window.applyCurrentPaginationMode();

window.setGameCardSize = (size) => {
    if (size === 'small' || size === 'normal') {
        const gameGrid = document.getElementById('gameGrid');
        
        if (gameGrid) {

            gameGrid.classList.remove('game-card-size-small', 'game-card-size-normal');
            
            if (size === 'small') {
                gameGrid.classList.add('game-card-size-small');
            } else if (size === 'normal') {
                gameGrid.classList.add('game-card-size-normal');
            }
        }
        
        localStorage.setItem('v10gameCardSize', size);
        
        const smallRadio = document.getElementById('gameCardSizeSmall');
        const normalRadio = document.getElementById('gameCardSizeNormal');
        if (smallRadio) smallRadio.checked = (size === 'small');
        if (normalRadio) normalRadio.checked = (size === 'normal');
        
        const smallOption = document.getElementById('gameCardSizeSmallOption');
        const normalOption = document.getElementById('gameCardSizeNormalOption');
        if (smallOption) smallOption.classList.toggle('border-baby-blue', size === 'small');
        if (normalOption) normalOption.classList.toggle('border-baby-blue', size === 'normal');
    }
};

window.applyGameCardSize = () => {
    const savedSize = localStorage.getItem('v10gameCardSize') || 'small';
    const gameGrid = document.getElementById('gameGrid');
    
    if (gameGrid) {
        gameGrid.classList.remove('game-card-size-small', 'game-card-size-normal');
        
        if (savedSize === 'small') {
            gameGrid.classList.add('game-card-size-small');
        } else if (savedSize === 'normal') {
            gameGrid.classList.add('game-card-size-normal');
        }
    }
    
    const smallRadio = document.getElementById('gameCardSizeSmall');
    const normalRadio = document.getElementById('gameCardSizeNormal');
    if (smallRadio) smallRadio.checked = (savedSize === 'small');
    if (normalRadio) normalRadio.checked = (savedSize === 'normal');
    
    const smallOption = document.getElementById('gameCardSizeSmallOption');
    const normalOption = document.getElementById('gameCardSizeNormalOption');
    if (smallOption) smallOption.classList.toggle('border-baby-blue', savedSize === 'small');
    if (normalOption) normalOption.classList.toggle('border-baby-blue', savedSize === 'normal');
};

window.setSidebarPosition = (position) => {
    if (position === 'right') {
        document.documentElement.classList.add('sidebar-right');
    } else {
        document.documentElement.classList.remove('sidebar-right');
    }
    
    const leftRadio = document.getElementById('sidebarLeft');
    const rightRadio = document.getElementById('sidebarRight');
    if (leftRadio) leftRadio.checked = (position === 'left');
    if (rightRadio) rightRadio.checked = (position === 'right');
    
    const leftOption = document.getElementById('sidebarLeftOption');
    const rightOption = document.getElementById('sidebarRightOption');
    if (leftOption) leftOption.classList.toggle('border-baby-blue', position === 'left');
    if (rightOption) rightOption.classList.toggle('border-baby-blue', position === 'right');
    
    localStorage.setItem('deltaV10_sidebarPosition', position);
};

window.applyCurrentSidebarPosition = () => {
    const position = localStorage.getItem('deltaV10_sidebarPosition') || 'left';
    setSidebarPosition(position);
};

window.applyCurrentSidebarPosition();

window.setSidebarStyle = (style) => {
    if (style === 'rectangular') {
        document.documentElement.classList.add('sidebar-rectangular');
    } else {
        document.documentElement.classList.remove('sidebar-rectangular');
    }
    
    const floatingRadio = document.getElementById('sidebarFloating');
    const rectangularRadio = document.getElementById('sidebarRectangular');
    if (floatingRadio) floatingRadio.checked = (style === 'floating');
    if (rectangularRadio) rectangularRadio.checked = (style === 'rectangular');
    
    const floatingOption = document.getElementById('sidebarFloatingOption');
    const rectangularOption = document.getElementById('sidebarRectangularOption');
    if (floatingOption) {
        floatingOption.classList.toggle('border-baby-blue', style === 'floating');
    }
    if (rectangularOption) {
        rectangularOption.classList.toggle('border-baby-blue', style === 'rectangular');
    }
    
    localStorage.setItem('deltaV10_sidebarStyle', style);
};

window.applyCurrentSidebarStyle = () => {
    const style = localStorage.getItem('deltaV10_sidebarStyle') || 'floating';
    setSidebarStyle(style);
};

window.applyCurrentSidebarStyle();

window.setSidebarAlwaysOpen = (state) => {
    document.documentElement.classList.remove('sidebar-always-open', 'sidebar-always-collapsed');

    if (state === true || state === 'alwaysOpen') {
        document.documentElement.classList.add('sidebar-always-open');
        const sidebar = document.getElementById('main-sidebar');
        const mainContent = document.querySelector('.main-content');
        if (sidebar) sidebar.classList.remove('sidebar-collapsed');
        if (mainContent) mainContent.classList.remove('sidebar-content-expanded');
        state = 'alwaysOpen';
    } else if (state === 'alwaysCollapsed') {
        document.documentElement.classList.add('sidebar-always-collapsed');
    } else {
        state = 'auto';
    }

    const autoRadio = document.getElementById('sidebarAuto');
    const alwaysOpenRadio = document.getElementById('sidebarAlwaysOpen');
    const alwaysCollapsedRadio = document.getElementById('sidebarAlwaysCollapsed');
    if (autoRadio) autoRadio.checked = (state === 'auto');
    if (alwaysOpenRadio) alwaysOpenRadio.checked = (state === 'alwaysOpen');
    if (alwaysCollapsedRadio) alwaysCollapsedRadio.checked = (state === 'alwaysCollapsed');

    const autoOption = document.getElementById('sidebarAutoOption');
    const alwaysOpenOption = document.getElementById('sidebarAlwaysOpenOption');
    const alwaysCollapsedOption = document.getElementById('sidebarAlwaysCollapsedOption');
    if (autoOption) autoOption.classList.toggle('border-baby-blue', state === 'auto');
    if (alwaysOpenOption) alwaysOpenOption.classList.toggle('border-baby-blue', state === 'alwaysOpen');
    if (alwaysCollapsedOption) alwaysCollapsedOption.classList.toggle('border-baby-blue', state === 'alwaysCollapsed');

    localStorage.setItem('deltaV10_sidebarAlwaysOpen', state);
};

window.applyCurrentSidebarAlwaysOpen = () => {
    const saved = localStorage.getItem('deltaV10_sidebarAlwaysOpen');
    if (saved === 'true' || saved === 'alwaysOpen') setSidebarAlwaysOpen('alwaysOpen');
    else if (saved === 'alwaysCollapsed') setSidebarAlwaysOpen('alwaysCollapsed');
    else setSidebarAlwaysOpen('auto');
};

window.applyCurrentSidebarAlwaysOpen();

window.openCloakedPageWrapper = () => {
    const currentUrl = 'https://delta-5t9i.firebaseapp.com/'; // Change this every time the domain changes, or else it will not work
    const newWindow = window.open('about:blank', '_blank');

    if (newWindow) {
        const currentTitle = document.title;
        const currentFaviconLink = document.getElementById("faviconLink");
        const currentFaviconType = currentFaviconLink ? currentFaviconLink.type : 'image/x-icon';
        const currentFaviconHref = currentFaviconLink ? currentFaviconLink.href : '/static/favicons/canvas.png';

        const htmlContent =
            '<!DOCTYPE html>' +
            '<html>' +
            '<head>' +
            `<title>${currentTitle}</title>` + 
            `<link rel="icon" type="${currentFaviconType}" href="${currentFaviconHref}">` + 
            '</head>' +
            '<body>' +
            '<p style="font-family: sans-serif; text-align: center; margin-top: 50px;">' +
            'Please wait while the page loads...' +
            '</p>' +
            `<iframe src="${currentUrl}" style="width:100%; height:100vh; border:none; position:fixed; top:0; left:0;" sandbox="allow-forms allow-scripts allow-same-origin"></iframe>` +
            '</body>' +
            '</html>';

        newWindow.document.write(htmlContent);
        newWindow.document.close();
    } else {
        alert("Your browser's popup blocker prevented the cloak. Please disable it.");
        const statusElement = document.getElementById('import-status');
        if (statusElement) {
            statusElement.textContent = "Error: Popup blocker prevented the cloak.";
        }
    }
};

window.openBlobCloakedPage = function(url) {
  const html = `<!DOCTYPE html><html><head><script>window.location.replace(${JSON.stringify(url)})<\/script></head><body></body></html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, '_blank');
};

window.downloadCookieData = () => { 
    const data = {};
    const statusElement = document.getElementById('import-status');

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        data[key] = localStorage.getItem(key);
    }

    const jsonString = JSON.stringify(data, null, 2); 
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `deltaV10_data_export_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click(); 
    document.body.removeChild(a); 
    URL.revokeObjectURL(url);
    if (statusElement) {
        statusElement.textContent = 'Data successfully downloaded!';
        setTimeout(() => statusElement.textContent = '', 5000);
    }
};

window.uploadCookieData = () => { 
    const statusElement = document.getElementById('import-status');

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.style.display = 'none';

    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) {
            if (statusElement) statusElement.textContent = 'No file selected.';
            setTimeout(() => statusElement.textContent = '', 5000);
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target.result);
                let importedCount = 0;

                for (const key in importedData) {
                    if (Object.hasOwnProperty.call(importedData, key)) {
                        localStorage.setItem(key, importedData[key]);
                        importedCount++;
                    }
                }
                
                window.applyCurrentDisguise();

                if (statusElement) {
                    statusElement.textContent = `Successfully imported ${importedCount} items. Please refresh for full effect.`;
                    setTimeout(() => statusElement.textContent = '', 10000);
                }

            } catch (error) {
                console.error('Error processing JSON file:', error);
                if (statusElement) {
                    statusElement.textContent = 'Error: Invalid JSON file format.';
                    setTimeout(() => statusElement.textContent = '', 5000);
                }
            }
        };

        reader.readAsText(file);
    };

    document.body.appendChild(input);
    input.click();
    input.remove();
    
    if (statusElement) statusElement.textContent = 'Waiting for file selection...';
};


window.updateParticleButtons = () => {
    const onBtn = document.getElementById('particlesOnBtn');
    const offBtn = document.getElementById('particlesOffBtn');
    if (!onBtn || !offBtn) return;
    
    const isEnabled = typeof isParticlesEnabled === 'function' ? isParticlesEnabled() : true;
    
    if (isEnabled) {
        onBtn.className = 'px-6 py-2 rounded-lg font-semibold transition duration-200 bg-baby-blue text-dark-navy';
        offBtn.className = 'px-6 py-2 rounded-lg font-semibold transition duration-200 bg-slate-700 text-slate-300 hover:bg-slate-600';
    } else {
        onBtn.className = 'px-6 py-2 rounded-lg font-semibold transition duration-200 bg-slate-700 text-slate-300 hover:bg-slate-600';
        offBtn.className = 'px-6 py-2 rounded-lg font-semibold transition duration-200 bg-red-600 text-white';
    }
};

window.updateCursorGlowButtons = () => {
    const onBtn = document.getElementById('cursorGlowOnBtn');
    const offBtn = document.getElementById('cursorGlowOffBtn');
    if (!onBtn || !offBtn) return;
    
    const isEnabled = typeof isCursorGlowEnabled === 'function' ? isCursorGlowEnabled() : true;
    
    if (isEnabled) {
        onBtn.className = 'px-6 py-2 rounded-lg font-semibold transition duration-200 bg-baby-blue text-dark-navy';
        offBtn.className = 'px-6 py-2 rounded-lg font-semibold transition duration-200 bg-slate-700 text-slate-300 hover:bg-slate-600';
    } else {
        onBtn.className = 'px-6 py-2 rounded-lg font-semibold transition duration-200 bg-slate-700 text-slate-300 hover:bg-slate-600';
        offBtn.className = 'px-6 py-2 rounded-lg font-semibold transition duration-200 bg-red-600 text-white';
    }
};

async function processUsernameChange(inputElement) {
    const rawName = inputElement.value;
    const cleanName = rawName.trim().slice(0, 20);
    const lookupName = cleanName.toLowerCase();

    if (!cleanName) {
        alert('Please enter a username');
        return;
    }

    if (BLACKLIST.includes(lookupName)) {
        const result = await showAdminAuthModal();
        if (!result) return;
        
        const { user, pass } = result;
        
        if (typeof window.verifyAdminCredentials !== 'function') {
            alert("Authentication system not available. Please try again.");
            return;
        }
        
        const isValid = await window.verifyAdminCredentials(user, pass);
        if (!isValid) {
            alert("Incorrect credentials. GET OUT!"); // ngl they deserve it if they can't even get the password right
            inputElement.value = localStorage.getItem('public_chat_username_v1') || '';
            return;
        }
        
        alert("Admin identity verified.");
    }

    localStorage.setItem('public_chat_username_v1', cleanName);
    inputElement.value = '';
}

window.changeUsername = () => {
    const input = document.getElementById('chatUsernameInput');
    if (input) processUsernameChange(input);
};

window.changeUsernameFromAppearance = () => {
    const input = document.getElementById('appearanceChatUsernameInput');
    if (input) processUsernameChange(input);
};

window.initSettingsPage = () => {
    const navButtonsContainer = document.getElementById('navButtons');
    if (navButtonsContainer) {

        const activeNav = document.querySelector('.nav-btn.active');
        const initialPanelId = activeNav ? activeNav.getAttribute('data-target') : 'cloaking';

        document.querySelectorAll('.panel').forEach(panel => {
            panel.setAttribute('hidden', true);
            panel.setAttribute('aria-hidden', true);
        });
        const initialPanel = document.getElementById(initialPanelId);
        if (initialPanel) {
            initialPanel.removeAttribute('hidden');
            initialPanel.setAttribute('aria-hidden', false);
        }
    }
    
   
    const disguiseSelect = document.getElementById('disguiseSelect');

    if (disguiseSelect) {

        disguiseSelect.value = localStorage.getItem('deltaV9_disguise') || 'None';

        disguiseSelect.addEventListener('change', (e) => {
            const selectedValue = e.target.value;
            applyDisguise(selectedValue);
            localStorage.setItem('deltaV9_disguise', selectedValue); 
        });
        
        window.applyCurrentDisguise();
    }

    const themeSelect = document.getElementById('themeSelect');
    
    if (themeSelect) {
        themeSelect.value = localStorage.getItem('theme') || 'theme-default';
        updateCustomThemeControls();
        if (themeSelect.value === 'theme-custom') {
            applyCustomTheme();
        }

        themeSelect.addEventListener('change', (e) => {
            const selectedTheme = e.target.value;
            applyTheme(selectedTheme);
            localStorage.setItem('theme', selectedTheme);
            updateCustomThemeControls();
            if (selectedTheme === 'theme-custom') {
                applyCustomTheme();
            }
        });
        
        window.applyCurrentTheme();
    }

    updateParticleButtons();
    updateCursorGlowButtons();
    updateChatNotificationButtons();
 
    const chatUsernameInput = document.getElementById('chatUsernameInput');
    if(chatUsernameInput) {
        chatUsernameInput.value = localStorage.getItem('public_chat_username_v1') || 'Guest';
    }
    
    const appearanceChatUsernameInput = document.getElementById('appearanceChatUsernameInput');
    if(appearanceChatUsernameInput) {
        appearanceChatUsernameInput.value = localStorage.getItem('public_chat_username_v1') || '';
    }

    window.applyCurrentSidebarStyle();
    window.applyCurrentSidebarPosition();
    window.applyCurrentSidebarAlwaysOpen();
};

window.saveKeybindSettings = function() {
    const keybindInput = document.getElementById('miscKeybindInput');
    const websiteInput = document.getElementById('miscWebsiteInput');
    
    if (!keybindInput || !websiteInput) return;
    
    const keybind = keybindInput.value.trim().toLowerCase();
    const website = websiteInput.value.trim();
    
    if (!keybind || !website) {sync
        alert('Please fill in both keybind and website fields.');
        return;
    }
    
    localStorage.setItem('deltaV10_customKeybind', keybind);
    localStorage.setItem('deltaV10_customKeybindWebsite', website);
    
    const btn = document.querySelector('button[onclick="saveKeybindSettings();"]');
    if (btn) {
        const originalText = btn.textContent;
        btn.textContent = '✓ Saved!';
        btn.style.backgroundColor = '#4ade80';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.backgroundColor = '';
        }, 2000);
    }
};

window.removeKeybind = function() {
    const keybindInput = document.getElementById('miscKeybindInput');
    const websiteInput = document.getElementById('miscWebsiteInput');

    localStorage.removeItem('deltaV10_customKeybind');
    localStorage.removeItem('deltaV10_customKeybindWebsite');

    if (keybindInput) keybindInput.value = '';
    if (websiteInput) websiteInput.value = '';
   
    const btn = document.querySelector('button[onclick="removeKeybind();"]');
    if (btn) {
        const originalText = btn.textContent;
        btn.textContent = '✓ Removed!';
        btn.style.backgroundColor = '#22c55e';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.backgroundColor = '';
        }, 2000);
    }
};

window.toggleMiscCloak = function(enable) {
    const onBtn = document.getElementById('miscCloakOnBtn');
    const offBtn = document.getElementById('miscCloakOffBtn');
    
    if (enable) {
        if (onBtn) onBtn.classList.add('bg-baby-blue', 'text-dark-navy');
        if (offBtn) offBtn.classList.remove('bg-baby-blue', 'text-dark-navy');
        window.openCloakedPageWrapper();
    } else {
        if (onBtn) onBtn.classList.remove('bg-baby-blue', 'text-dark-navy');
        if (offBtn) offBtn.classList.add('bg-baby-blue', 'text-dark-navy');
    }
};

window.updateMiscParticleButtons = function() {
    const particlesEnabled = localStorage.getItem('particlesToggle') !== 'false';
    const onBtn = document.getElementById('miscParticlesOnBtn');
    const offBtn = document.getElementById('miscParticlesOffBtn');
    
    if (particlesEnabled) {
        if (onBtn) onBtn.classList.add('bg-baby-blue', 'text-dark-navy');
        if (offBtn) offBtn.classList.remove('bg-baby-blue', 'text-dark-navy');
    } else {
        if (onBtn) onBtn.classList.remove('bg-baby-blue', 'text-dark-navy');
        if (offBtn) offBtn.classList.add('bg-baby-blue', 'text-dark-navy');
    }
};

window.updateMiscCursorGlowButtons = function() {
    const glowEnabled = localStorage.getItem('cursorGlowEnabled') === 'true';
    const onBtn = document.getElementById('miscCursorGlowOnBtn');
    const offBtn = document.getElementById('miscCursorGlowOffBtn');
    
    if (glowEnabled) {
        if (onBtn) onBtn.classList.add('bg-baby-blue', 'text-dark-navy');
        if (offBtn) offBtn.classList.remove('bg-baby-blue', 'text-dark-navy');
    } else {
        if (onBtn) onBtn.classList.remove('bg-baby-blue', 'text-dark-navy');
        if (offBtn) offBtn.classList.add('bg-baby-blue', 'text-dark-navy');
    }
};

window.updateAppearanceParticleButtons = function() {
    const particlesEnabled = localStorage.getItem('delta_particles') !== 'disabled';
    const onBtn = document.getElementById('appearanceParticlesOnBtn');
    const offBtn = document.getElementById('appearanceParticlesOffBtn');
    
    if (particlesEnabled) {
        if (onBtn) onBtn.classList.add('bg-baby-blue', 'text-dark-navy');
        if (offBtn) offBtn.classList.remove('bg-baby-blue', 'text-dark-navy');
    } else {
        if (onBtn) onBtn.classList.remove('bg-baby-blue', 'text-dark-navy');
        if (offBtn) offBtn.classList.add('bg-baby-blue', 'text-dark-navy');
    }
};

window.updateAppearanceCursorGlowButtons = function() {
    const glowEnabled = localStorage.getItem('cursorGlowEnabled') === 'true';
    const onBtn = document.getElementById('appearanceCursorGlowOnBtn');
    const offBtn = document.getElementById('appearanceCursorGlowOffBtn');
    
    if (glowEnabled) {
        if (onBtn) onBtn.classList.add('bg-baby-blue', 'text-dark-navy');
        if (offBtn) offBtn.classList.remove('bg-baby-blue', 'text-dark-navy');
    } else {
        if (onBtn) onBtn.classList.remove('bg-baby-blue', 'text-dark-navy');
        if (offBtn) offBtn.classList.add('bg-baby-blue', 'text-dark-navy');
    }
};

window.toggleChatNotifications = function(enable) {
    localStorage.setItem('chatNotificationsEnabled', enable ? 'true' : 'false');
};

window.updateChatNotificationButtons = function() {
    const enabled = localStorage.getItem('chatNotificationsEnabled') !== 'false';
    const onBtn = document.getElementById('miscChatNotificationsOnBtn');
    const offBtn = document.getElementById('miscChatNotificationsOffBtn');
    
    if (enabled) {
        if (onBtn) onBtn.classList.add('bg-baby-blue', 'text-dark-navy');
        if (offBtn) offBtn.classList.remove('bg-baby-blue', 'text-dark-navy');
    } else {
        if (onBtn) onBtn.classList.remove('bg-baby-blue', 'text-dark-navy');
        if (offBtn) offBtn.classList.add('bg-baby-blue', 'text-dark-navy');
    }
};

window.toggleRecentlyPlayedSection = function(enable) {
    localStorage.setItem('recentlyPlayedEnabled', enable ? 'true' : 'false');
    const section = document.getElementById('recently-played-section');
    if (section) {
        section.style.display = enable ? 'block' : 'none';
    }
};

window.updateAppearanceRecentlyPlayedButtons = function() {
    const enabled = localStorage.getItem('recentlyPlayedEnabled') === 'true';
    const onBtn = document.getElementById('appearanceRecentlyPlayedOnBtn');
    const offBtn = document.getElementById('appearanceRecentlyPlayedOffBtn');
    
    if (enabled) {
        if (onBtn) onBtn.classList.add('bg-baby-blue', 'text-dark-navy');
        if (offBtn) offBtn.classList.remove('bg-baby-blue', 'text-dark-navy');
    } else {
        if (onBtn) onBtn.classList.remove('bg-baby-blue', 'text-dark-navy');
        if (offBtn) offBtn.classList.add('bg-baby-blue', 'text-dark-navy');
    }
};

window.applyRecentlyPlayedSectionState = function() {
    const enabled = localStorage.getItem('recentlyPlayedEnabled') === 'true';
    const section = document.getElementById('recently-played-section');
    if (section) {
        section.style.display = enabled ? 'block' : 'none';
    }
};

window.togglePopularGamesSection = function(enable) {
    localStorage.setItem('popularGamesEnabled', enable ? 'true' : 'false');
    const section = document.getElementById('popular-games-section');
    if (section) {
        section.style.display = enable ? 'block' : 'none';
    }
};

window.updateAppearancePopularGamesButtons = function() {
    const enabled = localStorage.getItem('popularGamesEnabled') !== 'false';
    const onBtn = document.getElementById('appearancePopularGamesOnBtn');
    const offBtn = document.getElementById('appearancePopularGamesOffBtn');
    
    if (enabled) {
        if (onBtn) onBtn.classList.add('bg-baby-blue', 'text-dark-navy');
        if (offBtn) offBtn.classList.remove('bg-baby-blue', 'text-dark-navy');
    } else {
        if (onBtn) onBtn.classList.remove('bg-baby-blue', 'text-dark-navy');
        if (offBtn) offBtn.classList.add('bg-baby-blue', 'text-dark-navy');
    }
};

window.applyPopularGamesSectionState = function() {
    const enabled = localStorage.getItem('popularGamesEnabled') !== 'false';
    const section = document.getElementById('popular-games-section');
    if (section) {
        section.style.display = enabled ? 'block' : 'none';
    }
};
window.setCloudStorageStyle = function(style) {
    localStorage.setItem('cloudStorageUIStyle', style);
    const explorerRadio = document.getElementById('cloudStyleExplorer');
    const commanderRadio = document.getElementById('cloudStyleCommander');
    if (explorerRadio) explorerRadio.checked = (style === 'explorer');
    if (commanderRadio) commanderRadio.checked = (style === 'commander');
};

window.updateCloudStorageStyleRadios = function() {
    const style = localStorage.getItem('cloudStorageUIStyle') || 'explorer';
    const explorerRadio = document.getElementById('cloudStyleExplorer');
    const commanderRadio = document.getElementById('cloudStyleCommander');
    if (explorerRadio) explorerRadio.checked = (style === 'explorer');
    if (commanderRadio) commanderRadio.checked = (style === 'commander');
};

window.toggleAutoAboutBlank = function(enable) {
    localStorage.setItem('autoAboutBlankEnabled', enable ? 'true' : 'false');
};

window.updateAutoAboutBlankButtons = function() {
    const enabled = localStorage.getItem('autoAboutBlankEnabled') === 'true';
    const onBtn = document.getElementById('miscAutoAboutBlankOnBtn');
    const offBtn = document.getElementById('miscAutoAboutBlankOffBtn');
    
    if (enabled) {
        if (onBtn) onBtn.classList.add('bg-baby-blue', 'text-dark-navy');
        if (offBtn) offBtn.classList.remove('bg-baby-blue', 'text-dark-navy');
    } else {
        if (onBtn) onBtn.classList.remove('bg-baby-blue', 'text-dark-navy');
        if (offBtn) offBtn.classList.add('bg-baby-blue', 'text-dark-navy');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    window.updateMiscParticleButtons();
    window.updateMiscCursorGlowButtons();
    window.updateAppearanceParticleButtons();
    window.updateAppearanceCursorGlowButtons();
    window.updatePaginationModeRadios();
    window.updateAppearanceRecentlyPlayedButtons();
    window.updateAppearancePopularGamesButtons();
    window.updateAutoAboutBlankButtons();
    window.applyCurrentParticleShape();
    window.updateCustomThemeControls();
    window.refreshPfpPreview();
    window.updateCloudStorageStyleRadios();
    document.querySelectorAll('#navButtons .nav-btn').forEach(button => {
        button.addEventListener('click', function() {
            if (this.getAttribute('data-target') === 'misc') {
                setTimeout(() => window.updatePaginationModeRadios(), 100);
            }
            if (this.getAttribute('data-target') === 'appearance') {
                setTimeout(() => {
                    window.updateAppearanceRecentlyPlayedButtons();
                    window.updateAppearancePopularGamesButtons();
                }, 100);
            }
            if (this.getAttribute('data-target') === 'cloud-settings') {
                setTimeout(() => window.updateCloudStorageStyleRadios(), 100);
            }
        });
    });
});

(function initializeAccountPanel() {
    const accountPanel = document.getElementById('account');
    if (accountPanel) {
        const userDbKey = localStorage.getItem('userDbKey');
        const chatUsername = localStorage.getItem('public_chat_username_v1') || 'Guest';
        
        const nameDisplay = document.getElementById('accountNameDisplay');
        const currentUsernameInput = document.getElementById('currentChatUsername');
        const loginStatusDisplay = document.getElementById('accountLoginStatusDisplay');
        
        if (nameDisplay) nameDisplay.textContent = userDbKey ? userDbKey.replace(/_/g, ' ').split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Unknown';
        if (currentUsernameInput) { currentUsernameInput.value = chatUsername; currentUsernameInput.readOnly = true; }
        if (loginStatusDisplay) loginStatusDisplay.textContent = userDbKey ? 'Yes' : 'No';
    }
})();

let adminAuthResolve = null;

window.showAdminAuthModal = () => {
    return new Promise((resolve) => {
        adminAuthResolve = resolve;
        const modal = document.getElementById('adminAuthModal');
        const form = document.getElementById('adminAuthForm');
        const usernameInput = document.getElementById('adminUsername');
        const passwordInput = document.getElementById('adminPassword');

        document.querySelectorAll('.modal-overlay').forEach(el => el.style.display = 'none');
        const chatSetupModal = document.getElementById('chatUsernameSetupModal');
        if (chatSetupModal) chatSetupModal.style.display = 'none';
        
        if (modal) {
            modal.style.display = 'flex';
            modal.style.zIndex = '10001';
            form.reset();
            usernameInput.focus();
        }
    });
};

window.closeAdminAuthModal = () => {
    const modal = document.getElementById('adminAuthModal');
    if (modal) {
        modal.style.display = 'none';
    }
    if (adminAuthResolve) {
        adminAuthResolve(null);
        adminAuthResolve = null;
    }
};

window.handleAdminAuth = (event) => {
    event.preventDefault();
    const usernameInput = document.getElementById('adminUsername');
    const passwordInput = document.getElementById('adminPassword');
    
    const user = usernameInput.value.trim();
    const pass = passwordInput.value;
    
    if (!user || !pass) {
        alert('Please enter both username and password');
        return;
    }
    
    const modal = document.getElementById('adminAuthModal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    if (adminAuthResolve) {
        adminAuthResolve({ user, pass });
        adminAuthResolve = null;
    }
};
let usernamePickerResolve = null;

window.uploadProfilePicture = async function(input) {
    const file = input.files[0];
    if(!file) return;
    if(file.size > 2 * 1024 * 1024){ alert('File too large. Max 2 MB.'); input.value=''; return; }
    const status = document.getElementById('pfpStatus');
    if(status) status.textContent = 'Uploading…';
    const username = localStorage.getItem('public_chat_username_v1') || localStorage.getItem('userDbKey') || 'Guest';
    const safeUser = username.toLowerCase().replace(/[^a-z0-9]/g,'_').slice(0,40);
    const renamed = new File([file], 'pfp.png', {type: file.type});
    const fd = new FormData();
    fd.append('file', renamed);
    try {
        const token = await firebase.auth().currentUser?.getIdToken();
        const existing = localStorage.getItem('delta_pfp_file_id');
        if(existing){
            await fetch(`${window.UPLOAD_SERVER}/file/${safeUser}/${existing}`, {method:'DELETE', headers:{'Authorization':`Bearer ${token}`}}).catch(()=>{});
        }
        const res = await fetch(`${window.UPLOAD_SERVER}/upload`, {
            method: 'POST',
            headers: {'x-username': username, 'x-room-code': 'pfp', 'Authorization':`Bearer ${token}`},
            body: fd
        });
        if(!res.ok){ const e=await res.json(); throw new Error(e.error||res.statusText); }
        const data = await res.json();
        const url = `${window.UPLOAD_SERVER}${data.url}`;
        localStorage.setItem('delta_pfp_url', url);
        localStorage.setItem('delta_pfp_file_id', data.id);
        await firebase.database().ref(`user_pfps/${safeUser}`).set({url, uid: firebase.auth().currentUser.uid});
        window.refreshPfpPreview();
        if(status) status.textContent = 'Profile picture updated!';
        setTimeout(()=>{ if(status) status.textContent=''; }, 3000);
    } catch(e) {
        if(status) status.textContent = 'Upload failed: ' + e.message;
    }
    input.value = '';
};

window.removeProfilePicture = async function() {
    const username = localStorage.getItem('public_chat_username_v1') || localStorage.getItem('userDbKey') || 'Guest';
    const safeUser = username.toLowerCase().replace(/[^a-z0-9]/g,'_').slice(0,40);
    const fileId = localStorage.getItem('delta_pfp_file_id');
    if(fileId){
        const token = await firebase.auth().currentUser?.getIdToken();
        await fetch(`${window.UPLOAD_SERVER}/file/${safeUser}/${fileId}`, {method:'DELETE', headers:{'Authorization':`Bearer ${token}`}}).catch(()=>{});
    }
    localStorage.removeItem('delta_pfp_url');
    localStorage.removeItem('delta_pfp_file_id');
    const pfpRef = firebase.database().ref(`user_pfps/${safeUser}`);
    const snap = await pfpRef.once('value');
    const existing = snap.val();
    if(existing && existing.uid === firebase.auth().currentUser?.uid){
        await pfpRef.remove();
    }
    window.refreshPfpPreview();
    const status = document.getElementById('pfpStatus');
    if(status){ status.textContent = 'Profile picture removed.'; setTimeout(()=>{ status.textContent=''; }, 2500); }
};

window.refreshPfpPreview = function() {
    const preview = document.getElementById('pfpPreview');
    const removeBtn = document.getElementById('pfpRemoveBtn');
    if(!preview) return;
    const url = localStorage.getItem('delta_pfp_url');
    const username = localStorage.getItem('public_chat_username_v1') || localStorage.getItem('userDbKey') || '?';
    if(url){
        preview.innerHTML = `<img src="${url}" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.textContent='${username.charAt(0).toUpperCase()}'">`;
        if(removeBtn) removeBtn.style.display = 'block';
    } else {
        preview.textContent = username.charAt(0).toUpperCase();
        if(removeBtn) removeBtn.style.display = 'none';
    }
};
