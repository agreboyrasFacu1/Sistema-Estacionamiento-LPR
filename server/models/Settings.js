const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  pricePerHour: { type: Number, required: true },
  abonoValue: { type: Number, required: true },
});

module.exports = mongoose.model('Settings', SettingsSchema);
