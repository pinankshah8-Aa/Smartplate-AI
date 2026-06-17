import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPushSubscription extends Document {
  userId: string;
  endpoint: string;
  keys: {
    auth: string;
    p256dh: string;
  };
  isActive: boolean;
}

const PushSubscriptionSchema: Schema = new Schema({
  userId: { type: String, required: true },
  endpoint: { type: String, required: true },
  keys: {
    auth: { type: String, required: true },
    p256dh: { type: String, required: true }
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const PushSubscription: Model<IPushSubscription> = mongoose.models.PushSubscription || mongoose.model<IPushSubscription>("PushSubscription", PushSubscriptionSchema);

export default PushSubscription;
