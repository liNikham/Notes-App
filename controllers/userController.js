
const jwt=require('jsonwebtoken');
const bcrypt=require('bcrypt');
const nodemailer=require('nodemailer');
const User=require('../models/userSchema');
const crypto=require('crypto');
const dotenv = require("dotenv")
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const jwtSecret=process.env.JWT_SECRET;
// email transporter
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
        user: 'nikhil.212708111@vcet.edu.in',
        pass:process.env.SMTP_SECRET,
    }
  });
  // otp generation
  const generateOTP=()=>{
    const otp = Math.floor(100000 + Math.random() * 900000);
    return otp;

  }
  // authenticate jwt
  exports.authenticateJWT=async(req,res,next)=>{
    const authHeader= req.headers.authorization;
    if(authHeader){
        const token=authHeader.split(' ')[1];
        jwt.verify(token,jwtSecret,(err,user)=>{
            if(err){
               return res.status(400).json({message:'Token error'});
            }
            req.user=user;
            next();

        });
    } else{
        res.status(500).send('Not a valid token user');
    }
  }
// after clicking signUp button
exports.postSignUp=async (req,res)=>{
    try{
    // get the user details from the body
    const {email,password}=req.body;
     const existingUser= await User.findOne({email});
     if(existingUser){
        return res.status(400).json({message:'a user with this email already exists'})
     }
    // hashed the password
    const emailRegex = /^[a-zA-Z0-9._-]+@vcet\.edu\.in$/;
    if(!emailRegex.test(email)){
        return res.status(400).json({ error :'Please enter Valid email and Only Vcet Students are allowed to Sign Up'})
    }
    const tokenPayload={
        email:email
    }
    
    const token=jwt.sign(tokenPayload,jwtSecret);
    const hashedPassword=await bcrypt.hash(password,10);
   
      const otp=generateOTP();
    const newUser= new User({
        email:email,
        password:hashedPassword,
        otp
    });
    // save the user in the database
    await newUser.save();
    // generating the random OTP

 
    // mailing OTP to the user


    const mail={
        from:'nikhil.212708111@vcet.edu.in',
        to:email,
        subject:'OTP',
        text:`Your OTP is : ${otp} `,
    };
    transporter.sendMail(mail, (err,info)=>{
        if(err) console.log(err);
        else console.log('OTP sent on user email successfully');
    })
    res.json({message:`User Signed Up Successfully:${token}`});
    }
    catch(err){
            console.error(err);
            res.status(500).send('Error signing up user');
    }

}
// verification of otp , still remaining the work of resending otp when valid time limit expires
exports.verifyOtp=async(req,res)=>{
    const {otp}=req.body;
    const user=req.user;
    try{
        const existingUser= await User.findOne({email:user.email});
        if(existingUser && !existingUser.verified){
            if(otp===existingUser.otp ){
                existingUser.verified=true;
                existingUser.otp=undefined;
                await existingUser.save();
                res.json({message:"Email verified. You can now log in."})
            }
            else{
                res.status(400).json({error:'Invalid OTP or OTP has expired'})
            }
        }else{
            res.status(500).json({error:'Email already exists'});
        }
    }
    catch(err){
        console.log(err);
        res.status(500).json( {error:'Internal server error'});
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
                userId:user._id
            }
        const jwtSecret=process.env.JWT_SECRET;
        const token=jwt.sign(tokenPayload,jwtSecret)
        console.log(token);
        res.cookie('token',token);
        res.status(200).json({ success: true, message: `Login successful ${token} ` });
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

// validating reset password token
 exports.resetPassword=async(req,res)=>{
     try{
        const db_user=req.user;
        console.log(db_user);
        const {newPassword,confirmPassword}=req.body;
        const user=await User.findOne({_id:db_user.userId});
        if(!user){
            return res.status(400).json({message:'Invalid or expired  token'});

        }
        if(newPassword!==confirmPassword){
          return res.status(400).json({message:'Passwords do not match'});
        }
        const salt=await bcrypt.genSalt(10);
        const hashedPassword=await bcrypt.hash(newPassword,salt);


        const userData=await User.findByIdAndUpdate({
            _id:user._id},{
                $set:{
                    password:hashedPassword
                }
            },{new:true}
        );
        res.status(200).send({msg:"User Password has been reset"});
    
       
     } catch(err){
        console.log(err);
        res.status(500).json({message:err.message})
     }
    
 }
// resending otp 
 exports.resendOTP=async(req,res)=>{
    const user=req.user;
    const db_user= await User.findOne({_id:user.userId});
    const email=await db_user.email;
   try{
    const otp=generateOTP();
    const userOTP=await User.findByIdAndUpdate({
        _id:user.userId
    },{
        $set:{
            otp:otp

        }
    },{new:true});
    const mail={
        from:'nikhil.212708111@vcet.edu.in',
        to:email,
        subject:'OTP',
        text:`Your OTP is : ${otp} `,
    };
    transporter.sendMail(mail, (err,info)=>{
        if(err) console.log(err);
        else console.log('OTP sent on user email successfully');
    })
    res.status(200).json({message:"OTP send on your email"});
   }
   catch(err){
    console.log(err);
    res.status(500).json({message:err.message});
   }

 }
