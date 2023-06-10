const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// Middleware
app.use(cors());
app.use(express.json());

// MOngoDB Connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.57whvd4.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true,
	},
});

const classCollection = client.db("MusicCampDB").collection("ClassCollection");
const instructorCollection = client
	.db("MusicCampDB")
	.collection("InstructorCollection");
const usersCollection = client
	.db("MusicCampDB")
	.collection("usersCollection");

async function run() {
	try {
		// Connect the client to the server	(optional starting in v4.7)
		client.connect();

		// Get API of  Class Collection
		app.get("/classes", async (req, res) => {
			const result = await classCollection.find().toArray();
			res.send(result);
		});

		// Get API of Instructor Collection
		app.get("/instructors", async (req, res) => {
			const result = await instructorCollection.find().toArray();
			res.send(result);
		});

		// Get API of 6 Class Collection
		app.get("/home/classes", async (req, res) => {
			const limit = 6;
			const query = { enrolled: { $gt: 0 } };
			const options = {
				sort: {
					enrolled: -1,
				},
			};
			const result = await classCollection
				.find(query, options)
				.limit(limit)
				.toArray();
			res.send(result);
		});

		// Get API of 6 Instructor Collection
		app.get("/home/instructors", async (req, res) => {
			const limit = 6;
			const query = { students_enrolled: { $gt: 0 } };
			const options = {
				sort: {
					students_enrolled: -1,
				},
			};
			const result = await instructorCollection
				.find(query, options)
				.limit(limit)
				.toArray();
			res.send(result);
		});

		// Get API for Individual Classes by Id
		app.get("/classes/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: new ObjectId(id) };
			const result = await classCollection.find(query).toArray();
			res.send(result);
		});

		// Get API for Individual Classes by Id
		app.get("/instructors/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: new ObjectId(id) };
			const result = await instructorCollection.find(query).toArray();
			res.send(result);
		});

		// Users APIs
		// Post API for Users
		 app.post("/users", async (req, res) => {
				const user = req.body;
				const query = { email: user.email };
				const existingUser = await usersCollection.findOne(query);
				if (existingUser) {
					return res.send({ message: "user already exists" });
				}
				const result = await usersCollection.insertOne(user);
				res.send(result);
			});

		// Send a ping to confirm a successful connection
		await client.db("admin").command({ ping: 1 });
		console.log(
			"Pinged your deployment. You successfully connected to MongoDB!"
		);
	} finally {
		// Ensures that the client will close when you finish/error
		// await client.close();
	}
}
run().catch(console.dir);

app.get("/", (req, res) => {
	res.send("Summer Music Camp is running");
});

app.listen(port, () => {
	console.log(`Summer Music Camp app listening on port ${port}`);
});
