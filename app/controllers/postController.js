const Post = require('../models/Post') // Post model
const User = require('../models/User')
const jwt = require('jsonwebtoken')

// viewCreateScreen, a view to create new post
exports.createPostScreen = (req, res) => {
  res.render('create-post', {title: 'Create new post'})
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
    res.render('single-post-screen', {post: post, title: post.title})
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
      res.render('edit-post', {post: post, title: post.title})
    } else {
      // user doesnt own post
      req.flash('errors', 'you do not have permission to perform that action')
      req.session.save(() => res.redirect('/'))
    }

  } catch {
    res.render('404')
  }
}

// delete a post by its unique id
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

exports.search = (req, res) => {
  Post.search(req.body.searchTerm).then(posts => {
    res.json(posts)
  }).catch(() => {
    res.json([])
  })
}

// ** api methods **

// create post, send request to Model to save post 
exports.apiCreate = (req, res) => {
  let post = new Post(req.body, req.apiUser._id)
  post.create().then(() => {
    // save post to database
    res.json('Congrats, post saved')
  }).catch((errors) => {
    // errors, post not saved
    res.json(errors)
  })
}

// delete a post by its unique id
exports.apiDelete = (req, res) => {
  Post.delete(req.params.id, req.apiUser._id).then(() => {
    // user owns post that was deleted
    res.json('Success, post is deleted')
  }).catch(() => {
    // error, post not deleted
    res.json('You dont have permission to delete that post')
  })
}

// get all posts by given username
exports.apiPostsByUsername = async (req, res) => {
  try {
    let userDoc = await User.findByUsername(req.params.username)
    let posts = await Post.findByAuthorId(userDoc._id)
    res.json(posts)
  } catch (error) {
    res.json("Invalid user requested")
  }
}