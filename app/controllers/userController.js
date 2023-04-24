const User = require('../models/User') // User model

// user mustBeLoggedIn
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

exports.logout = (req, res) => {
  // delete the user Session store, callback runs when Session is destroyed
  req.session.destroy(() => res.redirect('/'))
}

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

exports.home = (req, res) => {
  // confirm user is logged in
  if (req.session.user) {
    res.render('home-dashboard')
  } else {
    // render home page, and retrieve possible flash error messages
    res.render('home-guest', {errors: req.flash('errors'), regErrors: req.flash('regErrors')})
  }
}