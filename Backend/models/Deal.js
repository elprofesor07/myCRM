const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Deal title is required'],
    trim: true,
    maxlength: [200, 'Deal title cannot exceed 200 characters']
  },
  value: {
    type: Number,
    required: [true, 'Deal value is required'],
    min: [0, 'Deal value cannot be negative']
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true,
    maxlength: 3
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company is required']
  },
  contact: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact',
    required: [true, 'Contact is required']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  stage: {
    type: String,
    enum: [
      'qualification',
      'needs_analysis',
      'proposal',
      'negotiation',
      'closed_won',
      'closed_lost'
    ],
    default: 'qualification',
    required: true
  },
  probability: {
    type: Number,
    min: 0,
    max: 100,
    default: function() {
      const stageProbabilities = {
        'qualification': 10,
        'needs_analysis': 25,
        'proposal': 50,
        'negotiation': 75,
        'closed_won': 100,
        'closed_lost': 0
      };
      return stageProbabilities[this.stage] || 0;
    }
  },
  expectedCloseDate: {
    type: Date,
    required: [true, 'Expected close date is required']
  },
  actualCloseDate: Date,
  description: {
    type: String,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  products: [{
    name: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    total: {
      type: Number,
      required: true
    }
  }],
  competitors: [{
    name: String,
    strengths: String,
    weaknesses: String,
    status: {
      type: String,
      enum: ['active', 'eliminated', 'unknown'],
      default: 'active'
    }
  }],
  lostReason: {
    type: String,
    enum: [
      'price',
      'product_fit',
      'competitor',
      'timing',
      'budget',
      'authority',
      'other'
    ]
  },
  lostReasonDetails: String,
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  pipeline: {
    type: String,
    default: 'default',
    enum: ['default', 'enterprise', 'smb', 'partner']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  source: {
    type: String,
    enum: [
      'website',
      'referral',
      'cold_call',
      'email_campaign',
      'social_media',
      'trade_show',
      'partner',
      'other'
    ],
    default: 'other'
  },
  commission: {
    percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 10
    },
    amount: {
      type: Number,
      min: 0,
      default: function() {
        return (this.value * this.commission.percentage) / 100;
      }
    }
  },
  metadata: {
    stageHistory: [{
      stage: String,
      enteredAt: Date,
      duration: Number, // in days
      movedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }],
    forecastCategory: {
      type: String,
      enum: ['pipeline', 'best_case', 'commit', 'closed'],
      default: 'pipeline'
    },
    lastActivityDate: Date,
    nextStep: String,
    nextStepDate: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for weighted value
dealSchema.virtual('weightedValue').get(function() {
  return (this.value * this.probability) / 100;
});

// Virtual for days in current stage
dealSchema.virtual('daysInCurrentStage').get(function() {
  if (this.metadata.stageHistory && this.metadata.stageHistory.length > 0) {
    const currentStageEntry = this.metadata.stageHistory[this.metadata.stageHistory.length - 1];
    const daysInStage = Math.floor((Date.now() - currentStageEntry.enteredAt) / (1000 * 60 * 60 * 24));
    return daysInStage;
  }
  return 0;
});

// Virtual for total deal cycle
dealSchema.virtual('totalDealCycle').get(function() {
  if (this.actualCloseDate) {
    return Math.floor((this.actualCloseDate - this.createdAt) / (1000 * 60 * 60 * 24));
  }
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for activities
dealSchema.virtual('activities', {
  ref: 'Activity',
  localField: '_id',
  foreignField: 'relatedTo',
  match: { relatedToModel: 'Deal' }
});

// Indexes
dealSchema.index({ owner: 1, stage: 1 });
dealSchema.index({ company: 1 });
dealSchema.index({ contact: 1 });
dealSchema.index({ expectedCloseDate: 1 });
dealSchema.index({ stage: 1, probability: 1 });
dealSchema.index({ pipeline: 1, stage: 1 });
dealSchema.index({ createdAt: -1 });
dealSchema.index({ 'metadata.forecastCategory': 1 });

// Pre-save middleware
dealSchema.pre('save', async function(next) {
  // Track stage changes
  if (this.isModified('stage')) {
    if (!this.metadata.stageHistory) {
      this.metadata.stageHistory = [];
    }
    
    // Calculate duration in previous stage
    if (this.metadata.stageHistory.length > 0) {
      const lastStage = this.metadata.stageHistory[this.metadata.stageHistory.length - 1];
      lastStage.duration = Math.floor((Date.now() - lastStage.enteredAt) / (1000 * 60 * 60 * 24));
    }
    
    // Add new stage entry
    this.metadata.stageHistory.push({
      stage: this.stage,
      enteredAt: new Date(),
      movedBy: this.metadata.lastModifiedBy
    });
    
    // Update probability based on stage
    const stageProbabilities = {
      'qualification': 10,
      'needs_analysis': 25,
      'proposal': 50,
      'negotiation': 75,
      'closed_won': 100,
      'closed_lost': 0
    };
    this.probability = stageProbabilities[this.stage] || this.probability;
    
    // Update forecast category
    this.updateForecastCategory();
    
    // Set close date for closed deals
    if (this.stage === 'closed_won' || this.stage === 'closed_lost') {
      this.actualCloseDate = new Date();
    }
  }
  
  // Calculate products total
  if (this.products && this.products.length > 0) {
    let totalValue = 0;
    this.products.forEach(product => {
      product.total = product.price * product.quantity * (1 - product.discount / 100);
      totalValue += product.total;
    });
    this.value = totalValue;
  }
  
  // Update commission amount
  if (this.commission && this.commission.percentage) {
    this.commission.amount = (this.value * this.commission.percentage) / 100;
  }
  
  next();
});

// Method to update forecast category
dealSchema.methods.updateForecastCategory = function() {
  if (this.stage === 'closed_won' || this.stage === 'closed_lost') {
    this.metadata.forecastCategory = 'closed';
  } else if (this.probability >= 75) {
    this.metadata.forecastCategory = 'commit';
  } else if (this.probability >= 50) {
    this.metadata.forecastCategory = 'best_case';
  } else {
    this.metadata.forecastCategory = 'pipeline';
  }
};

// Method to move to next stage
dealSchema.methods.moveToNextStage = async function(userId) {
  const stageOrder = [
    'qualification',
    'needs_analysis',
    'proposal',
    'negotiation',
    'closed_won'
  ];
  
  const currentIndex = stageOrder.indexOf(this.stage);
  if (currentIndex < stageOrder.length - 1 && this.stage !== 'closed_lost') {
    this.stage = stageOrder[currentIndex + 1];
    this.metadata.lastModifiedBy = userId;
    return this.save();
  }
  
  throw new Error('Cannot move to next stage');
};

// Method to close deal
dealSchema.methods.closeDeal = async function(won, reason = null, reasonDetails = null) {
  this.stage = won ? 'closed_won' : 'closed_lost';
  
  if (!won && reason) {
    this.lostReason = reason;
    this.lostReasonDetails = reasonDetails;
  }
  
  return this.save();
};

// Method to add competitor
dealSchema.methods.addCompetitor = function(competitorData) {
  if (!this.competitors) {
    this.competitors = [];
  }
  
  this.competitors.push(competitorData);
  return this.save();
};

// Static method to get pipeline summary
dealSchema.statics.getPipelineSummary = async function(ownerId = null, pipeline = 'default') {
  const matchStage = { pipeline };
  if (ownerId) {
    matchStage.owner = mongoose.Types.ObjectId(ownerId);
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$stage',
        count: { $sum: 1 },
        totalValue: { $sum: '$value' },
        weightedValue: { $sum: { $multiply: ['$value', { $divide: ['$probability', 100] }] } }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

// Static method to get forecast
dealSchema.statics.getForecast = async function(startDate, endDate, ownerId = null) {
  const matchStage = {
    expectedCloseDate: {
      $gte: startDate,
      $lte: endDate
    },
    stage: { $nin: ['closed_won', 'closed_lost'] }
  };
  
  if (ownerId) {
    matchStage.owner = mongoose.Types.ObjectId(ownerId);
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$metadata.forecastCategory',
        count: { $sum: 1 },
        totalValue: { $sum: '$value' },
        weightedValue: { $sum: { $multiply: ['$value', { $divide: ['$probability', 100] }] } }
      }
    }
  ]);
};

const Deal = mongoose.model('Deal', dealSchema);

module.exports = Deal;