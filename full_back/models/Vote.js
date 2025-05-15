const mongoose = require('mongoose');

const VoteSchema = new mongoose.Schema({
  userId: { type: String, required: true },  // Хто проголосував
  candidateId: { type: String, required: true } // За кого
});

module.exports = mongoose.model('vote', VoteSchema);