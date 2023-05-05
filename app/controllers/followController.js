const Follow = require('../models/Follow')

// request to start following a user profile
exports.addFollow = async function(req, res) {
  let follow = new Follow(req.params.username, req.visitorId)
  try {
    await follow.create()
    // following user is successful, go back to user profile
    req.flash('success', `Successfully following ${req.params.username}`)
    req.session.save(() => res.redirect(`/profile/${req.params.username}`))
  } catch (errors) {
    // failed, go to homepage
    this.displayFlashErrors(req, errors)
  }
}

// request to remove following a user profile
exports.removeFollow = async function(req, res) {
  let follow = new Follow(req.params.username, req.visitorId)
  try {
    await follow.delete()
    // stop following user is successful, go back to user profile
    req.flash('success', `Successfully stopped following ${req.params.username}`)
    req.session.save(() => res.redirect(`/profile/${req.params.username}`))
  } catch (errors) {
    // failed, go to homepage
    this.displayFlashErrors(req, errors)
  }
}

// ** helper method **

displayFlashErrors = (req, errors) => {
  errors.forEach(error => {
    req.flash('errors', error)
  })
  req.session.save(() => res.redirect('/'))
}