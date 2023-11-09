const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken')
const app = express()
require('dotenv').config()

const port = process.env.PORT || 5000
app.use(cors({
    origin: [process.env.LIVE_LINK],
    credentials: true
}));

app.use(cookieParser());
app.use(express.json());
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const verifyToken = async (req, res, next) => {
    const token = req.cookies?.token;
    if (!token) {
        return res.status(401).send({ message: 'not authorized' })
        next()
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'unauthorized' })
        }
        req.user = decoded
        next()
    })
}
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
        app.patch('/borrow/:id',verifyToken, async (req, res) => {
            try {
                let id = new ObjectId(req.params.id)
                let bbook = await books.findOne(id)
                let userfilter = {email : req.user.email}
                let uuser = await users.findOne(userfilter)

                if (bbook.quantity <= 0) {
                    res.send({ code: "50", message: "No more books available right now" })
                }else if(uuser.books.includes(req.params.id)){
                    res.send({ code: "50", message: "You have already borrowed this book." })
                }else{
                    const filter = { _id: id }
                    const options = { upsert: true }
                    const updated = {$set: {quantity: (bbook.quantity - 1)}}
                    const userupdate = {$push:{books:req.params.id}}
                    const result1 = await books.updateOne(filter, updated, options)
                    const result2 = await users.updateOne(userfilter, userupdate,options)
                    console.log("updated")
                    res.send(result2)
                }
            } catch (e) {
                res.send(e)
            }
        })

        app.patch('/content/:id', async (req, res) => {
            try {
                let id = new ObjectId(req.params.id)
                const filter = { _id: id }
                const options = { upsert: true }
                const updated = { $set: { read: req.body.content } } 
                const result = await books.updateOne(filter, updated, options)
                res.send(result)
            } catch (e) {
                res.send(e)
            }
        })

        app.get('/user', verifyToken , async (req, res) => {
            try {
                const filter = { email: req.user.email }
                let user = await users.findOne(filter)
                res.send(user)
            } catch (e) {
                res.send(e)
            }
        })
        app.post('/usercreate', async (req, res) => {
            try {
                const user = {
                    email: req.body.email,
                    name: req.body.name,
                    picture: req.body.picture,
                    books: []
                }
                let result = await users.insertOne(user)
                res.send(result)
            } catch (e) {
                res.send(e)
            }
        })

        app.post('/jwt', async (req, res) => {
            const user = req.body
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.cookie('token', token, {
                maxAge: 1000 * 3600 * 72 * 4,
                httpOnly: true,
                secure: false //change before deploy
            })
            res.send({ success: true })
        })

    } finally {
    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log(`App listening on port: ${port}`)
})