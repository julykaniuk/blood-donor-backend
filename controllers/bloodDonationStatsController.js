import BloodDonationStats from '../models/BloodDonation.js';

export const addDonation = async (req, res) => {
    try {
        const { userId, bloodType, bloodGroup, rhFactor, amountMl, donationDate } = req.body;

        const newDonation = new BloodDonationStats({
            userId,
            bloodType,
            bloodGroup,
            rhFactor,
            amountMl,
            donationDate
        });

        await newDonation.save();

        const totalAmount = await BloodDonationStats.aggregate([
            { $group: { _id: null, totalAmount: { $sum: "$amountMl" } } }
        ]);

        res.status(201).json({
            message: 'Статистика здачі крові збережена успішно',
            data: newDonation,
            totalAmount: totalAmount[0]?.totalAmount || 0
        });
    } catch (err) {
        console.error('Помилка при збереженні статистики здачі крові:', err);
        res.status(500).json({ message: 'Сталася помилка при збереженні статистики' });
    }
};

export const getAllDonations = async (req, res) => {
    try {
        const donations = await BloodDonationStats.find()
            .populate('userId', 'name email')
            .sort({ donationDate: -1 });

        const totalAmount = await BloodDonationStats.aggregate([
            { $group: { _id: null, totalAmount: { $sum: "$amountMl" } } }
        ]);

        res.status(200).json({
            message: 'Статистика здачі крові отримана успішно',
            data: donations,
            totalAmount: totalAmount[0]?.totalAmount || 0
        });
    } catch (err) {
        console.error('Помилка при отриманні статистики здачі крові:', err);
        res.status(500).json({ message: 'Сталася помилка при отриманні статистики' });
    }
};

export const deleteDonation = async (req, res) => {
    try {
        const { id } = req.params;

        const donation = await BloodDonationStats.findById(id);
        if (!donation) {
            return res.status(404).json({ message: 'Запис не знайдений' });
        }

        await donation.remove();

        const totalAmount = await BloodDonationStats.aggregate([
            { $group: { _id: null, totalAmount: { $sum: "$amountMl" } } }
        ]);

        res.status(200).json({
            message: 'Запис про здачу крові видалено успішно',
            totalAmount: totalAmount[0]?.totalAmount || 0
        });
    } catch (err) {
        console.error('Помилка при видаленні статистики здачі крові:', err);
        res.status(500).json({ message: 'Сталася помилка при видаленні статистики' });
    }
};
