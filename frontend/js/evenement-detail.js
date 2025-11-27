// Script pour la page de détails d'un événement
document.addEventListener('DOMContentLoaded', () => {
    Auth.updateAuthUI();
    
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('id');
    
    if (eventId) {
        loadEventDetails(eventId);
    } else {
        document.getElementById('errorMessage').textContent = 'ID événement manquant';
        document.getElementById('errorMessage').style.display = 'block';
    }
    
    document.getElementById('backBtn').addEventListener('click', () => {
        window.history.back();
    });
});

async function loadEventDetails(id) {
    const loading = document.getElementById('loading');
    const errorDiv = document.getElementById('errorMessage');
    const detailsDiv = document.getElementById('eventDetails');
    
    loading.style.display = 'block';
    errorDiv.style.display = 'none';
    detailsDiv.innerHTML = '';
    
    try {
        const evenement = await API.evenements.getById(id);
        
        let html = `
            <div class="card">
                <h2>${evenement.titre}</h2>
                <p><strong>Association:</strong> ${evenement.association_nom}</p>
                <p><strong>Date:</strong> ${new Date(evenement.date_debut).toLocaleString('fr-FR')} - ${new Date(evenement.date_fin).toLocaleString('fr-FR')}</p>
                ${evenement.description ? `<p>${evenement.description}</p>` : ''}
            </div>
        `;
        
        const user = Auth.getCurrentUser();
        const isBenevole = user && user.type === 'benevole';
        const isAssociation = user && user.type === 'association' && user.id == evenement.association_id;
        
        if (evenement.type_planification === 'creneaux') {
            html += '<h3>Créneaux horaires</h3>';
            html += '<div id="creneauxList"></div>';
        } else {
            html += '<h3>Tâches</h3>';
            html += '<div id="tachesList"></div>';
        }
        
        detailsDiv.innerHTML = html;
        
        if (evenement.type_planification === 'creneaux') {
            loadCreneaux(id, evenement.creneaux, isBenevole, isAssociation);
        } else {
            loadTaches(id, evenement.taches, isBenevole, isAssociation);
        }
        
        if (isAssociation) {
            // Afficher les disponibilités et les outils d'assignation
            loadDisponibilites(id);
            loadAssignationTools(id);
        }
    } catch (error) {
        errorDiv.textContent = error.message || 'Erreur lors du chargement de l\'événement';
        errorDiv.style.display = 'block';
    } finally {
        loading.style.display = 'none';
    }
}

async function loadCreneaux(evenementId, creneaux, isBenevole, isAssociation) {
    const listDiv = document.getElementById('creneauxList');
    listDiv.innerHTML = '';
    
    try {
        let disponibilites = null;
        if (isBenevole) {
            disponibilites = await API.disponibilites.getBenevoleByEvenement(evenementId);
        }
        
        creneaux.forEach(creneau => {
            const card = document.createElement('div');
            card.className = 'card';
            
            let disponibilite = null;
            if (disponibilites) {
                disponibilite = disponibilites.find(d => d.creneau_id === creneau.id);
            }
            
            card.innerHTML = `
                <div class="card-header">
                    <h4>${creneau.heure_debut} - ${creneau.heure_fin}</h4>
                    <span class="badge badge-info">${creneau.nombre_personnes_requises} personne(s) requise(s)</span>
                </div>
                ${creneau.description ? `<p>${creneau.description}</p>` : ''}
                ${isBenevole ? renderAvailabilityButtons(creneau.id, disponibilite, 'creneau') : ''}
            `;
            listDiv.appendChild(card);
        });
    } catch (error) {
        console.error('Erreur chargement créneaux:', error);
    }
}

async function loadTaches(evenementId, taches, isBenevole, isAssociation) {
    const listDiv = document.getElementById('tachesList');
    listDiv.innerHTML = '';
    
    try {
        let disponibilites = null;
        if (isBenevole) {
            disponibilites = await API.disponibilites.getBenevoleByEvenement(evenementId);
        }
        
        taches.forEach(tache => {
            const card = document.createElement('div');
            card.className = 'card';
            
            let disponibilite = null;
            if (disponibilites) {
                disponibilite = disponibilites.find(d => d.tache_id === tache.id);
            }
            
            card.innerHTML = `
                <div class="card-header">
                    <h4>${tache.nom}</h4>
                    <span class="badge badge-info">${tache.nombre_personnes_requises} personne(s) requise(s)</span>
                </div>
                ${tache.description ? `<p>${tache.description}</p>` : ''}
                ${isBenevole ? renderAvailabilityButtons(tache.id, disponibilite, 'tache') : ''}
            `;
            listDiv.appendChild(card);
        });
    } catch (error) {
        console.error('Erreur chargement tâches:', error);
    }
}

function renderAvailabilityButtons(id, disponibilite, type) {
    const statut = disponibilite ? disponibilite.statut : null;
    
    return `
        <div class="availability-buttons">
            <button class="availability-btn disponible ${statut === 'disponible' ? 'active' : ''}" 
                    onclick="setDisponibilite(${id}, 'disponible', '${type}')">
                Disponible
            </button>
            <button class="availability-btn peut-etre ${statut === 'peut_etre' ? 'active' : ''}" 
                    onclick="setDisponibilite(${id}, 'peut_etre', '${type}')">
                Peut-être
            </button>
            <button class="availability-btn pas-disponible ${statut === 'pas_disponible' ? 'active' : ''}" 
                    onclick="setDisponibilite(${id}, 'pas_disponible', '${type}')">
                Pas disponible
            </button>
        </div>
    `;
}

async function setDisponibilite(id, statut, type) {
    if (!Auth.isBenevole()) {
        Toast.warning('Vous devez être connecté en tant que bénévole 🔐');
        return;
    }
    
    try {
        if (type === 'creneau') {
            await API.disponibilites.setCreneau(id, statut);
        } else {
            await API.disponibilites.setTache(id, statut);
        }
        
        const messages = {
            disponible: '✨ Disponibilité enregistrée ! Vous êtes disponible 🟢',
            peut_etre: '🤔 Disponibilité enregistrée ! Peut-être disponible 🟡',
            pas_disponible: '❌ Disponibilité enregistrée ! Pas disponible 🔴'
        };
        
        Toast.success(messages[statut] || '✨ Disponibilité mise à jour !');
        
        // Mettre à jour l'affichage
        const urlParams = new URLSearchParams(window.location.search);
        const eventId = urlParams.get('id');
        loadEventDetails(eventId);
    } catch (error) {
        Toast.error(error.message || 'Erreur lors de la mise à jour de la disponibilité 😔');
    }
}

async function loadDisponibilites(evenementId) {
    try {
        const disponibilites = await API.disponibilites.getByEvenement(evenementId);
        
        const html = `
            <div class="card">
                <h3>Disponibilités des bénévoles</h3>
                ${JSON.stringify(disponibilites, null, 2)}
            </div>
        `;
        
        document.getElementById('eventDetails').innerHTML += html;
    } catch (error) {
        console.error('Erreur chargement disponibilités:', error);
    }
}

async function loadAssignationTools(evenementId) {
    const html = `
        <div class="card">
            <h3>Gestion des assignations</h3>
            <div class="actions">
                <button class="btn btn-primary" onclick="generateAssignations(${evenementId})">Générer assignations automatiques</button>
                <button class="btn btn-secondary" onclick="viewProposedAssignations(${evenementId})">Voir propositions</button>
            </div>
        </div>
    `;
    
    document.getElementById('eventDetails').innerHTML += html;
}

async function generateAssignations(evenementId) {
    const confirmed = confirm('Générer une nouvelle proposition d\'assignation automatique ? 🤖');
    if (!confirmed) return;
    
    try {
        await API.assignations.generateAuto(evenementId);
        Toast.success('✨ Proposition d\'assignation générée avec succès ! 🤖');
        viewProposedAssignations(evenementId);
    } catch (error) {
        Toast.error(error.message || 'Erreur lors de la génération des assignations 😔');
    }
}

async function viewProposedAssignations(evenementId) {
    try {
        const assignations = await API.assignations.getProposees(evenementId);
        
        const html = `
            <div class="card">
                <h3>Assignations proposées</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Bénévole</th>
                            <th>Détails</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${assignations.map(a => `
                            <tr>
                                <td>${a.prenom} ${a.nom}</td>
                                <td>${a.heure_debut ? `Créneau: ${a.heure_debut} - ${a.heure_fin}` : `Tâche: ${a.tache_nom}`}</td>
                                <td>
                                    <button class="btn btn-success" onclick="validerAssignation(${a.id}, ${evenementId})">Valider</button>
                                    <button class="btn btn-danger" onclick="supprimerAssignation(${a.id}, ${evenementId})">Supprimer</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div class="actions" style="margin-top: 1rem;">
                    <button class="btn btn-primary" onclick="validerToutesAssignations(${evenementId})">Tout valider</button>
                </div>
            </div>
        `;
        
        document.getElementById('eventDetails').innerHTML += html;
    } catch (error) {
        Toast.error(error.message || 'Erreur lors du chargement des assignations 😔');
    }
}

async function validerAssignation(id, evenementId) {
    try {
        await API.assignations.valider(id);
        Toast.success('✨ Assignation validée avec succès ! Les bénévoles seront notifiés 📧');
        window.location.reload();
    } catch (error) {
        Toast.error(error.message || 'Erreur lors de la validation 😔');
    }
}

async function supprimerAssignation(id, evenementId) {
    const confirmed = confirm('Supprimer cette assignation ? 🗑️');
    if (!confirmed) return;
    
    try {
        await API.assignations.delete(id);
        Toast.success('✨ Assignation supprimée ! 🗑️');
        window.location.reload();
    } catch (error) {
        Toast.error(error.message || 'Erreur lors de la suppression 😔');
    }
}

async function validerToutesAssignations(evenementId) {
    const confirmed = confirm('Valider toutes les assignations proposées ? Les bénévoles recevront une notification 📧');
    if (!confirmed) return;
    
    try {
        await API.assignations.validerTout(evenementId);
        Toast.success('✨ Toutes les assignations ont été validées ! Les notifications ont été envoyées aux bénévoles 📧🎉');
        window.location.reload();
    } catch (error) {
        Toast.error(error.message || 'Erreur lors de la validation 😔');
    }
}

window.setDisponibilite = setDisponibilite;
window.generateAssignations = generateAssignations;
window.viewProposedAssignations = viewProposedAssignations;
window.validerAssignation = validerAssignation;
window.supprimerAssignation = supprimerAssignation;
window.validerToutesAssignations = validerToutesAssignations;

