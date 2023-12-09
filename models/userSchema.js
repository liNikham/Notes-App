const mongoose=require('mongoose')
// defines user schema
const userSchema = new mongoose.Schema({
    username: String,
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
  });

  const User = mongoose.model('User', userSchema);
  module.exports=User;