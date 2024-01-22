const express = require('express');
const app = express();
const cors = require('cors');
// const jwt = require('jsonwebtoken')
require('dotenv').config();
const port = process.env.PORT || 5000;


// Middleware
app.use(cors({
    origin: ["http://localhost:5173"]
}));
app.use(express.json());




const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_ADMIN}:${process.env.DB_PASSWORD}@cluster0.xeklkbf.mongodb.net/?retryWrites=true&w=majority`;

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
        // await client.connect();


        // Database and collection
        const usersCollection = client.db("horizonHomes").collection("registeredUsers");




        // post new user data
        app.post("/newUser", async (req, res) => {
            const newUserData = req.body;
            const query = { email: newUserData?.email };
            const existingUser = await usersCollection.findOne(query);
            if (existingUser) {
                return res.send({ message: "Email already exists", insertedId: null })
            }
            const result = await usersCollection.insertOne(newUserData);
            res.send(result);
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





// Checking if the server is running
app.get("/", (req, res) => {
    res.send("Horizon Homes is alive");
})


// Checking the running port
app.listen(port, () => {
    console.log("Horizon Homes Server is running on port:", port)
})