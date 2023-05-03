export default class Chat {
  constructor() {
    this.hasOpenedYet = false
    this.chatWrapperElem = document.querySelector('#chat-wrapper')
    this.openIcon = document.querySelector('.header-chat-icon')
    this.injectHTML()
    this.closeIcon = document.querySelector('.chat-title-bar-close')
    this.events()
  }

  // events
  events() {
    this.openIcon.addEventListener('click', () => this.showChatBox())
    this.closeIcon.addEventListener('click', () => this.hideChatBox())
  }

  // methods
  showChatBox() {
    // check if chat has been opened and server connection is opened
    if (!this.hasOpenedYet) {
      this.openConnection()
    }
    this.hasOpenedYet = true
    this.chatWrapperElem.classList.add('chat--visible')
  }

  hideChatBox() {
    this.chatWrapperElem.classList.remove('chat--visible')
  }

  openConnection() {

  }

  injectHTML() {
    this.chatWrapperElem.innerHTML = `
      <div class="chat-title-bar">Chat <span class="chat-title-bar-close"><i class="fas fa-times-circle"></i></span></div>
      <div id="chat" class="chat-log"</div>

      <form id="chatForm" class="chat-form border-top">
        <input type="text" class="chat-field" id="chatField" placeholder="Type a message…" autocomplete="off">
      </form>
    `
  }
}
