const express = require('express')
const session = require('express-session')
const MongoStore = require('connect-mongo')
const router = require('./app/router')

const app = express()

// config session
// secret phrase is required
// cookie.maxAge in milliseconds
let sessionOptions = session({
  secret: 'javascript is awesome sauce',
  store: MongoStore.create({ client: require('./db')}),
  resave: false,
  saveUninitialized: false,
  cookie: {maxAge: 1000 * 60 * 60 * 24, httpOnly: true}
})

app.use(sessionOptions)

// add user input to request data
app.use(express.urlencoded({extended: false}))
app.use(express.json()) // format request data as json

app.use(express.static('app/public'))
// setting the views folder locations
app.set('views', 'app/views')
// set view template engine
app.set('view engine', 'ejs')

// homepage GET request
app.use('/', router)

// export this app, instead of listening to requests
module.exports = app
// listen to incoming requests is in db.js file