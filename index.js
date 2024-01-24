const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;


// Middleware
app.use(cors({
    origin: ["http://localhost:5173"]
}));
app.use(express.json());




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
        const allHousesCollection = client.db("horizonHomes").collection("allHouses");
        const rentedListCollection = client.db("horizonHomes").collection("rentedList");



        // JSON related api
        app.post("/jwt", async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_WEB_TOKEN, { expiresIn: '1h' });
            res.send({ token });
        })


        // verify token middleware
        const verifyToken = (req, res, next) => {
            const tokenAuthorization = req.headers.authorization;
            if (!tokenAuthorization) {
                return res.status(401).send({ message: 'Unauthorized' })
            }
            const token = tokenAuthorization.split(' ')[1]
            // verify token
            jwt.verify(token, process.env.ACCESS_WEB_TOKEN, (err, decoded) => {
                if (err) {
                    return res.status(401).send({ message: 'Unauthorized' })
                }
                req.decoded = decoded;
                next();
            })
        }


        // post new user data and duplicate email validation
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



        // post new house data
        app.post("/newHouse", async (req, res) => {
            const newHouseData = req.body;
            const result = await allHousesCollection.insertOne(newHouseData);
            res.send(result);
        })



        // post new house rent data
        app.post("/houseRent", async (req, res) => {
            const houseRentData = req.body;
            const result = await rentedListCollection.insertOne(houseRentData);
            res.send(result);
        })



        // get data to login a user
        app.post("/loginUser", async (req, res) => {
            const loginData = req.body;
            const email = loginData?.email;
            const password = loginData?.password;
            const query = { email: email };
            const existingUser = await usersCollection.findOne(query);
            if (!existingUser) {
                return res.send({ login: false, message: "No user found" })
            }
            if (existingUser?.password !== password) {
                return res.send({ login: false, message: "Please recheck your email and password" })
            }
            const userName = existingUser?.name;
            const userEmail = existingUser?.email;
            const userRole = existingUser?.userRole;
            const userId = existingUser?._id;
            const loggedInUserData = { userName, userEmail, userRole, userId }
            res.send({ login: true, loggedInUserData });
        })



        // get houses for a specific owner
        app.get("/houseOwnerHouses/:id", async (req, res) => {
            const houseOwnerId = req.params.id;
            const query = { houseOwnerId: houseOwnerId };
            const result = await allHousesCollection.find(query).sort({ _id: -1 }).toArray();
            res.send(result);
        })



        // get a single house
        app.get("/singleHouse/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await allHousesCollection.findOne(query);
            res.send(result);
        })



        // get all house (paginated)
        app.get("/allHouse", async (req, res) => {
            const result = await allHousesCollection.find().toArray();
            res.send(result);
        })



        // get all bookings for user
        app.get("/userBookings/:id", async (req, res) => {
            const id = req.params.id;
            const query = {renterId: id}
            const result = await rentedListCollection.find(query).toArray();
            res.send(result);
        })



        // update a single house
        app.put("/updateHouse/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDetails = req.body;
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    availabilityDate: updatedDetails.availabilityDate,
                    bathRooms: updatedDetails.bathRooms,
                    bedRooms: updatedDetails.bedRooms,
                    cityName: updatedDetails.cityName,
                    houseAddress: updatedDetails.houseAddress,
                    houseDescription: updatedDetails.houseDescription,
                    houseName: updatedDetails.houseName,
                    ownerPhone: updatedDetails.ownerPhone,
                    rentPerMonth: updatedDetails.rentPerMonth,
                    roomSize: updatedDetails.roomSize,
                }
            };
            const result = await allHousesCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        })



        // delete a house
        app.delete("/deleteHouse/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await allHousesCollection.deleteOne(query);
            res.send(result);
        })



        // delete a booking
        app.delete("/deleteBooking/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await rentedListCollection.deleteOne(query);
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