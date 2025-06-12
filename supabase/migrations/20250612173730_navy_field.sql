/*
  # Remove user education table

  1. Changes
    - Drop the `user_education` table completely
    - Remove all associated indexes, triggers, and policies
    - Clean up any references

  2. Security
    - All RLS policies will be automatically removed when table is dropped
    - All triggers will be automatically removed when table is dropped
*/

-- Drop the user_education table and all its dependencies
DROP TABLE IF EXISTS user_education CASCADE;

-- Note: When a table is dropped with CASCADE, PostgreSQL automatically:
-- - Removes all indexes on the table
-- - Removes all triggers on the table  
-- - Removes all RLS policies on the table
-- - Removes all foreign key constraints referencing the table