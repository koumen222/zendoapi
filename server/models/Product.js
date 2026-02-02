import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema(
  {
    qty: { type: Number, default: 1, min: 1 },
    label: { type: String, default: '' },
    priceValue: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    productName: { type: String, required: true, trim: true },
    shortDesc: { type: String, default: '' },
    images: { type: [String], default: [] },
    offers: { type: [offerSchema], default: [] },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

productSchema.index({ slug: 1 }, { unique: true });

export default mongoose.model('Product', productSchema);
