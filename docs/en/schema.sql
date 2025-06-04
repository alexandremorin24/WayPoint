-- 📄 Database Schema – WayPoint Map Builder (MVP)
--
-- ⚡️ Initialization (EN)
--
-- To initialize the main database:
--   ./backend/scripts/init-db.sh
--
-- To initialize the test database:
--   WAYPOINT_DB_NAME=waypoint_test_db ./backend/scripts/init-db.sh
--
-- The SQL below is applied to the selected database. No CREATE DATABASE or USE statement is needed.

-- 🧑‍💻 Users
CREATE TABLE users (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  photo_url TEXT,
  auth_provider VARCHAR(50) NOT NULL CHECK (auth_provider IN ('google', 'local')),
  password_hash VARCHAR(255), -- NULL for Google auth
  email_verified BOOLEAN DEFAULT FALSE,
  last_login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  preferred_language VARCHAR(5) DEFAULT 'en',
  email_optin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 🗺️ Maps
CREATE TABLE maps (
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
  FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- 📌 POIs (Points of Interest)
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
  creator_id CHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (map_id) REFERENCES maps(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (creator_id) REFERENCES users(id)
);

-- 🗂️ Categories
CREATE TABLE categories (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  map_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  color VARCHAR(7) DEFAULT '#3498db', -- Default blue
  icon VARCHAR(255) DEFAULT 'map-marker', -- Default marker icon
  parent_category_id CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (map_id) REFERENCES maps(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- 👥 Map Access Roles
CREATE TABLE map_user_roles (
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

-- 🧮 POI User Statistics
CREATE TABLE poi_user_stats (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  map_id CHAR(36) NOT NULL,
  poi_created_count INT DEFAULT 0,
  poi_updated_count INT DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (map_id) REFERENCES maps(id) ON DELETE CASCADE
);

-- 🕒 POI Logs
CREATE TABLE poi_logs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  poi_id CHAR(36) NOT NULL,
  map_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  action VARCHAR(50) CHECK (action IN ('create', 'update')),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  payload JSON,
  FOREIGN KEY (poi_id) REFERENCES pois(id) ON DELETE CASCADE,
  FOREIGN KEY (map_id) REFERENCES maps(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 👍 Map Votes
CREATE TABLE map_votes (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  map_id CHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (map_id) REFERENCES maps(id) ON DELETE CASCADE,
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

-- 📈 Optimizations for Scalability and Performance

-- Indexes for critical and frequently queried columns
CREATE INDEX idx_maps_owner ON maps(owner_id);
CREATE INDEX idx_maps_public_created ON maps(is_public, created_at);
CREATE INDEX idx_pois_map ON pois(map_id);
CREATE INDEX idx_pois_category ON pois(category_id);
CREATE INDEX idx_pois_creator ON pois(creator_id);
CREATE INDEX idx_map_user_roles_user ON map_user_roles(user_id);
CREATE INDEX idx_map_user_roles_map ON map_user_roles(map_id);
CREATE INDEX idx_map_user_roles_role ON map_user_roles(role);
CREATE INDEX idx_categories_map ON categories(map_id);
CREATE INDEX idx_poi_logs_poi ON poi_logs(poi_id);
CREATE INDEX idx_poi_logs_user ON poi_logs(user_id);
CREATE INDEX idx_poi_user_stats_user ON poi_user_stats(user_id);
CREATE INDEX idx_map_votes_map_user ON map_votes(map_id, user_id);

-- Example pagination query for public maps
-- SELECT * FROM maps WHERE is_public = true ORDER BY created_at DESC LIMIT 20 OFFSET 0;

```
