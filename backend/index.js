require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const hospitalRoutes = require('./routes/hospitalRoutes');
const appointmentRoutes = require('./routes/appointmenthospitalRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const adminRoutes = require('./routes/adminRoutes');
const clinicRoutes = require('./routes/clinicRoutes');
const pharmacyRoutes = require('./routes/pharmacyRoutes');
const labRoutes = require('./routes/labRoutes');
const clinicalRoutes = require('./routes/clinicalRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const errorHandler = require('./middleware/errorMiddleware');

const app = express();

// 1. Standard Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Static Folder for Uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 3. API Routes
app.use('/auth', authRoutes);
app.use('/patient', patientRoutes);
app.use('/hospital', hospitalRoutes);
app.use('/appointment', appointmentRoutes);
app.use('/doctor', doctorRoutes);
app.use('/admin', adminRoutes);
app.use('/clinic', clinicRoutes);
app.use('/pharmacy', pharmacyRoutes);
app.use('/lab', labRoutes);
app.use('/clinical', clinicalRoutes);
app.use('/feedback', feedbackRoutes);

// 4. 404 Route Not Found Middleware (Optional)
app.use((req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
});

// 5. Custom Error Handler Middleware
app.use(errorHandler);

// 6. Connect Database & Start Server Gracefully
const PORT = process.env.PORT || 5000;
const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server due to DB connection error:', error);
        process.exit(1);
    }
};

startServer();