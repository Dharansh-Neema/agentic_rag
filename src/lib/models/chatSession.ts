import mongoose, { Schema, Document } from 'mongoose';

// Message interface
export interface IMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Message schema
const MessageSchema = new Schema<IMessage>({
  role: { 
    type: String, 
    enum: ['user', 'assistant'], 
    required: true 
  },
  content: { 
    type: String, 
    required: true 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
});

// Chat session interface
export interface IChatSession extends Document {
  title: string;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// Chat session schema
const ChatSessionSchema = new Schema<IChatSession>({
  title: { 
    type: String, 
    required: true 
  },
  messages: [MessageSchema],
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Update the updatedAt field on save
ChatSessionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create model if it doesn't exist (for Next.js hot reloading)
export const ChatSession = mongoose.models.ChatSession || 
  mongoose.model<IChatSession>('ChatSession', ChatSessionSchema);
