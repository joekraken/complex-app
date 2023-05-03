export default class Chat {
  constructor() {
    this.hasOpenedYet = false
    this.chatWrapperElem = document.querySelector('#chat-wrapper')
    this.openIcon = document.querySelector('.header-chat-icon')
    this.injectHTML()
    this.chatLog = document.querySelector('#chat')
    this.chatField = document.querySelector('#chatField')
    this.chatForm = document.querySelector('#chatForm')
    this.closeIcon = document.querySelector('.chat-title-bar-close')
    this.events()
  }

  // events
  events() {
    this.openIcon.addEventListener('click', () => this.showChatBox())
    this.closeIcon.addEventListener('click', () => this.hideChatBox())
    this.chatForm.addEventListener('submit', (e) => {
      e.preventDefault()
      this.sendMessageToServer()
    })
  }

  //** methods **

  showChatBox() {
    // check if chat has been opened and server connection is opened
    if (!this.hasOpenedYet) {
      this.openConnection()
    }
    this.hasOpenedYet = true
    this.chatWrapperElem.classList.add('chat--visible')
    this.chatField.focus()
  }

  hideChatBox() {
    this.chatWrapperElem.classList.remove('chat--visible')
  }

  openConnection() {
    this.socket = io()
    this.socket.on('welcome', data => {
      this.username = data.username
      this.avatar = data.avatar
    })
    this.socket.on('chatMessageFromServer', data => {
      this.chatLog.insertAdjacentHTML('beforeend', `
        <div class="chat-other">
          <a href="#"><img class="avatar-tiny" src="${data.avatar}"></a>
          <div class="chat-message"><div class="chat-message-inner">
            <a href="#"><strong>${data.username}:</strong></a>
            ${data.message}
          </div></div>
        </div>
      `)
    })
  }

  sendMessageToServer() {
    this.socket.emit('chatMessageFromBrowser', {message: this.chatField.value})
    this.chatLog.insertAdjacentHTML('beforeend', `
      <div class="chat-self">
        <div class="chat-message">
          <div class="chat-message-inner">
            ${this.chatField.value}
          </div>
        </div>
        <img class="chat-avatar avatar-tiny" src="${this.avatar}">
      </div>
    `)
    this.chatField.value = ''
    this.chatField.focus()
  }

  injectHTML() {
    this.chatWrapperElem.innerHTML = `
      <div class="chat-title-bar">Chat <span class="chat-title-bar-close"><i class="fas fa-times-circle"></i></span></div>
      <div id="chat" class="chat-log"></div>
      <form id="chatForm" class="chat-form border-top">
        <input type="text" class="chat-field" id="chatField" placeholder="Type a message…" autocomplete="off">
      </form>
    `
  }
}
