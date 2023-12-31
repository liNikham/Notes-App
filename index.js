const express = require('express');
const userRoutes=require('./routes/userRoutes');
//added jwt bcrypt mongoose  
const jwt=require('jsonwebtoken')
const bcrypt=require('bcrypt')
const mongoose=require('mongoose')
const bodyParser=require('body-parser');
require('dotenv').config();
const db_string=process.env.DB_CONNECTION_STRING;

//started express server
const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}))
app.use(userRoutes);
// started server on port 3000
//made a connection to database
mongoose.connect(db_string)
.then(console.log("Database Successfully Connected"))
.catch(err=> console.log(err));
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
