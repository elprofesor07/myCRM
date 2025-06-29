const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, 'Activity type is required'],
    enum: ['call', 'email', 'meeting', 'note', 'task', 'deadline'],
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [200, 'Subject cannot exceed 200 characters']
  },
  description: {
    type: String,
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  relatedTo: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'relatedToModel'
  },
  relatedToModel: {
    type: String,
    required: true,
    enum: ['Contact', 'Company', 'Deal']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['planned', 'in_progress', 'completed', 'cancelled', 'no_show'],
    default: 'planned'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  scheduledStart: {
    type: Date,
    required: function() {
      return ['call', 'meeting', 'task', 'deadline'].includes(this.type);
    }
  },
  scheduledEnd: {
    type: Date,
    required: function() {
      return ['meeting'].includes(this.type);
    }
  },
  actualStart: Date,
  actualEnd: Date,
  duration: {
    type: Number, // in minutes
    min: 0
  },
  location: {
    type: String,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  callDetails: {
    direction: {
      type: String,
      enum: ['inbound', 'outbound']
    },
    outcome: {
      type: String,
      enum: ['connected', 'voicemail', 'no_answer', 'busy', 'wrong_number']
    },
    recordingUrl: String
  },
  emailDetails: {
    messageId: String,
    threadId: String,
    from: String,
    to: [String],
    cc: [String],
    bcc: [String],
    attachments: [{
      name: String,
      size: Number,
      type: String,
      url: String
    }],
    isReply: {
      type: Boolean,
      default: false
    },
    openedAt: Date,
    clickedLinks: [{
      url: String,
      clickedAt: Date
    }]
  },
  meetingDetails: {
    meetingType: {
      type: String,
      enum: ['in_person', 'video_call', 'phone_call']
    },
    agenda: String,
    meetingUrl: String,
    notes: String,
    outcomes: [String],
    actionItems: [{
      description: String,
      assignee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      dueDate: Date,
      completed: {
        type: Boolean,
        default: false
      }
    }]
  },
  taskDetails: {
    category: {
      type: String,
      enum: ['follow_up', 'preparation', 'research', 'administrative', 'other']
    },
    completedAt: Date,
    completionNotes: String
  },
  reminder: {
    enabled: {
      type: Boolean,
      default: false
    },
    minutesBefore: {
      type: Number,
      default: 15
    },
    sent: {
      type: Boolean,
      default: false
    }
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  attachments: [{
    name: String,
    size: Number,
    type: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  metadata: {
    source: {
      type: String,
      enum: ['manual', 'email_sync', 'calendar_sync', 'api', 'automation'],
      default: 'manual'
    },
    syncedFrom: {
      system: String,
      id: String,
      lastSync: Date
    },
    automationId: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for display name
activitySchema.virtual('displayName').get(function() {
  const typeIcons = {
    'call': '📞',
    'email': '✉️',
    'meeting': '🤝',
    'note': '📝',
    'task': '✅',
    'deadline': '⏰'
  };
  return `${typeIcons[this.type] || ''} ${this.subject}`.trim();
});

// Virtual for is overdue
activitySchema.virtual('isOverdue').get(function() {
  if (this.status === 'completed' || this.status === 'cancelled') {
    return false;
  }
  return this.scheduledStart && this.scheduledStart < new Date();
});

// Indexes
activitySchema.index({ relatedTo: 1, relatedToModel: 1 });
activitySchema.index({ owner: 1, createdAt: -1 });
activitySchema.index({ type: 1, status: 1 });
activitySchema.index({ scheduledStart: 1 });
activitySchema.index({ status: 1, scheduledStart: 1 });
activitySchema.index({ 'metadata.source': 1 });

// Pre-save middleware
activitySchema.pre('save', function(next) {
  // Calculate duration for completed activities
  if (this.actualStart && this.actualEnd) {
    this.duration = Math.floor((this.actualEnd - this.actualStart) / (1000 * 60)); // Convert to minutes
  }
  
  // Set completed status for tasks when completedAt is set
  if (this.type === 'task' && this.taskDetails?.completedAt && this.status !== 'completed') {
    this.status = 'completed';
  }
  
  // Validate scheduled times
  if (this.scheduledEnd && this.scheduledStart && this.scheduledEnd < this.scheduledStart) {
    return next(new Error('Scheduled end time must be after start time'));
  }
  
  next();
});

// Post-save middleware to update related records
activitySchema.post('save', async function(doc) {
  // Update last activity date on related records
  try {
    const Model = mongoose.model(doc.relatedToModel);
    await Model.findByIdAndUpdate(doc.relatedTo, {
      'lifecycle.lastActivityDate': doc.createdAt
    });
  } catch (error) {
    console.error('Error updating related record:', error);
  }
});

// Method to complete activity
activitySchema.methods.complete = async function(notes = null) {
  this.status = 'completed';
  this.actualEnd = new Date();
  
  if (!this.actualStart) {
    this.actualStart = this.scheduledStart || new Date();
  }
  
  if (this.type === 'task') {
    this.taskDetails.completedAt = new Date();
    if (notes) {
      this.taskDetails.completionNotes = notes;
    }
  }
  
  return this.save();
};

// Method to cancel activity
activitySchema.methods.cancel = async function(reason = null) {
  this.status = 'cancelled';
  if (reason) {
    this.description = this.description ? `${this.description}\n\nCancelled: ${reason}` : `Cancelled: ${reason}`;
  }
  return this.save();
};

// Method to reschedule activity
activitySchema.methods.reschedule = async function(newStart, newEnd = null) {
  this.scheduledStart = newStart;
  if (newEnd) {
    this.scheduledEnd = newEnd;
  } else if (this.scheduledEnd) {
    // Maintain the same duration
    const originalDuration = this.scheduledEnd - this.scheduledStart;
    this.scheduledEnd = new Date(newStart.getTime() + originalDuration);
  }
  
  // Reset reminder if it was already sent
  if (this.reminder.enabled && this.reminder.sent) {
    this.reminder.sent = false;
  }
  
  return this.save();
};

// Method to add participant
activitySchema.methods.addParticipant = async function(userId) {
  if (!this.participants.includes(userId)) {
    this.participants.push(userId);
    return this.save();
  }
  return this;
};

// Static method to get upcoming activities
activitySchema.statics.getUpcoming = async function(userId, days = 7) {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);
  
  return this.find({
    $or: [
      { owner: userId },
      { participants: userId }
    ],
    status: { $in: ['planned', 'in_progress'] },
    scheduledStart: {
      $gte: new Date(),
      $lte: endDate
    }
  })
  .sort({ scheduledStart: 1 })
  .populate('relatedTo')
  .populate('owner', 'firstName lastName email')
  .populate('participants', 'firstName lastName email');
};

// Static method to get overdue activities
activitySchema.statics.getOverdue = async function(userId) {
  return this.find({
    $or: [
      { owner: userId },
      { participants: userId }
    ],
    status: { $in: ['planned', 'in_progress'] },
    scheduledStart: { $lt: new Date() }
  })
  .sort({ scheduledStart: 1 })
  .populate('relatedTo')
  .populate('owner', 'firstName lastName email');
};

// Static method to get activity timeline
activitySchema.statics.getTimeline = async function(relatedTo, relatedToModel, limit = 50) {
  return this.find({
    relatedTo,
    relatedToModel
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .populate('owner', 'firstName lastName email avatar')
  .populate('participants', 'firstName lastName email');
};

// Static method to get activity summary
activitySchema.statics.getSummary = async function(userId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        owner: mongoose.Types.ObjectId(userId),
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: {
          type: '$type',
          status: '$status'
        },
        count: { $sum: 1 },
        totalDuration: { $sum: '$duration' }
      }
    },
    {
      $group: {
        _id: '$_id.type',
        statuses: {
          $push: {
            status: '$_id.status',
            count: '$count',
            totalDuration: '$totalDuration'
          }
        },
        total: { $sum: '$count' }
      }
    }
  ]);
};

const Activity = mongoose.model('Activity', activitySchema);

module.exports = Activity;