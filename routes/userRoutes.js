const express= require('express');
const router=express.Router();
const userController=require('../controllers/userController');
router.post('/signUp',userController.postSignUp);
router.post('/loginUser',userController.postLogin);
module.exports=router;