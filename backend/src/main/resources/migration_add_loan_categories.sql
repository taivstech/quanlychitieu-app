-- ============================================
-- MIGRATION: Add LOAN transaction type categories
-- Run this script AFTER deploying the update with LOAN enum
-- ============================================

-- STEP 1: Alter the MySQL categories table to add LOAN to the ENUM column
ALTER TABLE categories MODIFY COLUMN type ENUM('INCOME', 'EXPENSE', 'LOAN') NOT NULL;

-- STEP 2: Add default LOAN categories for demo user (id=1)
INSERT INTO categories (name, type, icon, color, is_default, user_id) 
VALUES 
  ('Vay', 'LOAN', 'money-off', '#FF6B9D', true, 1),
  ('Cho vay', 'LOAN', 'money', '#00D4FF', true, 1);

-- STEP 3: Verification - run manually to check LOAN categories exist:
-- SELECT id, name, type, color FROM categories WHERE type = 'LOAN' ORDER BY user_id, name;
