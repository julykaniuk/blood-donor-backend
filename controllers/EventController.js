import { addMinutes } from 'date-fns';
import Event from '../models/Event.js'; 

export const createEvent = async (req, res) => {
  try {
    const { start, description } = req.body;

    if (!start || !description) {
      return res.status(400).json({
        message: 'Поле start та description є обов\'язковими',
      });
    }

    const startDate = new Date(start);
    
    if (isNaN(startDate.getTime())) {
      return res.status(400).json({
        message: 'Невірний формат дати для поля start',
      });
    }

    const endDate = addMinutes(startDate, 30);

    const newEvent = new Event({
      title: `Запис на донорство від ${req.userEmail}`,
      start: startDate,
      end: endDate,
      description: description,
      userEmail: req.userEmail,
    });

    await newEvent.save();


    res.status(201).json({
      message: 'Подію успішно створено',
      event: newEvent,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Помилка при створенні події',
      error: error.message,
    });
  }
};

export const getEvents = async (req, res) => {
  try {
    console.log('Отримано запит на події');
    console.log('Email користувача:', req.userEmail);

    if (req.userEmail === 'admin@gmail.com') {
      console.log('Користувач — адміністратор. Завантажуємо всі події...');
      const events = await Event.find(); 
      return res.json(events);
    } else {
      console.log('Користувач не адміністратор. Завантажуємо тільки його події...');
      const events = await Event.find({ userEmail: req.userEmail }); 
      return res.json(events);
    }
  } catch (error) {
    console.error('Помилка під час отримання подій:', error);
    res.status(500).json({ message: "Помилка отримання записів" });
  }
};
export const deleteEvent = async (req, res) => {
  try {
     const { eventId } = req.params;
    if (!eventId) {
      return res.status(400).json({
        message: 'ID події не вказано',
      });
    }

    const event = await Event.findByIdAndDelete(eventId);

    if (!event) {
      return res.status(404).json({
        message: 'Подія не знайдена',
      });
    }

    res.status(200).json({
      message: 'Подія успішно видалена',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Помилка при видаленні події',
      error: error.message,
    });
  }
};