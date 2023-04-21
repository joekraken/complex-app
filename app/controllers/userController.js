const User = require('../models/User') // User model

exports.login = (req, res) => {
  let user = new User(req.body) // user object model
  // login returns a Promise
  user.login().then(function() {
    // server stores user Session data
    req.session.user = {username: user.data.username}
    req.session.save(()  => res.redirect('/'))
  }).catch(function(e) {
    req.flash('errors', e) // store error messages in Session
    req.session.save(() => res.redirect('/')) // manually save to db, then redirct
  })
}

exports.logout = (req, res) => {
  // delete the user Session store, callback runs when Session is destroyed
  req.session.destroy(() => res.redirect('/'))
}

exports.register = (req, res) => {
  let user = new User(req.body) // user object model
  user.register()
  // check for errors
  if (user.errors.length) {
    user.errors.forEach(e => {})
    // show errors on homepage
    user.errors.forEach(e => req.flash('regErrors', e))
    req.session.save(() => res.redirect('/'))
  } else {
    res.render('home-dashboard', {username: req.session.user.username})
  }


}

exports.home = (req, res) => {
  // confirm user is logged in
  if (req.session.user) {
    res.render('home-dashboard', {username: req.session.user.username})
  } else {
    // render home page, and retrieve possible flash error messages
    res.render('home-guest', {errors: req.flash('errors'), regErrors: req.flash('regErrors')})
  }
}