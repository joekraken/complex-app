const express = require('express')
const app = express()
const port = 3000

const router = require('./app/router')

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

// listen to incoming requests
app.listen(port, () => console.log(`Example app listening on port ${port}!`))