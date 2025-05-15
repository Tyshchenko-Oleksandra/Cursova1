const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/user'); 

// Реєстрація (для хазяїнів голосувань)
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email вже зареєстровано' });
    const hash = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hash });
    await user.save();
    res.json({ message: 'Користувача зареєстровано' });
  } catch (e) {
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// Логін (для всіх)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    // Якщо вже залогінений цей користувач
    if (req.session && req.session.user && req.session.user.email === email) {
      return res.json({ 
        message: `Вхід вже виконано через користувача ${email}`,
        email 
      });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Невірний email або пароль' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Невірний email або пароль' });
    }
    // Зберігаємо користувача у сесії
    if (req.session) {
      req.session.user = { email };
    }
    res.json({ 
      message: `Вхід виконано через користувача ${email}`,
      email,
      userId: user._id 
    });
  } catch (err) {
    res.status(500).json({ message: 'Помилка входу' });
  }
});

module.exports = router;