const Post = require('../models/Post') // Post model

// viewCreateScreen, a view to create new post
exports.createPostScreen = (req, res) => {
  res.render('create-post')
}

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