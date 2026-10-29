const TAB_DISGUISES = [
    { id: 'none', name: 'None', icon: 'https://cdn.jsdelivr.net/gh/ethanlb34/delta-icons@main/default.png', title: 'Delta V10' },
    { id: 'google-drive', name: 'Google Drive', icon: 'https://drive.google.com/favicon.ico', title: 'My Drive - Google Drive' },
    { id: 'canvas', name: 'Canvas', icon: 'https://instructure-uploads.s3.amazonaws.com/account_96810000000000001/attachments/1049/Canvas_logo_gray2.png', title: 'Dashboard' },
    { id: 'clever', name: 'Clever', icon: 'https://www.clever.com/wp-content/uploads/2023/06/cropped-Favicon-512px-32x32.png', title: 'Clever | Log in' },
    { id: 'edpuzzle', name: 'EdPuzzle', icon: 'https://images.edpuzzle.com/favicons/favicon-32.png', title: 'Edpuzzle | Student' },
    { id: 'kahoot', name: 'Kahoot!', icon: 'https://kahoot.it/favicon.ico', title: 'Kahoot! - Play & Create Quizzes' }
];

let currentOnboardingStep = 0;
const TOTAL_ONBOARDING_STEPS = 3;

window.showOnboarding = function() {
    const hasSeenOnboarding = localStorage.getItem('deltaV10_onboardingComplete') === 'true';
    if (hasSeenOnboarding) return;

    currentOnboardingStep = 0;
    showOnboardingStep(0);
};

window.showOnboardingStep = function(step) {
    currentOnboardingStep = step;

    [1, 2, 3].forEach(i => {
        const element = document.getElementById(`onboardingStep${i}`);
        if (element && element.style.display !== 'none') {
            element.classList.remove('onboarding-step-visible');
            element.classList.add('onboarding-step-hidden');
            setTimeout(() => {
                element.style.display = 'none';
                element.classList.remove('onboarding-step-hidden');
                element.classList.add('onboarding-step-visible');
            }, 300);
        }
    });

    if (step < TOTAL_ONBOARDING_STEPS) {
        setTimeout(() => {
            const nextElement = document.getElementById(`onboardingStep${step + 1}`);
            if (nextElement) {
                nextElement.style.display = 'flex';
                document.getElementById('onboardingModal').style.display = 'flex';
                nextElement.classList.add('onboarding-step-visible');
            }
        }, 300);
    } else {
        completeOnboarding();
    }
};

window.nextOnboardingStep = function() {
    window.showOnboardingStep(currentOnboardingStep + 1);
};

window.skipOnboarding = function() {
    completeOnboarding();
};

function completeOnboarding() {
    document.getElementById('onboardingModal').style.display = 'none';
    localStorage.setItem('deltaV10_onboardingComplete', 'true');
    
    const aboutBlankEnabled = localStorage.getItem('deltaV10_aboutBlankEnabled') === 'true';
    if (aboutBlankEnabled) {
        setTimeout(() => {
            window.open('about:blank', '_blank');
        }, 500);
    }
}

window.selectTabDisguise = function(disguiseId) {
    document.querySelectorAll('.disguise-option').forEach(option => {
        option.classList.remove('border-baby-blue', 'bg-baby-blue/10');
        option.classList.add('border-slate-600');
    });

    const selectedOption = document.querySelector(`[data-disguise-id="${disguiseId}"]`);
    if (selectedOption) {
        selectedOption.classList.add('border-baby-blue', 'bg-baby-blue/10');
        selectedOption.classList.remove('border-slate-600');
    }

    const disguise = TAB_DISGUISES.find(d => d.id === disguiseId);
    if (disguise) {
        localStorage.setItem('deltaV10_tabDisguise', disguiseId);
        localStorage.setItem('deltaV10_tabFavicon', disguise.icon);
        localStorage.setItem('deltaV9_disguise', disguise.name);
        
        const settingsDisguiseGrid = document.getElementById('settingsDisguiseGrid');
        if (settingsDisguiseGrid) {
            const settingsOption = settingsDisguiseGrid.querySelector(`[data-disguise-id="${disguiseId}"]`);
            if (settingsOption) {
                settingsDisguiseGrid.querySelectorAll('[data-disguise-id]').forEach(opt => {
                    opt.classList.remove('border-baby-blue', 'bg-baby-blue/10');
                    opt.classList.add('border-slate-600');
                });
                settingsOption.classList.add('border-baby-blue', 'bg-baby-blue/10');
                settingsOption.classList.remove('border-slate-600');
            }
        }
        
        applyTabDisguise(disguise.icon, disguise.title);
    }
};

function applyTabDisguise(iconPath, pageTitle) {
    const faviconLink = document.getElementById('faviconLink');
    if (faviconLink) {
        faviconLink.href = iconPath;
    }
    if (pageTitle) {
        document.title = pageTitle;
    }
}

window.toggleAboutBlank = function(enabled) {
    document.querySelectorAll('.aboutblank-option').forEach(opt => {
        opt.classList.remove('border-baby-blue', 'bg-baby-blue/10');
        opt.classList.add('border-slate-600');
    });

    const selectedOption = document.querySelector(`[data-aboutblank="${enabled}"]`);
    if (selectedOption) {
        selectedOption.classList.add('border-baby-blue', 'bg-baby-blue/10');
        selectedOption.classList.remove('border-slate-600');
    }

    localStorage.setItem('deltaV10_aboutBlankEnabled', enabled ? 'true' : 'false');

    const nextBtn = document.querySelector('#onboardingStep2 button:last-of-type');
    if (nextBtn) {
        nextBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        nextBtn.disabled = false;
    }
};

window.setupKeybind = function() {
    const keybindInput = document.getElementById('onboardingKeybindInput');
    const websiteInput = document.getElementById('onboardingWebsiteInput');

    if (keybindInput && websiteInput) {
        const keybind = keybindInput.value.trim().toLowerCase();
        const website = websiteInput.value.trim();

        if (keybind && website) {
            localStorage.setItem('deltaV10_customKeybind', keybind);
            localStorage.setItem('deltaV10_customKeybindWebsite', website);
        } else if (keybind || website) {
            alert('Please fill in both keybind and website, or leave both empty to skip.');
            return;
        }
    }

    window.nextOnboardingStep();
};

function populateDisguiseGrid(targetElementId) {
    const container = document.getElementById(targetElementId);
    if (!container) return;

    container.innerHTML = TAB_DISGUISES.map(disguise => `
        <div class="p-3 rounded-lg bg-slate-900 border border-slate-600 cursor-pointer transition duration-200 hover:border-baby-blue disguise-option" 
             data-disguise-id="${disguise.id}" onclick="selectTabDisguise('${disguise.id}')">
            <img src="${disguise.icon}" alt="${disguise.name}" class="w-full h-12 object-contain mb-2 rounded">
            <p class="text-xs text-center text-slate-300 font-medium truncate">${disguise.name}</p>
        </div>
    `).join('');
}

function initializeKeybindListener() {
    document.addEventListener('keydown', (e) => {
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
            return;
        }

        const savedKeybind = localStorage.getItem('deltaV10_customKeybind');
        const savedWebsite = localStorage.getItem('deltaV10_customKeybindWebsite');

        if (!savedKeybind || !savedWebsite) return;

        const parts = [];
        if (e.ctrlKey) parts.push('ctrl');
        if (e.shiftKey) parts.push('shift');
        if (e.altKey) parts.push('alt');

        const key = e.key.toLowerCase();
        if (!['control', 'shift', 'alt', 'meta'].includes(key)) {
            parts.push(key);
        }

        const currentKeybind = parts.join('+');

        if (currentKeybind === savedKeybind) {
            e.preventDefault();
            const url = savedWebsite.startsWith('http') ? savedWebsite : 'https://' + savedWebsite;
            window.open(url, '_blank');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    populateDisguiseGrid('disguiseGrid');
    populateDisguiseGrid('settingsDisguiseGrid');

    const savedDisguise = localStorage.getItem('deltaV10_tabFavicon');
    const savedDisguiseId = localStorage.getItem('deltaV10_tabDisguise');
    if (savedDisguise && savedDisguiseId) {
        const disguise = TAB_DISGUISES.find(d => d.id === savedDisguiseId);
        if (disguise) {
            applyTabDisguise(savedDisguise, disguise.title);
        }
    } else if (savedDisguise) {
        applyTabDisguise(savedDisguise);
    }

    const keybindInput = document.getElementById('miscKeybindInput');
    const websiteInput = document.getElementById('miscWebsiteInput');
    if (keybindInput) {
        keybindInput.value = localStorage.getItem('deltaV10_customKeybind') || '';
    }
    if (websiteInput) {
        websiteInput.value = localStorage.getItem('deltaV10_customKeybindWebsite') || '';
    }

    initializeKeybindListener();
});
