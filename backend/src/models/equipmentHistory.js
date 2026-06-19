import mongoose, { Schema } from "mongoose";

const equipmentHistorySchema = new mongoose.Schema({
  equipment: { 
    type: Schema.Types.ObjectId, 
    ref: "Equipment", 
    required: true 
  },
  status: { 
    type: String, 
    required: true 
  },
  previousStatus: {
    type: String,
    required: true,
    default: "unknown"
  },
  user: {
    type: Schema.Types.ObjectId, 
    ref: "User", 
    default: null 
  },
  roll_no: { 
    type: String 
  },
  duration: { 
    type: String,
    default: null
  },
  unregisteredName: {
    type: String,
    default: null,
  },
  unregisteredPhone: {
    type: String,
    default: null,
  },
  changedAt: {
    type: Date,
    default: Date.now
  },
  expireAt: {
    type: Date,
    default: function () {
      const now = new Date();
      now.setMonth(now.getMonth() + 3);
      return now;
    },
  },

});

equipmentHistorySchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

export const EquipmentHistory = mongoose.model("EquipmentHistory", equipmentHistorySchema);