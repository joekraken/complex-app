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

// user dashboard or guest page
exports.home = (req, res) => {
  // confirm user is logged in
  if (req.session.user) {
    res.render('home-dashboard')
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

// list of post for a user
exports.profilePostsScreen = (req, res) => {
  // get posts by author id
  Post.findByAuthorId(req.profileUser._id).then((posts) => {
    res.render('profile', {
      profileUsername: req.profileUser.username,
      profileAvatar: req.profileUser.avatar,
      posts: posts,
      isFollowing: req.isFollowing,
      isVisitorsProfile: req.isVisitorsProfile
    })
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
  next()
}
