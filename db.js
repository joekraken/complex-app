const {MongoClient} = require('mongodb')
const port = 3000
const uri = 'mongodb+srv://student:evEry83kiwi@cluster0.ud4v6.azure.mongodb.net/complexApp?retryWrites=true&w=majority'

const client = new MongoClient(uri)

async function startDb() {
  await client.connect()
  // exports database, to access in models
  module.exports = client.db()
  // after db connection, then app listens to incomopng requests
  const app = require('./app')
  app.listen(port, () => console.log(`app listening on port ${port}!`))
}

startDb()