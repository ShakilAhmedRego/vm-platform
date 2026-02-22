-- Grant a specific client access to a vertical
-- Usage: Replace CLIENT_USER_ID and run per vertical

DO $$
DECLARE
  client UUID := 'CLIENT-USER-UUID-HERE';
  credit_amount INT := 100;
BEGIN
  -- Add credits
  INSERT INTO credit_ledger (user_id, delta, note)
  VALUES (client, credit_amount, 'Client onboarding credits');

  RAISE NOTICE 'Granted % credits to client.', credit_amount;
END $$;
