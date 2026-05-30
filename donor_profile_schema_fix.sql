ALTER TABLE donors
ADD COLUMN date_of_birth DATE NULL
AFTER rh_factor;

ALTER TABLE donors
MODIFY blood_group ENUM('I','II','III','IV') NULL;

ALTER TABLE donors
MODIFY rh_factor ENUM('+','-') NULL;
