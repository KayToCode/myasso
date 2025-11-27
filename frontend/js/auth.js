// Gestion de l'authentification côté client

// Vérifier si l'utilisateur est connecté
function isAuthenticated() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return token && user;
}

// Obtenir les informations de l'utilisateur connecté
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        try {
            return JSON.parse(userStr);
        } catch (e) {
            return null;
        }
    }
    return null;
}

// Définir l'utilisateur connecté
function setCurrentUser(user, token) {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
}

// Déconnecter l'utilisateur
function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = 'index.html';
}

// Vérifier le type d'utilisateur
function isAssociation() {
    const user = getCurrentUser();
    return user && user.type === 'association';
}

function isBenevole() {
    const user = getCurrentUser();
    return user && user.type === 'benevole';
}

// Mettre à jour l'affichage selon l'état de connexion
function updateAuthUI() {
    const authLinks = document.getElementById('authLinks');
    const userLinks = document.getElementById('userLinks');
    const dashboardLink = document.getElementById('dashboardLink');
    
    if (isAuthenticated()) {
        if (authLinks) authLinks.style.display = 'none';
        if (userLinks) userLinks.style.display = 'block';
        
        const user = getCurrentUser();
        
        // Mettre à jour le lien du tableau de bord selon le type d'utilisateur
        const profileLink = document.getElementById('profileLink');
        
        if (dashboardLink && user) {
            if (user.type === 'association') {
                dashboardLink.href = 'dashboard-association.html';
            } else if (user.type === 'benevole') {
                dashboardLink.href = 'dashboard-benevole.html';
            }
        }
        
        // Mettre à jour le lien du profil selon le type d'utilisateur
        if (profileLink && user) {
            if (user.type === 'association') {
                profileLink.href = 'javascript:void(0)';
                profileLink.onclick = function(e) {
                    e.preventDefault();
                    if (typeof switchToProfilTab === 'function') {
                        switchToProfilTab();
                    } else {
                        window.location.href = 'dashboard-association.html#profil';
                    }
                };
            } else if (user.type === 'benevole') {
                profileLink.href = 'javascript:void(0)';
                profileLink.onclick = function(e) {
                    e.preventDefault();
                    if (typeof switchToProfilTab === 'function') {
                        switchToProfilTab();
                    } else {
                        window.location.href = 'dashboard-benevole.html#profil';
                    }
                };
            }
        }
        
        // Afficher les informations de l'utilisateur si nécessaire
        const userInfo = document.getElementById('userInfo');
        if (userInfo) {
            userInfo.textContent = `${user.nom || user.prenom} ${user.nom || ''}`;
        }
    } else {
        if (authLinks) authLinks.style.display = 'block';
        if (userLinks) userLinks.style.display = 'none';
    }
}

// Gérer la déconnexion
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
});

// Fonction d'aide pour rediriger selon le type d'utilisateur
function redirectByUserType() {
    const user = getCurrentUser();
    if (user) {
        if (user.type === 'association') {
            window.location.href = 'dashboard-association.html';
        } else if (user.type === 'benevole') {
            window.location.href = 'dashboard-benevole.html';
        }
    } else {
        window.location.href = 'index.html';
    }
}

// Export pour utilisation globale
window.Auth = {
    isAuthenticated,
    getCurrentUser,
    setCurrentUser,
    logout,
    isAssociation,
    isBenevole,
    updateAuthUI,
    redirectByUserType
};

