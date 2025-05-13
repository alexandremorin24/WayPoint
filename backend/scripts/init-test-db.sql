CREATE DATABASE IF NOT EXISTS waypoint_test_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE waypoint_test_db;

SOURCE scripts/schema.sql;

GRANT ALL PRIVILEGES ON waypoint_test_db.* TO 'Overflow'@'localhost';

FLUSH PRIVILEGES;
