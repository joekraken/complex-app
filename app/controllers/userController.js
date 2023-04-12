const User = require('../models/User')

exports.login = () => {}

exports.logout = () => {}

exports.register = (req, res) => {
  let user = new User(req.body)
  res.send('thanks for new registration')
}

exports.home = (req, res) => {
  res.render('home-guest')
}