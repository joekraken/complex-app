exports.login = () => {}

exports.logout = () => {}

exports.register = (req, res) => {
  res.send('thanks for new registration')
}

exports.home = (req, res) => {
  res.render('home-guest')
}