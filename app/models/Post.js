const ObjectId = require('mongodb').ObjectId
const postCollection = require('../../db').db().collection('posts')

let Post = function(data, userId) {
  this.data = data
  this.userId = userId
  this.errors = []
}

Post.prototype.cleanUp = function() {
  // check post data are strings
  if(typeof(this.data.title) != 'string') {this.data.title = ''}
  if(typeof(this.data.body) != 'string') {this.data.body = ''}

  // purify data, remove bogus properties
  this.data = {
    title: this.data.title.trim(),
    body: this.data.body.trim(),
    createdDate: new Date(),
    author: new ObjectId(this.userId)
  }
}

// check post doesn't have empty fields
Post.prototype.validate = function() {
  if (this.data.title == '') {this.errors.push('Title must be provided')}
  if (this.data.body == '') {this.errors.push('Post content must not be empty')}
}

Post.prototype.create = function() {
  return new Promise(async (resolve, reject) => {
    this.cleanUp()
    this.validate()

    // if no errors, then save post to database
    if (!this.errors.length) {
      // save post to db
      postCollection.insertOne(this.data).then(() => {
        resolve()
      }).catch(() => {
        this.errors.push('Please try again later')
        reject(this.errors)
      })
    } else {
      reject(this.errors)
    }
  })
}

module.exports = Post