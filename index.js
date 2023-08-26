const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const morgan = require("morgan");
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
app.use(morgan('dev'));

// Verify jwt
const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization
    if (!authorization) {
        return res.status(401).send({ error: true, message: 'unauthorized access' })
    }
    // bearer token
    const token = authorization.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ error: true, message: 'unauthorized access' })
        }
        req.decoded = decoded
        next()
    })
}


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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

        // Genarate jwt token
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '80d',
            });
            console.log(token);
            res.send({ token })
        });

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

        // Get user
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email
            const query = { email: email }
            const result = await usersCollection.findOne(query)
            res.send(result)
        })

        // Get all rooms
        app.get('/rooms', async (req, res) => {
            const result = await roomsCollection.find().toArray()
            res.send(result)

        });

        // Get a host added room
        app.get('/rooms/:email', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email
            const email = req.params.email
            if (email !== decodedEmail) {
                return res.status(403).send({ error: true, message: 'Forbidded access' })
            }
            const query = { 'host.email': email }
            const result = await roomsCollection.find(query).toArray()
            res.send(result)
        })

        // Get a single room
        app.get('/room/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await roomsCollection.findOne(query)
            res.send(result)
        })

        // Save a room in databse
        app.post('/room', async (req, res) => {
            const room = req.body;
            const result = await roomsCollection.insertOne(room);
            res.send(result);

        });

        // delete room
        app.delete('/rooms/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await roomsCollection.deleteOne(query)
            res.send(result)
        })

        // update room booking status
        app.patch('/rooms/status/:id', async (req, res) => {
            const id = req.params.id
            const status = req.body.status
            const query = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    booked: status,
                },
            }
            const update = await roomsCollection.updateOne(query, updateDoc)
            res.send(update)
        });

        // Update A room
        app.put('/rooms/:id', verifyJWT, async (req, res) => {
            const room = req.body
            console.log(room)

            const filter = { _id: new ObjectId(req.params.id) }
            const options = { upsert: true }
            const updateDoc = {
                $set: room,
            }
            const result = await roomsCollection.updateOne(filter, updateDoc, options)
            res.send(result)
        })

        // Get bookings for guest
        app.get('/bookings', async (req, res) => {
            const email = req.query.email

            if (!email) {
                res.send([])
            }
            const query = { 'guest.email': email }
            const result = await bookingsCollection.find(query).toArray()
            res.send(result)
        });

        // Get bookings for host
        app.get('/bookings/host', async (req, res) => {
            const email = req.query.email

            if (!email) {
                res.send([])
            }
            const query = { host: email }
            const result = await bookingsCollection.find(query).toArray()
            console.log(result)
            res.send(result)
        })


        // Save a booking in database
        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            const result = await bookingsCollection.insertOne(booking)
            res.send(result)
        });

        // delete a booking
        app.delete('/bookings/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await bookingsCollection.deleteOne(query)
            res.send(result)
        })

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