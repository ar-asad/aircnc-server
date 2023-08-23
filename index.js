const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
// const objectID=require('mongodb').ObjectId;

//Please add .env file in .gitignore
//DB_USER
//DB_PASSWORD


// middleware
const corsOptions = {
    origin: '*',
    credentials: true,
    optionSuccessStatus: 200,
}

app.use(cors(corsOptions));
app.use(express.json());

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.mjpzktk.mongodb.net/?retryWrites=true&w=majority`;
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
        await client.connect();
        const usersCollection = client.db('aircncDb').collection('users')
        const roomsCollection = client.db('aircncDb').collection('rooms')
        const bookingsCollection = client.db('aircncDb').collection('bookings');

        // Save user email and role in DB
        app.put('/users/:email', async (req, res) => {
            const email = req.params.email
            const user = req.body
            const query = { email: email }
            const options = { upsert: true }
            const updateDoc = {
                $set: user,
            }
            const result = await usersCollection.updateOne(query, updateDoc, options)
            res.send(result)
        });

        // Get all rooms
        app.get('/rooms', async (req, res) => {
            console.log('roommssss')
            const result = await roomsCollection.find().toArray()
            res.send(result)

        });

        // Save a room in databse
        app.post('/room', async (req, res) => {
            const room = req.body;
            console.log(room);
            const result = await roomsCollection.insertOne(room);
            res.send(result);

        });

    }
    finally {
        // await client.close()
    }
}
run().catch(console.dir);



app.get("/", (req, res) => {
    res.send("Hello Wwwwwww from Example app");
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});