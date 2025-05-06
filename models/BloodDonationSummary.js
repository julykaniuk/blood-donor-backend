import mongoose from "mongoose";

const bloodDonationSummarySchema = new mongoose.Schema({
    bloodType: { type: String, required: true },
    bloodGroup: { type: String, required: true },
    totalAmountMl: { type: Number, required: true },
    totalDonations: { type: Number, required: true }
});

export default mongoose.model("BloodDonationSummary", bloodDonationSummarySchema);