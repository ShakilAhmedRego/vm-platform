-- Run this to unlock all records for a demo user
-- Replace UUID with the demo user's ID

DO $$
DECLARE
  demo_user UUID := 'YOUR-DEMO-USER-UUID-HERE';
BEGIN
  -- Unlock companies (dealflow)
  INSERT INTO company_access (user_id, company_id)
  SELECT demo_user, id FROM companies
  ON CONFLICT DO NOTHING;

  -- Unlock leads (salesintel)
  INSERT INTO lead_access (user_id, lead_id)
  SELECT demo_user, id FROM b2b_leads
  ON CONFLICT DO NOTHING;

  -- Add demo credits
  INSERT INTO credit_ledger (user_id, delta, note)
  VALUES (demo_user, 1000, 'Demo credits');

  RAISE NOTICE 'Demo user unlocked and credited.';
END $$;
