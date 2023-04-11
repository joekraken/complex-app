const express = require('express')
const app = express()
const port = 3000

const router = require('app/router.js')

app.use(express.static('app/public'))
// setting the views folder locations
app.set('views', 'app/views')
// set view template engine
app.set('view engine', 'ejs')

// homepage GET request
app.get('/', (req, res) => {
  res.render('home-guest')
})

// listen to incoming requests
app.listen(port, () => console.log(`Example app listening on port ${port}!`))