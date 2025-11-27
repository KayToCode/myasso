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
    const isEnAttente = statut === 'en_attente_approbation';
    const isApprouve = statut === 'approuve';
    const isRefuse = statut === 'refuse';
    
    let statusMessage = '';
    if (isEnAttente) {
        statusMessage = '<p style="color: #007bff; font-weight: 600; margin-top: 0.5rem;">⏳ En attente d\'approbation</p>';
    } else if (isApprouve) {
        statusMessage = '<p style="color: var(--success-color); font-weight: 600; margin-top: 0.5rem;">✅ Disponibilité approuvée</p>';
    } else if (isRefuse) {
        statusMessage = '<p style="color: var(--error-color); font-weight: 600; margin-top: 0.5rem;">❌ Disponibilité refusée</p>';
    }
    
    return `
        <div class="availability-buttons">
            <button class="availability-btn disponible ${isEnAttente || isApprouve || statut === 'disponible' ? 'active' : ''}" 
                    onclick="setDisponibilite(${id}, 'disponible', '${type}')"
                    ${isEnAttente || isApprouve || isRefuse ? 'disabled' : ''}>
                ${isEnAttente ? '⏳ En attente...' : 'Disponible'}
            </button>
            <button class="availability-btn peut-etre ${statut === 'peut_etre' ? 'active' : ''}" 
                    onclick="setDisponibilite(${id}, 'peut_etre', '${type}')"
                    ${isEnAttente || isApprouve || isRefuse ? 'disabled' : ''}>
                Peut-être
            </button>
            <button class="availability-btn pas-disponible ${statut === 'pas_disponible' ? 'active' : ''}" 
                    onclick="setDisponibilite(${id}, 'pas_disponible', '${type}')"
                    ${isEnAttente || isApprouve || isRefuse ? 'disabled' : ''}>
                Pas disponible
            </button>
            ${statusMessage}
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
            disponible: '⏳ Demande de disponibilité envoyée ! En attente d\'approbation par l\'association 🔵',
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
        const data = await API.disponibilites.getByEvenement(evenementId);
        
        let html = `
            <div class="card" style="margin-top: 2rem;">
                <h3>📊 Disponibilités des bénévoles</h3>
        `;
        
        if (data.type_planification === 'creneaux' && data.creneaux) {
            html += '<div style="display: grid; gap: 1.5rem; margin-top: 1.5rem;">';
            
            data.creneaux.forEach(creneau => {
                const currentEventId = data.evenement_id || evenementId;
                const enAttente = creneau.disponibilites.filter(d => d.statut === 'en_attente_approbation');
                const disponibles = creneau.disponibilites.filter(d => d.statut === 'approuve' || d.statut === 'disponible');
                const peutEtre = creneau.disponibilites.filter(d => d.statut === 'peut_etre');
                const pasDisponibles = creneau.disponibilites.filter(d => d.statut === 'pas_disponible');
                const refuses = creneau.disponibilites.filter(d => d.statut === 'refuse');
                
                html += `
                    <div style="padding: 1.5rem; background: var(--bg-light); border-radius: var(--border-radius); border: 1px solid var(--border-color);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <h4 style="margin: 0; color: var(--accent-color);">
                                🕐 ${creneau.heure_debut.substring(0, 5)} - ${creneau.heure_fin.substring(0, 5)}
                            </h4>
                            <span class="badge badge-info">
                                ${disponibles.length}/${creneau.nombre_personnes_requises} disponible(s)
                            </span>
                        </div>
                        
                        <div style="display: grid; gap: 1rem; margin-top: 1rem;">
                            ${enAttente.length > 0 ? `
                                <div>
                                    <strong style="color: #007bff;">⏳ En attente d'approbation (${enAttente.length})</strong>
                                    <ul style="margin: 0.5rem 0 0 0; padding-left: 1.5rem;">
                                        ${enAttente.map(d => `
                                            <li style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                                                <span>${d.prenom} ${d.nom}</span>
                                                <div>
                                                    <button class="btn btn-success btn-sm" onclick="approuverDisponibilite(${d.disponibilite_id}, ${currentEventId})" style="margin-right: 0.5rem;">
                                                        ✅ Approuver
                                                    </button>
                                                    <button class="btn btn-danger btn-sm" onclick="refuserDisponibilite(${d.disponibilite_id}, ${currentEventId})">
                                                        ❌ Refuser
                                                    </button>
                                                </div>
                                            </li>
                                        `).join('')}
                                    </ul>
                                </div>
                            ` : ''}
                            
                            ${disponibles.length > 0 ? `
                                <div>
                                    <strong style="color: var(--success-color);">✅ Disponibles (${disponibles.length})</strong>
                                    <ul style="margin: 0.5rem 0 0 0; padding-left: 1.5rem;">
                                        ${disponibles.map(d => `<li>${d.prenom} ${d.nom}</li>`).join('')}
                                    </ul>
                                </div>
                            ` : enAttente.length === 0 ? '<p style="color: var(--text-light);">Aucun bénévole disponible pour ce créneau.</p>' : ''}
                            
                            ${peutEtre.length > 0 ? `
                                <div>
                                    <strong style="color: #ffa500;">🤔 Peut-être (${peutEtre.length})</strong>
                                    <ul style="margin: 0.5rem 0 0 0; padding-left: 1.5rem;">
                                        ${peutEtre.map(d => `<li>${d.prenom} ${d.nom}</li>`).join('')}
                                    </ul>
                                </div>
                            ` : ''}
                            
                            ${pasDisponibles.length > 0 ? `
                                <div>
                                    <strong style="color: var(--error-color);">❌ Pas disponibles (${pasDisponibles.length})</strong>
                                    <ul style="margin: 0.5rem 0 0 0; padding-left: 1.5rem;">
                                        ${pasDisponibles.map(d => `<li>${d.prenom} ${d.nom}</li>`).join('')}
                                    </ul>
                                </div>
                            ` : ''}
                            
                            ${refuses.length > 0 ? `
                                <div>
                                    <strong style="color: var(--error-color); opacity: 0.7;">🚫 Refusés (${refuses.length})</strong>
                                    <ul style="margin: 0.5rem 0 0 0; padding-left: 1.5rem;">
                                        ${refuses.map(d => `<li>${d.prenom} ${d.nom}</li>`).join('')}
                                    </ul>
                                </div>
                            ` : ''}
                        </div>
                        
                        ${disponibles.length < creneau.nombre_personnes_requises ? `
                            <p style="margin-top: 1rem; color: var(--warning-color); font-weight: 600;">
                                ⚠️ Manque ${creneau.nombre_personnes_requises - disponibles.length} personne(s)
                            </p>
                        ` : ''}
                    </div>
                `;
            });
            
            html += '</div>';
        } else if (data.type_planification === 'taches' && data.taches) {
            html += '<div style="display: grid; gap: 1.5rem; margin-top: 1.5rem;">';
            
            data.taches.forEach(tache => {
                const currentEventId = data.evenement_id || evenementId;
                const enAttente = tache.disponibilites.filter(d => d.statut === 'en_attente_approbation');
                const disponibles = tache.disponibilites.filter(d => d.statut === 'approuve' || d.statut === 'disponible');
                const peutEtre = tache.disponibilites.filter(d => d.statut === 'peut_etre');
                const pasDisponibles = tache.disponibilites.filter(d => d.statut === 'pas_disponible');
                const refuses = tache.disponibilites.filter(d => d.statut === 'refuse');
                
                html += `
                    <div style="padding: 1.5rem; background: var(--bg-light); border-radius: var(--border-radius); border: 1px solid var(--border-color);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <h4 style="margin: 0; color: var(--accent-color);">📋 ${tache.tache_nom}</h4>
                            <span class="badge badge-info">
                                ${disponibles.length}/${tache.nombre_personnes_requises} disponible(s)
                            </span>
                        </div>
                        
                        <div style="display: grid; gap: 1rem; margin-top: 1rem;">
                            ${enAttente.length > 0 ? `
                                <div>
                                    <strong style="color: #007bff;">⏳ En attente d'approbation (${enAttente.length})</strong>
                                    <ul style="margin: 0.5rem 0 0 0; padding-left: 1.5rem;">
                                        ${enAttente.map(d => `
                                            <li style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                                                <span>${d.prenom} ${d.nom}</span>
                                                <div>
                                                    <button class="btn btn-success btn-sm" onclick="approuverDisponibilite(${d.disponibilite_id}, ${currentEventId})" style="margin-right: 0.5rem;">
                                                        ✅ Approuver
                                                    </button>
                                                    <button class="btn btn-danger btn-sm" onclick="refuserDisponibilite(${d.disponibilite_id}, ${currentEventId})">
                                                        ❌ Refuser
                                                    </button>
                                                </div>
                                            </li>
                                        `).join('')}
                                    </ul>
                                </div>
                            ` : ''}
                            
                            ${disponibles.length > 0 ? `
                                <div>
                                    <strong style="color: var(--success-color);">✅ Disponibles (${disponibles.length})</strong>
                                    <ul style="margin: 0.5rem 0 0 0; padding-left: 1.5rem;">
                                        ${disponibles.map(d => `<li>${d.prenom} ${d.nom}</li>`).join('')}
                                    </ul>
                                </div>
                            ` : enAttente.length === 0 ? '<p style="color: var(--text-light);">Aucun bénévole disponible pour cette tâche.</p>' : ''}
                            
                            ${peutEtre.length > 0 ? `
                                <div>
                                    <strong style="color: #ffa500;">🤔 Peut-être (${peutEtre.length})</strong>
                                    <ul style="margin: 0.5rem 0 0 0; padding-left: 1.5rem;">
                                        ${peutEtre.map(d => `<li>${d.prenom} ${d.nom}</li>`).join('')}
                                    </ul>
                                </div>
                            ` : ''}
                            
                            ${pasDisponibles.length > 0 ? `
                                <div>
                                    <strong style="color: var(--error-color);">❌ Pas disponibles (${pasDisponibles.length})</strong>
                                    <ul style="margin: 0.5rem 0 0 0; padding-left: 1.5rem;">
                                        ${pasDisponibles.map(d => `<li>${d.prenom} ${d.nom}</li>`).join('')}
                                    </ul>
                                </div>
                            ` : ''}
                            
                            ${refuses.length > 0 ? `
                                <div>
                                    <strong style="color: var(--error-color); opacity: 0.7;">🚫 Refusés (${refuses.length})</strong>
                                    <ul style="margin: 0.5rem 0 0 0; padding-left: 1.5rem;">
                                        ${refuses.map(d => `<li>${d.prenom} ${d.nom}</li>`).join('')}
                                    </ul>
                                </div>
                            ` : ''}
                        </div>
                        
                        ${disponibles.length < tache.nombre_personnes_requises ? `
                            <p style="margin-top: 1rem; color: var(--warning-color); font-weight: 600;">
                                ⚠️ Manque ${tache.nombre_personnes_requises - disponibles.length} personne(s)
                            </p>
                        ` : ''}
                    </div>
                `;
            });
            
            html += '</div>';
        } else {
            html += '<p style="color: var(--text-light); margin-top: 1rem;">Aucune disponibilité enregistrée pour le moment.</p>';
        }
        
        html += '</div>';
        
        document.getElementById('eventDetails').innerHTML += html;
    } catch (error) {
        console.error('Erreur chargement disponibilités:', error);
        document.getElementById('eventDetails').innerHTML += `
            <div class="card" style="margin-top: 2rem;">
                <h3>📊 Disponibilités des bénévoles</h3>
                <p class="error-message">Erreur lors du chargement des disponibilités: ${error.message || 'Erreur inconnue'}</p>
            </div>
        `;
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

async function approuverDisponibilite(disponibiliteId, evenementId) {
    try {
        await API.disponibilites.approuver(disponibiliteId);
        Toast.success('✅ Disponibilité approuvée ! Notification envoyée au bénévole 📧');
        
        // Recharger la page pour voir les changements
        const urlParams = new URLSearchParams(window.location.search);
        const eventId = urlParams.get('id');
        loadEventDetails(eventId);
    } catch (error) {
        Toast.error(error.message || 'Erreur lors de l\'approbation 😔');
    }
}

async function refuserDisponibilite(disponibiliteId, evenementId) {
    if (!confirm('Êtes-vous sûr de vouloir refuser cette demande de disponibilité ?')) {
        return;
    }
    
    try {
        await API.disponibilites.refuser(disponibiliteId);
        Toast.success('❌ Disponibilité refusée ! Notification envoyée au bénévole 📧');
        
        // Recharger la page pour voir les changements
        const urlParams = new URLSearchParams(window.location.search);
        const eventId = urlParams.get('id');
        loadEventDetails(eventId);
    } catch (error) {
        Toast.error(error.message || 'Erreur lors du refus 😔');
    }
}

window.setDisponibilite = setDisponibilite;
window.generateAssignations = generateAssignations;
window.viewProposedAssignations = viewProposedAssignations;
window.validerAssignation = validerAssignation;
window.supprimerAssignation = supprimerAssignation;
window.validerToutesAssignations = validerToutesAssignations;
window.approuverDisponibilite = approuverDisponibilite;
window.refuserDisponibilite = refuserDisponibilite;

