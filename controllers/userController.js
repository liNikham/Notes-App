
const jwt=require('jsonwebtoken');
const bcrypt=require('bcrypt');
const nodemailer=require('nodemailer');
const User=require('../models/userSchema');
const crypto=require('crypto');
const dotenv = require("dotenv")
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
// email transporter
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
        user: 'nikhil.212708111@vcet.edu.in',
        pass:process.env.SMTP_SECRET,
    }
  });
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
    const hashedPassword=await bcrypt.hash(password,10);
    const generateOTP=()=>{
        const otp = Math.floor(100000 + Math.random() * 900000);
        return otp;
    
      }
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
    res.send("Successfully sign up")
    }
    catch(err){
            console.error(err);
            res.status(500).send('Error signing up user');
    }

}
// verification of otp , still remaining the work of resending otp when valid time limit expires
exports.verifyOtp=async(req,res)=>{
    const {otp}=req.body;
    console.log(otp)
    try{
        const user= await User.findOne({otp});
        if(user && !user.verified){
            if(Date.now()-user.timestamp<=300*1000){
                user.verified=true;
                user.otp=undefined;
                await user.save();
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

// allowing user to reset password in case they forgot them
exports.forgotPassword=async(req,res)=>{
    try{
        const {email}=req.body;
        const user=await User.findOne({email});
        if(!user){
            return res.status(404).json({message:'User Not Found'});

        }
        // generating token for reseting password
        const resetToken=crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken=resetToken;
        // Token expires in 1 hour
        user.resetPasswordTokenExpiry=Date.now()+3600000;
        await user.save();
        const resetUrl=`http://localhost:3000/reset-password?token=${resetToken}`;
        await transporter.sendMail({
            from:'nikhil.212708111@vcet.edu.in',
            to:email,
            subject:'Password Reset',
            text:`Click the link to reset your password :${resetUrl}`,
        })
        res.status(200).json({message:'Password reset email sent successfully'});




    } catch(err){
        console.log(err);
        res.status(500).json({message:err.message})
    }
}
// validating reset password token
 exports.resetPassword=async(req,res)=>{
     try{
        const token=req.query.token;
        const {newPassword,confirmPassword}=req.body;
        const user=await User.findOne({resetPasswordToken:token});
        if(!user){
            return res.status(400).json({message:'Invalid or expired reset token'});

        }
        if(newPassword!==confirmPassword){
          return res.status(400).json({message:'Passwords do not match'});
        }
        const salt=await bcrypt.genSalt(10);
        const hashedPassword=await bcrypt.hash(newPassword,salt);

      if(Date.now()-user.resetPasswordTokenExpiry<=3600000){
        const userData=await User.findByIdAndUpdate({
            _id:user._id},{
                $set:{
                    password:hashedPassword
                }
            },{new:true}
        );
        user.resetPasswordToken=undefined;
        user.resetPasswordToken-undefined;
        res.status(200).send({msg:"User Password has been reset"});
      }
      else{
        res.status(400).json({msg:"error resetting password"});
      }
       
     } catch(err){
        console.log(err);
        res.status(500).json({message:err.message})
     }
    
 }