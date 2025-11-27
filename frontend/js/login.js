// Script pour la page de connexion
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
    const benevoleForm = document.getElementById('loginBenevoleForm');
    if (benevoleForm) {
        benevoleForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const errorDiv = document.getElementById('errorMessage');
            errorDiv.style.display = 'none';
            
            const formData = {
                email: document.getElementById('benevole_email').value,
                password: document.getElementById('benevole_password').value
            };
            
            try {
                const response = await API.auth.loginBenevole(formData);
                Auth.setCurrentUser(response.user, response.token);
                window.location.href = 'dashboard-benevole.html';
            } catch (error) {
                errorDiv.textContent = error.message || 'Email ou mot de passe incorrect';
                errorDiv.style.display = 'block';
            }
        });
    }
    
    // Formulaire association
    const associationForm = document.getElementById('loginAssociationForm');
    if (associationForm) {
        associationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const errorDiv = document.getElementById('errorMessage');
            errorDiv.style.display = 'none';
            
            const formData = {
                email: document.getElementById('asso_email').value,
                password: document.getElementById('asso_password').value
            };
            
            try {
                const response = await API.auth.loginAssociation(formData);
                Auth.setCurrentUser(response.user, response.token);
                window.location.href = 'dashboard-association.html';
            } catch (error) {
                errorDiv.textContent = error.message || 'Email ou mot de passe incorrect';
                errorDiv.style.display = 'block';
            }
        });
    }
});

