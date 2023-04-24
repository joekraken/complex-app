const express = require('express')
const router = express.Router()
const userController = require('./controllers/userController')
const postController = require('./controllers/postController')

// user routes
router.get('/', userController.home) // home page
router.post('/register', userController.register) // new user sign up
router.post('/login', userController.login) // login existing user
router.post('/logout', userController.logout)

// post-feature routes
router.get('/create-post', userController.isLoggedIn, postController.createPostScreen)
router.post('/create-post', userController.isLoggedIn, postController.create)

module.exports = router
