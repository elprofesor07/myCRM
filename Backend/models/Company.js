const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [200, 'Company name cannot exceed 200 characters']
  },
  domain: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/, 'Please enter a valid domain']
  },
  industry: {
    type: String,
    enum: [
      'technology', 'healthcare', 'finance', 'retail', 'manufacturing',
      'education', 'real_estate', 'hospitality', 'transportation',
      'telecommunications', 'energy', 'entertainment', 'agriculture',
      'construction', 'automotive', 'other'
    ],
    default: 'other'
  },
  size: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+'],
    default: '1-10'
  },
  type: {
    type: String,
    enum: ['prospect', 'customer', 'partner', 'vendor', 'competitor', 'other'],
    default: 'prospect'
  },
  website: {
    type: String,
    trim: true,
    match: [/^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/, 'Please enter a valid URL']
  },
  phone: {
    main: {
      type: String,
      match: [/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/, 'Please enter a valid phone number']
    },
    fax: {
      type: String,
      match: [/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/, 'Please enter a valid phone number']
    }
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  address: {
    billing: {
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
    shipping: {
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
    }
  },
  financials: {
    annualRevenue: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
      maxlength: 3
    },
    fiscalYearEnd: {
      type: String,
      match: [/^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/, 'Please use MM-DD format']
    }
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  parentCompany: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    default: null
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  description: {
    type: String,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  logo: {
    type: String,
    default: null
  },
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  lifecycle: {
    firstContactDate: {
      type: Date,
      default: Date.now
    },
    lastActivityDate: Date,
    becameCustomerDate: Date,
    renewalDate: Date
  },
  healthScore: {
    type: Number,
    default: 50,
    min: 0,
    max: 100
  },
  metadata: {
    source: {
      type: String,
      enum: ['manual', 'import', 'api', 'enrichment', 'other'],
      default: 'manual'
    },
    importId: String,
    externalId: String,
    enrichmentData: {
      provider: String,
      lastUpdated: Date,
      data: mongoose.Schema.Types.Mixed
    },
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

// Virtual for contacts count
companySchema.virtual('contactsCount', {
  ref: 'Contact',
  localField: '_id',
  foreignField: 'company',
  count: true
});

// Virtual for deals
companySchema.virtual('deals', {
  ref: 'Deal',
  localField: '_id',
  foreignField: 'company'
});

// Virtual for total deal value
companySchema.virtual('totalDealValue').get(async function() {
  const Deal = mongoose.model('Deal');
  const result = await Deal.aggregate([
    { $match: { company: this._id, status: 'won' } },
    { $group: { _id: null, total: { $sum: '$value' } } }
  ]);
  return result[0]?.total || 0;
});

// Virtual for subsidiary companies
companySchema.virtual('subsidiaries', {
  ref: 'Company',
  localField: '_id',
  foreignField: 'parentCompany'
});

// Indexes
companySchema.index({ name: 1 });
companySchema.index({ domain: 1 });
companySchema.index({ owner: 1 });
companySchema.index({ type: 1 });
companySchema.index({ industry: 1 });
companySchema.index({ tags: 1 });
companySchema.index({ 'lifecycle.becameCustomerDate': 1 });
companySchema.index({ name: 'text', domain: 'text' });

// Pre-save middleware
companySchema.pre('save', function(next) {
  // Extract domain from website if not provided
  if (this.website && !this.domain) {
    try {
      const url = new URL(this.website);
      this.domain = url.hostname.replace(/^www\./, '');
    } catch (error) {
      // Invalid URL, skip domain extraction
    }
  }
  
  // Calculate health score
  this.calculateHealthScore();
  
  next();
});

// Method to calculate health score
companySchema.methods.calculateHealthScore = function() {
  let score = 50; // Base score
  
  // Profile completeness
  if (this.website) score += 5;
  if (this.phone.main) score += 5;
  if (this.email) score += 5;
  if (this.industry !== 'other') score += 5;
  if (this.size) score += 5;
  
  // Business factors
  if (this.type === 'customer') score += 20;
  else if (this.type === 'partner') score += 15;
  
  // Financial data
  if (this.financials.annualRevenue) score += 5;
  
  // Cap at 100
  this.healthScore = Math.min(score, 100);
};

// Method to enrich company data
companySchema.methods.enrichData = async function(provider, data) {
  this.metadata.enrichmentData = {
    provider,
    lastUpdated: new Date(),
    data
  };
  
  // Update fields based on enrichment data
  if (data.industry && !this.industry) this.industry = data.industry;
  if (data.size && !this.size) this.size = data.size;
  if (data.description && !this.description) this.description = data.description;
  
  return this.save();
};

// Method to add activity
companySchema.methods.addActivity = async function(activityData) {
  const Activity = mongoose.model('Activity');
  const activity = new Activity({
    ...activityData,
    relatedTo: this._id,
    relatedToModel: 'Company'
  });
  
  await activity.save();
  this.lifecycle.lastActivityDate = new Date();
  await this.save();
  
  return activity;
};

// Static method to find by domain
companySchema.statics.findByDomain = function(domain) {
  const cleanDomain = domain.toLowerCase().replace(/^www\./, '');
  return this.findOne({ domain: cleanDomain });
};

// Static method to find potential duplicates
companySchema.statics.findDuplicates = async function(name, domain, excludeId = null) {
  const query = {
    $or: [
      { name: new RegExp(`^${name}$`, 'i') }
    ]
  };
  
  if (domain) {
    query.$or.push({ domain: domain.toLowerCase() });
  }
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  return this.find(query);
};

const Company = mongoose.model('Company', companySchema);

module.exports = Company;