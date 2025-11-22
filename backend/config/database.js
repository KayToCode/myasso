const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'myasso',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const promisePool = pool.promise();

// Créer un wrapper qui expose les méthodes du pool + promise()
const db = {
  // Exposer toutes les méthodes du pool
  getConnection: pool.getConnection.bind(pool),
  query: pool.query.bind(pool),
  execute: pool.execute.bind(pool),
  end: pool.end.bind(pool),
  // Méthode promise() qui retourne le promisePool
  promise: function() {
    return promisePool;
  },
  // Accès direct au promisePool
  promisePool: promisePool
};

// Exporter db et promisePool séparément pour compatibilité
module.exports = db;
module.exports.promisePool = promisePool;

