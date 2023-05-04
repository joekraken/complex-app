const express = require('express')
const session = require('express-session')
const MongoStore = require('connect-mongo')
const router = require('./app/router')
const flash = require('connect-flash')
const markdown = require('marked')
const sanitizeHTML = require('sanitize-html')
const csrf = require('csurf')

const app = express()

// be able read request data
app.use(express.urlencoded({extended: false}))
// be able to read incoming json data
app.use(express.json())

// ** api routes; not effected by code below
app.use('/api', require('./app/router-api'))

// ** code below is for app

// config session + cookies
// secret phrase is required
// cookie.maxAge in milliseconds, example 24 hrs = 1000 * 60 * 60 * 24
let sessionOptions = session({
  secret: 'javascript is awesome sauce',
  store: MongoStore.create({ client: require('./db')}),
  resave: false,
  saveUninitialized: false,
  cookie: {maxAge: 1000 * 60 * 60 * 4, httpOnly: true}
})

app.use(sessionOptions)
app.use(flash()) // add flash feature

// run for every page request
app.use((req, res, next) => {
  // make markdown available from ejs templates
  res.locals.filterUserHTML = (content) => {
    const options = {
      allowedTags: ['p', 'br', 'ul', 'li', 'strong', 'bold', 'i', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
      allowedAttributes: []
    }
    return sanitizeHTML(markdown.parse(content), options)
  }
  // make flash messages available to all ejs templates
  res.locals.errors = req.flash('errors')
  res.locals.success = req.flash('success')
  // make current user id available on req obj
  if (req.session.user) {req.visitorId = req.session.user._id}
  else {req.visitorId = 0}
  // make user session data accessible from any .ejs template
  res.locals.user = req.session.user
  next()
})

app.use(express.static('app/public'))
// setting the views folder locations
app.set('views', 'app/views')
// set view template engine
app.set('view engine', 'ejs')

// use csrf tokens
app.use(csrf())
// setup middleware
app.use(function(req, res, next) {
  res.locals.csrfToken = req.csrfToken()
  next()
})

// homepage GET request
app.use('/', router)

// flash messages for csrf attacks
app.use((err, req, res, next) => {
  if (err) {
    if (err.code == 'EBADCSRFTOKEN') {
      req.flash('errors', 'CSRF: Cross-site request forgery attack detected')
      req.session.save(() => res.redirect('/'))
    } else {
      res.render('404')
    }
  }
})

// create socket.io server with app express code above
const server = require('http').createServer(app)
const io = require('socket.io')(server)

// make express session data available to socket.io
io.use((socket, next) => {
  sessionOptions(socket.request, socket.request.res, next)
})

// create connection
io.on('connection', client => {
  const user = client.request.session.user
  if (user) {
    let userData = {username: user.username, avatar: user.avatar}
    // outgoing data & message
    client.emit('welcome', userData)
    // incoming data & message 
    client.on('chatMessageFromBrowser', data => {
      // sanitize malicious code in message
      userData.message = sanitizeHTML(data.message, {allowedTags: [], allowedAttributes: []})
      client.broadcast.emit('chatMessageFromServer', userData)
    })
  }
})

// export this server which includes app, instead of listening to requests
module.exports = server