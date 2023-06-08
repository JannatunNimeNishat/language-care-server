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





const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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



        //users apis
        //CREATE user
        app.post('/create-user/:email', async (req, res) => {
            console.log('new user');
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



            //Check users role
            app.get('/users/role/:email', verifyJWT, async(req,res)=>{
                const email = req.params.email;
                if(!email){
                    return res.send(' ')
                }
                const query =  {email:email}
                const user = await usersCollections.findOne(query)
                // console.log(user);
                const role = user.role; //todo problem
                res.send(role)
            })



        

        //Classes apis

        //GET all approved classes
        app.get('/approved-classes', async(req,res)=>{
            // console.log('reached');
            const classes = await classesCollections.find().toArray()
            const approvedClasses = classes.filter(singleClass => singleClass.status="approved")
            
            res.send(approvedClasses)
        })



        //get all popular classes bases on total enrolled students
        app.get('/popular-classes', async(req,res)=>{
            const result = await classesCollections.find().sort({total_enrolled_students: -1}).limit(6).toArray()
            res.send(result)
        })





   //Instructors apis

        //verify instructor
        const verifyInstructor = async(req,res,next) =>{
            const email = req.decoded.email;
            const query = {email:email}
            const instructor = await usersCollections.findOne(query)
            if(!instructor.role === 'instructor'){
                return res.status(403).send({error:true, message:'forbidden access'})
            }

           next()
        }



    
        //create/post a class
        app.post('/add-class', verifyJWT,verifyInstructor ,async(req,res)=>{
            const newClass = req.body;
           newClass.total_enrolled_students=0;
            console.log(newClass);
            const result = await classesCollections.insertOne(newClass)
            res.send(result)
        })



        //get instructors all classes posted by him
        app.get('/instructor_classes/:email', verifyJWT,verifyInstructor ,async(req,res)=>{
            const email = req.params.email;
            const query = {instructor_email:email}
            console.log('reached to ',email);
            const instructor_classes = await classesCollections.find(query).toArray()
           res.send(instructor_classes)
        })

        //get popular insturctors
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

        //delete selected class
        //DELETE
        app.delete('/selected-class-delete/:id', verifyJWT, async(req,res)=>{
            const id = req.params.id;
            const query = {_id: new ObjectId(id)}
            const result = await selectedClassesCollections.deleteOne(query)
            res.send(result)
        })



        //admin apis

         //verify admin
         const verifyAdmin = async(req,res,next) =>{
            const email = req.decoded.email;
            const query = {email:email}
            const admin = await usersCollections.findOne(query)
            if(!admin.role === 'admin'){
                return res.status(403).send({error:true, message:'forbidden access'})
            }

           next()
        }

        //get all classes
        app.get('/allClasses', async(req,res)=>{
            const result = await classesCollections.find().toArray()
            res.send(result)
        })

        //make approved class
        app.patch('/make-approved/:id',verifyJWT,verifyAdmin ,async(req,res)=>{
            const id = req.params.id
            console.log(id);
            const filter = {_id: new ObjectId(id)}
            const updatedDoc = {
                $set:{
                    status:'approved'
                }
            }
            const result = await classesCollections.updateOne(filter,updatedDoc)
            res.send(result)
        })

        //make denied class
        app.patch('/make-denied/:id',verifyJWT,verifyAdmin ,async(req,res)=>{

            const id = req.params.id
            console.log(id);
            const filter = {_id: new ObjectId(id)}
            const updatedDoc = {
                $set:{
                    status:'deny'
                }
            }
            const result = await classesCollections.updateOne(filter,updatedDoc)
            res.send(result)
        })

        //give feedback
        app.patch('/admin-feedback/:id',verifyJWT,verifyAdmin ,async(req,res)=>{

            const id = req.params.id
            const feedback = req.body.feedback;
            console.log(id, feedback);
            const filter = {_id: new ObjectId(id)}
            const updatedDoc = {
                $set:{
                    feedback:feedback
                }
            }
            const result = await classesCollections.updateOne(filter,updatedDoc)
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
