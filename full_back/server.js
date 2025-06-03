const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require('path');
const app = express();
const PORT = 3000;


mongoose.connect('mongodb+srv://tyshchenkooleksandra:tibvo7-qeGvep-wagfep@cluster0.yjgfflt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.log('MongoDB connection error:', err));

// Обробники подій підключення
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to DB');
});
mongoose.connection.on('error', (err) => {
  console.log('Mongoose connection error:', err);
});


// Middleware
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000' 
}));


app.use(express.static(path.join(__dirname, '../full_front')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../full_front/voting.html'));
});

// Маршрути
const votingRoutes = require('./routes/voting');
const authRoutes = require('./routes/auth');

app.use('/api/voting', votingRoutes);
app.use('/api/auth', authRoutes);

// Моделі
const Voting = require('./models/voting');
const Candidate = require('./models/candidate');
const Vote = require('./models/vote');
const User = require('./models/user');

app.post('/api/vote', async (req, res) => {
  try {
    const { userId, votingId, candidateId } = req.body;
    // Перевірка: чи вже голосував цей user у цьому голосуванні
    const candidate = await Candidate.findOne({ _id: candidateId, votingId });
    if (!candidate) {
      return res.status(400).json({ message: 'Кандидата не знайдено у цьому голосуванні' });
    }
    const alreadyVoted = await Vote.findOne({ userId, candidateId });
    if (alreadyVoted) {
      return res.status(400).json({ message: 'Ви вже проголосували за цього кандидата' });
    }
    const vote = new Vote({ userId, candidateId });
    await vote.save();
    res.json({ message: 'Голос зараховано' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});