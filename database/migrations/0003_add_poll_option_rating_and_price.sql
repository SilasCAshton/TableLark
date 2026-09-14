ALTER TABLE poll_options
ADD COLUMN rating REAL,
ADD COLUMN price_level VARCHAR(32);

ALTER TABLE poll_options
ADD CONSTRAINT poll_options_rating_check
CHECK (rating IS NULL OR rating BETWEEN 0 AND 5);
