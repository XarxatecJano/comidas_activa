-- Migration: Add Family Members functionality
-- This migration adds support for users to manage family members and their preferences

-- Create FamilyMember table
CREATE TABLE IF NOT EXISTS "FamilyMember" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES "User"(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  preferences TEXT,
  dietary_restrictions TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create junction table for Meal-FamilyMember relationship
CREATE TABLE IF NOT EXISTS "MealDiner" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID REFERENCES "Meal"(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES "FamilyMember"(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(meal_id, family_member_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_familymember_user ON "FamilyMember"(user_id);
CREATE INDEX IF NOT EXISTS idx_mealdiner_meal ON "MealDiner"(meal_id);
CREATE INDEX IF NOT EXISTS idx_mealdiner_familymember ON "MealDiner"(family_member_id);

-- Comments
COMMENT ON TABLE "FamilyMember" IS 'Family members and related people for each user';
COMMENT ON TABLE "MealDiner" IS 'Junction table linking meals with family members who will eat';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✓ Family Members migration completed successfully!';
END $$;
