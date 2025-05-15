const mongoose = require('mongoose');

const VotingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  ownerId: { type: String, required: true }, // ID хазяїна
  isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model('voting', VotingSchema);