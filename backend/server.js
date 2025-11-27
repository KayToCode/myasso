require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./config/database');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
const authRoutes = require('./routes/auth');
const associationRoutes = require('./routes/associations');
const benevoleRoutes = require('./routes/benevoles');
const evenementRoutes = require('./routes/evenements');
const disponibiliteRoutes = require('./routes/disponibilites');
const assignationRoutes = require('./routes/assignations');
const notificationRoutes = require('./routes/notifications');
const annonceRoutes = require('./routes/annonces');

app.use('/api/auth', authRoutes);
app.use('/api/associations', associationRoutes);
app.use('/api/benevoles', benevoleRoutes);
app.use('/api/evenements', evenementRoutes);
app.use('/api/disponibilites', disponibiliteRoutes);
app.use('/api/assignations', assignationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/annonces', annonceRoutes);

// Test route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API is running' });
});

// Servir les fichiers statiques du frontend
const path = require('path');
app.use(express.static(path.join(__dirname, '../frontend')));

// Route pour servir index.html pour toutes les routes frontend (doit être en dernier)
app.get('*', (req, res) => {
  // Ne servir index.html que si ce n'est pas une route API
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  }
});

// Test database connection
db.getConnection((err, connection) => {
  if (err) {
    console.error('Erreur de connexion à la base de données:', err);
  } else {
    console.log('Connexion à MySQL réussie!');
    connection.release();
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});

module.exports = app;

