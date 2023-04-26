const Post = require('../models/Post') // Post model

// viewCreateScreen, a view to create new post
exports.createPostScreen = (req, res) => {
  res.render('create-post')
}

// create post, send request to Model to save post 
exports.create = (req, res) => {
  let post = new Post(req.body, req.session.user._id)
  post.create().then(() => {
    // save post to database
    res.send('new post created')
  }).catch((errors) => {
    // errors, post not saved
    res.send(errors)
  })
}

// update an existing post
exports.edit = (req, res) => {
  let post = new Post(req.body, req.visitorId, req.params.id)
  post.update().then((status) => {
    // post successfully update or validation error
    if (status == 'success') {
      // successful post update
      req.flash('success', 'Post successfully updated')
      //req.session.save(() => res.redirect(`/post/${req.params.id}/edit`))
    } else {
      // validation errors, redirect back to edit post page
      post.errors.forEach(error => req.flash('errors'))
      //req.session.save(() => res.redirect(`/post/${req.params.id}/edit`))
    }
    req.session.save(() => res.redirect(`/post/${req.params.id}/edit`))
  }).catch(() => {
    // post doesn't exist or visitor is not owner of the post to update
    req.flash('errors', 'you do not have persmission to perform that action')
    req.session.save(() => res.redirect('/'))
  })
}

// retrieve a Post with id from Model
exports.viewSinglePost = async (req, res) => {
  try {
    let post = await Post.findSingleById(req.params.id, req.visitorId)
    res.render('single-post-screen', {post: post})
  } catch (e) {
    res.render('404')
  }
}

// view the edit post screen
exports.viewEditScreen = async (req, res) => {
  try {
    let post = await Post.findSingleById(req.params.id)
    res.render('edit-post', {post: post})
  } catch (e) {
    res.render('404')
  }
}