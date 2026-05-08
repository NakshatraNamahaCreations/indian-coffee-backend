/**
 * User Type Constants
 * Centralized configuration for user categories with database values and UI display mappings
 */

// Database enum values (snake_case for storage)
const USER_TYPE_VALUES = {
  COFFEE_GROWER: 'coffee_grower',
  FPO_COMPANY: 'fpo_company',
  TRADER_COMPANY: 'trader_company',
  CURER_COMPANY: 'curer_company',
  OTHER_INDIVIDUAL: 'other_individual',
};

// Metadata for each user type: display label, underlying business type, profile template
const USER_TYPE_METADATA = {
  [USER_TYPE_VALUES.COFFEE_GROWER]: {
    label: 'Coffee Grower',
    businessType: 'individual',
    profileTemplate: 'coffee_grower',
    category: 'Farmer',
  },
  [USER_TYPE_VALUES.FPO_COMPANY]: {
    label: 'FPO',
    businessType: 'company',
    profileTemplate: 'curer_fpo',
    category: 'Both',
  },
  [USER_TYPE_VALUES.TRADER_COMPANY]: {
    label: 'Trader',
    businessType: 'company',
    profileTemplate: 'trader_exporter',
    category: 'Both',
  },
  [USER_TYPE_VALUES.CURER_COMPANY]: {
    label: 'Curer',
    businessType: 'company',
    profileTemplate: 'curer_fpo',
    category: 'Farmer',
  },
  [USER_TYPE_VALUES.OTHER_INDIVIDUAL]: {
    label: 'Others',
    businessType: 'individual',
    profileTemplate: 'individual',
    category: 'Farmer',
  },
};

// Farmer-specific user types (for Farmer app signup)
const FARMER_USER_TYPES = [
  { value: USER_TYPE_VALUES.COFFEE_GROWER, label: 'Coffee Grower (Individual)' },
  { value: USER_TYPE_VALUES.FPO_COMPANY, label: 'FPO (Company)' },
  { value: USER_TYPE_VALUES.TRADER_COMPANY, label: 'Trader (Company)' },
  { value: USER_TYPE_VALUES.CURER_COMPANY, label: 'Curer (Company)' },
  { value: USER_TYPE_VALUES.OTHER_INDIVIDUAL, label: 'Others (Individual)' },
];

// Trader-specific user types (for Trader app signup)
const TRADER_USER_TYPES = [
  { value: USER_TYPE_VALUES.COFFEE_GROWER, label: 'Individual' },
  { value: USER_TYPE_VALUES.FPO_COMPANY, label: 'FPO (Company)' },
  { value: USER_TYPE_VALUES.TRADER_COMPANY, label: 'Trader (Company)' },
  { value: USER_TYPE_VALUES.CURER_COMPANY, label: 'Curer (Company)' },
  { value: USER_TYPE_VALUES.OTHER_INDIVIDUAL, label: 'Others (Company)' },
];

// Plan management user types (for filtering by userType when creating plans)
const PLAN_USER_TYPES_FARMER = [
  { value: 'all', label: 'All Types' },
  ...FARMER_USER_TYPES,
];

const PLAN_USER_TYPES_TRADER = [
  { value: 'all', label: 'All Types' },
  ...TRADER_USER_TYPES,
];

// Helper functions
const getUserTypeLabel = (userTypeValue) => {
  const metadata = USER_TYPE_METADATA[userTypeValue];
  return metadata ? metadata.label : userTypeValue;
};

const getBusinessType = (userTypeValue) => {
  const metadata = USER_TYPE_METADATA[userTypeValue];
  return metadata ? metadata.businessType : 'individual';
};

const getProfileTemplate = (userTypeValue) => {
  const metadata = USER_TYPE_METADATA[userTypeValue];
  return metadata ? metadata.profileTemplate : 'individual';
};

const isCompanyType = (userTypeValue) => {
  return getBusinessType(userTypeValue) === 'company';
};

const isIndividualType = (userTypeValue) => {
  return getBusinessType(userTypeValue) === 'individual';
};

// Trader-specific user types (7 values for Trader app)
const TRADER_USER_TYPE_VALUES = {
  INDIVIDUAL: 'individual',
  FPO_COMPANY: 'fpo_company',
  TRADER_COMPANY: 'trader_company',
  CURER_COMPANY: 'curer_company',
  ROASTER_COMPANY: 'roaster_company',
  EXPORTER_COMPANY: 'exporter_company',
  CAFE_RETAILER_COMPANY: 'cafe_retailer_company',
};

// Helper: Check if trader user type is individual
const isTraderIndividualType = (userTypeValue) => {
  return userTypeValue === TRADER_USER_TYPE_VALUES.INDIVIDUAL;
};

module.exports = {
  USER_TYPE_VALUES,
  TRADER_USER_TYPE_VALUES,
  USER_TYPE_METADATA,
  FARMER_USER_TYPES,
  TRADER_USER_TYPES,
  PLAN_USER_TYPES_FARMER,
  PLAN_USER_TYPES_TRADER,
  // Helper functions
  getUserTypeLabel,
  getBusinessType,
  getProfileTemplate,
  isCompanyType,
  isIndividualType,
  isTraderIndividualType,
  // Convenience arrays
  ALL_USER_TYPES: Object.values(USER_TYPE_VALUES),
  ALL_TRADER_USER_TYPES: Object.values(TRADER_USER_TYPE_VALUES),
};
