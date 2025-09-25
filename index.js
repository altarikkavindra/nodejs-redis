const express = require('express');
const mysql = require('mysql2');
const redis = require('redis');

const app = express();
const port = 3000;

// MySQL connection
const db = mysql.createConnection({
  host: 'db',
  user: 'user',
  password: '123',
  database: 'testdb'
});

// Redis connection
const cache = redis.createClient({ url: 'redis://redis:6379' });

(async () => {
  try {
    await cache.connect();
    console.log('Redis connected');
  } catch (err) {
    console.error('Redis error:', err.message);
  }
})();

// Retry MySQL connection
const connectWithRetry = () => {
  db.connect(err => {
    if (err) {
      console.error('Koneksi gagal, coba lagi 5 detik...', err.message);
      setTimeout(connectWithRetry, 5000);
    } else {
      console.log('Terhubung ke MySQL!');
    }
  });
};
connectWithRetry();

// Route default
app.get('/', (req, res) => {
  res.send('hai des');
});

// Endpoint /users
app.get('/users', async (req, res) => {
  try {
    const cached = await cache.get('users');
    if (cached) return res.send(JSON.parse(cached));

    db.query('SELECT * FROM users', async (err, results) => {
      if (err) return res.status(500).send(err);
      await cache.set('users', JSON.stringify(results), { EX: 60 });
      res.send(results);
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.listen(port, () => console.log(`Server jalan di http://localhost:${port}`));
