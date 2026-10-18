CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS movies (
  id           SERIAL PRIMARY KEY,
  title        VARCHAR(200) UNIQUE NOT NULL,
  description  TEXT NOT NULL,
  genre        VARCHAR(50) NOT NULL,
  release_year INT NOT NULL,
  rating       NUMERIC(2,1) NOT NULL,
  duration_min INT NOT NULL,
  poster_color VARCHAR(30) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_movies_genre ON movies (genre);

CREATE TABLE IF NOT EXISTS watchlist (
  user_id  INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  movie_id INT NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, movie_id)
);
