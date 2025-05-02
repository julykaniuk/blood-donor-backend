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

