const Post = require('../models/Post') // Post model
const User = require('../models/User')
const jwt = require('jsonwebtoken')

// viewCreateScreen, a view to create new post
exports.createPostScreen = (req, res) => {
  res.render('create-post', {title: 'Create new post'})
}

// create post, send request to Model to save post 
exports.create = async (req, res) => {
  let post = new Post(req.body, req.session.user._id)
  try {
    // save new post to db
    const postId = await post.create()
    req.flash('success', 'New post successfully created')
    req.session.save(() => res.redirect(`/post/${postId}`))
  } catch (errors) {
    // errors, post not saved
    errors.forEach(error => req.flash('errors', error))
    req.session.save(() => res.redirect('/create-post'))
  }
}

// update an existing post
exports.edit = async (req, res) => {
  let post = new Post(req.body, req.visitorId, req.params.id)
  try {
    // post updated either successfully or validation errors
    const status = await post.update()
    if (status == 'success') {
      // successful post update
      req.flash('success', 'Post successfully updated')
    } else {
      // validation errors, redirect back to edit post page
      post.errors.forEach(error => req.flash('errors'))
    }
    req.session.save(() => res.redirect(`/post/${req.params.id}/edit`))
  } catch {
    // post doesn't exist or visitor is not owner of the post to update
    req.flash('errors', 'you do not have persmission to perform that action')
    req.session.save(() => res.redirect('/'))
  }
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
    // check user authored this post
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
exports.delete = async (req, res) => {
  try {
    // delete user's own post
    await Post.delete(req.params.id, req.visitorId)
    req.flash('success', 'Post successfully deleted')
    req.session.save(() => res.redirect(`/profile/${req.session.user.username}`))
  } catch {
    // user not owner of post to delete
    req.flash('errors', 'you do not have persmission to perform that action')
    req.session.save(() => res.redirect('/'))
  }
}

// search for posts
exports.search = async (req, res) => {
  try {
    const posts = await Post.search(req.body.searchTerm)
    res.json(posts)
    
  } catch {
    res.json([])
  }
}

// ** api methods **

// create post, send request to Model to save post 
exports.apiCreate = async (req, res) => {
  let post = new Post(req.body, req.apiUser._id)
  try {
    // save post to database
    await post.create()
    res.json('Congrats, post saved')
  } catch (errors) {
    res.json(errors)
  }
}

// delete a post by its unique id
exports.apiDelete = async (req, res) => {
  
  try {
    // user owns post that was deleted
    await Post.delete(req.params.id, req.apiUser._id)
    res.json('Success, post is deleted')
  } catch {
    // error, post not deleted
    res.json('You dont have permission to delete that post')
  }
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