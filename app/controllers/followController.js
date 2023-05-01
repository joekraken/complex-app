const Follow = require('../models/Follow')

exports.addFollow = function(req, res) {
  let follow = new Follow(req.params.username, req.visitorId)
  follow.create().then(() => {
    // following user is successful, go back to user profile
    req.flash('success', `Successfully following ${req.params.username}`)
    req.session.save(() => res.redirect(`/profile/${req.params.username}`))
  }).catch((errors) => {
    // failed, go to homepage
    errors.forEach(error => {
      req.flash('errors', error)
    })
    req.session.save(() => res.redirect('/'))
  })
}