import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

import UserModel from '../models/User.js';

export const register = async (req, res) => {
    try {
        const password = req.body.password;
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const doc = new UserModel({
            email: req.body.email,
            fullName: req.body.fullName,
            avatarUrl: req.body.avatarUrl,
            passwordHash: hash,
        });

        const user = await doc.save();

        const token = jwt.sign(
            {
                _id: user._id,
                 _email: user.email,
            },
            'secret123',
            {
                expiresIn: '30d',
            },
        );

        const { passwordHash, ...userData } = user._doc;

        res.json({
            ...userData,
            token,
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: 'Не вийшло зареєструватись',
        });
    }
};

export const login = async (req, res) => {
    try {
        const user = await UserModel.findOne({ email: req.body.email });

        if (!user) {
            return res.status(404).json({
                message: 'Користувач не знайдений',
            });
        }

        const isValidPass = await bcrypt.compare(req.body.password, user._doc.passwordHash);

        if (!isValidPass) {
            return res.status(400).json({
                message: 'Неправильний логін чи пароль',
            });
        }

        const token = jwt.sign(
            {
                _id: user._id,
                 _email: user.email,
            },
            'secret123',
            {
                expiresIn: '30d',
            },
        );

        const { passwordHash, ...userData } = user._doc;

        res.json({
            ...userData,
            token,
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: 'Не вийшло авторизуватись',
        });
    }
};

export const getMe = async (req, res) => {
    try {
        const user = await UserModel.findById(req.userId);

        if (!user) {
            return res.status(404).json({
                message: 'Користувач не знайдений',
            });
        }

        const { passwordHash, ...userData } = user._doc;

        res.json(userData);
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: 'Нема доступа',
        });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { userId } = req;
        const {
            fullName,
            avatarUrl,
            gender,
            passwordHash, 
            confirmPassword,
            firstName,
            lastName,
            homeAddress,
            phone,
            bloodGroup,
            rhFactor,
            HBD,
            height,
            weight
        } = req.body;

        if (passwordHash && passwordHash !== confirmPassword) {
            return res.status(400).json({ message: 'Паролі не співпадають' });
        }

        const updateData = {
            fullName,
            avatarUrl,
            gender,
            firstName,
            lastName,
            homeAddress,
            phone,
            bloodGroup,
            rhFactor,
            height,
            HBD,
            weight
        };

        if (passwordHash) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(passwordHash, salt); 
            updateData.passwordHash = hashedPassword; 
        }

        const updatedUser = await UserModel.findByIdAndUpdate(userId, updateData, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ message: 'Користувач не знайдений' });
        }

        const { passwordHash: _, ...userData } = updatedUser._doc; 

        res.json(userData);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Не вдалося оновити профіль' });
    }
};
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не завантажено' });
    }

    const avatarUrl = `/uploads/${req.file.originalname}`;

    const updatedUser = await UserModel.findByIdAndUpdate(
      req.userId,
      { avatarUrl },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'Користувача не знайдено' });
    }

    res.json({
      message: 'Аватар успішно оновлено',
      avatarUrl: updatedUser.avatarUrl,
    });
  } catch (err) {
    console.error('Помилка при завантаженні аватара:', err);
    res.status(500).json({ error: 'Не вдалося оновити аватар' });
  }
};

export const getUsers = async (req, res) => {
    try {
        const users = await UserModel.find({});

        const usersInfo = users.map(user => user.getUserInfo()); 
        return res.json(usersInfo);  

    } catch (error) {
        console.error('Помилка під час отримання користувачів:', error);
        res.status(500).json({ message: "Помилка отримання записів" });
    }
};
export const getUserById = async (req, res) => {
    try {
        const user = await UserModel.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                message: 'Користувач не знайдений',
            });
        }

        const { passwordHash, ...userData } = user._doc;

        res.json(userData);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: 'Помилка при отриманні користувача',
        });
    }
};
export const updateContraindications = async (req, res) => {
  const { name, days } = req.body;

  if (!name || !days) {
    return res.status(400).json({ message: "Ім’я та дні є обов’язковими" });
  }

  try {
    const user = await UserModel.findById(req.userId);
    if (!user) return res.status(404).json({ message: "Користувача не знайдено" });

    const newContra = {
      name,
      days,
      date: new Date(),
    };

    if (!Array.isArray(user.contraindications)) {
      user.contraindications = [];
    }

    user.contraindications.push(newContra);

    const today = new Date();
    user.contraindications = user.contraindications.filter(({ date, days }) => {
      const diff = (today - new Date(date)) / (1000 * 60 * 60 * 24);
      return diff < days;
    });

    let maxRemainingDays = 0;
    for (const { date, days } of user.contraindications) {
      const passed = (today - new Date(date)) / (1000 * 60 * 60 * 24);
      const remaining = Math.max(days - passed, 0);
      if (remaining > maxRemainingDays) {
        maxRemainingDays = remaining;
      }
    }

    user.donationsPeriod = Math.ceil(maxRemainingDays);

    await user.save();

    res.json({
      contraindications: user.contraindications,
      donationsPeriod: user.donationsPeriod
    });
  } catch (err) {
    console.error("Помилка серверу:", err);
    res.status(500).json({ message: "Помилка серверу", error: err.message });
  }
};


const updateDonationsPeriod = async () => {
  try {
    const users = await UserModel.find(); 
    for (const user of users) {  
      if (user.donationsPeriod > 0) {
        user.donationsPeriod -= 1;

        if (user.donationsPeriod <= 0) {
          console.log(`Користувач ${user._id} може зробити нову донацію.`);
        }

        await user.save();
        console.log(`Оновлено donationsPeriod для користувача ${user._id}: ${user.donationsPeriod}`);
      }
    }
  } catch (error) {
    console.error('Помилка при оновленні donationsPeriod:', error);
  }
};
