const express = require('express');
const cors = require('cors');
const app = express()

const port = process.env.port || 5000;

//middle wares
app.use(cors())
app.use(express.json())
require('dotenv').config()
const jwt = require('jsonwebtoken');


//JWT middle wares
const verifyJWT = (req,res,next) =>{
    const authorization = req.headers.authorization
    // console.log(authorization);
    if(!authorization){
        return res.status(401).send({error:true, message:'unauthorized access'})
    }
    const token = authorization.split(' ')[1]
    // console.log(token);
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error,decoded)=>{
        if(error){
            return res.status(401).send({error:true, message:'unauthorized access'})
        }
        req.decoded = decoded
        // console.log(decoded);
        next()
    })
}





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
        const classesCollections = client.db('languageCareDB').collection('classes')
        const selectedClassesCollections = client.db('languageCareDB').collection('selectedClasses')

        //JWT
        app.post('/jwt', (req, res) => {
            const email = req.body;
            const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({ token })
        })


            //Check users role
            app.get('/users/role/:email', verifyJWT, async(req,res)=>{
                const email = req.params.email;
                const query =  {email:email}
                const user = await usersCollections.findOne(query)
                //console.log(user);
                const role = user.role;
                res.send(role)
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

        //Classes apis

        //GET all approved classes
        app.get('/approved-classes', async(req,res)=>{
            // console.log('reached');
            const classes = await classesCollections.find().toArray()
            const approvedClasses = classes.filter(singleClass => singleClass.status="approved")
            
            res.send(approvedClasses)
        })


        app.get('/popular-classes', async(req,res)=>{
            const result = await classesCollections.find().sort({total_enrolled_students: -1}).limit(6).toArray()
            res.send(result)
        })


        //Instructors apis
        app.get('/instructors', async(req,res)=>{
            // const query ={role:'instructor'}
            const users = await usersCollections.find().toArray()
            const instructors = users.filter(user => user.role === 'instructor')
            /* const courses_taken_by_them = await classesCollections.find({email: instructors.email}).toArray()
            console.log('courses',courses_taken_by_them.instructor_name); */
            // console.log(instructors);
            res.send(instructors)
        })


        // Student apis

        //Selected class
        //post selected class
        app.post('/selected-class/:email', verifyJWT ,async(req,res)=>{
            const addClass = req.body;
            const email = req.params.email
            const decoded = req.decoded;
            // console.log(email,decoded);
            // console.log(addClass);
            if(email !== decoded.email){
                return res.status(403).send({error:true, message:'forbidden access'})
            }
            const result = await selectedClassesCollections.insertOne(addClass)
            res.send(result)
        })

        //get selected class
        app.get('/selected-class/:email', verifyJWT, async(req,res)=>{
            const email = req.params.email;
            const query = {email:email}

            const selectedClass = await selectedClassesCollections.find(query).toArray()
            res.send(selectedClass)
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
