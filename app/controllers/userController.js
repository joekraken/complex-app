const User = require('../models/User')
const Post = require('../models/Post')
const Follow = require('../models/Follow')
const jwt = require('jsonwebtoken')

// verify user is logged in, mustBeLoggedIn
exports.isLoggedIn = (req, res, next) => {
  // verify user is logged in
  if (req.session.user) {
    // execute next function in the route
    next()
  } else {
    // not logged in, save error message to flash
    req.flash('errors', 'You must be logged in to perform that action')
    req.session.save(() => res.redirect('/'))
  }
}

// login
exports.login = async (req, res) => {
  let user = new User(req.body) // user object model
  try {
    await user.login()
    // server stores user Session data
    req.session.user = {username: user.data.username, avatar: user.avatar, _id: user.data._id}
    req.session.save(()  => res.redirect('/'))
  } catch (e) {
    req.flash('errors', e) // store error messages in Session
    req.session.save(() => res.redirect('/')) // manually save to db, then redirect
  }
}

// logout
exports.logout = (req, res) => {
  // delete the user Session store, callback runs when Session is destroyed
  req.session.destroy(() => res.redirect('/'))
}

// register
exports.register = async (req, res) => {
  let user = new User(req.body) // user object model
  try {
    // register a new user
    await user.register()
    // store session data
    req.session.user = {username: user.data.username, avatar: user.avatar, _id: user.data._id}
    req.session.save(()  => res.redirect('/'))
  } catch (errors) {
    // show errors on homepage
    errors.forEach(e => req.flash('regErrors', e))
    req.session.save(() => res.redirect('/'))
  }
}

// check username exists
exports.doesUsernameExist = async (req, res) => {
  try {
    await User.findByUsername(req.body.username)
    // return false if name is available
    res.json(true)
  } catch {
    res.json(false)
  }
}

exports.doesEmailExist = async (req, res) => {
  let emailExist = await User.doesEmailExist(req.body.email)
  res.json(emailExist)
}

// user dashboard or guest page
exports.home = async (req, res) => {
  // confirm user is logged in
  if (req.session.user) {
    // feed of posts that current user is following
    let posts = await Post.getFeed(req.session.user._id)
    res.render('home-dashboard', {posts: posts})
  } else {
    // render home page, and retrieve possible flash error messages
    res.render('home-guest', {regErrors: req.flash('regErrors')})
  }
}

// check user does exist
exports.ifUserExists = async (req, res, next) => {
  try {
    const userDoc = await User.findByUsername(req.params.username)
    req.profileUser = userDoc
    next()
  } catch {
    res.render('404')
  }
}

// change view between user profile data
exports.sharedProfileData = async (req, res, next) => {
  let isOwnProfile = false
  let isFollowing = false
  // veriy user is logged in
  if (req.session.user) {
    // T/F is viewing you own profile
    isOwnProfile = req.profileUser._id.equals(req.session.user._id)
    // T/F is already following user profile
    isFollowing = await Follow.isVisitorFollowing(req.profileUser._id, req.visitorId)
  }
  req.isVisitorsProfile = isOwnProfile
  req.isFollowing = isFollowing
  // counts for posts, followers, following
  const postCountPromise = Post.countPostsByAuthor(req.profileUser._id)
  const followerCountPromise = Follow.countFollowersById(req.profileUser._id)
  const followingCountPromise = Follow.countFollowingById(req.profileUser._id)
  // execute all promises simultaneously save into a destructured array
  const [postCount, followerCount, followingCount] = await Promise.all([postCountPromise, followerCountPromise, followingCountPromise])
  req.postCount = postCount
  req.followerCount = followerCount
  req.followingCount = followingCount
  next()
}

// on user profile list their posts
exports.profilePostsScreen = async function(req, res) {
  try {
    // get posts by author id
    const posts = await Post.findByAuthorId(req.profileUser._id)
    let userProfile = this.profileDataObj(req, `${req.profileUser.username}'s profile`)
    userProfile.posts = posts
    userProfile.currentPage = 'posts'
    res.render('profile', userProfile)
  } catch {
    res.render('404')
  }
}

// on user profile show which users are following them
exports.profileFollowersScreen = async (req, res) => {
  try {
    const followers = await Follow.getFollowersById(req.profileUser._id)
    let userProfile = profileDataObj(req, `${req.profileUser.username}'s followers`)
    userProfile.followers = followers
    userProfile.currentPage = 'followers'
    res.render('profile-followers', userProfile)
  } catch {
    res.render('404')
  }
}

// on user profile show other users they follow
exports.profileFollowingScreen = async (req, res) => {
  try {
    const following = await Follow.getFollowingById(req.profileUser._id)
    let userProfile = profileDataObj(req, `Followed by ${req.profileUser.username}`)
    userProfile.following = following
    userProfile.currentPage = 'following'
    res.render('profile-following', userProfile)
  } catch {
    res.render('404')
  }
}

//** helper methods **

// user profile data to render
profileDataObj = (req, title) => {
  return {
    title: title,
    profileUsername: req.profileUser.username,
    profileAvatar: req.profileUser.avatar,
    isFollowing: req.isFollowing,
    isVisitorsProfile: req.isVisitorsProfile,
    counts: {post: req.postCount, follower: req.followerCount, following: req.followingCount}
  }
}

// ** api methods **

exports.apiIsLoggedIn = (req, res, next) => {
  try {
    req.apiUser = jwt.verify(req.body.token, process.env.JWTSECRET)
    next()
  } catch {
    res.json('Invalid token sent')
  }
}

// api login
exports.apiLogin = async (req, res) => {
  let user = new User(req.body) // user object model

  try {
    // login user, req API body must have username and password
    await user.login()
    const token = jwt.sign(
      {_id:user.data._id},
      process.env.JWTSECRET,
      {expiresIn: '4h'}
    )
    // return generate web token
    res.json(token)
  } catch {
    res.json('failed login')
  }
}

// check username exists
exports.apiDoesUsernameExist = async (req, res, next) => {
  try {
    await User.findByUsername(req.params.username)
    next()
  } catch {
    // invalid username
    res.json("That user does not exist")
  }
}
