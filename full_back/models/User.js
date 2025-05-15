const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'host'], default: 'user' } // Ролі: user (звичайний), host (хазяїн)
});

module.exports = mongoose.model('user', UserSchema);