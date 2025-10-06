-- Add ESOP refresh target column to funding_rounds
-- This allows specifying a target ESOP pool percentage after each funding round

ALTER TABLE funding_rounds
ADD COLUMN IF NOT EXISTS esop_refresh_target numeric(5,4) DEFAULT NULL;

COMMENT ON COLUMN funding_rounds.esop_refresh_target IS 'Target ESOP pool percentage (0-1) to refresh to after this round closes';

-- Update Pre-Seed round to refresh to 15%
-- Update Series A to refresh to 12%
UPDATE funding_rounds
SET esop_refresh_target = 0.15
WHERE round_name ILIKE '%pre-seed%' OR round_type = 'pre_seed';

UPDATE funding_rounds
SET esop_refresh_target = 0.12
WHERE round_name ILIKE '%series a%' OR round_type = 'series_a';

-- Verify the changes
SELECT
  round_name,
  round_type,
  esop_refresh_target,
  amount_raised,
  post_money_valuation
FROM funding_rounds
ORDER BY close_date;
