-- Create test user for Torqr App
-- Run this in Supabase Dashboard → SQL Editor

-- First, check if user already exists
DO $$
DECLARE
  user_exists boolean;
  password_hash text;
BEGIN
  -- Check if user exists
  SELECT EXISTS(SELECT 1 FROM users WHERE email = 'test@torqr.app') INTO user_exists;

  -- Password hash for "Test123!" with bcrypt salt rounds 12
  -- Generated with: bcrypt.hash('Test123!', 12)
  password_hash := '$2b$12$CP38i0oGkvDNHuTvH54Ry.KZ62DuSvb7brli23fSaNg/cEdzDTQYq';

  IF user_exists THEN
    -- Update existing user
    UPDATE users
    SET password_hash = password_hash,
        updated_at = NOW()
    WHERE email = 'test@torqr.app';

    RAISE NOTICE 'Test user updated successfully!';
  ELSE
    -- Insert new user
    INSERT INTO users (id, email, password_hash, name, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      'test@torqr.app',
      password_hash,
      'Test User',
      NOW(),
      NOW()
    );

    RAISE NOTICE 'Test user created successfully!';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '=================================';
  RAISE NOTICE 'Login Credentials:';
  RAISE NOTICE '=================================';
  RAISE NOTICE 'Email:    test@torqr.app';
  RAISE NOTICE 'Password: Test123!';
  RAISE NOTICE '=================================';
END $$;
