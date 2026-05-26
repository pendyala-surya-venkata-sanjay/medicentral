import {
  INDIAN_DEPARTMENTS,
  VISIT_TYPES,
  VISIT_STATUSES,
  BILL_CATEGORIES,
  PAYMENT_METHODS,
  INDIAN_STATES,
  BLOOD_GROUPS,
} from '../utils/indiaHealthcare.js';

export const getIndiaMeta = (req, res) => {
  res.json({
    departments: INDIAN_DEPARTMENTS,
    visitTypes: VISIT_TYPES,
    visitStatuses: VISIT_STATUSES,
    billCategories: BILL_CATEGORIES,
    paymentMethods: PAYMENT_METHODS,
    states: INDIAN_STATES,
    bloodGroups: BLOOD_GROUPS,
    currency: 'INR',
    locale: 'en-IN',
  });
};
