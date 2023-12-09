const jwt=require('jsonwebtoken');
const jwtSecret=process.env.JWT_Secret;
const bcrypt=require('bcrypt');
const nodemailer=require('nodemailer');
const User=require('../models/userSchema');
// after clicking signUp button
exports.postSignUp=async (req,res)=>{
    try{
    // get the user details from the body
    const {email,password}=req.body;
    // hashed the password
    const emailRegex = /^[a-zA-Z0-9._-]+@vcet\.edu\.in$/;
    if(!emailRegex.test(email)){
        return res.status(400).json({ error :'Only Vcet Students are allowed to Sign Up'})
    }
    const hashedPassword=await bcrypt.hash(password,10);
    const newUser= new User({
        email:email,
        password:hashedPassword
    });
    // save the user in the database
    await newUser.save();
    // generating the random OTP
    const numbers='0123456789';
  const generateOTP=()=>{
    let OTP='';
    for(let i=0;i<5;i++){
        const randomIndex=Math.floor(Math.random()*numbers.length);
        OTP+=numbers[randomIndex];
    }

  }
    // mailing OTP to the user
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        auth: {
            user: 'nikhil.212708111@vcet.edu.in',
            pass: 'hzhquqgmcajxiqkz'
        }
      });
    const mail={
        from:'nikhil.212708111@vcet.edu.in',
        to:email,
        subject:'OTP',
        text:`Your OTP is : ${generateOTP()} `,
    };
    transporter.sendMail(mail, (err,info)=>{
        if(err) console.log(err);
        else console.log('OTP sent on user email successfully');
    })
    res.send("Successfully sign up")
    }
    catch(err){
            console.error(err);
            res.status(500).send('Error signing up user');
    }

}
// after clicking login button
exports.postLogin=async(req,res)=>{
    const {email,password}=req.body;
    //Check if the user with the provided email exists already
    try{
        const user=await User.findOne({email:email});
        if(user && (await bcrypt.compare(password,user.password))){
            const tokenPayload={
                userType:'user',
                userId:user._id
            }
        const jwtSecret=process.env.JWT_SECRET;
        const token=jwt.sign(tokenPayload,jwtSecret)
        console.log("Login successful");
        res.cookie('token',token);
        res.status(200).json({ success: true, message: 'Login successful' });
        }
        else{
            res.status(400).json({error:'Invalid email or password'});
        }
    }
    catch(err){
        console.error(err);
        res.status(500).send('Error during login')
    }

}