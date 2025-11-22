const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, isAssociation, isBenevole } = require('../middleware/auth');

// Créer un événement (association uniquement)
router.post('/', authenticateToken, isAssociation, async (req, res) => {
  try {
    const { titre, description, date_debut, date_fin, type_planification, creneaux, taches } = req.body;

    if (!titre || !date_debut || !date_fin || !type_planification) {
      return res.status(400).json({ error: 'Titre, dates et type de planification requis' });
    }

    if (!['creneaux', 'taches'].includes(type_planification)) {
      return res.status(400).json({ error: 'Type de planification invalide (creneaux ou taches)' });
    }

    if (type_planification === 'creneaux' && (!creneaux || creneaux.length === 0)) {
      return res.status(400).json({ error: 'Au moins un créneau requis' });
    }

    if (type_planification === 'taches' && (!taches || taches.length === 0)) {
      return res.status(400).json({ error: 'Au moins une tâche requise' });
    }

    const connection = await db.promise().getConnection();
    await connection.beginTransaction();

    try {
      // Créer l'événement
      const [result] = await connection.execute(
        'INSERT INTO evenements (association_id, titre, description, date_debut, date_fin, type_planification, statut) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [req.user.id, titre, description || null, date_debut, date_fin, type_planification, 'brouillon']
      );

      const evenementId = result.insertId;

      // Créer les créneaux si nécessaire
      if (type_planification === 'creneaux') {
        for (const creneau of creneaux) {
          await connection.execute(
            'INSERT INTO creneaux (evenement_id, heure_debut, heure_fin, nombre_personnes_requises, description) VALUES (?, ?, ?, ?, ?)',
            [evenementId, creneau.heure_debut, creneau.heure_fin, creneau.nombre_personnes_requises || 1, creneau.description || null]
          );
        }
      }

      // Créer les tâches si nécessaire
      if (type_planification === 'taches') {
        for (const tache of taches) {
          await connection.execute(
            'INSERT INTO taches (evenement_id, nom, description, nombre_personnes_requises) VALUES (?, ?, ?, ?)',
            [evenementId, tache.nom, tache.description || null, tache.nombre_personnes_requises || 1]
          );
        }
      }

      await connection.commit();
      res.status(201).json({ message: 'Événement créé avec succès', id: evenementId });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Erreur création événement:', error);
    res.status(500).json({ error: 'Erreur lors de la création de l\'événement' });
  }
});

// Lister les événements d'une association
router.get('/association/:id', async (req, res) => {
  try {
    const { statut } = req.query; // Optionnel: 'brouillon', 'publie', 'termine'

    let query = `SELECT e.*, a.nom as association_nom 
                 FROM evenements e 
                 JOIN associations a ON e.association_id = a.id 
                 WHERE e.association_id = ?`;
    let params = [req.params.id];

    if (statut) {
      query += ' AND e.statut = ?';
      params.push(statut);
    }

    query += ' ORDER BY e.date_debut DESC';

    const [rows] = await db.promise().execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Erreur récupération événements:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des événements' });
  }
});

// Obtenir un événement avec ses créneaux/tâches
router.get('/:id', async (req, res) => {
  try {
    // Récupérer l'événement
    const [events] = await db.promise().execute(
      `SELECT e.*, a.nom as association_nom, a.description as association_description
       FROM evenements e
       JOIN associations a ON e.association_id = a.id
       WHERE e.id = ?`,
      [req.params.id]
    );

    if (events.length === 0) {
      return res.status(404).json({ error: 'Événement non trouvé' });
    }

    const evenement = events[0];

    // Récupérer les créneaux
    const [creneaux] = await db.promise().execute(
      'SELECT * FROM creneaux WHERE evenement_id = ? ORDER BY heure_debut',
      [req.params.id]
    );

    // Récupérer les tâches
    const [taches] = await db.promise().execute(
      'SELECT * FROM taches WHERE evenement_id = ? ORDER BY nom',
      [req.params.id]
    );

    evenement.creneaux = creneaux;
    evenement.taches = taches;

    res.json(evenement);
  } catch (error) {
    console.error('Erreur récupération événement:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'événement' });
  }
});

// Mettre à jour un événement
router.put('/:id', authenticateToken, isAssociation, async (req, res) => {
  try {
    const { titre, description, date_debut, date_fin, statut } = req.body;

    // Vérifier que l'événement appartient à l'association
    const [check] = await db.promise().execute(
      'SELECT id FROM evenements WHERE id = ? AND association_id = ?',
      [req.params.id, req.user.id]
    );

    if (check.length === 0) {
      return res.status(404).json({ error: 'Événement non trouvé ou non autorisé' });
    }

    const updates = [];
    const values = [];

    if (titre) {
      updates.push('titre = ?');
      values.push(titre);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (date_debut) {
      updates.push('date_debut = ?');
      values.push(date_debut);
    }
    if (date_fin) {
      updates.push('date_fin = ?');
      values.push(date_fin);
    }
    if (statut) {
      updates.push('statut = ?');
      values.push(statut);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Aucune modification à effectuer' });
    }

    values.push(req.params.id);

    await db.promise().execute(
      `UPDATE evenements SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    res.json({ message: 'Événement mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur mise à jour événement:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'événement' });
  }
});

// Lister les événements publics disponibles pour les bénévoles
router.get('/public/disponibles', async (req, res) => {
  try {
    const [rows] = await db.promise().execute(
      `SELECT e.id, e.titre, e.description, e.date_debut, e.date_fin, e.type_planification,
              a.id as association_id, a.nom as association_nom
       FROM evenements e
       JOIN associations a ON e.association_id = a.id
       WHERE e.statut = 'publie' AND e.date_debut >= NOW()
       ORDER BY e.date_debut ASC`,
      []
    );

    res.json(rows);
  } catch (error) {
    console.error('Erreur récupération événements publics:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des événements' });
  }
});

// Obtenir les événements où le bénévole est accepté (associations)
router.get('/benevole/mes-associations', authenticateToken, isBenevole, async (req, res) => {
  try {
    const [rows] = await db.promise().execute(
      `SELECT DISTINCT e.*, a.nom as association_nom
       FROM evenements e
       JOIN associations a ON e.association_id = a.id
       JOIN benevole_associations ba ON a.id = ba.association_id
       WHERE ba.benevole_id = ? AND ba.statut = 'accepte' AND e.statut = 'publie' AND e.date_debut >= NOW()
       ORDER BY e.date_debut ASC`,
      [req.user.id]
    );

    res.json(rows);
  } catch (error) {
    console.error('Erreur récupération événements bénévole:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des événements' });
  }
});

module.exports = router;

