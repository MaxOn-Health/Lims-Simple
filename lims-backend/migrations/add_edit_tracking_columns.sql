-- Migration: Add edit tracking columns to test_results table
-- Date: 2026-01-19
-- Description: Add is_edited, edited_at, edited_by, and edit_reason columns for result editing feature

-- Add is_edited column (boolean, default false)
ALTER TABLE test_results 
ADD COLUMN IF NOT EXISTS is_edited BOOLEAN NOT NULL DEFAULT false;

-- Add edited_at column (timestamp, nullable)
ALTER TABLE test_results 
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP NULL;

-- Add edited_by column (uuid, nullable, references users)
ALTER TABLE test_results 
ADD COLUMN IF NOT EXISTS edited_by UUID NULL;

-- Add edit_reason column (text, nullable)
ALTER TABLE test_results 
ADD COLUMN IF NOT EXISTS edit_reason TEXT NULL;

-- Add foreign key constraint for edited_by
ALTER TABLE test_results
ADD CONSTRAINT IF NOT EXISTS "FK_test_results_edited_by" 
FOREIGN KEY (edited_by) REFERENCES users(id) ON DELETE SET NULL;

-- Add index for edited_by
CREATE INDEX IF NOT EXISTS "IDX_test_results_edited_by" ON test_results(edited_by);
