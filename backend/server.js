const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'streamflix',
  password: process.env.DB_PASSWORD || 'streamflix',
  database: process.env.DB_NAME || 'streamflix',
  // RDS needs SSL; local Docker Postgres does not.
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

const app = express();
app.use(cors());
app.use(express.json());

// ---------- helpers ----------
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

const signToken = (user) =>
  jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

// ---------- health (used by the load balancer) ----------
app.get('/api/health', wrap(async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ status: 'ok' });
}));

// ---------- auth ----------
app.post('/api/auth/register', wrap(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password || password.length < 6) {
    return res.status(400).json({ error: 'Email and a password of 6+ characters are required' });
  }
  const hash = await bcrypt.hash(password, 10);
  try {
    const { rows } = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [email.toLowerCase(), hash]
    );
    res.status(201).json({ token: signToken(rows[0]), user: rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already registered' });
    throw err;
  }
}));

app.post('/api/auth/login', wrap(async (req, res) => {
  const { email, password } = req.body || {};
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [(email || '').toLowerCase()]);
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password || '', user.password_hash))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  res.json({ token: signToken(user), user: { id: user.id, email: user.email } });
}));

// ---------- movies ----------
app.get('/api/movies', wrap(async (req, res) => {
  const { genre, q } = req.query;
  const where = [];
  const params = [];
  if (genre) { params.push(genre); where.push(`genre = $${params.length}`); }
  if (q) { params.push(`%${q}%`); where.push(`title ILIKE $${params.length}`); }
  const sql = `SELECT * FROM movies ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY rating DESC, title`;
  const { rows } = await pool.query(sql, params);
  res.json(rows);
}));

app.get('/api/movies/:id', wrap(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM movies WHERE id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Movie not found' });
  res.json(rows[0]);
}));

// ---------- watchlist ----------
app.get('/api/watchlist', auth, wrap(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT m.* FROM watchlist w JOIN movies m ON m.id = w.movie_id
     WHERE w.user_id = $1 ORDER BY w.added_at DESC`,
    [req.user.id]
  );
  res.json(rows);
}));

app.post('/api/watchlist/:movieId', auth, wrap(async (req, res) => {
  await pool.query(
    'INSERT INTO watchlist (user_id, movie_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [req.user.id, req.params.movieId]
  );
  res.status(201).json({ ok: true });
}));

app.delete('/api/watchlist/:movieId', auth, wrap(async (req, res) => {
  await pool.query('DELETE FROM watchlist WHERE user_id = $1 AND movie_id = $2', [req.user.id, req.params.movieId]);
  res.json({ ok: true });
}));

// ---------- errors ----------
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// ---------- startup: create tables + seed (idempotent), retry until DB is up ----------
async function initDb(retries = 20) {
  for (let i = 1; i <= retries; i++) {
    try {
      await pool.query(fs.readFileSync(path.join(__dirname, 'db', 'schema.sql'), 'utf8'));
      await pool.query(fs.readFileSync(path.join(__dirname, 'db', 'seed.sql'), 'utf8'));
      console.log('Database ready');
      return;
    } catch (err) {
      console.log(`Waiting for database (${i}/${retries}): ${err.message}`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  throw new Error('Database never became ready');
}

initDb()
  .then(() => app.listen(PORT, () => console.log(`StreamFlix API listening on ${PORT}`)))
  .catch((err) => { console.error(err); process.exit(1); });
