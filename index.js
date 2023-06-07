const express = require('express');
const cors = require('cors');
const app = express()

const port = process.env.port || 5000;

//middle wares
app.use(cors())
app.use(express.json())
require('dotenv').config()
const jwt = require('jsonwebtoken');

//JWT
app.post('/jwt', (req,res)=>{
  
    const email = req.body;
   const token = jwt.sign(email,process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
    res.send({token})
})


app.get('/', (req,res)=>{
    res.send('language-care server is running')
})

app.listen(port, ()=>{
    console.log(`language-care server is running at port: ${port}`);
})
