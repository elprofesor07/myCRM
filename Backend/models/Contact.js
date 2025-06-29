const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    primary: {
      type: String,
      match: [/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/, 'Please enter a valid phone number']
    },
    mobile: {
      type: String,
      match: [/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/, 'Please enter a valid phone number']
    },
    work: {
      type: String,
      match: [/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/, 'Please enter a valid phone number']
    }
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    default: null
  },
  jobTitle: {
    type: String,
    trim: true,
    maxlength: [100, 'Job title cannot exceed 100 characters']
  },
  department: {
    type: String,
    trim: true,
    maxlength: [50, 'Department cannot exceed 50 characters']
  },
  address: {
    street: {
      type: String,
      trim: true,
      maxlength: [200, 'Street address cannot exceed 200 characters']
    },
    city: {
      type: String,
      trim: true,
      maxlength: [100, 'City cannot exceed 100 characters']
    },
    state: {
      type: String,
      trim: true,
      maxlength: [100, 'State cannot exceed 100 characters']
    },
    country: {
      type: String,
      trim: true,
      maxlength: [100, 'Country cannot exceed 100 characters']
    },
    postalCode: {
      type: String,
      trim: true,
      maxlength: [20, 'Postal code cannot exceed 20 characters']
    }
  },
  socialMedia: {
    linkedin: {
      type: String,
      trim: true,
      match: [/^https?:\/\/(www\.)?linkedin\.com\/.*$/, 'Please enter a valid LinkedIn URL']
    },
    twitter: {
      type: String,
      trim: true,
      match: [/^https?:\/\/(www\.)?twitter\.com\/.*$/, 'Please enter a valid Twitter URL']
    },
    facebook: {
      type: String,
      trim: true,
      match: [/^https?:\/\/(www\.)?facebook\.com\/.*$/, 'Please enter a valid Facebook URL']
    },
    other: [{
      platform: String,
      url: String
    }]
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  source: {
    type: String,
    enum: ['website', 'referral', 'social_media', 'email_campaign', 'cold_call', 'trade_show', 'advertisement', 'other'],
    default: 'other'
  },
  status: {
    type: String,
    enum: ['lead', 'prospect', 'customer', 'inactive', 'archived'],
    default: 'lead'
  },
  leadScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String,
    maxlength: [2000, 'Notes cannot exceed 2000 characters']
  },
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  communications: {
    emailOptIn: {
      type: Boolean,
      default: true
    },
    smsOptIn: {
      type: Boolean,
      default: false
    },
    preferredContactMethod: {
      type: String,
      enum: ['email', 'phone', 'sms', 'any'],
      default: 'email'
    }
  },
  lifecycle: {
    firstContactDate: {
      type: Date,
      default: Date.now
    },
    lastContactDate: Date,
    convertedDate: Date,
    lifecycleStage: {
      type: String,
      enum: ['subscriber', 'lead', 'marketing_qualified', 'sales_qualified', 'opportunity', 'customer', 'evangelist'],
      default: 'lead'
    }
  },
  metadata: {
    importId: String,
    externalId: String,
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
contactSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for display name with company
contactSchema.virtual('displayName').get(function() {
  let name = this.fullName;
  if (this.company && this.company.name) {
    name += ` (${this.company.name})`;
  }
  return name;
});

// Virtual for activities count
contactSchema.virtual('activitiesCount', {
  ref: 'Activity',
  localField: '_id',
  foreignField: 'relatedTo',
  count: true,
  match: { relatedToModel: 'Contact' }
});

// Virtual for deals
contactSchema.virtual('deals', {
  ref: 'Deal',
  localField: '_id',
  foreignField: 'contact'
});

// Indexes
contactSchema.index({ email: 1 });
contactSchema.index({ company: 1 });
contactSchema.index({ owner: 1, createdAt: -1 });
contactSchema.index({ status: 1 });
contactSchema.index({ 'lifecycle.lifecycleStage': 1 });
contactSchema.index({ tags: 1 });
contactSchema.index({ 
  firstName: 'text', 
  lastName: 'text', 
  email: 'text',
  'company.name': 'text'
});

// Pre-save middleware
contactSchema.pre('save', function(next) {
  // Update lifecycle stage based on status
  if (this.isModified('status')) {
    if (this.status === 'customer' && this.lifecycle.lifecycleStage !== 'customer') {
      this.lifecycle.lifecycleStage = 'customer';
      this.lifecycle.convertedDate = new Date();
    }
  }
  
  // Calculate lead score based on various factors
  this.calculateLeadScore();
  
  next();
});

// Method to calculate lead score
contactSchema.methods.calculateLeadScore = function() {
  let score = 0;
  
  // Email engagement
  if (this.communications.emailOptIn) score += 10;
  
  // Profile completeness
  if (this.jobTitle) score += 10;
  if (this.phone.primary || this.phone.mobile) score += 10;
  if (this.company) score += 15;
  if (this.socialMedia.linkedin) score += 5;
  
  // Lifecycle stage
  const stageScores = {
    'subscriber': 5,
    'lead': 10,
    'marketing_qualified': 20,
    'sales_qualified': 30,
    'opportunity': 40,
    'customer': 50,
    'evangelist': 60
  };
  score += stageScores[this.lifecycle.lifecycleStage] || 0;
  
  // Cap at 100
  this.leadScore = Math.min(score, 100);
};

// Method to add activity
contactSchema.methods.addActivity = async function(activityData) {
  const Activity = mongoose.model('Activity');
  const activity = new Activity({
    ...activityData,
    relatedTo: this._id,
    relatedToModel: 'Contact'
  });
  
  await activity.save();
  this.lifecycle.lastContactDate = new Date();
  await this.save();
  
  return activity;
};

// Method to convert to customer
contactSchema.methods.convertToCustomer = async function() {
  this.status = 'customer';
  this.lifecycle.lifecycleStage = 'customer';
  this.lifecycle.convertedDate = new Date();
  return this.save();
};

// Static method to find by email domain
contactSchema.statics.findByEmailDomain = function(domain) {
  return this.find({ 
    email: new RegExp(`@${domain}$`, 'i') 
  });
};

// Static method to find duplicates
contactSchema.statics.findDuplicates = async function(email, excludeId = null) {
  const query = { email: email.toLowerCase() };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  return this.find(query);
};

const Contact = mongoose.model('Contact', contactSchema);

module.exports = Contact;