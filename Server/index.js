const express = require('express');
const mongoose = require('mongoose');
const RegisterHandler = require('./Routes/Register');
const cookieParser = require('cookie-parser');
const verifyToken = require('./Controller/Auth');
const LoginHandler = require('./Routes/Login');
require('dotenv').config();


const app = express();
const port = process.env.PORT;
const mongoURI =process.env.MONGO_URI;

app.use(cookieParser())
app.use(express.json()); 
app.use(express.urlencoded({extended:true}))
mongoose.connect(mongoURI)
.then(() => console.log(" MongoDB Connected"))
.catch(err => console.error(" MongoDB Error:", err));



app.use("/api/register", RegisterHandler);  
app.use("/api/Login",LoginHandler)
app.get('/api/Dashboard',verifyToken, (req, res) => {
  res.send('Hello World!');
});


app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
