-- Final migration to add CASCADE delete to foreign keys
-- Drop existing foreign keys and recreate with CASCADE

ALTER TABLE meal_photos DROP FOREIGN KEY meal_photos_user_id_fk;
ALTER TABLE meal_photos 
    ADD CONSTRAINT meal_photos_user_id_fk 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE onboarding_data DROP FOREIGN KEY onboarding_data_user_id_fk;
ALTER TABLE onboarding_data 
    ADD CONSTRAINT onboarding_data_user_id_fk 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE water_logs DROP FOREIGN KEY water_logs_user_id_fk;
ALTER TABLE water_logs 
    ADD CONSTRAINT water_logs_user_id_fk 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE weight_logs DROP FOREIGN KEY weight_logs_user_id_fk;
ALTER TABLE weight_logs 
    ADD CONSTRAINT weight_logs_user_id_fk 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE progress_photos DROP FOREIGN KEY progress_photos_user_id_fk;
ALTER TABLE progress_photos 
    ADD CONSTRAINT progress_photos_user_id_fk 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

