// viewCreateScreen, a view to create new post
exports.createPostScreen = (req, res) => {
  res.render('create-post', {username: req.session.user.username, avatar: req.session.user.avatar})
}