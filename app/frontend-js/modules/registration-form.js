export default class RegistrationForm {
  constructor() {
    this.allFields = document.querySelectorAll('#registration-form .form-control')
    this.insertValidationElements()
    this.username = document.querySelector('#username-register')
    this.username.previousValue = ''
    // this.email = document.querySelector('#email-register')
    // this.password = document.querySelector('#password-register')
    this.events()
  }

  // ** events **

  events() {
    this.username.addEventListener('keyup', () => {
      this.isFieldValueChanged(this.username, this.usernameHandler)
    })
  }

  // ** methods **

  isFieldValueChanged(el, handler) {
    if (el.previousValue != el.value) {
      handler.call(this)
      // handler()
    }
    el.previousValue = el.value
  }

  usernameHandler() {
    this.username.errors = false
    this.usernameImmediately()
    clearTimeout(this.username.timer)
    this.username.timer = setTimeout(() => this.usernameAfterDelay(), 800)
  }

  usernameImmediately() {
    // error check for non-alphanumeric characters
    if (this.username.value != '' && !/^([a-zA-Z0-9]+)$/.test(this.username.value)) {
      this.showValidationError(this.username, 'Username can only contain letters and numbers')
    }
    // error check for length limit
    if (this.username.value.length > 30) {
      this.showValidationError(this.username, 'Username cannot exceed 30 characters')
    }
    if (!this.username.errors) {
      this.hideValidationError(this.username)
    }
  }

  usernameAfterDelay() {
    // error check for length limit
    if (this.username.value.length < 3) {
      this.showValidationError(this.username, 'Username must be at least 3 characters')
    }
  }

  showValidationError(el, message) {
    el.nextElementSibling.innerHTML = message
    el.nextElementSibling.classList.add('liveValidateMessage--visible')
    el.errors = true
  }

  hideValidationError(el) {
    el.nextElementSibling.classList.remove('liveValidateMessage--visible')
  }

  insertValidationElements() {
    console.log(this.allFields)
    this.allFields.forEach(el => {
      el.insertAdjacentHTML('afterend', '<div class="alert alert-danger small liveValidateMessage"></div>')
    })
  }
}
