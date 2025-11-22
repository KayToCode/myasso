const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, isAssociation } = require('../middleware/auth');

// Lister toutes les associations (public)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.promise().execute(
      'SELECT id, nom, description, activites, besoins, created_at FROM associations ORDER BY nom'
    );
    res.json(rows);
  } catch (error) {
    console.error('Erreur récupération associations:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des associations' });
  }
});

// Obtenir une association par ID (public)
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.promise().execute(
      'SELECT id, nom, description, activites, besoins, created_at FROM associations WHERE id = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Association non trouvée' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Erreur récupération association:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'association' });
  }
});

// Obtenir le profil de l'association connectée
router.get('/profile/me', authenticateToken, isAssociation, async (req, res) => {
  try {
    const [rows] = await db.promise().execute(
      'SELECT id, nom, description, activites, besoins, email, created_at FROM associations WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Association non trouvée' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Erreur récupération profil:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du profil' });
  }
});

// Mettre à jour le profil de l'association
router.put('/profile/me', authenticateToken, isAssociation, async (req, res) => {
  try {
    const { nom, description, activites, besoins } = req.body;

    await db.promise().execute(
      'UPDATE associations SET nom = ?, description = ?, activites = ?, besoins = ? WHERE id = ?',
      [nom, description, activites, besoins, req.user.id]
    );

    res.json({ message: 'Profil mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur mise à jour profil:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du profil' });
  }
});

// Obtenir les demandes d'adhésion en attente
router.get('/demandes/attente', authenticateToken, isAssociation, async (req, res) => {
  try {
    const [rows] = await db.promise().execute(
      `SELECT ba.id, ba.benevole_id, ba.statut, ba.created_at,
              b.nom, b.prenom, b.email, b.telephone
       FROM benevole_associations ba
       JOIN benevoles b ON ba.benevole_id = b.id
       WHERE ba.association_id = ? AND ba.statut = 'en_attente'
       ORDER BY ba.created_at DESC`,
      [req.user.id]
    );

    res.json(rows);
  } catch (error) {
    console.error('Erreur récupération demandes:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des demandes' });
  }
});

// Accepter ou refuser une demande d'adhésion
router.put('/demandes/:id', authenticateToken, isAssociation, async (req, res) => {
  try {
    const { statut } = req.body; // 'accepte' ou 'refuse'

    if (!['accepte', 'refuse'].includes(statut)) {
      return res.status(400).json({ error: 'Statut invalide. Utilisez "accepte" ou "refuse"' });
    }

    // Vérifier que la demande appartient à cette association
    const [check] = await db.promise().execute(
      'SELECT * FROM benevole_associations WHERE id = ? AND association_id = ?',
      [req.params.id, req.user.id]
    );

    if (check.length === 0) {
      return res.status(404).json({ error: 'Demande non trouvée' });
    }

    await db.promise().execute(
      'UPDATE benevole_associations SET statut = ? WHERE id = ?',
      [statut, req.params.id]
    );

    res.json({ message: `Demande ${statut === 'accepte' ? 'acceptée' : 'refusée'} avec succès` });
  } catch (error) {
    console.error('Erreur mise à jour demande:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la demande' });
  }
});

// Obtenir la liste des bénévoles acceptés
router.get('/benevoles/acceptes', authenticateToken, isAssociation, async (req, res) => {
  try {
    const [rows] = await db.promise().execute(
      `SELECT b.id, b.nom, b.prenom, b.email, b.telephone, ba.created_at
       FROM benevole_associations ba
       JOIN benevoles b ON ba.benevole_id = b.id
       WHERE ba.association_id = ? AND ba.statut = 'accepte'
       ORDER BY b.nom, b.prenom`,
      [req.user.id]
    );

    res.json(rows);
  } catch (error) {
    console.error('Erreur récupération bénévoles:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des bénévoles' });
  }
});

// Obtenir le tableau de bord (créneaux manquants)
router.get('/dashboard/manquants', authenticateToken, isAssociation, async (req, res) => {
  try {
    // Événements à venir avec créneaux manquants
    const [creneauxManquants] = await db.promise().execute(
      `SELECT c.id, c.evenement_id, e.titre, e.date_debut, 
              c.heure_debut, c.heure_fin, c.nombre_personnes_requises,
              COALESCE(COUNT(DISTINCT CASE WHEN d.statut = 'disponible' THEN d.benevole_id END), 0) as disponibles,
              (c.nombre_personnes_requises - COALESCE(COUNT(DISTINCT CASE WHEN d.statut = 'disponible' THEN d.benevole_id END), 0)) as manquants
       FROM creneaux c
       JOIN evenements e ON c.evenement_id = e.id
       LEFT JOIN disponibilites d ON c.id = d.creneau_id AND d.statut = 'disponible'
       WHERE e.association_id = ? AND e.date_debut >= NOW() AND e.statut = 'publie'
       GROUP BY c.id, c.evenement_id, e.titre, e.date_debut, c.heure_debut, c.heure_fin, c.nombre_personnes_requises
       HAVING manquants > 0
       ORDER BY e.date_debut, c.heure_debut`,
      [req.user.id]
    );

    // Tâches manquantes
    const [tachesManquantes] = await db.promise().execute(
      `SELECT t.id, t.evenement_id, e.titre, e.date_debut,
              t.nom, t.nombre_personnes_requises,
              COALESCE(COUNT(DISTINCT CASE WHEN d.statut = 'disponible' THEN d.benevole_id END), 0) as disponibles,
              (t.nombre_personnes_requises - COALESCE(COUNT(DISTINCT CASE WHEN d.statut = 'disponible' THEN d.benevole_id END), 0)) as manquants
       FROM taches t
       JOIN evenements e ON t.evenement_id = e.id
       LEFT JOIN disponibilites d ON t.id = d.tache_id AND d.statut = 'disponible'
       WHERE e.association_id = ? AND e.date_debut >= NOW() AND e.statut = 'publie'
       GROUP BY t.id, t.evenement_id, e.titre, e.date_debut, t.nom, t.nombre_personnes_requises
       HAVING manquants > 0
       ORDER BY e.date_debut, t.nom`,
      [req.user.id]
    );

    res.json({
      creneaux_manquants: creneauxManquants,
      taches_manquantes: tachesManquantes
    });
  } catch (error) {
    console.error('Erreur récupération tableau de bord:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du tableau de bord' });
  }
});

module.exports = router;

