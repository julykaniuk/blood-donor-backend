import { body } from "express-validator";

export const appointmentValidation = [
    body("title", "Вкажіть ім'я").isLength({ min: 3 }),
    body("donationType").isArray().withMessage("Тип донації має бути списком"),
];
