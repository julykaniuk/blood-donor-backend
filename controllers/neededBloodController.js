import NeededBlood from '../models/NeededBlood.js'; 

const createNeededBlood = async (req, res) => {
    try {
        const { bloodType } = req.body;

        if (!bloodType || !Array.isArray(bloodType) || bloodType.length === 0) {
            return res.status(400).json({ message: 'Потрібно вказати типи крові у вигляді масиву' });
        }

        await NeededBlood.deleteMany({});

        const bloodTypesString = bloodType.join(', ');

        const newRequest = new NeededBlood({ bloodType: bloodTypesString });
        await newRequest.save();

        res.status(201).json({ message: 'Необхідні групи крові оновлено.', data: newRequest });
    } catch (error) {
        console.error('Помилка при створенні запиту:', error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
};


const getNeededBlood = async (req, res) => {
    try {
        const requests = await NeededBlood.find();
        res.status(200).json(requests);
    } catch (error) {
        console.error('Помилка при отриманні запитів:', error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
};

export { createNeededBlood, getNeededBlood };
