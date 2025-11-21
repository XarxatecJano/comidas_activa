-- Migration: Set has_custom_diners flag for existing meals
-- This migration sets has_custom_diners=true for all existing meals that have custom diners
-- to maintain backward compatibility with the new bulk diner selection feature

-- Set has_custom_diners=true for meals that have entries in MealDiner table
UPDATE "Meal"
SET has_custom_diners = true
WHERE id IN (
  SELECT DISTINCT meal_id 
  FROM "MealDiner"
);

-- Set has_custom_diners=true for meals that have entries in the deprecated Diner table
UPDATE "Meal"
SET has_custom_diners = true
WHERE id IN (
  SELECT DISTINCT meal_id 
  FROM "Diner"
);

-- Log the results
DO $$
DECLARE
  meal_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO meal_count FROM "Meal" WHERE has_custom_diners = true;
  RAISE NOTICE '✓ Migration completed: % meals marked with custom diners', meal_count;
END $$;
