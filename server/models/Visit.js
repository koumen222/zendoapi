import mongoose from 'mongoose';

const visitSchema = new mongoose.Schema(
  {
    path: {
      type: String,
      required: true,
      trim: true,
    },
    referrer: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
    ip: {
      type: String,
      default: '',
    },
    sessionId: {
      type: String,
      default: '',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index pour les requêtes de statistiques
visitSchema.index({ createdAt: -1 });
visitSchema.index({ path: 1, createdAt: -1 });

export default mongoose.model('Visit', visitSchema);
