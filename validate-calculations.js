/**
 * CALCULATION VALIDATION TEST SCRIPT
 * Validates all financial calculations against Excel blueprint targets
 */

// Personnel calculations (from personnel.ts logic)
function calculatePersonnelCost(baseSalary, month, startMonth, endMonth) {
  if (month < startMonth) return 0;
  if (endMonth && month > endMonth) return 0;

  const OVERHEAD_MULTIPLIER = 1.4; // 40% overhead
  return (baseSalary * OVERHEAD_MULTIPLIER) / 12;
}

// Default personnel roles from Excel
const defaultRoles = [
  { roleName: 'CEO (Stephen)', baseSalary: 160000, startMonth: 6, endMonth: 120 },
  { roleName: 'CTO (Allen)', baseSalary: 160000, startMonth: 3, endMonth: 120 },
  { roleName: 'Sr. Full-Stack Developer', baseSalary: 140000, startMonth: 3, endMonth: 120 },
  { roleName: 'Product/Customer Success', baseSalary: 105000, startMonth: 13, endMonth: 120 },
  { roleName: 'Sales/Partnership Lead', baseSalary: 140000, startMonth: 25, endMonth: 120 },
  { roleName: 'UI/UX Designer', baseSalary: 100000, startMonth: 18, endMonth: 120 },
  { roleName: 'Backend Engineer', baseSalary: 120000, startMonth: 13, endMonth: 120 },
  { roleName: 'Marketing Manager', baseSalary: 110000, startMonth: 18, endMonth: 120 },
];

// OPEX allocation by funding round
function getAllocationForMonth(month) {
  if (month < 3) {
    return {
      productDevelopment: 0,
      marketingAndSales: 0,
      legalAndProfessional: 0,
      officeAndEquipment: 0,
      travelAndEvents: 0,
    };
  } else if (month < 27) {
    // Pre-Seed
    return {
      productDevelopment: 25000,
      marketingAndSales: 16667,
      legalAndProfessional: 2083,
      officeAndEquipment: 833,
      travelAndEvents: 1250,
    };
  } else if (month < 51) {
    // Series A
    return {
      productDevelopment: 16667,
      marketingAndSales: 58333,
      legalAndProfessional: 8333,
      officeAndEquipment: 8333,
      travelAndEvents: 8333,
    };
  } else {
    // Series X
    const monthlyBudget = 166667;
    return {
      productDevelopment: monthlyBudget * 0.20,
      marketingAndSales: monthlyBudget * 0.25,
      legalAndProfessional: monthlyBudget * 0.05,
      officeAndEquipment: monthlyBudget * 0.05,
      travelAndEvents: monthlyBudget * 0.05,
    };
  }
}

function calculateMonthlyPersonnelTotal(roles, month) {
  return roles.reduce((total, role) => {
    return total + calculatePersonnelCost(role.baseSalary, month, role.startMonth, role.endMonth);
  }, 0);
}

function calculateMonthlyOPEX(roles, month) {
  const personnelCost = calculateMonthlyPersonnelTotal(roles, month);
  const allocation = getAllocationForMonth(month);

  const operatingSubtotal =
    allocation.productDevelopment +
    allocation.marketingAndSales +
    allocation.legalAndProfessional +
    allocation.officeAndEquipment +
    allocation.travelAndEvents;

  const totalOPEX = personnelCost + operatingSubtotal;

  return {
    month,
    personnelCost,
    ...allocation,
    operatingSubtotal,
    totalOPEX,
  };
}

function calculateCumulativeOPEX(roles, targetMonth) {
  let cumulative = 0;
  for (let month = 1; month <= targetMonth; month++) {
    const monthlyOPEX = calculateMonthlyOPEX(roles, month);
    cumulative += monthlyOPEX.totalOPEX;
  }
  return cumulative;
}

// Revenue calculations
function calculateGrowthExponent(year1Customers, targetCustomers, yearsToTarget) {
  const ratio = year1Customers / targetCustomers;
  const base = 1 / yearsToTarget;
  return Math.log(ratio) / Math.log(base);
}

function getDiscountForYear(year) {
  const schedule = [
    { year: 1, discount: 0.40 },
    { year: 2, discount: 0.30 },
    { year: 3, discount: 0.20 },
    { year: 4, discount: 0.10 },
    { year: 5, discount: 0.10 },
    { year: 6, discount: 0.075 },
    { year: 7, discount: 0.05 },
    { year: 8, discount: 0.05 },
    { year: 9, discount: 0.03 },
    { year: 10, discount: 0.025 },
  ];

  const entry = schedule.find(s => s.year === year);
  return entry ? entry.discount : 0.025;
}

function getChurnForYear(year) {
  const schedule = [
    { year: 1, churn: 0.00 },
    { year: 2, churn: 0.20 },
    { year: 3, churn: 0.20 },
    { year: 4, churn: 0.18 },
    { year: 5, churn: 0.17 },
    { year: 6, churn: 0.17 },
    { year: 7, churn: 0.16 },
    { year: 8, churn: 0.15 },
    { year: 9, churn: 0.15 },
    { year: 10, churn: 0.15 },
  ];

  const entry = schedule.find(s => s.year === year);
  return entry ? entry.churn : 0.15;
}

function calculateMarketPenetration(year, assumptions) {
  if (year === 0) return 0;

  const targetCustomers = assumptions.tam * assumptions.targetPenetration;
  const growthExponent = calculateGrowthExponent(
    assumptions.year1Customers,
    targetCustomers,
    assumptions.yearsToTarget
  );

  const penetration = assumptions.targetPenetration *
    Math.pow(year / assumptions.yearsToTarget, growthExponent);

  return Math.min(penetration, assumptions.targetPenetration);
}

function calculateRevenueYear5(assumptions) {
  let previousCustomers = 0;
  let year5Customers = 0;

  for (let year = 1; year <= 5; year++) {
    const penetration = calculateMarketPenetration(year, assumptions);
    const totalCustomers = Math.round(assumptions.tam * penetration);
    const churnRate = getChurnForYear(year);
    const churnedCustomers = year > 1 ? Math.round(previousCustomers * churnRate) : 0;
    const newCustomers = year === 1
      ? assumptions.year1Customers
      : totalCustomers - (previousCustomers - churnedCustomers);

    year5Customers = totalCustomers;
    previousCustomers = totalCustomers;
  }

  // Calculate ARR with discount
  const baseARR = assumptions.baseArr * Math.pow(1 + assumptions.annualPriceIncrease, 4); // Year 5 is 4 years after Year 1
  const discount = getDiscountForYear(5);
  const discountedARR = baseARR * (1 - discount);
  const totalARR = year5Customers * discountedARR;

  return {
    customers: year5Customers,
    arr: totalARR,
    baseARR,
    discount,
    discountedARR,
  };
}

// Run validation tests
console.log('='.repeat(80));
console.log('CALCULATION VALIDATION REPORT');
console.log('='.repeat(80));
console.log('');

// Test 1: Personnel Costs
console.log('1. PERSONNEL COST VALIDATION');
console.log('-'.repeat(80));

const month12Personnel = calculateMonthlyPersonnelTotal(defaultRoles, 12);
console.log(`Month 12 Personnel Cost: $${month12Personnel.toFixed(2)}`);

const month36Personnel = calculateMonthlyPersonnelTotal(defaultRoles, 36);
console.log(`Month 36 Personnel Cost: $${month36Personnel.toFixed(2)}`);

// Test individual roles for month 12
console.log('\nMonth 12 Active Roles:');
defaultRoles.forEach(role => {
  if (role.startMonth <= 12) {
    const cost = calculatePersonnelCost(role.baseSalary, 12, role.startMonth, role.endMonth);
    console.log(`  ${role.roleName}: $${cost.toFixed(2)}/month (started Month ${role.startMonth})`);
  }
});

// Test 2: OPEX Calculations
console.log('\n2. OPEX CALCULATION VALIDATION');
console.log('-'.repeat(80));

const month12OPEX = calculateMonthlyOPEX(defaultRoles, 12);
console.log(`Month 12 Total OPEX: $${month12OPEX.totalOPEX.toFixed(2)}`);
console.log(`  Personnel: $${month12OPEX.personnelCost.toFixed(2)}`);
console.log(`  Operating: $${month12OPEX.operatingSubtotal.toFixed(2)}`);
console.log(`    - Product Development: $${month12OPEX.productDevelopment.toFixed(2)}`);
console.log(`    - Marketing & Sales: $${month12OPEX.marketingAndSales.toFixed(2)}`);
console.log(`    - Legal & Professional: $${month12OPEX.legalAndProfessional.toFixed(2)}`);

const month36OPEX = calculateMonthlyOPEX(defaultRoles, 36);
console.log(`\nMonth 36 Total OPEX: $${month36OPEX.totalOPEX.toFixed(2)}`);
console.log(`  Personnel: $${month36OPEX.personnelCost.toFixed(2)}`);
console.log(`  Operating: $${month36OPEX.operatingSubtotal.toFixed(2)}`);

const cumulative12 = calculateCumulativeOPEX(defaultRoles, 12);
console.log(`\nCumulative OPEX (Month 1-12): $${cumulative12.toFixed(2)}`);

// Test 3: Discount Schedule
console.log('\n3. DISCOUNT SCHEDULE VALIDATION');
console.log('-'.repeat(80));
for (let year = 1; year <= 10; year++) {
  const discount = getDiscountForYear(year);
  console.log(`Year ${year}: ${(discount * 100).toFixed(1)}%`);
}

// Expected: 40%, 30%, 20%, 10%, 10%, 7.5%, 5%, 5%, 3%, 2.5%
console.log('\nExpected: 40%, 30%, 20%, 10%, 10%, 7.5%, 5%, 5%, 3%, 2.5%');

// Test 4: Churn Schedule
console.log('\n4. CHURN SCHEDULE VALIDATION');
console.log('-'.repeat(80));
for (let year = 1; year <= 10; year++) {
  const churn = getChurnForYear(year);
  console.log(`Year ${year}: ${(churn * 100).toFixed(1)}%`);
}

console.log('\nExpected: 0%, 20%, 20%, 18%, 17%, 17%, 16%, 15%, 15%, 15%');

// Test 5: Revenue Year 5
console.log('\n5. YEAR 5 REVENUE VALIDATION');
console.log('-'.repeat(80));

const revenueAssumptions = {
  tam: 30000,
  targetPenetration: 0.05,
  yearsToTarget: 7,
  year1Customers: 10,
  baseArr: 24000,
  annualPriceIncrease: 0.03, // 3% annual increase
};

const year5 = calculateRevenueYear5(revenueAssumptions);
console.log(`Year 5 Customers: ${year5.customers}`);
console.log(`Year 5 Base ARR (before discount): $${year5.baseARR.toFixed(2)}`);
console.log(`Year 5 Discount: ${(year5.discount * 100).toFixed(1)}%`);
console.log(`Year 5 Discounted ARR per customer: $${year5.discountedARR.toFixed(2)}`);
console.log(`Year 5 Total ARR: $${year5.arr.toFixed(2)}`);
console.log('\nExpected from Blueprint: $15,332,765 ARR, 631 Customers');

// Test 6: Benefits Multiplier
console.log('\n6. BENEFITS MULTIPLIER VALIDATION');
console.log('-'.repeat(80));
console.log('Current multiplier: 1.4 (40% overhead)');
console.log('Expected from Blueprint: 1.30 (30% overhead)');
console.log('⚠️ DISCREPANCY DETECTED');

// Test 7: License Equivalents
console.log('\n7. LICENSE EQUIVALENTS VALIDATION');
console.log('-'.repeat(80));
const testCustomers = 1000;
console.log(`Total Customers: ${testCustomers}`);
console.log(`Single User (80%): ${Math.round(testCustomers * 0.80)}`);
console.log(`Team (16%): ${Math.round(testCustomers * 0.16)}`);
console.log(`Enterprise (4%): ${Math.round(testCustomers * 0.04)}`);
console.log('\nExpected Ratio: 800:80:10 (or 80:8:1)');

console.log('\n' + '='.repeat(80));
console.log('VALIDATION COMPLETE');
console.log('='.repeat(80));
