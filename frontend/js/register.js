// Script pour la page d'inscription
function switchTab(type) {
    // Mettre à jour les tabs
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    if (type === 'benevole') {
        document.querySelector('.tab').classList.add('active');
        document.getElementById('formBenevole').classList.add('active');
    } else {
        document.querySelectorAll('.tab')[1].classList.add('active');
        document.getElementById('formAssociation').classList.add('active');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Formulaire bénévole
    const benevoleForm = document.getElementById('registerBenevoleForm');
    if (benevoleForm) {
        benevoleForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const errorDiv = document.getElementById('errorMessage');
            const successDiv = document.getElementById('successMessage');
            errorDiv.style.display = 'none';
            successDiv.style.display = 'none';
            
            const formData = {
                nom: document.getElementById('benevole_nom').value,
                prenom: document.getElementById('benevole_prenom').value,
                email: document.getElementById('benevole_email').value,
                telephone: document.getElementById('benevole_telephone').value,
                password: document.getElementById('benevole_password').value
            };
            
            try {
                const response = await API.auth.registerBenevole(formData);
                Auth.setCurrentUser(response.user, response.token);
                successDiv.textContent = response.message || 'Inscription réussie !';
                successDiv.style.display = 'block';
                
                setTimeout(() => {
                    window.location.href = 'dashboard-benevole.html';
                }, 1500);
            } catch (error) {
                errorDiv.textContent = error.message || 'Une erreur est survenue lors de l\'inscription';
                errorDiv.style.display = 'block';
            }
        });
    }
    
    // Formulaire association
    const associationForm = document.getElementById('registerAssociationForm');
    if (associationForm) {
        associationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const errorDiv = document.getElementById('errorMessage');
            const successDiv = document.getElementById('successMessage');
            errorDiv.style.display = 'none';
            successDiv.style.display = 'none';
            
            const formData = {
                nom: document.getElementById('asso_nom').value,
                email: document.getElementById('asso_email').value,
                description: document.getElementById('asso_description').value,
                activites: document.getElementById('asso_activites').value,
                besoins: document.getElementById('asso_besoins').value,
                password: document.getElementById('asso_password').value
            };
            
            try {
                const response = await API.auth.registerAssociation(formData);
                Auth.setCurrentUser(response.user, response.token);
                successDiv.textContent = response.message || 'Inscription réussie !';
                successDiv.style.display = 'block';
                
                setTimeout(() => {
                    window.location.href = 'dashboard-association.html';
                }, 1500);
            } catch (error) {
                errorDiv.textContent = error.message || 'Une erreur est survenue lors de l\'inscription';
                errorDiv.style.display = 'block';
            }
        });
    }
});

