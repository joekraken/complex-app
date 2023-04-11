const express = require('express')
const router = express.Router()

// homepage route
router.get('/', (req, res) => {
  res.render('home-guest')
})

module.exports = router
