const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, isBenevole, isAssociation } = require('../middleware/auth');

// Indiquer sa disponibilité pour un créneau (bénévole uniquement)
router.post('/creneau/:id', authenticateToken, isBenevole, async (req, res) => {
  try {
    const creneauId = req.params.id;
    const { statut } = req.body; // 'disponible', 'pas_disponible', 'peut_etre'

    if (!['disponible', 'pas_disponible', 'peut_etre'].includes(statut)) {
      return res.status(400).json({ error: 'Statut invalide. Utilisez "disponible", "pas_disponible" ou "peut_etre"' });
    }

    // Vérifier que le créneau existe et que le bénévole est accepté dans l'association
    const [creneaux] = await db.promise().execute(
      `SELECT c.id, c.evenement_id, e.association_id
       FROM creneaux c
       JOIN evenements e ON c.evenement_id = e.id
       WHERE c.id = ? AND e.statut = 'publie'`,
      [creneauId]
    );

    if (creneaux.length === 0) {
      return res.status(404).json({ error: 'Créneau non trouvé ou événement non publié' });
    }

    const creneau = creneaux[0];

    // Vérifier que le bénévole est accepté dans l'association
    const [check] = await db.promise().execute(
      'SELECT * FROM benevole_associations WHERE benevole_id = ? AND association_id = ? AND statut = ?',
      [req.user.id, creneau.association_id, 'accepte']
    );

    if (check.length === 0) {
      return res.status(403).json({ error: 'Vous n\'êtes pas membre de cette association' });
    }

    // Insérer ou mettre à jour la disponibilité
    await db.promise().execute(
      `INSERT INTO disponibilites (benevole_id, evenement_id, creneau_id, statut)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE statut = ?, updated_at = CURRENT_TIMESTAMP`,
      [req.user.id, creneau.evenement_id, creneauId, statut, statut]
    );

    res.json({ message: 'Disponibilité mise à jour avec succès' });
  } catch (error) {
    console.error('Erreur mise à jour disponibilité créneau:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la disponibilité' });
  }
});

// Indiquer sa disponibilité pour une tâche (bénévole uniquement)
router.post('/tache/:id', authenticateToken, isBenevole, async (req, res) => {
  try {
    const tacheId = req.params.id;
    const { statut } = req.body; // 'disponible', 'pas_disponible', 'peut_etre'

    if (!['disponible', 'pas_disponible', 'peut_etre'].includes(statut)) {
      return res.status(400).json({ error: 'Statut invalide. Utilisez "disponible", "pas_disponible" ou "peut_etre"' });
    }

    // Vérifier que la tâche existe et que le bénévole est accepté dans l'association
    const [taches] = await db.promise().execute(
      `SELECT t.id, t.evenement_id, e.association_id
       FROM taches t
       JOIN evenements e ON t.evenement_id = e.id
       WHERE t.id = ? AND e.statut = 'publie'`,
      [tacheId]
    );

    if (taches.length === 0) {
      return res.status(404).json({ error: 'Tâche non trouvée ou événement non publié' });
    }

    const tache = taches[0];

    // Vérifier que le bénévole est accepté dans l'association
    const [check] = await db.promise().execute(
      'SELECT * FROM benevole_associations WHERE benevole_id = ? AND association_id = ? AND statut = ?',
      [req.user.id, tache.association_id, 'accepte']
    );

    if (check.length === 0) {
      return res.status(403).json({ error: 'Vous n\'êtes pas membre de cette association' });
    }

    // Insérer ou mettre à jour la disponibilité
    await db.promise().execute(
      `INSERT INTO disponibilites (benevole_id, evenement_id, tache_id, statut)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE statut = ?, updated_at = CURRENT_TIMESTAMP`,
      [req.user.id, tache.evenement_id, tacheId, statut, statut]
    );

    res.json({ message: 'Disponibilité mise à jour avec succès' });
  } catch (error) {
    console.error('Erreur mise à jour disponibilité tâche:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la disponibilité' });
  }
});

// Obtenir les disponibilités d'un événement (association uniquement)
router.get('/evenement/:id', authenticateToken, isAssociation, async (req, res) => {
  try {
    const evenementId = req.params.id;

    // Vérifier que l'événement appartient à l'association
    const [check] = await db.promise().execute(
      'SELECT * FROM evenements WHERE id = ? AND association_id = ?',
      [evenementId, req.user.id]
    );

    if (check.length === 0) {
      return res.status(404).json({ error: 'Événement non trouvé ou non autorisé' });
    }

    const evenement = check[0];

    let result = {
      evenement_id: evenementId,
      type_planification: evenement.type_planification
    };

    if (evenement.type_planification === 'creneaux') {
      // Récupérer les disponibilités par créneau
      const [disponibilites] = await db.promise().execute(
        `SELECT c.id as creneau_id, c.heure_debut, c.heure_fin, c.nombre_personnes_requises,
                d.benevole_id, d.statut,
                b.nom, b.prenom, b.email
         FROM creneaux c
         LEFT JOIN disponibilites d ON c.id = d.creneau_id
         LEFT JOIN benevoles b ON d.benevole_id = b.id
         WHERE c.evenement_id = ?
         ORDER BY c.heure_debut, d.statut, b.nom`,
        [evenementId]
      );

      // Organiser par créneau
      const creneauxMap = {};
      disponibilites.forEach(row => {
        if (!creneauxMap[row.creneau_id]) {
          creneauxMap[row.creneau_id] = {
            creneau_id: row.creneau_id,
            heure_debut: row.heure_debut,
            heure_fin: row.heure_fin,
            nombre_personnes_requises: row.nombre_personnes_requises,
            disponibilites: []
          };
        }
        if (row.benevole_id) {
          creneauxMap[row.creneau_id].disponibilites.push({
            benevole_id: row.benevole_id,
            nom: row.nom,
            prenom: row.prenom,
            email: row.email,
            statut: row.statut
          });
        }
      });

      result.creneaux = Object.values(creneauxMap);
    } else {
      // Récupérer les disponibilités par tâche
      const [disponibilites] = await db.promise().execute(
        `SELECT t.id as tache_id, t.nom as tache_nom, t.nombre_personnes_requises,
                d.benevole_id, d.statut,
                b.nom, b.prenom, b.email
         FROM taches t
         LEFT JOIN disponibilites d ON t.id = d.tache_id
         LEFT JOIN benevoles b ON d.benevole_id = b.id
         WHERE t.evenement_id = ?
         ORDER BY t.nom, d.statut, b.nom`,
        [evenementId]
      );

      // Organiser par tâche
      const tachesMap = {};
      disponibilites.forEach(row => {
        if (!tachesMap[row.tache_id]) {
          tachesMap[row.tache_id] = {
            tache_id: row.tache_id,
            tache_nom: row.tache_nom,
            nombre_personnes_requises: row.nombre_personnes_requises,
            disponibilites: []
          };
        }
        if (row.benevole_id) {
          tachesMap[row.tache_id].disponibilites.push({
            benevole_id: row.benevole_id,
            nom: row.nom,
            prenom: row.prenom,
            email: row.email,
            statut: row.statut
          });
        }
      });

      result.taches = Object.values(tachesMap);
    }

    res.json(result);
  } catch (error) {
    console.error('Erreur récupération disponibilités:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des disponibilités' });
  }
});

// Obtenir les disponibilités d'un bénévole pour un événement
router.get('/benevole/evenement/:id', authenticateToken, isBenevole, async (req, res) => {
  try {
    const evenementId = req.params.id;

    const [disponibilites] = await db.promise().execute(
      `SELECT d.*, 
              c.heure_debut, c.heure_fin,
              t.nom as tache_nom
       FROM disponibilites d
       LEFT JOIN creneaux c ON d.creneau_id = c.id
       LEFT JOIN taches t ON d.tache_id = t.id
       WHERE d.benevole_id = ? AND d.evenement_id = ?`,
      [req.user.id, evenementId]
    );

    res.json(disponibilites);
  } catch (error) {
    console.error('Erreur récupération disponibilités bénévole:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des disponibilités' });
  }
});

module.exports = router;

