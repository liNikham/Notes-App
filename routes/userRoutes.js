const express= require('express');
const router=express.Router();
const userController=require('../controllers/userController');
router.post('/signUp',userController.postSignUp);
router.post('/loginUser',userController.postLogin);
router.post('/verify-otp',userController.verifyOtp);
module.exports=router;