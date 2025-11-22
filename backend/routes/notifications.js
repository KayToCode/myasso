const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, isBenevole } = require('../middleware/auth');

// Obtenir les notifications d'un bénévole
router.get('/', authenticateToken, isBenevole, async (req, res) => {
  try {
    const { lu } = req.query; // Optionnel: true/false pour filtrer

    let query = `SELECT * FROM notifications WHERE benevole_id = ?`;
    let params = [req.user.id];

    if (lu !== undefined) {
      query += ' AND lu = ?';
      params.push(lu === 'true' || lu === true);
    }

    query += ' ORDER BY created_at DESC LIMIT 50';

    const [rows] = await db.promise().execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Erreur récupération notifications:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des notifications' });
  }
});

// Marquer une notification comme lue
router.put('/:id/lu', authenticateToken, isBenevole, async (req, res) => {
  try {
    const notificationId = req.params.id;

    // Vérifier que la notification appartient au bénévole
    const [check] = await db.promise().execute(
      'SELECT * FROM notifications WHERE id = ? AND benevole_id = ?',
      [notificationId, req.user.id]
    );

    if (check.length === 0) {
      return res.status(404).json({ error: 'Notification non trouvée ou non autorisée' });
    }

    await db.promise().execute(
      'UPDATE notifications SET lu = TRUE WHERE id = ?',
      [notificationId]
    );

    res.json({ message: 'Notification marquée comme lue' });
  } catch (error) {
    console.error('Erreur mise à jour notification:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la notification' });
  }
});

// Marquer toutes les notifications comme lues
router.put('/tout-lu', authenticateToken, isBenevole, async (req, res) => {
  try {
    await db.promise().execute(
      'UPDATE notifications SET lu = TRUE WHERE benevole_id = ? AND lu = FALSE',
      [req.user.id]
    );

    res.json({ message: 'Toutes les notifications marquées comme lues' });
  } catch (error) {
    console.error('Erreur mise à jour notifications:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour des notifications' });
  }
});

// Obtenir le nombre de notifications non lues
router.get('/non-lues/count', authenticateToken, isBenevole, async (req, res) => {
  try {
    const [rows] = await db.promise().execute(
      'SELECT COUNT(*) as count FROM notifications WHERE benevole_id = ? AND lu = FALSE',
      [req.user.id]
    );

    res.json({ count: rows[0].count });
  } catch (error) {
    console.error('Erreur comptage notifications:', error);
    res.status(500).json({ error: 'Erreur lors du comptage des notifications' });
  }
});

module.exports = router;

