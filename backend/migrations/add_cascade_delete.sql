
SET @dbname = DATABASE();

SET @sql = (
    SELECT CONCAT('ALTER TABLE meal_photos DROP FOREIGN KEY ', CONSTRAINT_NAME, ';')
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = 'meal_photos'
      AND COLUMN_NAME = 'user_id'
      AND REFERENCED_TABLE_NAME = 'users'
    LIMIT 1
);
SET @sql = IFNULL(@sql, 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE meal_photos ADD CONSTRAINT meal_photos_user_id_fk 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

SET @sql = (
    SELECT CONCAT('ALTER TABLE onboarding_data DROP FOREIGN KEY ', CONSTRAINT_NAME, ';')
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = 'onboarding_data'
      AND COLUMN_NAME = 'user_id'
      AND REFERENCED_TABLE_NAME = 'users'
    LIMIT 1
);
SET @sql = IFNULL(@sql, 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE onboarding_data ADD CONSTRAINT onboarding_data_user_id_fk 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

SET @sql = (
    SELECT CONCAT('ALTER TABLE water_logs DROP FOREIGN KEY ', CONSTRAINT_NAME, ';')
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = 'water_logs'
      AND COLUMN_NAME = 'user_id'
      AND REFERENCED_TABLE_NAME = 'users'
    LIMIT 1
);
SET @sql = IFNULL(@sql, 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE water_logs ADD CONSTRAINT water_logs_user_id_fk 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

SET @sql = (
    SELECT CONCAT('ALTER TABLE weight_logs DROP FOREIGN KEY ', CONSTRAINT_NAME, ';')
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = 'weight_logs'
      AND COLUMN_NAME = 'user_id'
      AND REFERENCED_TABLE_NAME = 'users'
    LIMIT 1
);
SET @sql = IFNULL(@sql, 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE weight_logs ADD CONSTRAINT weight_logs_user_id_fk 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

SET @sql = (
    SELECT CONCAT('ALTER TABLE progress_photos DROP FOREIGN KEY ', CONSTRAINT_NAME, ';')
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = 'progress_photos'
      AND COLUMN_NAME = 'user_id'
      AND REFERENCED_TABLE_NAME = 'users'
    LIMIT 1
);
SET @sql = IFNULL(@sql, 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE progress_photos ADD CONSTRAINT progress_photos_user_id_fk 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
