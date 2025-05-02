import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    passwordHash: {
        type: String,
        required: true,
    },
      confirmPassword: {
        type: String
    },
    avatarUrl: String,
    gender: String,
    homeAddress: String,
    firstName: {
        type: String,
    },
    lastName: {
        type: String,
    },
    phone: String,
    bloodGroup: String,
    rhFactor: String,
    height: Number,
    weight: Number,
    HBD: Date,
    contraindications: [{
    name: String,
    days: Number,
    date: Date
    }],
    donationsPeriod: Number,
    donations: {
        total: {
            type: Number,
            default: 0,
        },
        canceled: {
            type: Number,
            default: 0,
        },
        scheduled: {
            type: Number,
            default: 0,
        },
        completed: {
            type: Number,
            default: 0,
        },
         wholeBlood: {
            type: Number,
            default: 0,
        },
        platelets: {
            type: Number,
            default: 0,
        },
        plasma: {
            type: Number,
            default: 0,
        },
        granulocytes: {
            type: Number,
            default: 0,
        },
    },
    performedDonations: [
        {
            idEvent: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
            date: Date,
            name: String,
            address: String,
            city: String,
            donationType: String,
            status: {
                type: String,
                enum: ['completed', 'scheduled', 'canceled'],
            },
        },
    ],
}, { timestamps: true });
UserSchema.pre('save', function (next) {
    this.donations.total = this.donations.completed + this.donations.canceled + this.donations.scheduled;
    next();
});

UserSchema.pre('findOneAndUpdate', function (next) {
    const update = this.getUpdate();
    if (update.donations) {
        update.donations.total = (update.donations.completed || 0) + (update.donations.canceled || 0) + (update.donations.scheduled || 0);
    }
    next();
});

UserSchema.methods.getUserInfo = function() {
    const { firstName, lastName, bloodGroup, rhFactor, performedDonations, phone, email } = this;

    const name = firstName && lastName ? `${firstName} ${lastName}` : email;
    const bloodType = bloodGroup && rhFactor ? `${bloodGroup} ${rhFactor}` : '---';
    const contacts = phone || '---';
    const lastDonationCompleted = performedDonations?.filter(donation => donation.status === 'completed').pop();

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('uk-UA');
    };

    const lastDonation = lastDonationCompleted ? formatDate(lastDonationCompleted.date) : '---';
    const donationType = lastDonationCompleted ? lastDonationCompleted.donationType : '---';
    const profileLink = `/${this._id}`;

    return {
        name,
        bloodType,
        lastDonation,
        donationType,
        contacts,
        profileLink,
    };
};

export default mongoose.model('User', UserSchema);
