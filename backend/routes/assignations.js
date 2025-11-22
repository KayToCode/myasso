const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, isAssociation } = require('../middleware/auth');
const assignationService = require('../services/assignationService');

// Générer une proposition d'assignation automatique
router.post('/auto/:evenement_id', authenticateToken, isAssociation, async (req, res) => {
  try {
    const evenementId = req.params.evenement_id;

    // Vérifier que l'événement appartient à l'association
    const [check] = await db.promise().execute(
      'SELECT * FROM evenements WHERE id = ? AND association_id = ?',
      [evenementId, req.user.id]
    );

    if (check.length === 0) {
      return res.status(404).json({ error: 'Événement non trouvé ou non autorisé' });
    }

    const evenement = check[0];

    // Générer les assignations automatiques
    const assignations = await assignationService.genererAssignationsAutomatiques(evenementId);

    // Sauvegarder les assignations proposées
    const connection = await db.promise().getConnection();
    await connection.beginTransaction();

    try {
      // Supprimer les anciennes assignations proposées pour cet événement
      await connection.execute(
        'DELETE FROM assignations WHERE evenement_id = ? AND statut = ?',
        [evenementId, 'propose']
      );

      // Insérer les nouvelles assignations
      for (const assignation of assignations) {
        await connection.execute(
          `INSERT INTO assignations (benevole_id, evenement_id, creneau_id, tache_id, statut)
           VALUES (?, ?, ?, ?, ?)`,
          [
            assignation.benevole_id,
            evenementId,
            assignation.creneau_id || null,
            assignation.tache_id || null,
            'propose'
          ]
        );
      }

      await connection.commit();

      res.json({
        message: 'Proposition d\'assignation générée avec succès',
        assignations: assignations.length,
        details: assignations
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Erreur génération assignations:', error);
    res.status(500).json({ error: 'Erreur lors de la génération des assignations' });
  }
});

// Obtenir les assignations proposées d'un événement
router.get('/propose/:evenement_id', authenticateToken, isAssociation, async (req, res) => {
  try {
    const evenementId = req.params.evenement_id;

    // Vérifier que l'événement appartient à l'association
    const [check] = await db.promise().execute(
      'SELECT * FROM evenements WHERE id = ? AND association_id = ?',
      [evenementId, req.user.id]
    );

    if (check.length === 0) {
      return res.status(404).json({ error: 'Événement non trouvé ou non autorisé' });
    }

    const [assignations] = await db.promise().execute(
      `SELECT a.*, 
              b.nom, b.prenom, b.email,
              c.heure_debut, c.heure_fin,
              t.nom as tache_nom
       FROM assignations a
       JOIN benevoles b ON a.benevole_id = b.id
       LEFT JOIN creneaux c ON a.creneau_id = c.id
       LEFT JOIN taches t ON a.tache_id = t.id
       WHERE a.evenement_id = ? AND a.statut = ?
       ORDER BY c.heure_debut, t.nom, b.nom`,
      [evenementId, 'propose']
    );

    res.json(assignations);
  } catch (error) {
    console.error('Erreur récupération assignations:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des assignations' });
  }
});

// Valider une assignation (changer de 'propose' à 'valide')
router.put('/valider/:id', authenticateToken, isAssociation, async (req, res) => {
  try {
    const assignationId = req.params.id;

    // Vérifier que l'assignation appartient à un événement de l'association
    const [check] = await db.promise().execute(
      `SELECT a.* FROM assignations a
       JOIN evenements e ON a.evenement_id = e.id
       WHERE a.id = ? AND e.association_id = ?`,
      [assignationId, req.user.id]
    );

    if (check.length === 0) {
      return res.status(404).json({ error: 'Assignation non trouvée ou non autorisée' });
    }

    await db.promise().execute(
      'UPDATE assignations SET statut = ? WHERE id = ?',
      ['valide', assignationId]
    );

    // Créer une notification pour le bénévole
    const assignation = check[0];
    const [creneau] = assignation.creneau_id 
      ? await db.promise().execute('SELECT heure_debut, heure_fin FROM creneaux WHERE id = ?', [assignation.creneau_id])
      : [null];
    const [tache] = assignation.tache_id
      ? await db.promise().execute('SELECT nom FROM taches WHERE id = ?', [assignation.tache_id])
      : [null];
    const [evenement] = await db.promise().execute('SELECT titre FROM evenements WHERE id = ?', [assignation.evenement_id]);

    let message = `Vous avez été assigné(e) pour l'événement "${evenement[0].titre}". `;
    if (creneau && creneau.length > 0) {
      message += `Créneau: ${creneau[0].heure_debut} - ${creneau[0].heure_fin}.`;
    } else if (tache && tache.length > 0) {
      message += `Tâche: ${tache[0].nom}.`;
    }

    await db.promise().execute(
      `INSERT INTO notifications (benevole_id, type, titre, message, assignation_id, evenement_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [assignation.benevole_id, 'assignation', 'Nouvelle assignation', message, assignationId, assignation.evenement_id]
    );

    res.json({ message: 'Assignation validée avec succès, notification envoyée' });
  } catch (error) {
    console.error('Erreur validation assignation:', error);
    res.status(500).json({ error: 'Erreur lors de la validation de l\'assignation' });
  }
});

// Valider toutes les assignations proposées d'un événement
router.post('/valider-tout/:evenement_id', authenticateToken, isAssociation, async (req, res) => {
  try {
    const evenementId = req.params.evenement_id;

    // Vérifier que l'événement appartient à l'association
    const [check] = await db.promise().execute(
      'SELECT * FROM evenements WHERE id = ? AND association_id = ?',
      [evenementId, req.user.id]
    );

    if (check.length === 0) {
      return res.status(404).json({ error: 'Événement non trouvé ou non autorisé' });
    }

    const connection = await db.promise().getConnection();
    await connection.beginTransaction();

    try {
      // Récupérer les assignations proposées
      const [assignations] = await connection.execute(
        `SELECT a.*, 
                c.heure_debut, c.heure_fin,
                t.nom as tache_nom,
                e.titre as evenement_titre
         FROM assignations a
         LEFT JOIN creneaux c ON a.creneau_id = c.id
         LEFT JOIN taches t ON a.tache_id = t.id
         JOIN evenements e ON a.evenement_id = e.id
         WHERE a.evenement_id = ? AND a.statut = ?`,
        [evenementId, 'propose']
      );

      // Valider toutes les assignations
      await connection.execute(
        'UPDATE assignations SET statut = ? WHERE evenement_id = ? AND statut = ?',
        ['valide', evenementId, 'propose']
      );

      // Créer les notifications
      for (const assignation of assignations) {
        let message = `Vous avez été assigné(e) pour l'événement "${assignation.evenement_titre}". `;
        if (assignation.heure_debut) {
          message += `Créneau: ${assignation.heure_debut} - ${assignation.heure_fin}.`;
        } else if (assignation.tache_nom) {
          message += `Tâche: ${assignation.tache_nom}.`;
        }

        await connection.execute(
          `INSERT INTO notifications (benevole_id, type, titre, message, assignation_id, evenement_id)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [assignation.benevole_id, 'assignation', 'Nouvelle assignation', message, assignation.id, evenementId]
        );
      }

      await connection.commit();

      res.json({
        message: `${assignations.length} assignation(s) validée(s) avec succès, notifications envoyées`
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Erreur validation assignations:', error);
    res.status(500).json({ error: 'Erreur lors de la validation des assignations' });
  }
});

// Refuser/Supprimer une assignation proposée
router.delete('/:id', authenticateToken, isAssociation, async (req, res) => {
  try {
    const assignationId = req.params.id;

    // Vérifier que l'assignation appartient à un événement de l'association
    const [check] = await db.promise().execute(
      `SELECT * FROM assignations a
       JOIN evenements e ON a.evenement_id = e.id
       WHERE a.id = ? AND e.association_id = ? AND a.statut = ?`,
      [assignationId, req.user.id, 'propose']
    );

    if (check.length === 0) {
      return res.status(404).json({ error: 'Assignation non trouvée ou non autorisée' });
    }

    await db.promise().execute('DELETE FROM assignations WHERE id = ?', [assignationId]);

    res.json({ message: 'Assignation supprimée avec succès' });
  } catch (error) {
    console.error('Erreur suppression assignation:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'assignation' });
  }
});

// Créer une assignation manuelle
router.post('/manuelle', authenticateToken, isAssociation, async (req, res) => {
  try {
    const { benevole_id, evenement_id, creneau_id, tache_id } = req.body;

    if (!benevole_id || !evenement_id || (!creneau_id && !tache_id)) {
      return res.status(400).json({ error: 'Bénévole, événement et créneau OU tâche requis' });
    }

    // Vérifier que l'événement appartient à l'association
    const [check] = await db.promise().execute(
      'SELECT * FROM evenements WHERE id = ? AND association_id = ?',
      [evenement_id, req.user.id]
    );

    if (check.length === 0) {
      return res.status(404).json({ error: 'Événement non trouvé ou non autorisé' });
    }

    // Vérifier que le bénévole est accepté
    const [checkBenevole] = await db.promise().execute(
      'SELECT * FROM benevole_associations WHERE benevole_id = ? AND association_id = ? AND statut = ?',
      [benevole_id, req.user.id, 'accepte']
    );

    if (checkBenevole.length === 0) {
      return res.status(400).json({ error: 'Le bénévole n\'est pas membre de cette association' });
    }

    await db.promise().execute(
      `INSERT INTO assignations (benevole_id, evenement_id, creneau_id, tache_id, statut)
       VALUES (?, ?, ?, ?, ?)`,
      [benevole_id, evenement_id, creneau_id || null, tache_id || null, 'propose']
    );

    res.status(201).json({ message: 'Assignation créée avec succès' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Assignation déjà existante' });
    }
    console.error('Erreur création assignation:', error);
    res.status(500).json({ error: 'Erreur lors de la création de l\'assignation' });
  }
});

module.exports = router;

