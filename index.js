const express = require('express');
const multer = require('multer');
const fs = require('fs');
//added jwt bcrypt mongoose  
const jwt=require('jsonwebtoken')
const bcrypt=require('bcrypt')
const mongoose=require('mongoose')
const bodyParser=require('body-parser');
const dotenv = require("dotenv")
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, './.env') });
const db_string=process.env.DB_CONNECTION_STRING;
const userRoutes=require('./routes/userRoutes');
const storageRoutes=require('./routes/storageRoutes');
const credentials = require('./secret1.json');
//started express server
const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}))
app.use(userRoutes);
app.use(storageRoutes);
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
mongoose.connect(db_string)
.then(console.log("Database Successfully Connected"))
.catch(err=> console.log(err));
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
