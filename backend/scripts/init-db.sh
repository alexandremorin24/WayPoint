#!/bin/bash

DB="${WAYPOINT_DB_NAME:-waypoint_db}"
USER="root"
PASS="" # Set password if needed, or use .my.cnf for credentials

# 0. Create the database if it does not exist
mysql -u $USER -e "CREATE DATABASE IF NOT EXISTS $DB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 1. Create tables
mysql -u $USER $DB < backend/scripts/schema.sql

# 2. Drop indexes if they already exist (for idempotency)
INDEXES=(
  "idx_maps_owner maps"
  "idx_maps_public_created maps"
  "idx_pois_map pois"
  "idx_pois_category pois"
  "idx_collaborations_user collaborations"
  "idx_collaborations_map collaborations"
  "idx_categories_map categories"
  "idx_poi_logs_poi poi_logs"
  "idx_poi_logs_user poi_logs"
  "idx_poi_user_stats_user poi_user_stats"
  "idx_map_votes_map_user map_votes"
)

for entry in "${INDEXES[@]}"; do
  IFS=' ' read -r idx tbl <<< "$entry"
  mysql -u $USER $DB -e "DROP INDEX IF EXISTS $idx ON $tbl;" 2>/dev/null
done

# 3. Recreate indexes (no error possible)
mysql -u $USER $DB -e "
CREATE INDEX idx_maps_owner ON maps(owner_id);
CREATE INDEX idx_maps_public_created ON maps(is_public, created_at);
CREATE INDEX idx_pois_map ON pois(map_id);
CREATE INDEX idx_pois_category ON pois(category_id);
CREATE INDEX idx_collaborations_user ON collaborations(user_id);
CREATE INDEX idx_collaborations_map ON collaborations(map_id);
CREATE INDEX idx_categories_map ON categories(map_id);
CREATE INDEX idx_poi_logs_poi ON poi_logs(poi_id);
CREATE INDEX idx_poi_logs_user ON poi_logs(user_id);
CREATE INDEX idx_poi_user_stats_user ON poi_user_stats(user_id);
CREATE INDEX idx_map_votes_map_user ON map_votes(map_id, user_id);
"
echo "✅ Database $DB initialized successfully!" 
