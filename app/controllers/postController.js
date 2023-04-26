const Post = require('../models/Post') // Post model

// viewCreateScreen, a view to create new post
exports.createPostScreen = (req, res) => {
  res.render('create-post')
}

// create post, send request to Model to save post 
exports.create = (req, res) => {
  let post = new Post(req.body, req.session.user._id)
  post.create().then((postId) => {
    // save post to database
    req.flash('success', 'New post successfully created')
    req.session.save(() => res.redirect(`/post/${postId}`))
  }).catch((errors) => {
    // errors, post not saved
    errors.forEach(error => req.flash('errors', error))
    req.session.save(() => res.redirect('/create-post'))
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
    } else {
      // validation errors, redirect back to edit post page
      post.errors.forEach(error => req.flash('errors'))
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
    let post = await Post.findSingleById(req.params.id, req.visitorId)
    // check user is authored this post
    if (post.isVisitorOwner) {
      res.render('edit-post', {post: post})
    } else {
      // user doesnt own post
      req.flash('errors', 'you do not have permission to perform that action')
      req.session.save(() => res.redirect('/'))
    }

  } catch {
    res.render('404')
  }
}

exports.delete = (req, res) => {
  Post.delete(req.params.id, req.visitorId).then(() => {
    // user owns post that was deleted
    req.flash('success', 'Post successfully deleted')
    req.session.save(() => res.redirect(`/profile/${req.session.user.username}`))
  }).catch(() => {
    // user not owner of post to delete
    req.flash('errors', 'you do not have persmission to perform that action')
    req.session.save(() => res.redirect('/'))
  })
}