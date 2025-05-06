import mongoose from 'mongoose';

const neededBloodSchema = new mongoose.Schema({
    bloodType: {
          type: [String],
        required: true,
    },
}, { timestamps: true });

const NeededBlood = mongoose.model('NeededBlood', neededBloodSchema);

export default NeededBlood;
