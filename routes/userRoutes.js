const express= require('express');
const router=express.Router();
const userController=require('../controllers/userController');
router.post('/signUp',userController.postSignUp);
router.post('/loginUser', userController.postLogin);
router.put('/reset-password',userController.authenticateJWT, userController.resetPassword);
router.post('/verify-otp',userController.authenticateJWT, userController.verifyOtp);
router.get('/resend-otp',userController.authenticateJWT, userController.resendOTP);
module.exports=router;