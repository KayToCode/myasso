// Script pour le dashboard bénévole
document.addEventListener('DOMContentLoaded', () => {
    if (!Auth.isAuthenticated() || !Auth.isBenevole()) {
        window.location.href = 'login.html';
        return;
    }
    
    Auth.updateAuthUI();
    loadNotificationsCount();
    loadEvenements();
    loadProfile();
    
    // Vérifier les notifications toutes les 30 secondes
    setInterval(loadNotificationsCount, 30000);
    
    // Vérifier l'URL hash pour ouvrir directement un onglet
    if (window.location.hash === '#profil') {
        setTimeout(() => {
            switchTab('profil');
        }, 200);
    }
});

function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    if (event && event.target) {
        event.target.classList.add('active');
    } else {
        // Trouver le bon onglet par son texte
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => {
            if (tab.textContent.toLowerCase().includes(tabName.toLowerCase()) || tab.onclick && tab.onclick.toString().includes(tabName)) {
                tab.classList.add('active');
            }
        });
    }
    
    document.getElementById(`tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`).classList.add('active');
    
    switch(tabName) {
        case 'evenements':
            loadEvenements();
            break;
        case 'assignations':
            loadAssignations();
            break;
        case 'associations':
            loadAssociations();
            break;
        case 'annonces':
            loadAnnonces();
            break;
        case 'notifications':
            loadNotifications();
            break;
        case 'profil':
            loadProfile();
            break;
    }
}

async function loadEvenements() {
    try {
        const evenements = await API.evenements.getBenevoleMesAssociations();
        
        const listDiv = document.getElementById('eventsList');
        listDiv.innerHTML = '';
        
        if (evenements.length === 0) {
            listDiv.innerHTML = '<p>Aucun événement disponible pour le moment.</p>';
        } else {
            evenements.forEach(evenement => {
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <div class="card-header">
                        <h3>${evenement.titre}</h3>
                        <button class="btn btn-primary" onclick="viewEvent(${evenement.id})">Voir détails</button>
                    </div>
                    <p>Association: ${evenement.association_nom}</p>
                    <p>${evenement.description || ''}</p>
                    <p><strong>Date:</strong> ${new Date(evenement.date_debut).toLocaleString('fr-FR')} - ${new Date(evenement.date_fin).toLocaleString('fr-FR')}</p>
                `;
                listDiv.appendChild(card);
            });
        }
    } catch (error) {
        console.error('Erreur chargement événements:', error);
    }
}

async function viewEvent(id) {
    window.location.href = `evenement-detail.html?id=${id}`;
}

async function loadAssignations() {
    try {
        const assignations = await API.benevoles.getAssignations();
        
        const listDiv = document.getElementById('assignationsList');
        listDiv.innerHTML = '';
        
        if (assignations.length === 0) {
            listDiv.innerHTML = '<p>Aucune assignation pour le moment.</p>';
        } else {
            assignations.forEach(a => {
                const card = document.createElement('div');
                card.className = 'card';
                
                let detail = '';
                if (a.heure_debut) {
                    detail = `Créneau: ${a.heure_debut} - ${a.heure_fin}`;
                } else if (a.tache_nom) {
                    detail = `Tâche: ${a.tache_nom}`;
                }
                
                card.innerHTML = `
                    <h3>${a.titre}</h3>
                    <p>Association: ${a.association_nom}</p>
                    <p>${detail}</p>
                    <p><strong>Date:</strong> ${new Date(a.date_debut).toLocaleString('fr-FR')}</p>
                    <span class="badge badge-success">Assigné</span>
                `;
                listDiv.appendChild(card);
            });
        }
    } catch (error) {
        console.error('Erreur chargement assignations:', error);
    }
}

async function loadAssociations() {
    try {
        const associations = await API.benevoles.getMesAssociations();
        
        const listDiv = document.getElementById('associationsList');
        listDiv.innerHTML = '';
        
        if (associations.length === 0) {
            listDiv.innerHTML = '<p>Vous n\'êtes membre d\'aucune association pour le moment.</p>';
        } else {
            associations.forEach(a => {
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <h3>${a.nom}</h3>
                    <p>${a.description || ''}</p>
                    <p><a href="association-detail.html?id=${a.id}">Voir les détails</a></p>
                `;
                listDiv.appendChild(card);
            });
        }
    } catch (error) {
        console.error('Erreur chargement associations:', error);
    }
}

async function loadAnnonces() {
    try {
        const annonces = await API.annonces.getBenevoleMesAssociations();
        
        const listDiv = document.getElementById('annoncesList');
        listDiv.innerHTML = '';
        
        if (annonces.length === 0) {
            listDiv.innerHTML = '<p>Aucune annonce pour le moment.</p>';
        } else {
            annonces.forEach(a => {
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <h3>${a.titre}</h3>
                    <p><strong>${a.association_nom}</strong></p>
                    <p>${a.contenu}</p>
                    <p><small>${new Date(a.created_at).toLocaleString('fr-FR')}</small></p>
                `;
                listDiv.appendChild(card);
            });
        }
    } catch (error) {
        console.error('Erreur chargement annonces:', error);
    }
}

async function loadNotifications() {
    try {
        const notifications = await API.notifications.getAll(false);
        
        const listDiv = document.getElementById('notificationsList');
        listDiv.innerHTML = '';
        
        if (notifications.length === 0) {
            listDiv.innerHTML = '<p>Aucune notification.</p>';
        } else {
            notifications.forEach(n => {
                const card = document.createElement('div');
                card.className = 'card';
                card.style.opacity = n.lu ? '0.7' : '1';
                card.innerHTML = `
                    <div class="card-header">
                        <h3>${n.titre}</h3>
                        ${!n.lu ? '<span class="badge badge-info">Nouveau</span>' : ''}
                    </div>
                    <p>${n.message}</p>
                    <p><small>${new Date(n.created_at).toLocaleString('fr-FR')}</small></p>
                    ${!n.lu ? `<button class="btn btn-secondary" onclick="marquerLu(${n.id})">Marquer comme lu</button>` : ''}
                `;
                listDiv.appendChild(card);
            });
        }
    } catch (error) {
        console.error('Erreur chargement notifications:', error);
    }
}

async function loadNotificationsCount() {
    try {
        const result = await API.notifications.getCountNonLues();
        const count = result.count;
        
        const badge = document.getElementById('notificationBadge');
        const countSpan = document.getElementById('notificationCount');
        
        if (count > 0) {
            badge.style.display = 'block';
            countSpan.textContent = count;
        } else {
            badge.style.display = 'none';
        }
    } catch (error) {
        console.error('Erreur chargement compteur notifications:', error);
    }
}

async function marquerLu(id) {
    try {
        await API.notifications.marquerLu(id);
        Toast.success('✨ Notification marquée comme lue ! 👁️');
        loadNotifications();
        loadNotificationsCount();
    } catch (error) {
        Toast.error(error.message || 'Erreur lors de la mise à jour 😔');
    }
}

async function marquerToutLu() {
    try {
        await API.notifications.marquerToutLu();
        Toast.success('✨ Toutes les notifications marquées comme lues ! 👁️');
        loadNotifications();
        loadNotificationsCount();
    } catch (error) {
        Toast.error(error.message || 'Erreur lors de la mise à jour 😔');
    }
}

async function loadProfile() {
    try {
        const profile = await API.benevoles.getProfile();
        
        document.getElementById('profile_nom').value = profile.nom || '';
        document.getElementById('profile_prenom').value = profile.prenom || '';
        document.getElementById('profile_telephone').value = profile.telephone || '';
        
        document.getElementById('profileForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                await API.benevoles.updateProfile({
                    nom: document.getElementById('profile_nom').value,
                    prenom: document.getElementById('profile_prenom').value,
                    telephone: document.getElementById('profile_telephone').value
                });
                Toast.success('✨ Profil mis à jour avec succès ! 🎉');
            } catch (error) {
                Toast.error(error.message || 'Erreur lors de la mise à jour 😔');
            }
        });
    } catch (error) {
        console.error('Erreur chargement profil:', error);
    }
}

// Fonction pour passer à l'onglet profil depuis le header
function switchToProfilTab() {
    // Si on est déjà sur le dashboard, changer l'onglet
    if (window.location.pathname.includes('dashboard-benevole.html')) {
        // Trouver le bouton onglet profil et le cliquer
        const tabs = document.querySelectorAll('.tab');
        const profilTab = Array.from(tabs).find(tab => 
            tab.textContent.trim().toLowerCase().includes('profil') || 
            (tab.onclick && tab.onclick.toString().includes("switchTab('profil')"))
        );
        
        if (profilTab) {
            profilTab.click();
        } else {
            // Sinon, appeler directement switchTab
            switchTab('profil');
        }
    } else {
        // Sinon, rediriger vers le dashboard avec l'onglet profil
        window.location.href = 'dashboard-benevole.html#profil';
    }
    return false;
}

window.switchTab = switchTab;
window.switchToProfilTab = switchToProfilTab;
window.viewEvent = viewEvent;
window.marquerLu = marquerLu;
window.marquerToutLu = marquerToutLu;

