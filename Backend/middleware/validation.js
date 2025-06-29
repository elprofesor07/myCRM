const { body, param, query, validationResult } = require('express-validator');

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// Common validations
const commonValidations = {
  email: body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  password: body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  phoneNumber: (field) => body(field)
    .optional()
    .matches(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/)
    .withMessage('Please provide a valid phone number'),
  
  url: (field) => body(field)
    .optional()
    .isURL()
    .withMessage('Please provide a valid URL'),
  
  mongoId: (field) => param(field)
    .isMongoId()
    .withMessage('Invalid ID format'),
  
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ]
};

// Auth validations
const authValidations = {
  register: [
    body('firstName')
      .trim()
      .notEmpty().withMessage('First name is required')
      .isLength({ max: 50 }).withMessage('First name cannot exceed 50 characters'),
    body('lastName')
      .trim()
      .notEmpty().withMessage('Last name is required')
      .isLength({ max: 50 }).withMessage('Last name cannot exceed 50 characters'),
    commonValidations.email,
    commonValidations.password,
    body('timezone')
      .optional()
      .isIn(Intl.supportedValuesOf('timeZone'))
      .withMessage('Invalid timezone'),
    handleValidationErrors
  ],

  login: [
    commonValidations.email,
    body('password').notEmpty().withMessage('Password is required'),
    handleValidationErrors
  ],

  forgotPassword: [
    commonValidations.email,
    handleValidationErrors
  ],

  resetPassword: [
    body('token').notEmpty().withMessage('Reset token is required'),
    commonValidations.password,
    handleValidationErrors
  ],

  changePassword: [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    commonValidations.password,
    handleValidationErrors
  ]
};

// User validations
const userValidations = {
  updateProfile: [
    body('firstName')
      .optional()
      .trim()
      .isLength({ max: 50 }).withMessage('First name cannot exceed 50 characters'),
    body('lastName')
      .optional()
      .trim()
      .isLength({ max: 50 }).withMessage('Last name cannot exceed 50 characters'),
    commonValidations.phoneNumber('phone'),
    body('department')
      .optional()
      .isIn(['sales', 'marketing', 'support', 'management', 'other'])
      .withMessage('Invalid department'),
    body('timezone')
      .optional()
      .isIn(Intl.supportedValuesOf('timeZone'))
      .withMessage('Invalid timezone'),
    body('language')
      .optional()
      .isIn(['en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko'])
      .withMessage('Invalid language'),
    body('theme')
      .optional()
      .isIn(['light', 'dark', 'system'])
      .withMessage('Invalid theme'),
    handleValidationErrors
  ]
};

// Contact validations
const contactValidations = {
  create: [
    body('firstName')
      .trim()
      .notEmpty().withMessage('First name is required')
      .isLength({ max: 50 }).withMessage('First name cannot exceed 50 characters'),
    body('lastName')
      .trim()
      .notEmpty().withMessage('Last name is required')
      .isLength({ max: 50 }).withMessage('Last name cannot exceed 50 characters'),
    commonValidations.email,
    commonValidations.phoneNumber('phone.primary'),
    commonValidations.phoneNumber('phone.mobile'),
    commonValidations.phoneNumber('phone.work'),
    body('company')
      .optional()
      .isMongoId().withMessage('Invalid company ID'),
    body('status')
      .optional()
      .isIn(['lead', 'prospect', 'customer', 'inactive', 'archived'])
      .withMessage('Invalid status'),
    body('source')
      .optional()
      .isIn(['website', 'referral', 'social_media', 'email_campaign', 'cold_call', 'trade_show', 'advertisement', 'other'])
      .withMessage('Invalid source'),
    handleValidationErrors
  ],

  update: [
    body('firstName')
      .optional()
      .trim()
      .isLength({ max: 50 }).withMessage('First name cannot exceed 50 characters'),
    body('lastName')
      .optional()
      .trim()
      .isLength({ max: 50 }).withMessage('Last name cannot exceed 50 characters'),
    body('email')
      .optional()
      .isEmail().withMessage('Please provide a valid email')
      .normalizeEmail(),
    commonValidations.phoneNumber('phone.primary'),
    commonValidations.phoneNumber('phone.mobile'),
    commonValidations.phoneNumber('phone.work'),
    body('company')
      .optional()
      .isMongoId().withMessage('Invalid company ID'),
    handleValidationErrors
  ]
};

// Company validations
const companyValidations = {
  create: [
    body('name')
      .trim()
      .notEmpty().withMessage('Company name is required')
      .isLength({ max: 200 }).withMessage('Company name cannot exceed 200 characters'),
    body('domain')
      .optional()
      .trim()
      .matches(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/)
      .withMessage('Please provide a valid domain'),
    commonValidations.url('website'),
    body('industry')
      .optional()
      .isIn(['technology', 'healthcare', 'finance', 'retail', 'manufacturing', 'education', 'real_estate', 'hospitality', 'transportation', 'telecommunications', 'energy', 'entertainment', 'agriculture', 'construction', 'automotive', 'other'])
      .withMessage('Invalid industry'),
    body('size')
      .optional()
      .isIn(['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+'])
      .withMessage('Invalid company size'),
    body('type')
      .optional()
      .isIn(['prospect', 'customer', 'partner', 'vendor', 'competitor', 'other'])
      .withMessage('Invalid company type'),
    handleValidationErrors
  ]
};

// Deal validations
const dealValidations = {
  create: [
    body('title')
      .trim()
      .notEmpty().withMessage('Deal title is required')
      .isLength({ max: 200 }).withMessage('Deal title cannot exceed 200 characters'),
    body('value')
      .notEmpty().withMessage('Deal value is required')
      .isFloat({ min: 0 }).withMessage('Deal value must be a positive number'),
    body('company')
      .notEmpty().withMessage('Company is required')
      .isMongoId().withMessage('Invalid company ID'),
    body('contact')
      .notEmpty().withMessage('Contact is required')
      .isMongoId().withMessage('Invalid contact ID'),
    body('stage')
      .optional()
      .isIn(['qualification', 'needs_analysis', 'proposal', 'negotiation', 'closed_won', 'closed_lost'])
      .withMessage('Invalid stage'),
    body('expectedCloseDate')
      .notEmpty().withMessage('Expected close date is required')
      .isISO8601().withMessage('Invalid date format'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('Invalid priority'),
    handleValidationErrors
  ]
};

// Activity validations
const activityValidations = {
  create: [
    body('type')
      .notEmpty().withMessage('Activity type is required')
      .isIn(['call', 'email', 'meeting', 'note', 'task', 'deadline'])
      .withMessage('Invalid activity type'),
    body('subject')
      .trim()
      .notEmpty().withMessage('Subject is required')
      .isLength({ max: 200 }).withMessage('Subject cannot exceed 200 characters'),
    body('relatedTo')
      .notEmpty().withMessage('Related entity is required')
      .isMongoId().withMessage('Invalid related entity ID'),
    body('relatedToModel')
      .notEmpty().withMessage('Related model is required')
      .isIn(['Contact', 'Company', 'Deal'])
      .withMessage('Invalid related model'),
    body('scheduledStart')
      .optional()
      .isISO8601().withMessage('Invalid date format'),
    body('scheduledEnd')
      .optional()
      .isISO8601().withMessage('Invalid date format')
      .custom((value, { req }) => {
        if (value && req.body.scheduledStart && new Date(value) < new Date(req.body.scheduledStart)) {
          throw new Error('End time must be after start time');
        }
        return true;
      }),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('Invalid priority'),
    handleValidationErrors
  ]
};

// Task validations
const taskValidations = {
  create: [
    body('title')
      .trim()
      .notEmpty().withMessage('Task title is required')
      .isLength({ max: 200 }).withMessage('Task title cannot exceed 200 characters'),
    body('assignee')
      .notEmpty().withMessage('Assignee is required')
      .isMongoId().withMessage('Invalid assignee ID'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('Invalid priority'),
    body('type')
      .optional()
      .isIn(['task', 'bug', 'feature', 'improvement', 'research'])
      .withMessage('Invalid task type'),
    body('dueDate')
      .optional()
      .isISO8601().withMessage('Invalid date format'),
    body('estimatedHours')
      .optional()
      .isFloat({ min: 0, max: 999 }).withMessage('Estimated hours must be between 0 and 999'),
    handleValidationErrors
  ],

  updateProgress: [
    body('progress')
      .notEmpty().withMessage('Progress is required')
      .isInt({ min: 0, max: 100 }).withMessage('Progress must be between 0 and 100'),
    handleValidationErrors
  ],

  addComment: [
    body('text')
      .trim()
      .notEmpty().withMessage('Comment text is required')
      .isLength({ max: 2000 }).withMessage('Comment cannot exceed 2000 characters'),
    body('mentions')
      .optional()
      .isArray().withMessage('Mentions must be an array')
      .custom((value) => {
        if (value && !value.every(id => id.match(/^[0-9a-fA-F]{24}$/))) {
          throw new Error('Invalid user ID in mentions');
        }
        return true;
      }),
    handleValidationErrors
  ]
};

module.exports = {
  handleValidationErrors,
  commonValidations,
  authValidations,
  userValidations,
  contactValidations,
  companyValidations,
  dealValidations,
  activityValidations,
  taskValidations
};