const express = require('express')
const cors = require('cors')
const app = express()
const port = process.env.PORT || 5000
app.use(cors());
app.use(express.json());
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        app.get('/', async (req, res) => {
            await client.db("admin").command({ ping: 1 });
            res.send("Pinged your deployment. You successfully connected to MongoDB!");
        })
        const users = client.db('BookWormDB').collection('users');
        const books = client.db('BookWormDB').collection('books');
        const categories = client.db('BookWormDB').collection('categories');

        app.get('/categories', async (req, res) => {
            const cursor = categories.find();
            const result = await cursor.toArray();
            res.send(result)
        })

        app.get('/books', async (req, res) => {
            const cursor = books.find();
            const result = await cursor.toArray();
            res.send(result)
        })
        app.get('/category/:id', async (req, res) => {
            try {
                let id = new ObjectId(req.params.id)
                let category = await categories.findOne(id)
                const cursor = books.find({ category: category.title });
                let result = await cursor.toArray();
                category.items = result
                res.send(category)
            } catch (e) {
                res.send(e)
            }
        })



    } finally {
    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log(`App listening on port: ${port}`)
})