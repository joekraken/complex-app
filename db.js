const dotenv = require('dotenv')
dotenv.config()
const port = process.env.PORT
const {MongoClient} = require('mongodb')
const client = new MongoClient(process.env.CONNECTIONSTRING)

async function startDb() {
  await client.connect()
  // exports database, to access in models
  module.exports = client
  // after db connection, then app listens to incomopng requests
  const app = require('./app')
  app.listen(port, () => console.log(`app listening on port ${port}!`))
}

startDb()