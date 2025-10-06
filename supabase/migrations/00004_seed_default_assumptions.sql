-- Seed Default Assumptions for Base Scenario
-- These match the Excel model defaults

-- Revenue & Growth
INSERT INTO assumptions (organization_id, scenario_id, key, value, category, description)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'tam', '30000', 'revenue', 'Total Addressable Market (number of firms)'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'target_penetration', '0.05', 'revenue', 'Target market penetration (5%)'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'years_to_target', '10', 'revenue', 'Years to reach target penetration'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'year1_customers', '50', 'revenue', 'Starting customer count in Year 1')
ON CONFLICT (scenario_id, key) DO UPDATE
  SET value = EXCLUDED.value;

-- Pricing
INSERT INTO assumptions (organization_id, scenario_id, key, value, category, description)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'base_arr', '30000', 'pricing', 'Base Annual Recurring Revenue per customer'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'setup_fee', '5000', 'pricing', 'One-time setup fee per customer'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'annual_price_increase', '0.03', 'pricing', 'Annual price escalation (3%)'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'year1_discount', '0.40', 'pricing', 'Year 1 discount (40%)'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'year2_discount', '0.30', 'pricing', 'Year 2 discount (30%)'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'year3_discount', '0.20', 'pricing', 'Year 3 discount (20%)')
ON CONFLICT (scenario_id, key) DO UPDATE
  SET value = EXCLUDED.value;

-- Churn & Retention
INSERT INTO assumptions (organization_id, scenario_id, key, value, category, description)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'base_churn_rate', '0.05', 'churn', 'Base annual churn rate (5%)'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'year1_churn', '0.20', 'churn', 'Year 1 churn rate (20%)'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'year2_churn', '0.15', 'churn', 'Year 2 churn rate (15%)'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'year3_churn', '0.10', 'churn', 'Year 3 churn rate (10%)')
ON CONFLICT (scenario_id, key) DO UPDATE
  SET value = EXCLUDED.value;

-- OPEX
INSERT INTO assumptions (organization_id, scenario_id, key, value, category, description)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'benefits_multiplier', '1.3', 'opex', 'Benefits multiplier for personnel costs (130%)'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'monthly_cloud_hosting', '5000', 'opex', 'Monthly cloud hosting costs'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'monthly_saas_tools', '3000', 'opex', 'Monthly SaaS tools and software'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'monthly_marketing', '10000', 'opex', 'Monthly marketing spend'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'cogs_percent', '0.15', 'opex', 'Cost of Goods Sold as % of revenue (15%)')
ON CONFLICT (scenario_id, key) DO UPDATE
  SET value = EXCLUDED.value;

-- Equity & Ownership
INSERT INTO assumptions (organization_id, scenario_id, key, value, category, description)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'founder_1_ownership', '0.60', 'equity', 'Founder 1 initial ownership (60%)'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'founder_2_ownership', '0.40', 'equity', 'Founder 2 initial ownership (40%)'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'esop_pool_size', '0.15', 'equity', 'Employee stock option pool (15%)'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'series_a_esop_refresh', '0.12', 'equity', 'ESOP pool refresh at Series A (12%)')
ON CONFLICT (scenario_id, key) DO UPDATE
  SET value = EXCLUDED.value;

-- Funding
INSERT INTO assumptions (organization_id, scenario_id, key, value, category, description)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'pre_seed_amount', '1500000', 'funding', 'Pre-seed raise target ($1.5M)'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'pre_seed_post_money', '8000000', 'funding', 'Pre-seed post-money valuation ($8M)'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'series_a_amount', '8000000', 'funding', 'Series A raise target ($8M)'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'series_a_pre_money', '30000000', 'funding', 'Series A pre-money valuation ($30M)')
ON CONFLICT (scenario_id, key) DO UPDATE
  SET value = EXCLUDED.value;

COMMENT ON TABLE assumptions IS 'Stores configurable model assumptions and variables by scenario';
