-- Run this after creating your account
-- Replace the UUID below with your actual user ID from Supabase Auth → Users

UPDATE user_profiles 
SET role = 'admin' 
WHERE id = 'YOUR-USER-UUID-HERE';

-- Verify:
SELECT id, email, role FROM user_profiles WHERE role = 'admin';
