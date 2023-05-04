import axios from 'axios' // send HTTP requests
import DOMPurify from 'dompurify' // sanitize HTML


export default class Search {
  // store DOM elements and useful data
  constructor() {
    this.csrfToken = document.querySelector('[name="_csrf"]').value
    this.injectHTML() // inject search area HTML
    this.headerSearchIcon = document.querySelector('.header-search-icon') // select element with class
    this.overlay = document.querySelector('.search-overlay')
    this.closeOverlayIcon = document.querySelector('.close-live-search')
    this.inputField = document.querySelector('#live-search-field')
    this.resultsArea = document.querySelector('.live-search-results')
    this.loaderIcon = document.querySelector('.circle-loader')
    this.typingWaitTimer
    this.previousValue = ''
    this.events()
  }

  //**events**
  events() {
    this.inputField.addEventListener('keyup', () => this.keyPressHandler())
    // close the search box overlay
    this.closeOverlayIcon.addEventListener('click', () => this.closeOverlay())
    // open the search box overlay
    this.headerSearchIcon.addEventListener('click', (e) => {
      e.preventDefault()
      this.openOverlay()
    })
  }

  //**methods**

  // handle user keystrokes
  keyPressHandler() {
    let value = this.inputField.value
    // if search value is empty reset
    if (value == '') {
      clearTimeout(this.typingWaitTimer)
      this.hideLoaderIcon()
      this.hideResultsArea()
    }
    // check for new keystroke, i.e. user typing
    if (value != '' && value != this.previousValue) {
      clearTimeout(this.typingWaitTimer)
      this.showLoaderIcon()
      // wait after last keystroke, to get search results
      this.typingWaitTimer = setTimeout(() => this.sendRequest(), 800)
    }
    this.previousValue = value
  }

  // send HTTP search request to via route to Post model and database
  sendRequest() {
    axios.post('/search', {_csrf: this.csrfToken, searchTerm: this.inputField.value}).then(response => {
      this.renderResultsHTML(response.data)
    }).catch(() => {
      alert('oops, search fail')
    })
  }

  // HTML to display search results 
  renderResultsHTML(posts) {
    // check results has items
    if (posts.length) {
      // remove malicious JavaScript
      this.resultsArea.innerHTML = DOMPurify.sanitize(`<div class="list-group shadow-sm">
        <div class="list-group-item active"><strong>Search Results</strong> (${posts.length > 1 ? `${posts.length} items` : '1 item'} found)</div>
        ${posts.map((post) => {
          const postDate = new Date(post.createdDate)
          return `<a href="/post/${post._id}" class="list-group-item list-group-item-action">
              <img class="avatar-tiny" src="${post.author.avatar}"> <strong>${post.title}</strong>
              <span class="text-muted small">by ${post.author.username} on ${postDate.getMonth()+1}/${postDate.getDay()}/${postDate.getFullYear()}</span>
            </a>`
        }).join('')}
      </div>`)
    } else {
      this.resultsArea.innerHTML = `<p class='alert alert-danger text-center shadow-sm'>Sorry, no results found for that serach</p>`
    }
    this.hideLoaderIcon()
    this.showResultsArea()
  }

  // display the search overlay box
  openOverlay() {
    this.overlay.classList.add('search-overlay--visible')
    setTimeout(() => this.inputField.focus(), 50)
  }

  // hide the search overlay box
  closeOverlay() {
    this.overlay.classList.remove('search-overlay--visible')
  }

  // display the post search results
  showResultsArea() {
    this.resultsArea.classList.add('live-search-results--visible')
  }

  // hide the post search results
  hideResultsArea() {
    this.resultsArea.classList.remove('live-search-results--visible')
  }

  // display spinning loader
  showLoaderIcon() {
    this.loaderIcon.classList.add('circle-loader--visible')
  }

  // hide spinning loader
  hideLoaderIcon() {
    this.loaderIcon.classList.remove('circle-loader--visible')
  }

  // HTML for search overlay box
  injectHTML() {
    document.body.insertAdjacentHTML('beforeend', `
      <div class="search-overlay">
        <div class="search-overlay-top shadow-sm">
          <div class="container container--narrow">
            <label for="live-search-field" class="search-overlay-icon"><i class="fas fa-search"></i></label>
            <input type="text" id="live-search-field" class="live-search-field" placeholder="What are you interested in?">
            <span class="close-live-search"><i class="fas fa-times-circle"></i></span>
          </div>
        </div>
        <div class="search-overlay-bottom">
          <div class="container container--narrow py-3">
            <div class="circle-loader"></div>
            <div class="live-search-results"></div>
          </div>
        </div>
      </div>
    `)
  }
}