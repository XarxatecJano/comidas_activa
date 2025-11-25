-- Add family_member_id column to Diner table to track which family member or user each diner represents
ALTER TABLE "Diner" ADD COLUMN IF NOT EXISTS family_member_id UUID;

-- Add comment to explain the column
COMMENT ON COLUMN "Diner".family_member_id IS 'References either a FamilyMember.id or User.id to track the source of the diner';
