import User from '../models/User.js';
import BloodDonationStats from '../models/BloodDonation.js';
import BloodDonationSummary from "../models/BloodDonationSummary.js";

const updateDonationSummary = async (bloodGroup, rhFactor, typesDonations) => {
    const fullGroup = bloodGroup + rhFactor;

    for (const donation of typesDonations) {
        const { bloodType, amountMl } = donation;

        await BloodDonationSummary.findOneAndUpdate(
            { bloodType, bloodGroup: fullGroup },
            {
                $inc: {
                    totalAmountMl: amountMl,
                    totalDonations: 1
                }
            },
            { upsert: true }
        );
    }
};


export const confirmDonation = async (req, res) => {
    const { userId } = req.params;
    const { donationId, bloodGroup, rhFactor, typesDonations } = req.body;

    const donationTypesMapReverse = {
        'Whole Blood': 'wholeBlood',
        'Plasma': 'plasma',
        'Platelets': 'platelets',
        'Granulocytes': 'granulocytes'
    };
const donationTypesMap = {
    'Whole Blood': 'Цільна кров',
    'Plasma': 'Плазма',
    'Platelets': 'Тромбоцити',
    'Granulocytes': 'Гранулоцити'
};
    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'Користувача не знайдено' });

        const updateDonationCounters = () => {
            typesDonations.forEach(({ bloodType }) => {
                const key = donationTypesMapReverse[bloodType];
                if (key && typeof user.donations[key] === 'number') {
                    user.donations[key] += 1;
                }
            });
        };

        if (donationId) {
            const donation = user.performedDonations.find(d => d._id.toString() === donationId);
            if (!donation) return res.status(404).json({ message: 'Донацію не знайдено' });

            donation.status = 'completed';
            user.donations.completed += 1;
            user.donations.scheduled -= 1;
   const ukrainianTypes = typesDonations
        .map(({ bloodType }) => donationTypesMap[bloodType])
        .filter(Boolean);

    donation.donationType = ukrainianTypes.join(', ');

            updateDonationCounters();

            const newStat = new BloodDonationStats({
                donorId: user._id,
                bloodGroup,
                rhFactor,
                typesDonations: typesDonations.map(({ bloodType, amountMl }) => ({ bloodType, amountMl })),
                donationDate: donation.date
            });

            await newStat.save();
            await updateDonationSummary(bloodGroup, rhFactor, typesDonations);
            await user.save();

            return res.status(200).json({ message: 'Донація підтверджена успішно' });
        }

        const allDonations = typesDonations.map(({ bloodType, amountMl }) => ({
            bloodType,
            amountMl
        }));

        const newStat = new BloodDonationStats({
            donorId: user._id,
            bloodGroup,
            rhFactor,
            typesDonations: allDonations,
            donationDate: new Date()
        });

        await newStat.save();
        await updateDonationSummary(bloodGroup, rhFactor, typesDonations);
   const ukrainianTypes = typesDonations
        .map(({ bloodType }) => donationTypesMap[bloodType])
        .filter(Boolean);

    donation.donationType = ukrainianTypes.join(', ');
        updateDonationCounters();

        user.donations.completed += 1;
        user.donations.total += 1;

        await user.save();
        return res.status(200).json({ message: 'Усі донації підтверджено успішно' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
};

export const getBloodDonationSummary = async (req, res) => {
     try {
        const summary = await BloodDonationSummary.find().sort({ bloodType: 1, bloodGroup: 1 });
        res.status(200).json(summary);
    } catch (error) {
        console.error("Помилка при отриманні статистики донацій:", error);
        res.status(500).json({ message: "Помилка сервера при отриманні статистики" });
    }
};

export const getDonationSummaryByPeriod = async (req, res) => {
    try {
        const { period } = req.query; 

        let startDate = new Date();
        switch (period) {
            case 'week':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(startDate.getMonth() - 1);
                startDate.setDate(1);
                break;
            case '6months':
                startDate.setMonth(startDate.getMonth() - 6);
                startDate.setDate(1);
                break;
            case 'year':
                startDate.setFullYear(startDate.getFullYear() - 1);
                startDate.setMonth(0);
                startDate.setDate(1);
                break;
            default:
                return res.status(400).json({ message: "Невірний параметр періоду" });
        }

        let groupByField;
        let dateFormat;

        if (period === 'week') {
            groupByField = {
                $dateToString: { format: "%Y-%m-%d", date: "$donationDate" }
            };
            dateFormat = 'day'; 
        } else if (period === 'month') {
            groupByField = {
                $dateToString: { format: "%Y-%m-%d", date: "$donationDate" }
            };
            dateFormat = 'day';
        } else if (period === '6months' || period === 'year') {
            groupByField = {
                $month: "$donationDate"
            };
            dateFormat = 'month';
        }

        const summary = await BloodDonationStats.aggregate([
            { $match: { donationDate: { $gte: startDate } } },  
            { $unwind: "$typesDonations" },  
            {
                $group: {
                    _id: {
                        bloodType: "$typesDonations.bloodType",
                        period: groupByField 
                    },
                    totalAmountMl: { $sum: "$typesDonations.amountMl" }
                }
            },
            {
                $project: {
                    _id: 0,
                    bloodType: "$_id.bloodType",
                    period: "$_id.period",
                    totalAmountMl: 1
                }
            },
            { $sort: { bloodType: 1, period: 1 } } 
        ]);

        const result = summary.map(item => {
            return {
                [dateFormat]: item.period,  
                bloodType: item.bloodType,
                totalAmountMl: item.totalAmountMl
            };
        });

        res.status(200).json(result);

    } catch (error) {
        console.error("Помилка при отриманні статистики:", error);
        res.status(500).json({ message: "Помилка сервера при отриманні статистики" });
    }
};
export const decreaseDonationSummary = async (req, res) => {
    const { bloodType, bloodGroup, amountMl } = req.body;

    try {
        const summary = await BloodDonationSummary.findOne({ bloodType, bloodGroup });

        if (!summary) {
            return res.status(404).json({ message: 'Запис не знайдено' });
        }

        if (summary.totalAmountMl < amountMl || summary.totalDonations <= 0) {
            return res.status(400).json({ message: 'Недостатньо даних для зменшення' });
        }

        summary.totalAmountMl -= amountMl;
        summary.totalDonations -= 1;

        if (summary.totalAmountMl <= 0 || summary.totalDonations <= 0) {
            await summary.deleteOne(); 
            return res.status(200).json({ message: 'Запис видалено, оскільки кількість стала 0' });
        }

        await summary.save();
        res.status(200).json({ message: 'Дані оновлено', summary });
    } catch (error) {
        console.error("Помилка при зменшенні статистики:", error);
        res.status(500).json({ message: 'Помилка сервера при оновленні' });
    }
};
