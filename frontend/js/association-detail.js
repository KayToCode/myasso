// Script pour la page de détails d'une association
document.addEventListener('DOMContentLoaded', () => {
    Auth.updateAuthUI();
    
    const urlParams = new URLSearchParams(window.location.search);
    const associationId = urlParams.get('id');
    
    if (associationId) {
        loadAssociationDetails(associationId);
        loadEvenements(associationId);
        loadAnnonces(associationId);
    } else {
        document.getElementById('errorMessage').textContent = 'ID association manquant';
        document.getElementById('errorMessage').style.display = 'block';
    }
});

function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(`tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`).classList.add('active');
}

async function loadAssociationDetails(id) {
    const loading = document.getElementById('loading');
    const errorDiv = document.getElementById('errorMessage');
    const detailsDiv = document.getElementById('associationDetails');
    
    loading.style.display = 'block';
    errorDiv.style.display = 'none';
    detailsDiv.innerHTML = '';
    
    try {
        const association = await API.associations.getById(id);
        
        const user = Auth.getCurrentUser();
        const isBenevole = user && user.type === 'benevole';
        const isAlreadyMember = false; // TODO: vérifier si le bénévole est déjà membre
        
        let html = `
            <div class="card" style="margin-top: 2rem;">
                <div class="card-header">
                    <h2 style="font-size: 2rem; background: var(--primary-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                        🏢 ${association.nom}
                    </h2>
                    ${isBenevole && !isAlreadyMember ? `
                        <button class="btn btn-primary" onclick="rejoindreAssociation(${id})">
                            <span>✨</span> Rejoindre cette association
                        </button>
                    ` : ''}
                </div>
                ${association.description ? `
                    <div style="margin-bottom: 1.5rem;">
                        <h3 style="color: var(--accent-color); margin-bottom: 0.5rem;">📝 Description</h3>
                        <p style="color: var(--text-light); line-height: 1.8;">${association.description}</p>
                    </div>
                ` : ''}
                ${association.activites ? `
                    <div style="margin-bottom: 1.5rem;">
                        <h3 style="color: var(--accent-color); margin-bottom: 0.5rem;">🎯 Activités</h3>
                        <p style="color: var(--text-light); line-height: 1.8;">${association.activites}</p>
                    </div>
                ` : ''}
                ${association.besoins ? `
                    <div style="margin-bottom: 1.5rem;">
                        <h3 style="color: var(--accent-color); margin-bottom: 0.5rem;">💡 Besoins</h3>
                        <p style="color: var(--text-light); line-height: 1.8;">${association.besoins}</p>
                    </div>
                ` : ''}
                <p style="color: var(--text-light); font-size: 0.9rem; margin-top: 1rem;">
                    <small>Association créée le ${new Date(association.created_at).toLocaleDateString('fr-FR')}</small>
                </p>
            </div>
        `;
        
        detailsDiv.innerHTML = html;
    } catch (error) {
        errorDiv.textContent = error.message || 'Erreur lors du chargement de l\'association';
        errorDiv.style.display = 'block';
    } finally {
        loading.style.display = 'none';
    }
}

async function loadEvenements(associationId) {
    try {
        const evenements = await API.evenements.getByAssociation(associationId, 'publie');
        
        const listDiv = document.getElementById('evenementsList');
        listDiv.innerHTML = '';
        
        if (evenements.length === 0) {
            listDiv.innerHTML = `
                <div style="text-align: center; padding: 3rem; background: white; border-radius: var(--border-radius); box-shadow: var(--shadow-md);">
                    <p style="font-size: 1.2rem; color: var(--text-light);">
                        📭 Aucun événement publié pour le moment.
                    </p>
                </div>
            `;
        } else {
            evenements.forEach(evenement => {
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <div class="card-header">
                        <h3>${evenement.titre}</h3>
                        <a href="evenement-detail.html?id=${evenement.id}" class="btn btn-primary">
                            <span>👁️</span> Voir détails
                        </a>
                    </div>
                    ${evenement.description ? `<p style="margin-bottom: 1rem;">${evenement.description}</p>` : ''}
                    <p style="color: var(--text-light);">
                        <strong>📅 Date:</strong> ${new Date(evenement.date_debut).toLocaleString('fr-FR')} - ${new Date(evenement.date_fin).toLocaleString('fr-FR')}
                    </p>
                    <p style="color: var(--text-light);">
                        <strong>📋 Type:</strong> ${evenement.type_planification === 'creneaux' ? 'Créneaux horaires' : 'Tâches'}
                    </p>
                `;
                listDiv.appendChild(card);
            });
        }
    } catch (error) {
        console.error('Erreur chargement événements:', error);
        document.getElementById('evenementsList').innerHTML = `
            <div class="error-message">
                Erreur lors du chargement des événements
            </div>
        `;
    }
}

async function loadAnnonces(associationId) {
    try {
        const annonces = await API.annonces.getByAssociation(associationId);
        
        const listDiv = document.getElementById('annoncesList');
        listDiv.innerHTML = '';
        
        if (annonces.length === 0) {
            listDiv.innerHTML = `
                <div style="text-align: center; padding: 3rem; background: white; border-radius: var(--border-radius); box-shadow: var(--shadow-md);">
                    <p style="font-size: 1.2rem; color: var(--text-light);">
                        📭 Aucune annonce pour le moment.
                    </p>
                </div>
            `;
        } else {
            annonces.forEach(annonce => {
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <h3>${annonce.titre}</h3>
                    <p style="margin-bottom: 1rem; line-height: 1.8;">${annonce.contenu}</p>
                    <p style="color: var(--text-light); font-size: 0.9rem;">
                        <small>📅 ${new Date(annonce.created_at).toLocaleString('fr-FR')}</small>
                    </p>
                `;
                listDiv.appendChild(card);
            });
        }
    } catch (error) {
        console.error('Erreur chargement annonces:', error);
        document.getElementById('annoncesList').innerHTML = `
            <div class="error-message">
                Erreur lors du chargement des annonces
            </div>
        `;
    }
}

async function rejoindreAssociation(id) {
    if (!Auth.isAuthenticated() || !Auth.isBenevole()) {
        Toast.warning('Vous devez être connecté en tant que bénévole pour rejoindre une association 🔐');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }
    
    try {
        await API.benevoles.rejoindreAssociation(id);
        Toast.success('✨ Demande envoyée avec succès ! 🎉');
        // Recharger les détails pour mettre à jour le bouton
        loadAssociationDetails(id);
    } catch (error) {
        Toast.error(error.message || 'Erreur lors de l\'envoi de la demande 😔');
    }
}

window.switchTab = switchTab;
window.rejoindreAssociation = rejoindreAssociation;

