-- mysql -u root -p < init-test-db.sql
CREATE DATABASE IF NOT EXISTS waypoint_test_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

GRANT ALL PRIVILEGES ON waypoint_test_db.* TO 'Overflow'@'localhost';

FLUSH PRIVILEGES;
