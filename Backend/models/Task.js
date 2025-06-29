const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [200, 'Task title cannot exceed 200 characters']
  },
  description: {
    type: String,
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Assignee is required']
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  watchers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['todo', 'in_progress', 'in_review', 'done', 'cancelled'],
    default: 'todo',
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    required: true
  },
  type: {
    type: String,
    enum: ['task', 'bug', 'feature', 'improvement', 'research'],
    default: 'task',
    required: true
  },
  dueDate: {
    type: Date,
    index: true
  },
  startDate: Date,
  completedDate: Date,
  estimatedHours: {
    type: Number,
    min: 0,
    max: 999
  },
  actualHours: {
    type: Number,
    min: 0,
    max: 999
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  project: {
    type: String,
    trim: true,
    maxlength: [100, 'Project name cannot exceed 100 characters']
  },
  sprint: {
    type: String,
    trim: true,
    maxlength: [50, 'Sprint name cannot exceed 50 characters']
  },
  labels: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [30, 'Label cannot exceed 30 characters']
  }],
  attachments: [{
    name: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    size: Number,
    type: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    text: {
      type: String,
      required: true,
      maxlength: [2000, 'Comment cannot exceed 2000 characters']
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    editedAt: Date,
    mentions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  }],
  subtasks: [{
    title: {
      type: String,
      required: true,
      maxlength: [200, 'Subtask title cannot exceed 200 characters']
    },
    completed: {
      type: Boolean,
      default: false
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    completedAt: Date,
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  linkedTasks: [{
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    },
    linkType: {
      type: String,
      enum: ['blocks', 'is_blocked_by', 'relates_to', 'duplicates'],
      required: true
    }
  }],
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  timeTracking: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    startTime: {
      type: Date,
      required: true
    },
    endTime: Date,
    duration: Number, // in minutes
    description: String,
    billable: {
      type: Boolean,
      default: true
    }
  }],
  recurring: {
    enabled: {
      type: Boolean,
      default: false
    },
    pattern: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly']
    },
    interval: {
      type: Number,
      default: 1
    },
    endDate: Date,
    nextDueDate: Date
  },
  metadata: {
    source: {
      type: String,
      enum: ['manual', 'import', 'api', 'automation', 'recurring'],
      default: 'manual'
    },
    parentTaskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    },
    statusHistory: [{
      status: String,
      changedAt: Date,
      changedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      duration: Number // Time spent in this status (in hours)
    }],
    lastActivityAt: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for overdue status
taskSchema.virtual('isOverdue').get(function() {
  return this.dueDate && 
         this.dueDate < new Date() && 
         !['done', 'cancelled'].includes(this.status);
});

// Virtual for time until due
taskSchema.virtual('timeUntilDue').get(function() {
  if (!this.dueDate) return null;
  const now = new Date();
  const diff = this.dueDate - now;
  return Math.floor(diff / (1000 * 60 * 60 * 24)); // Days
});

// Virtual for subtask completion percentage
taskSchema.virtual('subtaskProgress').get(function() {
  if (!this.subtasks || this.subtasks.length === 0) return 100;
  const completed = this.subtasks.filter(st => st.completed).length;
  return Math.round((completed / this.subtasks.length) * 100);
});

// Virtual for total tracked time
taskSchema.virtual('totalTrackedTime').get(function() {
  return this.timeTracking.reduce((total, entry) => {
    return total + (entry.duration || 0);
  }, 0);
});

// Indexes
taskSchema.index({ assignee: 1, status: 1 });
taskSchema.index({ reporter: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ priority: 1, status: 1 });
taskSchema.index({ project: 1, sprint: 1 });
taskSchema.index({ labels: 1 });
taskSchema.index({ 'metadata.lastActivityAt': -1 });
taskSchema.index({ 
  title: 'text', 
  description: 'text' 
});

// Pre-save middleware
taskSchema.pre('save', function(next) {
  // Update metadata on activity
  this.metadata.lastActivityAt = new Date();
  
  // Track status changes
  if (this.isModified('status')) {
    if (!this.metadata.statusHistory) {
      this.metadata.statusHistory = [];
    }
    
    // Calculate duration in previous status
    if (this.metadata.statusHistory.length > 0) {
      const lastStatus = this.metadata.statusHistory[this.metadata.statusHistory.length - 1];
      lastStatus.duration = Math.floor((Date.now() - lastStatus.changedAt) / (1000 * 60 * 60)); // Hours
    }
    
    // Add new status entry
    this.metadata.statusHistory.push({
      status: this.status,
      changedAt: new Date(),
      changedBy: this._lastModifiedBy // Set this before saving
    });
    
    // Set completed date
    if (this.status === 'done' && !this.completedDate) {
      this.completedDate = new Date();
    } else if (this.status !== 'done') {
      this.completedDate = null;
    }
  }
  
  // Update progress based on status
  if (this.isModified('status')) {
    const statusProgress = {
      'todo': 0,
      'in_progress': 25,
      'in_review': 75,
      'done': 100,
      'cancelled': 0
    };
    this.progress = statusProgress[this.status] || this.progress;
  }
  
  // Calculate actual hours from time tracking
  this.actualHours = Math.round(this.totalTrackedTime / 60 * 10) / 10; // Convert minutes to hours
  
  next();
});

// Method to add comment
taskSchema.methods.addComment = async function(text, authorId, mentions = []) {
  this.comments.push({
    text,
    author: authorId,
    mentions,
    createdAt: new Date()
  });
  
  // Notify mentioned users
  if (mentions.length > 0) {
    // Add mentioned users to watchers
    mentions.forEach(userId => {
      if (!this.watchers.includes(userId)) {
        this.watchers.push(userId);
      }
    });
  }
  
  return this.save();
};

// Method to update progress
taskSchema.methods.updateProgress = async function(progress) {
  this.progress = Math.min(Math.max(progress, 0), 100);
  
  // Auto-update status based on progress
  if (progress === 100 && this.status !== 'done') {
    this.status = 'in_review';
  } else if (progress > 0 && progress < 100 && this.status === 'todo') {
    this.status = 'in_progress';
  }
  
  return this.save();
};

// Method to add time tracking entry
taskSchema.methods.trackTime = async function(userId, startTime, endTime, description, billable = true) {
  const duration = Math.floor((endTime - startTime) / (1000 * 60)); // Minutes
  
  this.timeTracking.push({
    user: userId,
    startTime,
    endTime,
    duration,
    description,
    billable
  });
  
  return this.save();
};

// Method to complete subtask
taskSchema.methods.completeSubtask = async function(subtaskIndex, userId) {
  if (this.subtasks[subtaskIndex]) {
    this.subtasks[subtaskIndex].completed = true;
    this.subtasks[subtaskIndex].completedAt = new Date();
    this.subtasks[subtaskIndex].completedBy = userId;
    
    // Update main task progress based on subtasks
    const completedSubtasks = this.subtasks.filter(st => st.completed).length;
    const subtaskProgress = Math.round((completedSubtasks / this.subtasks.length) * 100);
    
    // Only update if subtask progress would increase main progress
    if (subtaskProgress > this.progress) {
      this.progress = subtaskProgress;
    }
    
    return this.save();
  }
  
  throw new Error('Subtask not found');
};

// Method to create recurring task
taskSchema.methods.createNextRecurrence = async function() {
  if (!this.recurring.enabled || !this.recurring.nextDueDate) {
    return null;
  }
  
  // Check if we've passed the end date
  if (this.recurring.endDate && this.recurring.nextDueDate > this.recurring.endDate) {
    this.recurring.enabled = false;
    await this.save();
    return null;
  }
  
  // Create new task
  const Task = mongoose.model('Task');
  const newTask = new Task({
    ...this.toObject(),
    _id: undefined,
    status: 'todo',
    progress: 0,
    completedDate: undefined,
    actualHours: 0,
    timeTracking: [],
    comments: [],
    metadata: {
      source: 'recurring',
      parentTaskId: this._id,
      statusHistory: [],
      lastActivityAt: new Date()
    }
  });
  
  // Set new due date
  newTask.dueDate = this.recurring.nextDueDate;
  
  // Calculate next due date for current task
  const nextDate = new Date(this.recurring.nextDueDate);
  switch (this.recurring.pattern) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + this.recurring.interval);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + (this.recurring.interval * 7));
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + this.recurring.interval);
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + this.recurring.interval);
      break;
  }
  
  this.recurring.nextDueDate = nextDate;
  await this.save();
  
  return newTask.save();
};

// Static method to get tasks by status
taskSchema.statics.getByStatus = async function(userId, status) {
  return this.find({
    $or: [
      { assignee: userId },
      { reporter: userId },
      { watchers: userId }
    ],
    status
  })
  .populate('assignee', 'firstName lastName avatar')
  .populate('reporter', 'firstName lastName')
  .sort({ priority: -1, dueDate: 1 });
};

// Static method to get overdue tasks
taskSchema.statics.getOverdue = async function(userId) {
  return this.find({
    assignee: userId,
    dueDate: { $lt: new Date() },
    status: { $nin: ['done', 'cancelled'] }
  })
  .populate('reporter', 'firstName lastName')
  .sort({ dueDate: 1, priority: -1 });
};

// Static method to get task statistics
taskSchema.statics.getStatistics = async function(userId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        assignee: mongoose.Types.ObjectId(userId),
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $facet: {
        byStatus: [
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 }
            }
          }
        ],
        byPriority: [
          {
            $group: {
              _id: '$priority',
              count: { $sum: 1 }
            }
          }
        ],
        byType: [
          {
            $group: {
              _id: '$type',
              count: { $sum: 1 }
            }
          }
        ],
        completed: [
          {
            $match: { status: 'done' }
          },
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
              totalEstimated: { $sum: '$estimatedHours' },
              totalActual: { $sum: '$actualHours' }
            }
          }
        ],
        overdue: [
          {
            $match: {
              dueDate: { $lt: new Date() },
              status: { $nin: ['done', 'cancelled'] }
            }
          },
          {
            $count: 'count'
          }
        ]
      }
    }
  ]);
};

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;