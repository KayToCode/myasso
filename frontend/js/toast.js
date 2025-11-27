// Système de notifications toast modernes et animées

// Créer le conteneur des toasts s'il n'existe pas
function createToastContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    return container;
}

// Fonction principale pour afficher une notification toast
function showToast(message, type = 'info', duration = 4000) {
    const container = createToastContainer();
    
    // Créer l'élément toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Icônes selon le type
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    // Couleurs et emojis personnalisés
    const configs = {
        success: {
            icon: '✅',
            gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            emoji: '🎉'
        },
        error: {
            icon: '❌',
            gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            emoji: '😔'
        },
        warning: {
            icon: '⚠️',
            gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            emoji: '⚡'
        },
        info: {
            icon: 'ℹ️',
            gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            emoji: '💡'
        }
    };
    
    const config = configs[type] || configs.info;
    
    // Contenu du toast
    toast.innerHTML = `
        <div class="toast-content">
            <div class="toast-icon">${config.icon}</div>
            <div class="toast-message">
                <div class="toast-title">${getToastTitle(type)}</div>
                <div class="toast-text">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
        <div class="toast-progress"></div>
    `;
    
    // Ajouter le style du gradient
    toast.style.setProperty('--toast-gradient', config.gradient);
    
    // Ajouter au conteneur
    container.appendChild(toast);
    
    // Animation d'entrée
    setTimeout(() => {
        toast.classList.add('toast-show');
    }, 10);
    
    // Animation de sortie et suppression
    const progressBar = toast.querySelector('.toast-progress');
    if (progressBar) {
        progressBar.style.animation = `toastProgress ${duration}ms linear`;
    }
    
    setTimeout(() => {
        toast.classList.remove('toast-show');
        toast.classList.add('toast-hide');
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 300);
    }, duration);
    
    // Auto-close au clic
    toast.addEventListener('click', (e) => {
        if (e.target.classList.contains('toast-close') || e.target.closest('.toast-close')) {
            return;
        }
        toast.classList.remove('toast-show');
        toast.classList.add('toast-hide');
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 300);
    });
}

// Titres selon le type
function getToastTitle(type) {
    const titles = {
        success: 'Succès !',
        error: 'Erreur !',
        warning: 'Attention !',
        info: 'Information'
    };
    return titles[type] || titles.info;
}

// Fonctions helper pour chaque type
function showSuccess(message, duration) {
    showToast(message, 'success', duration);
}

function showError(message, duration) {
    showToast(message, 'error', duration);
}

function showWarning(message, duration) {
    showToast(message, 'warning', duration);
}

function showInfo(message, duration) {
    showToast(message, 'info', duration);
}

// Export global
window.Toast = {
    show: showToast,
    success: showSuccess,
    error: showError,
    warning: showWarning,
    info: showInfo
};

// Remplacer alert() par défaut
window.alert = function(message) {
    showInfo(message, 3000);
};

