const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_here_change_in_production';

// Middleware pour vérifier le token JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Token d\'authentification manquant' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token invalide' });
    }
    req.user = user;
    next();
  });
};

// Middleware pour vérifier si l'utilisateur est une association
const isAssociation = (req, res, next) => {
  if (req.user.type !== 'association') {
    return res.status(403).json({ error: 'Accès réservé aux associations' });
  }
  next();
};

// Middleware pour vérifier si l'utilisateur est un bénévole
const isBenevole = (req, res, next) => {
  if (req.user.type !== 'benevole') {
    return res.status(403).json({ error: 'Accès réservé aux bénévoles' });
  }
  next();
};

module.exports = {
  authenticateToken,
  isAssociation,
  isBenevole
};

