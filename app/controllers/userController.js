const User = require('../models/User') // User model

exports.login = (req, res) => {
  let user = new User(req.body) // user object model
  // login returns a Promise
  user.login().then(function() {
    // server stores user Session data
    req.session.user = {username: user.data.username}
    req.session.save(()  => res.redirect('/'))
  }).catch(function(error) {
    res.send(error)
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
    res.send(user.errors)
  } else {
    res.send('thanks for new registration')
  }
}

exports.home = (req, res) => {
  // confirm user is logged in
  if (req.session.user) {
    res.render('home-dashboard', {username: req.session.user.username})
  } else {
    res.render('home-guest')
  }
}