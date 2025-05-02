import { body } from 'express-validator';

export const registerValidation = [
    body('email', 'Невірний формат електронної адреси').isEmail(),
    
    body('password', 'Пароль повинен містити мінімум 5 символів').isLength({ min: 5 }),
    body('fullName', 'Вкажіть ім\'я').isLength({ min: 3 }),
    body('avatarUrl').optional().isURL(),
];

export const loginValidation = [
    body('email', 'Невірний формат електронної адреси').isEmail(),
    body('password', 'Пароль повинен містити мінімум 5 символів').isLength({ min: 5 }),
];
