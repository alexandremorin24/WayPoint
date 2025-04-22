-- Warning: This script will delete all data from the database.
-- This script is intended for use in a test environment only.
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE poi_logs;
TRUNCATE TABLE poi_user_stats;
TRUNCATE TABLE map_votes;
TRUNCATE TABLE collaborations;
TRUNCATE TABLE pois;
TRUNCATE TABLE categories;
TRUNCATE TABLE maps;
TRUNCATE TABLE users;
TRUNCATE TABLE games;

SET FOREIGN_KEY_CHECKS = 1;
