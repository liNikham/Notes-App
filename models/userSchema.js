const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: (value) => value.endsWith('@vcet.edu.in'),
      message: 'Only email addresses from @vcet.edu.in are allowed.',
    },
  },
  password: String,
  otp: {
    type: String,
    expires: 60, // Set the expiration time for 60 seconds (1 minute)
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  resetPasswordToken: String,
  resetPasswordTokenExpiry: {
    type: Date,
    expires: 60, // Set the expiration time for 60 seconds (1 minute)
  },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
