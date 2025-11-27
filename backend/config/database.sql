-- Création de la base de données
CREATE DATABASE IF NOT EXISTS myasso CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE myasso;

-- Table des associations
CREATE TABLE IF NOT EXISTS associations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    activites TEXT,
    besoins TEXT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des bénévoles
CREATE TABLE IF NOT EXISTS benevoles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    prenom VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    telephone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table de liaison bénévole-association (demandes d'adhésion)
CREATE TABLE IF NOT EXISTS benevole_associations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    benevole_id INT NOT NULL,
    association_id INT NOT NULL,
    statut ENUM('en_attente', 'accepte', 'refuse') DEFAULT 'en_attente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (benevole_id) REFERENCES benevoles(id) ON DELETE CASCADE,
    FOREIGN KEY (association_id) REFERENCES associations(id) ON DELETE CASCADE,
    UNIQUE KEY unique_benevole_association (benevole_id, association_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des événements
CREATE TABLE IF NOT EXISTS evenements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    association_id INT NOT NULL,
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    date_debut DATETIME NOT NULL,
    date_fin DATETIME NOT NULL,
    type_planification ENUM('creneaux', 'taches') NOT NULL DEFAULT 'creneaux',
    statut ENUM('brouillon', 'publie', 'termine') DEFAULT 'brouillon',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (association_id) REFERENCES associations(id) ON DELETE CASCADE,
    INDEX idx_date (date_debut, date_fin),
    INDEX idx_association (association_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des créneaux horaires
CREATE TABLE IF NOT EXISTS creneaux (
    id INT AUTO_INCREMENT PRIMARY KEY,
    evenement_id INT NOT NULL,
    heure_debut TIME NOT NULL,
    heure_fin TIME NOT NULL,
    nombre_personnes_requises INT DEFAULT 1,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (evenement_id) REFERENCES evenements(id) ON DELETE CASCADE,
    INDEX idx_evenement (evenement_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des tâches
CREATE TABLE IF NOT EXISTS taches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    evenement_id INT NOT NULL,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    nombre_personnes_requises INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (evenement_id) REFERENCES evenements(id) ON DELETE CASCADE,
    INDEX idx_evenement (evenement_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des disponibilités des bénévoles
CREATE TABLE IF NOT EXISTS disponibilites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    benevole_id INT NOT NULL,
    evenement_id INT NOT NULL,
    creneau_id INT NULL,
    tache_id INT NULL,
    statut ENUM('disponible', 'pas_disponible', 'peut_etre', 'en_attente_approbation', 'approuve', 'refuse') NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (benevole_id) REFERENCES benevoles(id) ON DELETE CASCADE,
    FOREIGN KEY (evenement_id) REFERENCES evenements(id) ON DELETE CASCADE,
    FOREIGN KEY (creneau_id) REFERENCES creneaux(id) ON DELETE CASCADE,
    FOREIGN KEY (tache_id) REFERENCES taches(id) ON DELETE CASCADE,
    UNIQUE KEY unique_benevole_creneau (benevole_id, creneau_id),
    UNIQUE KEY unique_benevole_tache (benevole_id, tache_id),
    CHECK ((creneau_id IS NOT NULL AND tache_id IS NULL) OR (creneau_id IS NULL AND tache_id IS NOT NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des assignations (après validation par l'association)
CREATE TABLE IF NOT EXISTS assignations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    benevole_id INT NOT NULL,
    evenement_id INT NOT NULL,
    creneau_id INT NULL,
    tache_id INT NULL,
    statut ENUM('propose', 'valide', 'refuse') DEFAULT 'propose',
    notification_envoyee BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (benevole_id) REFERENCES benevoles(id) ON DELETE CASCADE,
    FOREIGN KEY (evenement_id) REFERENCES evenements(id) ON DELETE CASCADE,
    FOREIGN KEY (creneau_id) REFERENCES creneaux(id) ON DELETE CASCADE,
    FOREIGN KEY (tache_id) REFERENCES taches(id) ON DELETE CASCADE,
    UNIQUE KEY unique_assignation_creneau (benevole_id, creneau_id),
    UNIQUE KEY unique_assignation_tache (benevole_id, tache_id),
    CHECK ((creneau_id IS NOT NULL AND tache_id IS NULL) OR (creneau_id IS NULL AND tache_id IS NOT NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des annonces
CREATE TABLE IF NOT EXISTS annonces (
    id INT AUTO_INCREMENT PRIMARY KEY,
    association_id INT NOT NULL,
    titre VARCHAR(255) NOT NULL,
    contenu TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (association_id) REFERENCES associations(id) ON DELETE CASCADE,
    INDEX idx_association (association_id),
    INDEX idx_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des notifications
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    benevole_id INT NOT NULL,
    type ENUM('assignation', 'annulation', 'nouvel_evenement', 'nouvelle_annonce', 'approbation_disponibilite', 'refus_disponibilite') NOT NULL,
    titre VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    lu BOOLEAN DEFAULT FALSE,
    assignation_id INT NULL,
    evenement_id INT NULL,
    disponibilite_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (benevole_id) REFERENCES benevoles(id) ON DELETE CASCADE,
    FOREIGN KEY (assignation_id) REFERENCES assignations(id) ON DELETE SET NULL,
    FOREIGN KEY (evenement_id) REFERENCES evenements(id) ON DELETE SET NULL,
    INDEX idx_benevole (benevole_id),
    INDEX idx_lu (lu)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

