// Configuration de l'API
const API_BASE_URL = 'http://localhost:3000/api';

// Fonction pour obtenir le token depuis le localStorage
function getToken() {
    return localStorage.getItem('token');
}

// Fonction pour obtenir les headers avec authentification
function getHeaders() {
    const headers = {
        'Content-Type': 'application/json'
    };
    
    const token = getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
}

// Fonction générique pour les requêtes API
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config = {
        headers: getHeaders(),
        ...options
    };
    
    try {
        const response = await fetch(url, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Une erreur est survenue');
        }
        
        return data;
    } catch (error) {
        console.error('Erreur API:', error);
        throw error;
    }
}

// API Auth
const authAPI = {
    registerAssociation: (data) => apiRequest('/auth/register/association', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    
    registerBenevole: (data) => apiRequest('/auth/register/benevole', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    
    loginAssociation: (data) => apiRequest('/auth/login/association', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    
    loginBenevole: (data) => apiRequest('/auth/login/benevole', {
        method: 'POST',
        body: JSON.stringify(data)
    })
};

// API Associations
const associationsAPI = {
    getAll: () => apiRequest('/associations'),
    
    getById: (id) => apiRequest(`/associations/${id}`),
    
    getProfile: () => apiRequest('/associations/profile/me'),
    
    updateProfile: (data) => apiRequest('/associations/profile/me', {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    
    getDemandesAttente: () => apiRequest('/associations/demandes/attente'),
    
    updateDemande: (id, statut) => apiRequest(`/associations/demandes/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ statut })
    }),
    
    getBenevolesAcceptes: () => apiRequest('/associations/benevoles/acceptes'),
    
    getDashboardManquants: () => apiRequest('/associations/dashboard/manquants')
};

// API Bénévoles
const benevolesAPI = {
    getProfile: () => apiRequest('/benevoles/profile/me'),
    
    updateProfile: (data) => apiRequest('/benevoles/profile/me', {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    
    rejoindreAssociation: (id) => apiRequest(`/benevoles/associations/${id}/rejoindre`, {
        method: 'POST'
    }),
    
    getMesAssociations: () => apiRequest('/benevoles/associations/mes-associations'),
    
    getAssignations: () => apiRequest('/benevoles/assignations')
};

// API Événements
const evenementsAPI = {
    create: (data) => apiRequest('/evenements', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    
    getByAssociation: (id, statut) => {
        const url = statut ? `/evenements/association/${id}?statut=${statut}` : `/evenements/association/${id}`;
        return apiRequest(url);
    },
    
    getById: (id) => apiRequest(`/evenements/${id}`),
    
    update: (id, data) => apiRequest(`/evenements/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    
    getPublicDisponibles: () => apiRequest('/evenements/public/disponibles'),
    
    getBenevoleMesAssociations: () => apiRequest('/evenements/benevole/mes-associations')
};

// API Disponibilités
const disponibilitesAPI = {
    setCreneau: (id, statut) => apiRequest(`/disponibilites/creneau/${id}`, {
        method: 'POST',
        body: JSON.stringify({ statut })
    }),
    
    setTache: (id, statut) => apiRequest(`/disponibilites/tache/${id}`, {
        method: 'POST',
        body: JSON.stringify({ statut })
    }),
    
    getByEvenement: (id) => apiRequest(`/disponibilites/evenement/${id}`),
    
    getBenevoleByEvenement: (id) => apiRequest(`/disponibilites/benevole/evenement/${id}`)
};

// API Assignations
const assignationsAPI = {
    generateAuto: (evenementId) => apiRequest(`/assignations/auto/${evenementId}`, {
        method: 'POST'
    }),
    
    getProposees: (evenementId) => apiRequest(`/assignations/propose/${evenementId}`),
    
    valider: (id) => apiRequest(`/assignations/valider/${id}`, {
        method: 'PUT'
    }),
    
    validerTout: (evenementId) => apiRequest(`/assignations/valider-tout/${evenementId}`, {
        method: 'POST'
    }),
    
    delete: (id) => apiRequest(`/assignations/${id}`, {
        method: 'DELETE'
    }),
    
    createManuelle: (data) => apiRequest('/assignations/manuelle', {
        method: 'POST',
        body: JSON.stringify(data)
    })
};

// API Notifications
const notificationsAPI = {
    getAll: (lu) => {
        const url = lu !== undefined ? `/notifications?lu=${lu}` : '/notifications';
        return apiRequest(url);
    },
    
    marquerLu: (id) => apiRequest(`/notifications/${id}/lu`, {
        method: 'PUT'
    }),
    
    marquerToutLu: () => apiRequest('/notifications/tout-lu', {
        method: 'PUT'
    }),
    
    getCountNonLues: () => apiRequest('/notifications/non-lues/count')
};

// API Annonces
const annoncesAPI = {
    create: (data) => apiRequest('/annonces', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    
    getByAssociation: (id) => apiRequest(`/annonces/association/${id}`),
    
    getBenevoleMesAssociations: () => apiRequest('/annonces/benevole/mes-associations'),
    
    update: (id, data) => apiRequest(`/annonces/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    
    delete: (id) => apiRequest(`/annonces/${id}`, {
        method: 'DELETE'
    })
};

// Export pour utilisation globale
window.API = {
    auth: authAPI,
    associations: associationsAPI,
    benevoles: benevolesAPI,
    evenements: evenementsAPI,
    disponibilites: disponibilitesAPI,
    assignations: assignationsAPI,
    notifications: notificationsAPI,
    annonces: annoncesAPI
};

