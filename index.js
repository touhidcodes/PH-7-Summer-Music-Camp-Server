const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");

// Middleware
app.use(cors());
app.use(express.json());

//  Verify JWT Token
const verifyJWT = (req, res, next) => {
	const authorization = req.headers.authorization;
	if (!authorization) {
		return res
			.status(401)
			.send({ error: true, message: "unauthorized access" });
	}
	// bearer token
	const token = authorization.split(" ")[1];
	jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
		if (err) {
			return res
				.status(401)
				.send({ error: true, message: "unauthorized access" });
		}
		req.decoded = decoded;
		next();
	});
};

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
const usersCollection = client.db("MusicCampDB").collection("usersCollection");
const cartCollection = client.db("MusicCampDB").collection("cartCollection");

async function run() {
	try {
		// Connect the client to the server	(optional starting in v4.7)
		client.connect();

		// JWT Token API
		app.post("/jwt", (req, res) => {
			const user = req.body;
			const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
				expiresIn: "1h",
			});
			res.send({ token });
		});

		// Get API of  Class Collection
		app.get("/classes/all", async (req, res) => {
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

		// Get API for Individual Classes by Email
		app.get("/classes", verifyJWT, async (req, res) => {
			const email = req.query.email;
			console.log(email);
			if (!email) {
				res.send([]);
			}
			const decodedEmail = req.decoded.email;
			if (email !== decodedEmail) {
				return res
					.status(403)
					.send({ error: true, message: "forbidden access" });
			}
			const query = { email: email };
			const result = await classCollection.find(query).toArray();
			res.send(result);
		});

		// Get API for Individual Instructors by Id
		app.get("/instructors/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: new ObjectId(id) };
			const result = await instructorCollection.find(query).toArray();
			res.send(result);
		});

		// Post API of Add Class
		app.post("/class", verifyJWT, async (req, res) => {
			const newItem = req.body;
			const result = await classCollection.insertOne(newItem);
			res.send(result);
		});

		// Users APIs
		// Get API for Users
		app.get("/users", async (req, res) => {
			const result = await usersCollection.find().toArray();
			res.send(result);
		});

		// Get API for check Role for Admin
		app.get("/users/admin/:email", verifyJWT, async (req, res) => {
			const email = req.params.email;
			if (req.decoded.email !== email) {
				res.send({ admin: false });
			}
			const query = { email: email };
			const user = await usersCollection.findOne(query);
			const result = { admin: user?.role === "Admin" };
			res.send(result);
		});

		// Get API for check Role for Instructor
		app.get("/users/instructor/:email", verifyJWT, async (req, res) => {
			const email = req.params.email;
			if (req.decoded.email !== email) {
				res.send({ instructor: false });
			}
			const query = { email: email };
			const user = await usersCollection.findOne(query);
			const result = { instructor: user?.role === "Instructor" };
			res.send(result);
		});

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

		// Patch API for User Data Update Role as Admin
		app.patch("/users/admin/:id", async (req, res) => {
			const id = req.params.id;
			const filter = { _id: new ObjectId(id) };
			const updateUser = {
				$set: {
					role: "Admin",
				},
			};
			const result = await usersCollection.updateOne(filter, updateUser);
			res.send(result);
		});

		// Patch API for User Data Update Role as Instructor
		app.patch("/users/Instructor/:id", async (req, res) => {
			const id = req.params.id;
			const filter = { _id: new ObjectId(id) };
			const updateUser = {
				$set: {
					role: "Instructor",
				},
			};
			const result = await usersCollection.updateOne(filter, updateUser);
			res.send(result);
		});

		// Patch API for Class Approve Status as Admin
		app.patch("/approve/:id", async (req, res) => {
			const id = req.params.id;
			const filter = { _id: new ObjectId(id) };
			const updateUser = {
				$set: {
					status: "Approved",
				},
			};
			const result = await classCollection.updateOne(filter, updateUser);
			console.log(result);
			res.send(result);
		});

		// Patch API for Class Deny Status as Admin
		app.patch("/deny/:id", async (req, res) => {
			const id = req.params.id;
			const filter = { _id: new ObjectId(id) };
			const updateUser = {
				$set: {
					status: "Deny",
				},
			};
			const result = await classCollection.updateOne(filter, updateUser);
			console.log(result);
			res.send(result);
		});

		// Cart APIs
		// Get API for Cart Data
		app.get("/carts", verifyJWT, async (req, res) => {
			const email = req.query.email;
			if (!email) {
				res.send([]);
			}
			const decodedEmail = req.decoded.email;
			if (email !== decodedEmail) {
				return res
					.status(403)
					.send({ error: true, message: "forbidden access" });
			}
			const query = { email: email };
			const result = await cartCollection.find(query).toArray();
			res.send(result);
		});

		// Get API for Cart Data for pending
		app.get("/pending", verifyJWT, async (req, res) => {
			const email = req.query.email;
			if (!email) {
				res.send([]);
			}
			const decodedEmail = req.decoded.email;
			if (email !== decodedEmail) {
				return res
					.status(403)
					.send({ error: true, message: "forbidden access" });
			}
			const query = { status: "pending" };
			const result = await classCollection.find(query).toArray();
			res.send(result);
		});

		// Post API for Cart Data
		app.post("/carts", async (req, res) => {
			const item = req.body;
			const id = req.body.booked_id;
			const query = { booked_id: id };
			const existingCart = await cartCollection.findOne(query);
			if (existingCart) {
				return res.send({ message: "cart already exists" });
			}
			const result = await cartCollection.insertOne(item);
			res.send(result);
		});

		// Delete API for Cart Data
		app.delete("/carts/:id", verifyJWT, async (req, res) => {
			const id = req.params.id;
			const query = { _id: new ObjectId(id) };
			const result = await cartCollection.deleteOne(query);
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
