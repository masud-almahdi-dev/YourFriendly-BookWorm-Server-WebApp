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
        app.get('/book/:id', async (req, res) => {
            try {
                let id = new ObjectId(req.params.id)
                let result = await books.findOne(id)
                res.send(result)
            } catch (e) {
                res.send(e)
            }
        })
        app.post('/add', async (req, res) => {
            try {
                let result = await books.insertOne(req.body)
                res.send(result)
            } catch (e) {
                res.send(e)
            }
        })
        app.patch('/update/:id', async (req, res) => {
            try {
                let id = new ObjectId(req.params.id)
                const filter = { _id: id }
                const options = { upsert: true }
                const updated = {
                  $set: {
                    name: req.body.name,
                    picture: req.body.picture,
                    author: req.body.author,
                    category: req.body.category,
                    quantity: req.body.quantity,
                    rating: req.body.rating,
                    quantity: req.body.quantity
                  }
                }
                const result = await books.updateOne(filter, updated, options)
                res.send(result)
            } catch (e) {
                res.send(e)
            }
        })

        app.delete("/delete/:id", async (req, res) => {

            try {
              let id = new ObjectId(req.params.id)
              const filter = { _id: id }
              const result = await books.deleteOne(filter)
              res.send(result)
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