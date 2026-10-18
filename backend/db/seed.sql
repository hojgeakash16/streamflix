INSERT INTO movies (title, description, genre, release_year, rating, duration_min, poster_color) VALUES
('Midnight Circuit',     'A rogue engineer races across a neon city to stop a blackout that could erase everyone''s memories.', 'Sci-Fi',   2024, 8.1, 118, '#1e3a8a'),
('The Last Lighthouse',  'A keeper on a remote island discovers the lamp he tends is guiding something far older than ships.', 'Thriller', 2023, 7.6, 109, '#0f766e'),
('Saffron Skies',        'Two rival chefs are forced to share one food truck on a road trip across Rajasthan.',                'Comedy',   2025, 7.4, 102, '#b45309'),
('Orbit of Ash',         'After Earth''s last launch window closes, a crew of five must decide who gets left behind.',        'Sci-Fi',   2022, 8.4, 134, '#7c3aed'),
('Paper Tigers',         'A retired detective takes one final case: a forger who signs every crime scene in origami.',        'Thriller', 2021, 7.9, 121, '#be123c'),
('Monsoon Letters',      'Decades of unsent letters reunite a family during one very long rainy season.',                     'Drama',    2024, 8.0, 126, '#0369a1'),
('Laugh Track',          'A failing stand-up comic discovers his every joke now plays on a live studio audience only he can hear.', 'Comedy', 2023, 7.1, 96, '#c2410c'),
('The Quiet Harvest',    'A drought-struck village stakes everything on one impossible crop.',                                'Drama',    2022, 8.3, 138, '#4d7c0f'),
('Glass Horizon',        'A climber and a satellite engineer uncover the same secret from opposite ends of the planet.',      'Adventure',2025, 7.8, 115, '#0e7490'),
('Echoes of Jaipur',     'A street photographer finds a camera that photographs the city as it was a century ago.',           'Adventure',2024, 7.7, 112, '#a21caf'),
('Dead Air',             'A late-night radio host realizes a caller is predicting tomorrow''s headlines.',                    'Thriller', 2025, 7.5, 104, '#334155'),
('Starlight Dhaba',      'A highway diner becomes the unlikely meeting point for a galaxy''s worth of travellers.',           'Sci-Fi',   2023, 7.2, 108, '#db2777')
ON CONFLICT (title) DO NOTHING;
