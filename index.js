const express = require('express');
const cors = require('cors');
const app = express()

const port = process.env.port || 5000;

//middle wares
app.use(cors())
app.use(express.json())
require('dotenv').config()
const jwt = require('jsonwebtoken');




const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.oth2isl.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const usersCollections = client.db('languageCareDB').collection('users')

        //JWT
        app.post('/jwt', (req, res) => {
            const email = req.body;
            const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({ token })
        })


        //users apis
        //CREATE
        app.post('/users/:email', async (req, res) => {
            const newUser = req.body;
            const email = req.params.email;
            const query = {email:email}
            const isPresent = await usersCollections.findOne(query)
            if(isPresent){
                return res.send('already present in users collection')
            }
            // const isPresent = 
            const result = await usersCollections.insertOne(newUser)
            res.send(result)
      
        })



        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);





app.get('/', (req, res) => {
    res.send('language-care server is running')
})

app.listen(port, () => {
    console.log(`language-care server is running at port: ${port}`);
})
