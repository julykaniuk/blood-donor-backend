import User from '../models/User.js';
import Event from '../models/Event.js';

const NAME='Закарпатська обласна станція переливання крові'
const ADDRESS = 'вул. Л. Толстого, 15';
const CITY = 'Ужгород';
export const syncEventsToUsers = async (req, res) => {
  const { eventId } = req.body;

  try {
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Подія не знайдена' });
    }

    console.log(`Знайдена подія для синхронізації: ${event._id}`);

    const user = await User.findOne({ email: event.userEmail });
    if (!user) {
      console.warn(`Користувача з email ${event.userEmail} не знайдено.`);
      return res.status(404).json({ message: 'Користувача не знайдено' });
    }

    const rawTypes = event.description || [];
    const mappedTypes = rawTypes.filter(type => ['Цільна кров', 'Плазма', 'Тромбоцити', 'Гранулоцити'].includes(type));

    if (mappedTypes.length === 0) {
      console.warn(`Типи донації для події ${event._id} не визначено.`);
      return res.status(400).json({ message: 'Типи донації не визначено' });
    }

    console.log(`Типи донації для події ${event._id}: ${mappedTypes.join(', ')}`);

    const eventAlreadyExists = user.performedDonations.some(donation =>
      new Date(donation.date).getTime() === new Date(event.start).getTime() &&
      mappedTypes.some(type => donation.donationType === type)
    );

    if (eventAlreadyExists) {
      console.log(`Подія вже існує для користувача ${user.email}, пропускаємо...`);
      return res.status(400).json({ message: `Подія вже існує для користувача ${user.email}` });
    }

    const newDonation = {
      idEvent: event._id,
      date: event.start,
      name: NAME,
      address: ADDRESS,
      city: CITY,
      donationType: mappedTypes.join(', '),
      status: 'scheduled',
    };

    console.log(`Додаємо нову донацію для користувача ${user.email}:`, newDonation);
    user.performedDonations.push(newDonation);

    if (!user.donations) {
      user.donations = { total: 0, scheduled: 0 };
    }

    user.donations.total += 1;
    user.donations.scheduled += 1;

    const donationTypes = ['Цільна кров', 'Плазма', 'Тромбоцити', 'Гранулоцити'];
    donationTypes.forEach((type) => {
      if (!user.donations[type]) {
        user.donations[type] = 0;
        console.log(`Ініціалізовано статистику для типу донації: ${type}`);
      }
    });

    mappedTypes.forEach((mappedType) => {
      user.donations[mappedType] += 1;
      console.log(`Оновлено статистику для ${mappedType}:`, user.donations[mappedType]);
    });

    console.log(`Зберігаємо зміни для користувача ${user.email}`);
    await user.save();
    console.log('Зміни збережено!');

    res.status(200).json({ message: 'Події синхронізовано з користувачами без дублікатів' });

  } catch (error) {
    console.error('Помилка при синхронізації подій:', error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};
export const syncDeleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    console.log('Received eventId:', eventId);

    if (!eventId) {
      return res.status(400).json({
        message: 'ID події не вказано',
      });
    }

    const user = await User.findOne({ 'performedDonations._id': eventId });

    if (!user) {
      return res.status(404).json({
        message: 'Користувача або події не знайдено',
      });
    }

    const donationIndex = user.performedDonations.findIndex(donation => donation._id.toString() === eventId);

    if (donationIndex === -1) {
      return res.status(404).json({
        message: 'Подія не знайдена серед донацій користувача',
      });
    }

    const removedDonation = user.performedDonations.splice(donationIndex, 1)[0];
    
    user.donations.scheduled = Math.max(0, user.donations.scheduled - 1);
    user.donations.canceled += 1;

    const donationTypes = removedDonation.donationType.split(', ');
    donationTypes.forEach((type) => {
      if (user.donations[type]) {
        user.donations[type] = Math.max(0, user.donations[type] - 1);
        console.log(`Зменшено статистику для ${type}:`, user.donations[type]);
      }
    });

    await Event.deleteOne({ _id: removedDonation.idEvent });

    await user.save();

    res.status(200).json({
      message: 'Подія успішно видалена з переліку донацій, таблиці Event, статистику оновлено',
       eventId,
    });
  } catch (error) {
    console.error('Помилка при видаленні події:', error);
    res.status(500).json({
      message: 'Помилка при видаленні події',
      error: error.message,
    });
  }
};
