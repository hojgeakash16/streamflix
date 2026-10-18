import React, { useEffect, useMemo, useState } from 'react';
import { api } from './api.js';

function AuthForm({ onAuthed }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      const data = await (mode === 'login' ? api.login(email, password) : api.register(email, password));
      localStorage.setItem('token', data.token);
      localStorage.setItem('email', data.user.email);
      onAuthed(data.user.email);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <h1 className="logo">STREAMFLIX</h1>
        <h2>{mode === 'login' ? 'Sign In' : 'Create Account'}</h2>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password (6+ characters)" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn-red">{mode === 'login' ? 'Sign In' : 'Sign Up'}</button>
        <p className="switch">
          {mode === 'login' ? 'New here? ' : 'Already a member? '}
          <a href="#" onClick={(e) => { e.preventDefault(); setMode(mode === 'login' ? 'register' : 'login'); }}>
            {mode === 'login' ? 'Sign up now' : 'Sign in'}
          </a>
        </p>
      </form>
    </div>
  );
}

function MovieCard({ movie, inList, onToggle }) {
  return (
    <div className="card" style={{ background: `linear-gradient(160deg, ${movie.poster_color}, #000)` }}>
      <div className="card-top">
        <span className="rating">★ {movie.rating}</span>
      </div>
      <div className="card-body">
        <h4>{movie.title}</h4>
        <p className="meta">{movie.release_year} · {movie.duration_min} min · {movie.genre}</p>
        <p className="desc">{movie.description}</p>
        <button className={inList ? 'btn-ghost on' : 'btn-ghost'} onClick={() => onToggle(movie.id)}>
          {inList ? '✓ In My List' : '+ My List'}
        </button>
      </div>
    </div>
  );
}

function Row({ title, movies, listIds, onToggle }) {
  if (!movies.length) return null;
  return (
    <section className="row">
      <h3>{title}</h3>
      <div className="row-scroll">
        {movies.map((m) => (
          <MovieCard key={m.id} movie={m} inList={listIds.has(m.id)} onToggle={onToggle} />
        ))}
      </div>
    </section>
  );
}

export default function App() {
  const [email, setEmail] = useState(localStorage.getItem('email'));
  const [movies, setMovies] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const listIds = useMemo(() => new Set(watchlist.map((m) => m.id)), [watchlist]);

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    setEmail(null);
    setMovies([]);
    setWatchlist([]);
  }

  useEffect(() => {
    if (!email) return;
    Promise.all([api.movies(), api.watchlist()])
      .then(([m, w]) => { setMovies(m); setWatchlist(w); })
      .catch((err) => { setError(err.message); if (/token/i.test(err.message)) logout(); });
  }, [email]);

  useEffect(() => {
    if (!email) return;
    const t = setTimeout(() => api.movies(search).then(setMovies).catch((e) => setError(e.message)), 250);
    return () => clearTimeout(t);
  }, [search, email]);

  async function toggle(id) {
    try {
      if (listIds.has(id)) await api.removeFromWatchlist(id);
      else await api.addToWatchlist(id);
      setWatchlist(await api.watchlist());
    } catch (err) {
      setError(err.message);
    }
  }

  if (!email) return <AuthForm onAuthed={setEmail} />;

  const genres = [...new Set(movies.map((m) => m.genre))];

  return (
    <>
      <header className="nav">
        <h1 className="logo">STREAMFLIX</h1>
        <input className="search" placeholder="Search titles…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="nav-right">
          <span>{email}</span>
          <button className="btn-ghost" onClick={logout}>Sign out</button>
        </div>
      </header>
      <main>
        {error && <p className="error banner">{error}</p>}
        <Row title="My List" movies={watchlist} listIds={listIds} onToggle={toggle} />
        <Row title="Top Rated" movies={movies.slice(0, 6)} listIds={listIds} onToggle={toggle} />
        {genres.map((g) => (
          <Row key={g} title={g} movies={movies.filter((m) => m.genre === g)} listIds={listIds} onToggle={toggle} />
        ))}
        {!movies.length && !error && <p className="empty">No titles found.</p>}
      </main>
    </>
  );
}
