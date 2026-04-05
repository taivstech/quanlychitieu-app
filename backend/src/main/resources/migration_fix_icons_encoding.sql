-- ============================================
-- Migration: Fix icon names (MaterialIcons → Ionicons) & Vietnamese encoding
-- Run this ONCE on existing database to fix corrupted data
-- ============================================
SET NAMES utf8mb4;

-- =====================
-- 1. Fix category icons: MaterialIcons → Ionicons
-- =====================
UPDATE categories SET icon = 'car' WHERE icon IN ('directions-car', 'directions_car');
UPDATE categories SET icon = 'cart' WHERE icon IN ('shopping-cart', 'shopping_cart');
UPDATE categories SET icon = 'film' WHERE icon = 'movie';
UPDATE categories SET icon = 'medkit' WHERE icon IN ('local-hospital', 'local_hospital');
UPDATE categories SET icon = 'ellipsis-horizontal' WHERE icon IN ('more-horiz', 'more_horiz');
UPDATE categories SET icon = 'wallet' WHERE icon IN ('account-balance-wallet', 'account_balance_wallet');
UPDATE categories SET icon = 'gift' WHERE icon IN ('card-giftcard', 'card_giftcard');
UPDATE categories SET icon = 'cash' WHERE icon IN ('attach-money', 'attach_money');
UPDATE categories SET icon = 'remove-circle' WHERE icon = 'money-off';
UPDATE categories SET icon = 'add-circle' WHERE icon = 'money';

-- =====================
-- 2. Fix wallet icons
-- =====================
UPDATE wallets SET icon = 'wallet' WHERE icon IN ('account-balance-wallet', 'account_balance_wallet');
UPDATE wallets SET icon = 'business' WHERE icon IN ('account-balance', 'account_balance');
UPDATE wallets SET icon = 'phone-portrait' WHERE icon IN ('phone-android', 'phone_android');

-- =====================
-- 3. Fix saving goal icons
-- =====================
UPDATE saving_goals SET icon = 'phone-portrait' WHERE icon IN ('phone-iphone', 'phone_iphone');
UPDATE saving_goals SET icon = 'airplane' WHERE icon = 'flight';

-- =====================
-- 4. Fix corrupted Vietnamese encoding in transaction notes
-- Converts double-encoded UTF-8 (UTF-8 bytes stored as Latin-1) back to proper UTF-8
-- Only updates rows that contain typical double-encoding patterns
-- =====================
UPDATE transactions
SET note = CONVERT(CAST(CONVERT(note USING latin1) AS BINARY) USING utf8mb4)
WHERE note REGEXP 'Ã|Æ|á»|áº|Ä|Æ°'
  AND note NOT REGEXP '^[\\x00-\\x7F\u00C0-\u024F\u1E00-\u1EFF]+$';

SELECT 'Migration completed!' AS result;
