const apiRouter = require('express').Router()
const userController = require('./controllers/userController')
const postController = require('./controllers/postController')
const followController = require('./controllers/followController')
const cors = require('cors')

// enable CORS from any domain
apiRouter.use(cors())

// ** api routes **
// note: create and execute userController.apiDoesUsernameExist before getting posts
apiRouter.get('/postsByAuthor/:username', userController.apiDoesUsernameExist, postController.apiPostsByUsername)
apiRouter.post('/login', userController.apiLogin)
apiRouter.post('/create-post', userController.apiIsLoggedIn, postController.apiCreate)
apiRouter.delete('/post/:id', userController.apiIsLoggedIn, postController.apiDelete)

module.exports = apiRouter