const express = require('express');
const router = express.Router();
const Voting = require('../models/voting'); 
const Candidate = require('../models/candidate'); 
const mongoose = require('mongoose');
const Vote = require('../models/vote');

// POST-маршрут для створення голосування
router.post('/create', async (req, res) => {
  try {
    const { title, ownerId } = req.body;
    const voting = new Voting({ title, ownerId });
    await voting.save();
    res.json(voting);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET-маршрут для отримання списку голосувань
router.get('/', (req, res) => {
  res.json({ 
    message: "Це тестовий GET-запит!",
    instructions: "Тут мають бути ваші голосування" 
  });
});

// GET /voting/active — повертає всі активні голосування з кандидатами і голосами
router.get('/active', async (req, res) => {
  try {
    const votings = await Voting.find({ isActive: true });
    const result = await Promise.all(votings.map(async voting => {
      const candidates = await Candidate.find({ votingId: voting._id });
      // Підрахунок голосів для кожного кандидата
      const candidatesWithVotes = await Promise.all(candidates.map(async candidate => {
        const votesCount = await Vote.countDocuments({ candidateId: candidate._id.toString() });
        return {
          ...candidate.toObject(),
          votes: votesCount
        };
      }));
      // Загальна кількість голосів по голосуванню
      const totalVotes = candidatesWithVotes.reduce((sum, c) => sum + c.votes, 0);
      return {
        ...voting.toObject(),
        candidates: candidatesWithVotes,
        totalVotes
      };
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /voting/:id/candidates — додати кандидата до голосування
router.post('/:id/candidates', async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'Некоректний ID голосування' });
  }
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Імʼя кандидата обовʼязкове' });
  }
  try {
    const candidate = new Candidate({ name, votingId: req.params.id });
    await candidate.save();
    res.json(candidate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /voting/:id/candidates — повертає кандидатів для голосування
router.get('/:id/candidates', async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'Некоректний ID голосування' });
  }
  try {
    const candidates = await Candidate.find({ votingId: req.params.id });
    res.json(candidates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/start', async (req, res) => {
  try {
    await Voting.findByIdAndUpdate(req.params.id, { isActive: true });
    res.json({ message: 'Голосування запущено' });
  } catch (err) {
    res.status(500).json({ message: 'Помилка запуску голосування' });
  }
});

router.post('/:id/stop', async (req, res) => {
  try {
    await Voting.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Голосування зупинено' });
  } catch (err) {
    res.status(500).json({ message: 'Помилка зупинки голосування' });
  }
});


module.exports = router;
