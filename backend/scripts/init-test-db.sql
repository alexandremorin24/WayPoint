-- 🌱 WayPoint Test Database Initialization Script
-- This script is executed before each Jest test suite (NODE_ENV=test)
-- It ensures a clean reset of tables while respecting foreign key constraints
-- WARNING: This script should NEVER be executed on the production database

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS waypoint_test_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE waypoint_test_db;

-- Apply schema
SOURCE scripts/schema.sql;

-- Temporarily disable foreign key checks
SET FOREIGN_KEY_CHECKS = 0;

-- Clean tables in reverse dependency order
-- 1. Junction tables and child tables
TRUNCATE TABLE poi_logs;
TRUNCATE TABLE poi_user_stats;
TRUNCATE TABLE map_votes;
TRUNCATE TABLE pois;
TRUNCATE TABLE categories;
TRUNCATE TABLE map_user_roles;
TRUNCATE TABLE map_invitations;

-- 2. Main tables
TRUNCATE TABLE maps;
TRUNCATE TABLE users;
TRUNCATE TABLE games;

-- Reset auto-increment sequences
ALTER TABLE games AUTO_INCREMENT = 1;
ALTER TABLE users AUTO_INCREMENT = 1;
ALTER TABLE maps AUTO_INCREMENT = 1;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Verify that tables are empty
SELECT 'Verifying empty tables:' as '';
SELECT 
    (SELECT COUNT(*) FROM poi_logs) as poi_logs_count,
    (SELECT COUNT(*) FROM poi_user_stats) as poi_user_stats_count,
    (SELECT COUNT(*) FROM map_votes) as map_votes_count,
    (SELECT COUNT(*) FROM pois) as pois_count,
    (SELECT COUNT(*) FROM categories) as categories_count,
    (SELECT COUNT(*) FROM map_user_roles) as map_user_roles_count,
    (SELECT COUNT(*) FROM map_invitations) as map_invitations_count,
    (SELECT COUNT(*) FROM maps) as maps_count,
    (SELECT COUNT(*) FROM users) as users_count,
    (SELECT COUNT(*) FROM games) as games_count;

-- Verify that sequences are reset
SELECT 'Verifying sequences:' as '';
SELECT 
    (SELECT AUTO_INCREMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'games') as games_auto_increment,
    (SELECT AUTO_INCREMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users') as users_auto_increment,
    (SELECT AUTO_INCREMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'maps') as maps_auto_increment;

-- Grant privileges
GRANT ALL PRIVILEGES ON waypoint_test_db.* TO 'Overflow'@'localhost';
FLUSH PRIVILEGES;
