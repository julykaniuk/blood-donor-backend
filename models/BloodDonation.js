import mongoose from "mongoose";
const Schema = mongoose.Schema;

const bloodDonationStatsSchema = new Schema({
    donorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    bloodGroup: {
        type: String,
        enum: ['A', 'B', 'AB', 'O'],
        required: true
    },
    rhFactor: {
        type: String,
        enum: ['+', '-'],
        required: true
    },
    typesDonations: [{
        bloodType: {
            type: String,
            enum: ['Whole Blood', 'Plasma', 'Platelets', 'Granulocytes'],
            required: true
        },
        amountMl: {
            type: Number,
            required: true
        }
    }],
    donationDate: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('BloodDonationStats', bloodDonationStatsSchema);
