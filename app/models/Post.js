const ObjectId = require('mongodb').ObjectId
const postsCollection = require('../../db').db().collection('posts')
const User = require('./User')

let Post = function(data, userId, postId) {
  this.data = data
  this.requestedPostId = postId
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

// save valid post to database
Post.prototype.create = function() {
  return new Promise(async (resolve, reject) => {
    this.cleanUp()
    this.validate()
    // if no errors, then save post to database
    if (!this.errors.length) {
      // save post to db
      postsCollection.insertOne(this.data).then(() => {
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

// updated a post in the database
Post.prototype.update = function() {
  return new Promise(async (resolve, reject) => {
    try {
      let post = await Post.findSingleById(this.requestedPostId, this.userId)
      // check user authored the post
      if (post.isVisitorOwner) {
        // update database
        let status = await this.updateDb()
        resolve(status)
      } else {
        // invalid user
        reject()
      }
    } catch {
      reject()
    }
  })
}

Post.prototype.updateDb = function() {
  return new Promise(async (resolve, reject) => {
    this.cleanUp()
    this.validate()
    // check validation errors
    if (!this.errors.length) {
      // document fields to update
      const updateDoc = {$set: {title: this.data.title, body: this.data.body}}
      // request mongo to update
      await postsCollection.findOneAndUpdate({_id: new ObjectId(this.requestedPostId)}, updateDoc)
      resolve('success')
    } else {
      resolve('failure')
    }
  })
}

Post.queryPosts = function(opsArray, visitorId) {
  return new Promise(async (resolve, reject) => {
    let aggregateOps = opsArray.concat([
      {$lookup: {from: 'users', localField: 'author', foreignField: '_id', as: 'authorInfo'}},
      {$project: {
        title: 1,
        body: 1,
        createdDate: 1,
        authorId: '$author',
        author: {$arrayElemAt: ['$authorInfo', 0]}
      }}
    ])
    // retrieve the post associated with the id and author
    let posts = await postsCollection.aggregate(aggregateOps).toArray()
    // clean up author property in post object
    // set author property to have username and gravatar icon
    // .map() creates a new array
    posts = posts.map(function(post) {
      post.isVisitorOwner = post.authorId.equals(visitorId)
      post.author = {
        username: post.author.username,
        avatar: new User(post.author, true).avatar
      }
      return post
    })

    resolve(posts)
  })
}

Post.findSingleById = function(postId, visitorId) {
  return new Promise(async (resolve, reject) => {
    // validate id is a not string or invalid mongo _id
    if (typeof(postId) != 'string' || !ObjectId.isValid(postId)) {
      reject()
      return
    }
    let posts = await Post.queryPosts([{$match: {_id: new ObjectId(postId)}}], visitorId)
    // check post is not empty
    if (posts.length) {
      resolve(posts[0])
    } else {
      reject()
    }
  })
}

Post.findByAuthorId = function(authorId) {
  return Post.queryPosts([
    {$match: {author: authorId}},
    {$sort: {createdDate: -1}}
  ])
}

module.exports = Post