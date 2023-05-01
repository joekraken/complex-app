const express = require('express')
const router = express.Router()
const userController = require('./controllers/userController')
const postController = require('./controllers/postController')
const followController = require('./controllers/followController')

// user routes
router.get('/', userController.home) // home page
router.post('/register', userController.register) // new user sign up
router.post('/login', userController.login) // login existing user
router.post('/logout', userController.logout)

// profile-feature routes
router.get('/profile/:username', userController.ifUserExists, userController.sharedProfileData, userController.profilePostsScreen)

// post-feature routes
router.get('/create-post', userController.isLoggedIn, postController.createPostScreen)
router.post('/create-post', userController.isLoggedIn, postController.create)
router.get('/post/:id', postController.viewSinglePost)
router.get('/post/:id/edit', userController.isLoggedIn, postController.viewEditScreen)
router.post('/post/:id/edit', userController.isLoggedIn, postController.edit)
router.post('/post/:id/delete', userController.isLoggedIn, postController.delete)
router.post('/search', postController.search)

// follow-feature routes
router.post('/addFollow/:username', userController.isLoggedIn, followController.addFollow)

module.exports = router
