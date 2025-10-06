-- Add revenue-related columns to annual_projections table
-- These columns are needed for the revenue model

ALTER TABLE annual_projections
ADD COLUMN IF NOT EXISTS arr NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS customers INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS revenue NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS cogs NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS gross_profit NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS gross_margin NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS ebitda NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS ebitda_margin NUMERIC DEFAULT 0;

-- Verify columns were added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'annual_projections'
ORDER BY ordinal_position;
