// Script pour le dashboard association
let creneauxCount = 0;
let tachesCount = 0;

document.addEventListener('DOMContentLoaded', () => {
    if (!Auth.isAuthenticated() || !Auth.isAssociation()) {
        window.location.href = 'login.html';
        return;
    }
    
    Auth.updateAuthUI();
    loadDashboard();
    loadProfile();
    
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
        case 'dashboard':
            loadDashboard();
            break;
        case 'evenements':
            loadEvenements();
            break;
        case 'benevoles':
            loadBenevoles();
            break;
        case 'demandes':
            loadDemandes();
            break;
        case 'annonces':
            loadAnnonces();
            break;
        case 'profil':
            loadProfile();
            break;
    }
}

async function loadDashboard() {
    try {
        const manquants = await API.associations.getDashboardManquants();
        
        const statsDiv = document.getElementById('dashboardStats');
        statsDiv.innerHTML = `
            <div class="stat-card">
                <h3>${manquants.creneaux_manquants.length}</h3>
                <p>Créneaux manquants</p>
            </div>
            <div class="stat-card">
                <h3>${manquants.taches_manquantes.length}</h3>
                <p>Tâches manquantes</p>
            </div>
        `;
        
        const manquantsDiv = document.getElementById('dashboardManquants');
        manquantsDiv.innerHTML = '';
        
        if (manquants.creneaux_manquants.length > 0) {
            const h4 = document.createElement('h4');
            h4.textContent = 'Crénеaux manquants';
            manquantsDiv.appendChild(h4);
            
            manquants.creneaux_manquants.forEach(c => {
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <p><strong>${c.titre}</strong> - ${c.heure_debut} - ${c.heure_fin}</p>
                    <p>Manque: ${c.manquants} personne(s)</p>
                `;
                manquantsDiv.appendChild(card);
            });
        }
        
        if (manquants.taches_manquantes.length > 0) {
            const h4 = document.createElement('h4');
            h4.textContent = 'Tâches manquantes';
            manquantsDiv.appendChild(h4);
            
            manquants.taches_manquantes.forEach(t => {
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <p><strong>${t.titre}</strong> - ${t.nom}</p>
                    <p>Manque: ${t.manquants} personne(s)</p>
                `;
                manquantsDiv.appendChild(card);
            });
        }
    } catch (error) {
        console.error('Erreur chargement dashboard:', error);
    }
}

async function loadEvenements() {
    try {
        const user = Auth.getCurrentUser();
        const evenements = await API.evenements.getByAssociation(user.id);
        
        const listDiv = document.getElementById('eventsList');
        listDiv.innerHTML = '';
        
        if (evenements.length === 0) {
            listDiv.innerHTML = '<p>Aucun événement pour le moment.</p>';
        } else {
            evenements.forEach(evenement => {
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <div class="card-header">
                        <h3>${evenement.titre}</h3>
                        <div class="actions">
                            <span class="badge badge-${evenement.statut === 'publie' ? 'success' : 'warning'}">${evenement.statut}</span>
                            <button class="btn btn-primary" onclick="viewEvent(${evenement.id})">Voir</button>
                            <button class="btn btn-secondary" onclick="editEvent(${evenement.id})">Modifier</button>
                            ${evenement.statut === 'brouillon' ? `<button class="btn btn-success" onclick="publierEvenement(${evenement.id})">📢 Publier</button>` : ''}
                            <button class="btn btn-danger" onclick="supprimerEvenement(${evenement.id}, '${evenement.titre}')">🗑️ Supprimer</button>
                        </div>
                    </div>
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

async function loadBenevoles() {
    try {
        const benevoles = await API.associations.getBenevolesAcceptes();
        
        const listDiv = document.getElementById('benevolesList');
        listDiv.innerHTML = '';
        
        if (benevoles.length === 0) {
            listDiv.innerHTML = '<p>Aucun bénévole accepté pour le moment.</p>';
        } else {
            benevoles.forEach(b => {
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <h3>${b.prenom} ${b.nom}</h3>
                    <p>Email: ${b.email}</p>
                    ${b.telephone ? `<p>Téléphone: ${b.telephone}</p>` : ''}
                `;
                listDiv.appendChild(card);
            });
        }
    } catch (error) {
        console.error('Erreur chargement bénévoles:', error);
    }
}

async function loadDemandes() {
    try {
        const demandes = await API.associations.getDemandesAttente();
        
        const listDiv = document.getElementById('demandesList');
        listDiv.innerHTML = '';
        
        if (demandes.length === 0) {
            listDiv.innerHTML = '<p>Aucune demande en attente.</p>';
        } else {
            demandes.forEach(d => {
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <h3>${d.prenom} ${d.nom}</h3>
                    <p>Email: ${d.email}</p>
                    ${d.telephone ? `<p>Téléphone: ${d.telephone}</p>` : ''}
                    <div class="actions">
                        <button class="btn btn-success" onclick="traiterDemande(${d.id}, 'accepte')">Accepter</button>
                        <button class="btn btn-danger" onclick="traiterDemande(${d.id}, 'refuse')">Refuser</button>
                    </div>
                `;
                listDiv.appendChild(card);
            });
        }
    } catch (error) {
        console.error('Erreur chargement demandes:', error);
    }
}

async function traiterDemande(id, statut) {
    try {
        await API.associations.updateDemande(id, statut);
        Toast.success(`✨ Demande ${statut === 'accepte' ? 'acceptée' : 'refusée'} avec succès ! 🎉`);
        loadDemandes();
    } catch (error) {
        Toast.error(error.message || 'Erreur lors du traitement de la demande 😔');
    }
}

async function loadAnnonces() {
    try {
        const user = Auth.getCurrentUser();
        const annonces = await API.annonces.getByAssociation(user.id);
        
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
                    <p>${a.contenu}</p>
                    <p><small>${new Date(a.created_at).toLocaleString('fr-FR')}</small></p>
                    <div class="actions">
                        <button class="btn btn-danger" onclick="deleteAnnonce(${a.id})">Supprimer</button>
                    </div>
                `;
                listDiv.appendChild(card);
            });
        }
    } catch (error) {
        console.error('Erreur chargement annonces:', error);
    }
}

async function loadProfile() {
    try {
        const profile = await API.associations.getProfile();
        
        document.getElementById('profile_nom').value = profile.nom || '';
        document.getElementById('profile_description').value = profile.description || '';
        document.getElementById('profile_activites').value = profile.activites || '';
        document.getElementById('profile_besoins').value = profile.besoins || '';
        
        document.getElementById('profileForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                await API.associations.updateProfile({
                    nom: document.getElementById('profile_nom').value,
                    description: document.getElementById('profile_description').value,
                    activites: document.getElementById('profile_activites').value,
                    besoins: document.getElementById('profile_besoins').value
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

function showCreateEventForm() {
    document.getElementById('createEventForm').style.display = 'block';
    creneauxCount = 0;
    tachesCount = 0;
    document.getElementById('creneauxList').innerHTML = '';
    document.getElementById('tachesList').innerHTML = '';
}

function cancelCreateEvent() {
    document.getElementById('createEventForm').style.display = 'none';
    document.getElementById('newEventForm').reset();
}

function togglePlanningType() {
    const type = document.getElementById('event_type').value;
    if (type === 'creneaux') {
        document.getElementById('creneauxSection').style.display = 'block';
        document.getElementById('tachesSection').style.display = 'none';
    } else {
        document.getElementById('creneauxSection').style.display = 'none';
        document.getElementById('tachesSection').style.display = 'block';
    }
}

function addCreneau() {
    creneauxCount++;
    const div = document.createElement('div');
    div.className = 'form-group';
    div.innerHTML = `
        <label>Créneau ${creneauxCount}</label>
        <input type="time" placeholder="Heure début" id="creneau_heure_debut_${creneauxCount}" required>
        <input type="time" placeholder="Heure fin" id="creneau_heure_fin_${creneauxCount}" required>
        <input type="number" placeholder="Personnes requises" id="creneau_personnes_${creneauxCount}" min="1" value="1">
        <input type="text" placeholder="Description" id="creneau_desc_${creneauxCount}">
        <button type="button" class="btn btn-danger" onclick="this.parentElement.remove()">Supprimer</button>
    `;
    document.getElementById('creneauxList').appendChild(div);
}

function addTache() {
    tachesCount++;
    const div = document.createElement('div');
    div.className = 'form-group';
    div.innerHTML = `
        <label>Tâche ${tachesCount}</label>
        <input type="text" placeholder="Nom de la tâche" id="tache_nom_${tachesCount}" required>
        <textarea placeholder="Description" id="tache_desc_${tachesCount}"></textarea>
        <input type="number" placeholder="Personnes requises" id="tache_personnes_${tachesCount}" min="1" value="1">
        <button type="button" class="btn btn-danger" onclick="this.parentElement.remove()">Supprimer</button>
    `;
    document.getElementById('tachesList').appendChild(div);
}

document.getElementById('newEventForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const type = document.getElementById('event_type').value;
    const creneaux = [];
    const taches = [];
    
    if (type === 'creneaux') {
        for (let i = 1; i <= creneauxCount; i++) {
            const heureDebut = document.getElementById(`creneau_heure_debut_${i}`);
            const heureFin = document.getElementById(`creneau_heure_fin_${i}`);
            if (heureDebut && heureFin) {
                creneaux.push({
                    heure_debut: heureDebut.value,
                    heure_fin: heureFin.value,
                    nombre_personnes_requises: parseInt(document.getElementById(`creneau_personnes_${i}`).value) || 1,
                    description: document.getElementById(`creneau_desc_${i}`).value || null
                });
            }
        }
    } else {
        for (let i = 1; i <= tachesCount; i++) {
            const nom = document.getElementById(`tache_nom_${i}`);
            if (nom && nom.value) {
                taches.push({
                    nom: nom.value,
                    description: document.getElementById(`tache_desc_${i}`).value || null,
                    nombre_personnes_requises: parseInt(document.getElementById(`tache_personnes_${i}`).value) || 1
                });
            }
        }
    }
    
    try {
        await API.evenements.create({
            titre: document.getElementById('event_titre').value,
            description: document.getElementById('event_description').value,
            date_debut: document.getElementById('event_date_debut').value,
            date_fin: document.getElementById('event_date_fin').value,
            type_planification: type,
            creneaux: creneaux,
            taches: taches
        });
        
        Toast.success('✨ Événement créé avec succès ! 🎉');
        cancelCreateEvent();
        loadEvenements();
    } catch (error) {
        Toast.error(error.message || 'Erreur lors de la création de l\'événement 😔');
    }
});

function showCreateAnnonceForm() {
    document.getElementById('createAnnonceForm').style.display = 'block';
}

function cancelCreateAnnonce() {
    document.getElementById('createAnnonceForm').style.display = 'none';
    document.getElementById('newAnnonceForm').reset();
}

document.getElementById('newAnnonceForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        await API.annonces.create({
            titre: document.getElementById('annonce_titre').value,
            contenu: document.getElementById('annonce_contenu').value
        });
        
        Toast.success('✨ Annonce créée avec succès ! 📢');
        cancelCreateAnnonce();
        loadAnnonces();
    } catch (error) {
        Toast.error(error.message || 'Erreur lors de la création de l\'annonce 😔');
    }
});

async function deleteAnnonce(id) {
    // Utiliser une confirmation moderne
    const confirmed = confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?');
    if (!confirmed) return;
    
    try {
        await API.annonces.delete(id);
        Toast.success('✨ Annonce supprimée avec succès ! 🗑️');
        loadAnnonces();
    } catch (error) {
        Toast.error(error.message || 'Erreur lors de la suppression 😔');
    }
}

function viewEvent(id) {
    window.location.href = `evenement-detail.html?id=${id}`;
}

function editEvent(id) {
    window.location.href = `evenement-edit.html?id=${id}`;
}

async function publierEvenement(id) {
    if (!confirm('Êtes-vous sûr de vouloir publier cet événement ? Il sera visible par tous les bénévoles.')) {
        return;
    }
    
    try {
        await API.evenements.update(id, { statut: 'publie' });
        Toast.success('✨ Événement publié avec succès ! 📢');
        loadEvenements(); // Recharger la liste
    } catch (error) {
        Toast.error(error.message || 'Erreur lors de la publication de l\'événement 😔');
    }
}

async function supprimerEvenement(id, titre) {
    if (!confirm(`⚠️ Attention : Vous êtes sur le point de supprimer l'événement "${titre}".\n\nCette action est irréversible et supprimera également tous les créneaux, tâches et disponibilités associés.\n\nÊtes-vous sûr de vouloir continuer ?`)) {
        return;
    }
    
    // Deuxième confirmation
    if (!confirm(`🛑 Dernière confirmation : Supprimer définitivement l'événement "${titre}" ?`)) {
        return;
    }
    
    try {
        await API.evenements.delete(id);
        Toast.success('🗑️ Événement supprimé avec succès !');
        loadEvenements(); // Recharger la liste
    } catch (error) {
        Toast.error(error.message || 'Erreur lors de la suppression de l\'événement 😔');
    }
}

// Fonction pour passer à l'onglet profil depuis le header
function switchToProfilTab() {
    // Si on est déjà sur le dashboard, changer l'onglet
    if (window.location.pathname.includes('dashboard-association.html')) {
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
        window.location.href = 'dashboard-association.html#profil';
    }
    return false;
}

window.switchTab = switchTab;
window.switchToProfilTab = switchToProfilTab;
window.traiterDemande = traiterDemande;
window.showCreateEventForm = showCreateEventForm;
window.cancelCreateEvent = cancelCreateEvent;
window.togglePlanningType = togglePlanningType;
window.addCreneau = addCreneau;
window.addTache = addTache;
window.showCreateAnnonceForm = showCreateAnnonceForm;
window.cancelCreateAnnonce = cancelCreateAnnonce;
window.deleteAnnonce = deleteAnnonce;
window.viewEvent = viewEvent;
window.editEvent = editEvent;
window.publierEvenement = publierEvenement;
window.supprimerEvenement = supprimerEvenement;

