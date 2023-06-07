const express = require('express');
const cors = require('cors');
const app = express()

const port = process.env.port || 5000;

//middle wares
app.get(cors())
app.get(express.json())


//JWT



app.get('/', (req,res)=>{
    res.send('language-care server is running')
})

app.listen(port, ()=>{
    console.log(`language-care server is running at port: ${port}`);
})
