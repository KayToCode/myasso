const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, isBenevole } = require('../middleware/auth');

// Obtenir le profil du bénévole connecté
router.get('/profile/me', authenticateToken, isBenevole, async (req, res) => {
  try {
    const [rows] = await db.promise().execute(
      'SELECT id, nom, prenom, email, telephone, created_at FROM benevoles WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Bénévole non trouvé' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Erreur récupération profil:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du profil' });
  }
});

// Mettre à jour le profil du bénévole
router.put('/profile/me', authenticateToken, isBenevole, async (req, res) => {
  try {
    const { nom, prenom, telephone } = req.body;

    await db.promise().execute(
      'UPDATE benevoles SET nom = ?, prenom = ?, telephone = ? WHERE id = ?',
      [nom, prenom, telephone, req.user.id]
    );

    res.json({ message: 'Profil mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur mise à jour profil:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du profil' });
  }
});

// Demander à rejoindre une association
router.post('/associations/:id/rejoindre', authenticateToken, isBenevole, async (req, res) => {
  try {
    const associationId = req.params.id;

    // Vérifier si l'association existe
    const [asso] = await db.promise().execute(
      'SELECT id FROM associations WHERE id = ?',
      [associationId]
    );

    if (asso.length === 0) {
      return res.status(404).json({ error: 'Association non trouvée' });
    }

    // Vérifier si la demande existe déjà
    const [existing] = await db.promise().execute(
      'SELECT * FROM benevole_associations WHERE benevole_id = ? AND association_id = ?',
      [req.user.id, associationId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Demande déjà envoyée' });
    }

    // Créer la demande
    await db.promise().execute(
      'INSERT INTO benevole_associations (benevole_id, association_id, statut) VALUES (?, ?, ?)',
      [req.user.id, associationId, 'en_attente']
    );

    res.status(201).json({ message: 'Demande envoyée avec succès' });
  } catch (error) {
    console.error('Erreur demande adhésion:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi de la demande' });
  }
});

// Obtenir les associations où le bénévole est accepté
router.get('/associations/mes-associations', authenticateToken, isBenevole, async (req, res) => {
  try {
    const [rows] = await db.promise().execute(
      `SELECT a.id, a.nom, a.description, ba.statut, ba.created_at
       FROM benevole_associations ba
       JOIN associations a ON ba.association_id = a.id
       WHERE ba.benevole_id = ? AND ba.statut = 'accepte'
       ORDER BY a.nom`,
      [req.user.id]
    );

    res.json(rows);
  } catch (error) {
    console.error('Erreur récupération associations:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des associations' });
  }
});

// Vérifier le statut d'adhésion d'un bénévole à une association
router.get('/associations/:id/statut', authenticateToken, isBenevole, async (req, res) => {
  try {
    const [rows] = await db.promise().execute(
      `SELECT statut FROM benevole_associations 
       WHERE benevole_id = ? AND association_id = ?`,
      [req.user.id, req.params.id]
    );

    if (rows.length === 0) {
      return res.json({ statut: null });
    }

    res.json({ statut: rows[0].statut });
  } catch (error) {
    console.error('Erreur vérification statut:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification du statut' });
  }
});

// Quitter une association
router.delete('/associations/:id/quitter', authenticateToken, isBenevole, async (req, res) => {
  try {
    const associationId = req.params.id;

    // Vérifier si la relation existe
    const [existing] = await db.promise().execute(
      'SELECT * FROM benevole_associations WHERE benevole_id = ? AND association_id = ?',
      [req.user.id, associationId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Vous n\'êtes pas membre de cette association' });
    }

    // Supprimer la relation
    await db.promise().execute(
      'DELETE FROM benevole_associations WHERE benevole_id = ? AND association_id = ?',
      [req.user.id, associationId]
    );

    res.json({ message: 'Vous avez quitté l\'association avec succès' });
  } catch (error) {
    console.error('Erreur quitter association:', error);
    res.status(500).json({ error: 'Erreur lors de la sortie de l\'association' });
  }
});

// Obtenir les assignations du bénévole
router.get('/assignations', authenticateToken, isBenevole, async (req, res) => {
  try {
    const [rows] = await db.promise().execute(
      `SELECT a.id, a.statut, a.created_at,
              e.id as evenement_id, e.titre, e.date_debut, e.date_fin,
              c.id as creneau_id, c.heure_debut, c.heure_fin,
              t.id as tache_id, t.nom as tache_nom,
              ass.id as association_id, ass.nom as association_nom
       FROM assignations a
       JOIN evenements e ON a.evenement_id = e.id
       JOIN associations ass ON e.association_id = ass.id
       LEFT JOIN creneaux c ON a.creneau_id = c.id
       LEFT JOIN taches t ON a.tache_id = t.id
       WHERE a.benevole_id = ? AND a.statut = 'valide'
       ORDER BY e.date_debut DESC`,
      [req.user.id]
    );

    res.json(rows);
  } catch (error) {
    console.error('Erreur récupération assignations:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des assignations' });
  }
});

module.exports = router;

