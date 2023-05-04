// models
const User = require('../models/User')
const Post = require('../models/Post')
const Follow = require('../models/Follow')

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
exports.login = (req, res) => {
  let user = new User(req.body) // user object model
  // login returns a Promise
  user.login().then(function() {
    // server stores user Session data
    req.session.user = {username: user.data.username, avatar: user.avatar, _id: user.data._id}
    req.session.save(()  => res.redirect('/'))
  }).catch(function(e) {
    req.flash('errors', e) // store error messages in Session
    req.session.save(() => res.redirect('/')) // manually save to db, then redirect
  })
}

// logout
exports.logout = (req, res) => {
  // delete the user Session store, callback runs when Session is destroyed
  req.session.destroy(() => res.redirect('/'))
}

// register
exports.register = (req, res) => {
  let user = new User(req.body) // user object model
  user.register().then(() => {
    req.session.user = {username: user.data.username, avatar: user.avatar, _id: user.data._id}
    req.session.save(()  => res.redirect('/'))
  }).catch((regErrors) => {
    // show errors on homepage
    regErrors.forEach(e => req.flash('regErrors', e))
    req.session.save(() => res.redirect('/'))
  })
}

// check username exists
exports.doesUsernameExist = function(req, res) {
  User.findByUsername(req.body.username).then(() => {
    // return true if name is taken
    res.json(true)
  }).catch(() => {
    // return false if name is available
    res.json(false)
  })
}

exports.doesEmailExist = async function(req, res) {
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
exports.ifUserExists = (req, res, next) => {
  User.findByUsername(req.params.username).then((userDoc) => {
    req.profileUser = userDoc
    next()
  }).catch(() => {
    res.render('404')
  })
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
exports.profilePostsScreen = (req, res) => {
  // get posts by author id
  Post.findByAuthorId(req.profileUser._id).then((posts) => {
    userProfile = profileDataObj(req, `${req.profileUser.username}'s profile`)
    userProfile.posts = posts
    userProfile.currentPage = 'posts'
    res.render('profile', userProfile)
  }).catch(() => res.render('404'))
}

// on user profile show which users are following them
exports.profileFollowersScreen = async (req, res) => {
  try {
    let followers = await Follow.getFollowersById(req.profileUser._id)
    userProfile = profileDataObj(req, `${req.profileUser.username}'s followers`)
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
    let following = await Follow.getFollowingById(req.profileUser._id)
    userProfile = profileDataObj(req, `Followed by ${req.profileUser.username}`)
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

// api login
exports.apiLogin = (req, res) => {
  let user = new User(req.body) // user object model
  // login returns a Promise
  user.login().then(function() {
    res.json('successful login')
  }).catch(function(e) {
    res.json('failed login')
  })
}