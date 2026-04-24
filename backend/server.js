const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

if (!process.env.JWT_SECRET) {
  console.warn(
    '[Security] JWT_SECRET is not set in .env — tokens use a default key. Set JWT_SECRET for production.'
  );
}

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/internships', require('./routes/internship'));
app.use('/', require('./routes/application'));
app.use('/notifications', require('./routes/notification'));
app.use('/admin', require('./routes/admin'));

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Internship Awareness System API running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

