const Post = require('../models/Post') // Post model

// viewCreateScreen, a view to create new post
exports.createPostScreen = (req, res) => {
  res.render('create-post')
}

// create post, send request to Model to save post 
exports.create = (req, res) => {
  let post = new Post(req.body, req.session.user._id)
  post.create().then(function() {
    // save post to database
    res.send('new post created')
  }).catch(function(errors) {
    // errors, post not saved
    res.send(errors)
  })
}

// retrieve a Post with id from Model
exports.viewSinglePost = async (req, res) => {
  try {
    let post = await Post.findSingleById(req.params.id)
    res.render('single-post-screen', {post: post})
  } catch (error) {
    res.send("404 page not found template goes here")
  }
}