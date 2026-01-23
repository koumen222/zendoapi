import mongoose from 'mongoose';

const cloudflareVisitSchema = new mongoose.Schema(
  {
    bucketStart: {
      type: Date,
      required: true,
    },
    bucket: {
      type: String,
      required: true,
      trim: true,
    },
    count: {
      type: Number,
      default: 0,
      min: 0,
    },
    source: {
      type: String,
      enum: ['daily', 'minute'],
      required: true,
    },
    zoneId: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

cloudflareVisitSchema.index({ source: 1, bucketStart: -1 });
cloudflareVisitSchema.index({ zoneId: 1, source: 1, bucketStart: 1 }, { unique: true });

export default mongoose.model('CloudflareVisit', cloudflareVisitSchema);
