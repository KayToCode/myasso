const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const promisePool = db.promisePool;
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_here_change_in_production';

// Inscription association
router.post('/register/association', async (req, res) => {
  try {
    const { nom, description, activites, besoins, email, password } = req.body;

    if (!nom || !email || !password) {
      return res.status(400).json({ error: 'Nom, email et mot de passe requis' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await promisePool.execute(
      'INSERT INTO associations (nom, description, activites, besoins, email, password) VALUES (?, ?, ?, ?, ?, ?)',
      [nom, description || null, activites || null, besoins || null, email, hashedPassword]
    );

    const token = jwt.sign(
      { id: result.insertId, type: 'association', email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Association créée avec succès',
      token,
      user: {
        id: result.insertId,
        nom,
        email,
        type: 'association'
      }
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }
    console.error('Erreur inscription association:', error);
    res.status(500).json({ error: 'Erreur lors de l\'inscription' });
  }
});

// Inscription bénévole
router.post('/register/benevole', async (req, res) => {
  try {
    const { nom, prenom, email, password, telephone } = req.body;

    if (!nom || !prenom || !email || !password) {
      return res.status(400).json({ error: 'Nom, prénom, email et mot de passe requis' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await promisePool.execute(
      'INSERT INTO benevoles (nom, prenom, email, password, telephone) VALUES (?, ?, ?, ?, ?)',
      [nom, prenom, email, hashedPassword, telephone || null]
    );

    const token = jwt.sign(
      { id: result.insertId, type: 'benevole', email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Compte bénévole créé avec succès',
      token,
      user: {
        id: result.insertId,
        nom,
        prenom,
        email,
        type: 'benevole'
      }
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }
    console.error('Erreur inscription bénévole:', error);
    res.status(500).json({ error: 'Erreur lors de l\'inscription' });
  }
});

// Connexion association
router.post('/login/association', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    const [rows] = await promisePool.execute(
      'SELECT * FROM associations WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const association = rows[0];
    const validPassword = await bcrypt.compare(password, association.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const token = jwt.sign(
      { id: association.id, type: 'association', email: association.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id: association.id,
        nom: association.nom,
        email: association.email,
        type: 'association'
      }
    });
  } catch (error) {
    console.error('Erreur connexion association:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
});

// Connexion bénévole
router.post('/login/benevole', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    const [rows] = await promisePool.execute(
      'SELECT * FROM benevoles WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const benevole = rows[0];
    const validPassword = await bcrypt.compare(password, benevole.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const token = jwt.sign(
      { id: benevole.id, type: 'benevole', email: benevole.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id: benevole.id,
        nom: benevole.nom,
        prenom: benevole.prenom,
        email: benevole.email,
        type: 'benevole'
      }
    });
  } catch (error) {
    console.error('Erreur connexion bénévole:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
});

module.exports = router;

