const User = require('../models/User') // User model

exports.login = (req, res) => {
  let user = new User(req.body) // user object model
  // login returns a Promise
  user.login().then(function(message) {
    // server stores unique session data
    req.session.user = {username: user.data.username}
    res.send(message)
  }).catch(function(error) {
    res.send(error)
  })
}

exports.logout = () => {}

exports.register = (req, res) => {
  let user = new User(req.body) // user object model
  user.register()
  // check for errors
  if (user.errors.length) {
    res.send(user.errors)
  } else {
    res.send('thanks for new registration')
  }
}

exports.home = (req, res) => {
  // confirm user is logged in
  if (req.session.user) {
    res.send('welcome to the app')
  } else {
    res.render('home-guest')
  }
}