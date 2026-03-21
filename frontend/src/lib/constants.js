/**
 * Application Constants - CommunityPulse
 */

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  SUBMIT: '/feedback/submit',
  ADMIN: '/admin',
  PROFILE: '/profile'
};

export const SENTIMENT_LABELS = {
  Positive: { label: 'Positive', icon: '😊', color: 'green' },
  Neutral: { label: 'Neutral', icon: '😐', color: 'yellow' },
  Negative: { label: 'Negative', icon: '😔', color: 'red' }
};

export const FEEDBACK_STATUS = {
  pending: 'Pending Review',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  dismissed: 'Dismissed'
};

export const CATEGORY_COLORS = {
  General: '#3B82F6',
  Facilities: '#10B981',
  Events: '#F59E0B',
  Leadership: '#EF4444',
  Safety: '#DC2626',
  Technology: '#8B5CF6'
};

export const PASSWORD_RULES = [
  { regex: /.{8,}/, message: 'At least 8 characters' },
  { regex: /[A-Z]/, message: 'One uppercase letter' },
  { regex: /[a-z]/, message: 'One lowercase letter' },
  { regex: /[0-9]/, message: 'One number' },
  { regex: /[^A-Za-z0-9]/, message: 'One special character' }
];

export const API_ERRORS = {
  UNAUTHORIZED: 'Please log in to continue',
  FORBIDDEN: 'You do not have permission to perform this action',
  NOT_FOUND: 'Resource not found',
  VALIDATION: 'Please check your input and try again',
  SERVER: 'Something went wrong. Please try again later'
};