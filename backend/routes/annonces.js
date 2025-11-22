const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, isAssociation, isBenevole } = require('../middleware/auth');

// Créer une annonce (association uniquement)
router.post('/', authenticateToken, isAssociation, async (req, res) => {
  try {
    const { titre, contenu } = req.body;

    if (!titre || !contenu) {
      return res.status(400).json({ error: 'Titre et contenu requis' });
    }

    const [result] = await db.promise().execute(
      'INSERT INTO annonces (association_id, titre, contenu) VALUES (?, ?, ?)',
      [req.user.id, titre, contenu]
    );

    // Créer des notifications pour tous les bénévoles acceptés
    const [benevoles] = await db.promise().execute(
      'SELECT benevole_id FROM benevole_associations WHERE association_id = ? AND statut = ?',
      [req.user.id, 'accepte']
    );

    for (const benevole of benevoles) {
      await db.promise().execute(
        `INSERT INTO notifications (benevole_id, type, titre, message, evenement_id)
         VALUES (?, ?, ?, ?, NULL)`,
        [benevole.benevole_id, 'nouvelle_annonce', `Nouvelle annonce: ${titre}`, contenu]
      );
    }

    res.status(201).json({ message: 'Annonce créée avec succès', id: result.insertId });
  } catch (error) {
    console.error('Erreur création annonce:', error);
    res.status(500).json({ error: 'Erreur lors de la création de l\'annonce' });
  }
});

// Obtenir les annonces d'une association (public)
router.get('/association/:id', async (req, res) => {
  try {
    const [rows] = await db.promise().execute(
      'SELECT * FROM annonces WHERE association_id = ? ORDER BY created_at DESC LIMIT 20',
      [req.params.id]
    );

    res.json(rows);
  } catch (error) {
    console.error('Erreur récupération annonces:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des annonces' });
  }
});

// Obtenir les annonces pour un bénévole (associations où il est accepté)
router.get('/benevole/mes-associations', authenticateToken, isBenevole, async (req, res) => {
  try {
    const [rows] = await db.promise().execute(
      `SELECT a.*, ass.nom as association_nom
       FROM annonces a
       JOIN associations ass ON a.association_id = ass.id
       JOIN benevole_associations ba ON ass.id = ba.association_id
       WHERE ba.benevole_id = ? AND ba.statut = 'accepte'
       ORDER BY a.created_at DESC LIMIT 50`,
      [req.user.id]
    );

    res.json(rows);
  } catch (error) {
    console.error('Erreur récupération annonces bénévole:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des annonces' });
  }
});

// Mettre à jour une annonce
router.put('/:id', authenticateToken, isAssociation, async (req, res) => {
  try {
    const { titre, contenu } = req.body;

    // Vérifier que l'annonce appartient à l'association
    const [check] = await db.promise().execute(
      'SELECT * FROM annonces WHERE id = ? AND association_id = ?',
      [req.params.id, req.user.id]
    );

    if (check.length === 0) {
      return res.status(404).json({ error: 'Annonce non trouvée ou non autorisée' });
    }

    await db.promise().execute(
      'UPDATE annonces SET titre = ?, contenu = ? WHERE id = ?',
      [titre, contenu, req.params.id]
    );

    res.json({ message: 'Annonce mise à jour avec succès' });
  } catch (error) {
    console.error('Erreur mise à jour annonce:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'annonce' });
  }
});

// Supprimer une annonce
router.delete('/:id', authenticateToken, isAssociation, async (req, res) => {
  try {
    // Vérifier que l'annonce appartient à l'association
    const [check] = await db.promise().execute(
      'SELECT * FROM annonces WHERE id = ? AND association_id = ?',
      [req.params.id, req.user.id]
    );

    if (check.length === 0) {
      return res.status(404).json({ error: 'Annonce non trouvée ou non autorisée' });
    }

    await db.promise().execute('DELETE FROM annonces WHERE id = ?', [req.params.id]);

    res.json({ message: 'Annonce supprimée avec succès' });
  } catch (error) {
    console.error('Erreur suppression annonce:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'annonce' });
  }
});

module.exports = router;

