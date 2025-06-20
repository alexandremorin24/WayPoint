-- 📄 Schéma de la base de données – WayPoint Map Builder (MVP)
--
-- ⚡️ Initialisation (FR)
--
-- Pour initialiser la base principale :
--   ./backend/scripts/init-db.sh
--
-- Pour initialiser la base de test :
--   WAYPOINT_DB_NAME=waypoint_test_db ./backend/scripts/init-db.sh
--
-- Le SQL ci-dessous s'applique à la base sélectionnée. Pas besoin de CREATE DATABASE ou USE.

-- 🧑‍💼 Utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  photo_url TEXT,
  auth_provider VARCHAR(50) NOT NULL CHECK (auth_provider IN ('google', 'local')),
  password_hash VARCHAR(255), -- NULL pour auth Google
  email_verified BOOLEAN DEFAULT FALSE,
  last_login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  preferred_language VARCHAR(5) DEFAULT 'en',
  email_optin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 🔑 Jetons de réinitialisation de mot de passe
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 🎮 Jeux
CREATE TABLE IF NOT EXISTS games (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255),
  cover_url TEXT,
  release_date DATE,
  genres TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 🗺️ Cartes
CREATE TABLE IF NOT EXISTS maps (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255),
  description TEXT,
  image_url TEXT,
  thumbnail_url TEXT,
  image_width INT,
  image_height INT,
  is_public BOOLEAN DEFAULT FALSE,
  owner_id CHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  game_id VARCHAR(255),
  FOREIGN KEY (owner_id) REFERENCES users(id),
  FOREIGN KEY (game_id) REFERENCES games(id)
);

-- 🗂️ Catégories
CREATE TABLE IF NOT EXISTS categories (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  map_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  color VARCHAR(7) DEFAULT '#3498db', -- Bleu par défaut
  icon VARCHAR(255) DEFAULT 'map-marker', -- Icône de marqueur par défaut
  parent_category_id CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (map_id) REFERENCES maps(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- 📌 Points d'intérêt (POI)
CREATE TABLE IF NOT EXISTS pois (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  map_id CHAR(36) NOT NULL,
  name VARCHAR(255),
  description TEXT,
  x FLOAT,
  y FLOAT,
  image_url TEXT,
  category_id CHAR(36),
  creator_id CHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (map_id) REFERENCES maps(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (creator_id) REFERENCES users(id)
);

-- 👥 Rôles d'accès aux cartes
CREATE TABLE IF NOT EXISTS map_user_roles (
  map_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (
    role IN (
      'viewer',
      'banned',
      'editor_all',
      'editor_own',
      'contributor'
    )
  ),
  PRIMARY KEY (map_id, user_id),
  FOREIGN KEY (map_id) REFERENCES maps(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 🧮 Statistiques utilisateur POI
CREATE TABLE IF NOT EXISTS poi_user_stats (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  map_id CHAR(36) NOT NULL,
  poi_created_count INT DEFAULT 0,
  poi_updated_count INT DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (map_id) REFERENCES maps(id) ON DELETE CASCADE
);

-- 🕒 Logs des POI
CREATE TABLE IF NOT EXISTS poi_logs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  poi_id CHAR(36) NOT NULL,
  map_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  action VARCHAR(50) CHECK (action IN ('create', 'update')),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  payload JSON,
  FOREIGN KEY (poi_id) REFERENCES pois(id) ON DELETE CASCADE,
  FOREIGN KEY (map_id) REFERENCES maps(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 👍 Votes des cartes
CREATE TABLE IF NOT EXISTS map_votes (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  map_id CHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (map_id) REFERENCES maps(id) ON DELETE CASCADE,
  UNIQUE (user_id, map_id)
);

-- 📈 Index performances
CREATE INDEX idx_maps_owner ON maps(owner_id);
CREATE INDEX idx_maps_public_created ON maps(is_public, created_at);
CREATE INDEX idx_pois_map ON pois(map_id);
CREATE INDEX idx_pois_category ON pois(category_id);
CREATE INDEX idx_map_user_roles_user ON map_user_roles(user_id);
CREATE INDEX idx_map_user_roles_map ON map_user_roles(map_id);
CREATE INDEX idx_map_user_roles_role ON map_user_roles(role);
CREATE INDEX idx_categories_map ON categories(map_id);
CREATE INDEX idx_poi_logs_poi ON poi_logs(poi_id);
CREATE INDEX idx_poi_logs_user ON poi_logs(user_id);
CREATE INDEX idx_poi_user_stats_user ON poi_user_stats(user_id);
CREATE INDEX idx_map_votes_map_user ON map_votes(map_id, user_id);

-- Exemple de requête de pagination pour les cartes publiques :
-- SELECT * FROM maps WHERE is_public = true ORDER BY created_at DESC LIMIT 20 OFFSET 0;

```
