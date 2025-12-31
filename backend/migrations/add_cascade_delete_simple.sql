
ALTER TABLE meal_photos DROP FOREIGN KEY IF EXISTS meal_photos_ibfk_1;
ALTER TABLE meal_photos DROP FOREIGN KEY IF EXISTS meal_photos_user_id_fk;

ALTER TABLE meal_photos 
    ADD CONSTRAINT meal_photos_user_id_fk 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- For onboarding_data
ALTER TABLE onboarding_data DROP FOREIGN KEY IF EXISTS onboarding_data_ibfk_1;
ALTER TABLE onboarding_data DROP FOREIGN KEY IF EXISTS onboarding_data_user_id_fk;

ALTER TABLE onboarding_data 
    ADD CONSTRAINT onboarding_data_user_id_fk 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- For water_logs
ALTER TABLE water_logs DROP FOREIGN KEY IF EXISTS water_logs_ibfk_1;
ALTER TABLE water_logs DROP FOREIGN KEY IF EXISTS water_logs_user_id_fk;

ALTER TABLE water_logs 
    ADD CONSTRAINT water_logs_user_id_fk 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- For weight_logs
ALTER TABLE weight_logs DROP FOREIGN KEY IF EXISTS weight_logs_ibfk_1;
ALTER TABLE weight_logs DROP FOREIGN KEY IF EXISTS weight_logs_user_id_fk;

ALTER TABLE weight_logs 
    ADD CONSTRAINT weight_logs_user_id_fk 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- For progress_photos
ALTER TABLE progress_photos DROP FOREIGN KEY IF EXISTS progress_photos_ibfk_1;
ALTER TABLE progress_photos DROP FOREIGN KEY IF EXISTS progress_photos_user_id_fk;

ALTER TABLE progress_photos 
    ADD CONSTRAINT progress_photos_user_id_fk 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

