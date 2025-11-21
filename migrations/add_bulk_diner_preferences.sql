-- Migration: Add bulk diner preferences functionality
-- This migration adds support for bulk diner selection at meal type level

-- Create UserDinerPreferences table for storing bulk diner selections
CREATE TABLE IF NOT EXISTS "UserDinerPreferences" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES "User"(id) ON DELETE CASCADE,
  meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('lunch', 'dinner')),
  family_member_id UUID REFERENCES "FamilyMember"(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, meal_type, family_member_id)
);

-- Add has_custom_diners column to Meal table
ALTER TABLE "Meal" ADD COLUMN IF NOT EXISTS has_custom_diners BOOLEAN DEFAULT FALSE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_userdinerprefs_user_mealtype ON "UserDinerPreferences"(user_id, meal_type);
CREATE INDEX IF NOT EXISTS idx_userdinerprefs_familymember ON "UserDinerPreferences"(family_member_id);
CREATE INDEX IF NOT EXISTS idx_meal_custom_diners ON "Meal"(has_custom_diners);

-- Set has_custom_diners=true for existing meals to preserve current behavior
UPDATE "Meal" SET has_custom_diners = TRUE WHERE has_custom_diners IS NULL OR has_custom_diners = FALSE;

-- Add comments for documentation
COMMENT ON TABLE "UserDinerPreferences" IS 'Stores bulk diner preferences for lunch and dinner meal types';
COMMENT ON COLUMN "UserDinerPreferences".meal_type IS 'Type of meal: lunch or dinner';
COMMENT ON COLUMN "Meal".has_custom_diners IS 'Flag indicating if meal has custom diners (true) or uses bulk selection (false)';

-- Success message
DO $
BEGIN
  RAISE NOTICE '✓ Bulk diner preferences migration completed successfully!';
  RAISE NOTICE 'Added UserDinerPreferences table and has_custom_diners column to Meal table';
END $;