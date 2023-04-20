const express = require('express')
const router = express.Router()
const userController = require('./controllers/userController')

router.get('/', userController.home) // home page
router.post('/register', userController.register) // new user sign up
router.post('/login', userController.login) // login existing user

module.exports = router
