```sql
-- 📄 Schéma de la base de données – WayPoint Map Builder (MVP)

-- 🧑‍💼 Utilisateurs
CREATE TABLE users (
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

-- 🗺️ Cartes
CREATE TABLE maps (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255),
  description TEXT,
  image_url TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  owner_id CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- 📌 Points d'intérêt (POI)
CREATE TABLE pois (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  map_id CHAR(36) NOT NULL,
  name VARCHAR(255),
  description TEXT,
  x FLOAT,
  y FLOAT,
  icon VARCHAR(255),
  image_url TEXT,
  category_id CHAR(36),
  FOREIGN KEY (map_id) REFERENCES maps(id),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- 🗂️ Catégories
CREATE TABLE categories (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  map_id CHAR(36) NOT NULL,
  name VARCHAR(255),
  icon VARCHAR(255),
  parent_category_id CHAR(36),
  FOREIGN KEY (map_id) REFERENCES maps(id),
  FOREIGN KEY (parent_category_id) REFERENCES categories(id)
);

-- 👥 Collaborations
CREATE TABLE collaborations (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  map_id CHAR(36) NOT NULL,
  role VARCHAR(50) CHECK (role IN ('editor', 'viewer')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (map_id) REFERENCES maps(id)
);

-- 🧮 Statistiques utilisateur POI
CREATE TABLE poi_user_stats (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  map_id CHAR(36) NOT NULL,
  poi_created_count INT DEFAULT 0,
  poi_updated_count INT DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (map_id) REFERENCES maps(id)
);

-- 🕒 Logs des POI
CREATE TABLE poi_logs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  poi_id CHAR(36) NOT NULL,
  map_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  action VARCHAR(50) CHECK (action IN ('create', 'update')),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  payload JSON,
  FOREIGN KEY (poi_id) REFERENCES pois(id),
  FOREIGN KEY (map_id) REFERENCES maps(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 👍 Votes des cartes
CREATE TABLE map_votes (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  map_id CHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (map_id) REFERENCES maps(id),
  UNIQUE (user_id, map_id)
);

CREATE TABLE games (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255),
  cover_url TEXT,
  release_date DATE,
  genres TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE maps ADD COLUMN game_id VARCHAR(255);
ALTER TABLE maps ADD FOREIGN KEY (game_id) REFERENCES games(id);

-- 📈 Index performances

CREATE INDEX idx_maps_owner ON maps(owner_id);
CREATE INDEX idx_maps_public_created ON maps(is_public, created_at);
CREATE INDEX idx_pois_map ON pois(map_id);
CREATE INDEX idx_collaborations_user ON collaborations(user_id);
CREATE INDEX idx_categories_map ON categories(map_id);
CREATE INDEX idx_poi_logs_poi ON poi_logs(poi_id);
CREATE INDEX idx_map_votes_map_user ON map_votes(map_id, user_id);

-- Exemple de pagination côté serveur pour cartes publiques :
-- SELECT * FROM maps WHERE is_public = true ORDER BY created_at DESC LIMIT 20 OFFSET 0;

```
