import express from 'express';
import mongoose from 'mongoose';
import {registerValidation, loginValidation} from './validations/auth.js';
import cors from 'cors';
import {UserController,EventController ,syncEventsController,bloodDonationStatsController,donationController,NeededBloodController} from './controllers/index.js';
import cron from 'node-cron';
import dotenv from 'dotenv';
import { handleValidationErrors, checkAuth } from './utils/index.js';
import multer from 'multer';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

const app = express();
app.use(express.json());
app.use(cors());
dotenv.config(); 

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch((err) => console.log('MongoDB connection error:', err));

cron.schedule('0 0 * * *', async () => {
  try {
    await UserController.updateDonationsPeriod();  
    console.log('Оновлено donationsPeriod для всіх користувачів.');
  } catch (error) {
    console.error('Помилка при виконанні завдання:', error);
  }
});
app.post('/user/updateAvatar', checkAuth, upload.single('image'), UserController.uploadAvatar);

app.use('/uploads', express.static('uploads'));
app.post('/auth/login',loginValidation, handleValidationErrors, UserController.login);
app.post('/auth/register', registerValidation,handleValidationErrors, UserController.register);
app.get('/auth/me', checkAuth, UserController.getMe);
app.get('/auth/user', checkAuth, UserController.getUsers);
app.get('/auth/getUser/:id', UserController.getUserById);
app.put('/user/update', checkAuth, UserController.updateProfile);

app.post('/calendar/createEvent', checkAuth, EventController.createEvent);
app.get('/calendar/getEvent', checkAuth, EventController.getEvents);
app.delete('/calendar/deleteEvent/:eventId',checkAuth, EventController.deleteEvent);

app.post('/syncEvents', syncEventsController.syncEventsToUsers);
app.delete('/syncDeleteEvent/:eventId',checkAuth, syncEventsController.syncDeleteEvent);

app.post('/needBlood/cteate',checkAuth, NeededBloodController.createNeededBlood);
app.get('/getNeedBlood',NeededBloodController.getNeededBlood);


app.post('/blood-donations',checkAuth, bloodDonationStatsController.addDonation);
app.post('/user/contraindications', checkAuth, UserController.updateContraindications);

app.get('/blood-donations',checkAuth, bloodDonationStatsController.getAllDonations);
app.delete('/blood-donations/:id',checkAuth, bloodDonationStatsController.deleteDonation);

app.put('/confirm/:userId',checkAuth, donationController.confirmDonation);
app.get('/donation', donationController.getBloodDonationSummary);
app.get('/getDonationPeriod', donationController.getDonationSummaryByPeriod);
app.delete('/donation/delete/',checkAuth, donationController.decreaseDonationSummary);

app.post('/user/contraindications', checkAuth, UserController.updateContraindications);


app.listen(3000, (err) => {
    if (err) return console.log(err);
    console.log("Server running on port 3000");
});
