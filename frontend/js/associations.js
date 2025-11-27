// Script pour la page des associations
document.addEventListener('DOMContentLoaded', () => {
    Auth.updateAuthUI();
    loadAssociations();
});

async function loadAssociations() {
    const loading = document.getElementById('loading');
    const errorDiv = document.getElementById('errorMessage');
    const listDiv = document.getElementById('associationsList');
    
    loading.style.display = 'block';
    errorDiv.style.display = 'none';
    listDiv.innerHTML = '';
    
    try {
        const associations = await API.associations.getAll();
        
        if (associations.length === 0) {
            listDiv.innerHTML = `
                <div style="text-align: center; padding: 3rem; background: white; border-radius: var(--border-radius); box-shadow: var(--shadow-md);">
                    <p style="font-size: 1.2rem; color: var(--text-light);">
                        📭 Aucune association disponible pour le moment.
                    </p>
                </div>
            `;
        } else {
            const user = Auth.getCurrentUser();
            const isBenevole = user && user.type === 'benevole';
            
            associations.forEach(asso => {
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <div class="card-header">
                        <h3>🏢 ${asso.nom}</h3>
                        ${isBenevole ? `<button class="btn btn-primary" onclick="rejoindreAssociation(${asso.id})"><span>✨</span> Rejoindre</button>` : ''}
                    </div>
                    ${asso.description ? `<p style="margin-bottom: 1rem;"><strong>📝 Description:</strong><br>${asso.description}</p>` : ''}
                    ${asso.activites ? `<p style="margin-bottom: 1rem;"><strong>🎯 Activités:</strong><br>${asso.activites}</p>` : ''}
                    ${asso.besoins ? `<p style="margin-bottom: 1rem;"><strong>💡 Besoins:</strong><br>${asso.besoins}</p>` : ''}
                    <div style="margin-top: 1.5rem;">
                        <a href="association-detail.html?id=${asso.id}" style="color: var(--accent-color); font-weight: 600; text-decoration: none;">
                            🔍 Voir les détails
                        </a>
                    </div>
                `;
                listDiv.appendChild(card);
            });
        }
    } catch (error) {
        errorDiv.textContent = error.message || 'Erreur lors du chargement des associations';
        errorDiv.style.display = 'block';
    } finally {
        loading.style.display = 'none';
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
        loadAssociations(); // Recharger la liste
    } catch (error) {
        Toast.error(error.message || 'Erreur lors de l\'envoi de la demande 😔');
    }
}

window.rejoindreAssociation = rejoindreAssociation;

