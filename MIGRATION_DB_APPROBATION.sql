-- Script de migration pour ajouter les nouveaux statuts d'approbation
-- À exécuter sur une base de données existante pour ajouter les nouveaux statuts

-- 1. Modifier la table disponibilites pour ajouter les nouveaux statuts
ALTER TABLE disponibilites 
MODIFY COLUMN statut ENUM('disponible', 'pas_disponible', 'peut_etre', 'en_attente_approbation', 'approuve', 'refuse') NOT NULL;

-- 2. Modifier la table notifications pour ajouter les nouveaux types
ALTER TABLE notifications 
MODIFY COLUMN type ENUM('assignation', 'annulation', 'nouvel_evenement', 'nouvelle_annonce', 'approbation_disponibilite', 'refus_disponibilite') NOT NULL;

-- 3. Ajouter la colonne disponibilite_id à la table notifications (si elle n'existe pas)
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS disponibilite_id INT NULL;

-- Note: Les disponibilités existantes avec statut 'disponible' resteront 'disponible'
-- Seules les nouvelles demandes seront en 'en_attente_approbation'

