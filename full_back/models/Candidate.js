const mongoose = require('mongoose');

const CandidateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  votingId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'voting' } // ID голосування
});

module.exports = mongoose.model('candidate', CandidateSchema);