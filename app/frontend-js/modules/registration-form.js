import axios from 'axios'

export default class RegistrationForm {
  constructor() {
    this.csrfToken = document.querySelector('[name="_csrf"]').value
    this.form = document.querySelector('#registration-form')
    this.allFields = document.querySelectorAll('#registration-form .form-control')
    this.insertValidationElements()
    this.username = document.querySelector('#username-register')
    this.username.previousValue = ''
    this.username.isUnique = false
    this.email = document.querySelector('#email-register')
    this.email.previousValue = ''
    this.email.isUnique = false
    this.password = document.querySelector('#password-register')
    this.password.previousValue = ''
    this.events()
  }

  // ** events **

  events() {
    this.form.addEventListener('submit', e => {
      e.preventDefault()
      this.formSubmitHandler()
    })
    this.username.addEventListener('keyup', () => {
      this.isFieldValueChanged(this.username, this.usernameHandler)
    })
    this.email.addEventListener('keyup', () => {
      this.isFieldValueChanged(this.email, this.emailHandler)
    })
    this.password.addEventListener('keyup', () => {
      this.isFieldValueChanged(this.password, this.passwordHandler)
    })
    this.username.addEventListener('blur', () => {
      this.isFieldValueChanged(this.username, this.usernameHandler)
    })
    this.email.addEventListener('blur', () => {
      this.isFieldValueChanged(this.email, this.emailHandler)
    })
    this.password.addEventListener('blur', () => {
      this.isFieldValueChanged(this.password, this.passwordHandler)
    })
  }

  // ** methods **

  formSubmitHandler() {
    // run all validations
    this.usernameImmediately()
    this.usernameAfterDelay()
    this.emailAfterDelay()
    this.passwordImmediately()
    this.passwordAfterDelay()

    // check no error validations
    if (
        this.username.isUnique &&
        !this.username.errors &&
        this.email.isUnique &&
        !this.email.errors &&
        !this.password.errors
      ) {
      this.form.submit()
    }
  }

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
    // error check for non-alphanumeric characters using regExp /^([a-zA-Z0-9]+)$/
    if (this.username.value != '' && !/^([a-zA-Z0-9]+)$/.test(this.username.value)) {
      this.showValidationError(this.username, 'Username can only contain letters and numbers')
    }
    // error check length limit
    if (this.username.value.length > 30) {
      this.showValidationError(this.username, 'Username cannot exceed 30 characters')
    }
    // no errors, hide validation
    if (!this.username.errors) {
      this.hideValidationError(this.username)
    }
  }

  usernameAfterDelay() {
    // error check length limit
    if (this.username.value.length < 3) {
      this.showValidationError(this.username, 'Username must be at least 3 characters')
    }
    // if no errors, then check server if username exists
    if (!this.username.errors) {
      axios.post('/doesUsernameExist', {_csrf: this.csrfToken, username: this.username.value}).then((response) => {
        // true then username exists, else false
        if (response.data) {
          this.username.isUnique = false
          this.showValidationError(this.username, 'That username is already taken')
        } else {
          this.username.isUnique = true
        }
      }).catch(() => {
        console.log('try again later')
      })
    }
  }

  emailHandler() {
    this.email.errors = false
    clearTimeout(this.email.timer)
    this.email.timer = setTimeout(() => this.emailAfterDelay(), 800)
  }

  emailAfterDelay() {
    // check email using regExp /^\S+@\S+$/
    if (!/^\S+@\S+$/.test(this.email.value)) {
      this.showValidationError(this.email, 'You must provide a valid email')
    }
    if (!this.email.errors) {
      axios.post('/doesEmailExist', {_csrf: this.csrfToken, email: this.email.value}).then((response) => {
        // true then email exists, else false
        if (response.data) {
          this.email.isUnique = false
          this.showValidationError(this.email, 'That email is already taken')
        } else {
          this.email.isUnique = true
          this.hideValidationError(this.email)
        }
      }).catch(() => {
        console.log("try again")
      })
    }
  }

  passwordHandler() {
    this.password.errors = false
    this.passwordImmediately()
    clearTimeout(this.password.timer)
    this.password.timer = setTimeout(() => this.passwordAfterDelay(), 800)
  }

  passwordImmediately() {
    // check length limit
    if (this.password.value.length > 50) {
      this.showValidationError(this.password, 'Password cannot exceed 50 characters')
    }
    // no errors, hide validation
    if (!this.password.errors) {
      this.hideValidationError(this.password)
    }
  }

  passwordAfterDelay() {
    // check length limit
    if (this.password.value.length < 12) {
      this.showValidationError(this.password, 'Password must be at least 12 characters')
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
    this.allFields.forEach(el => {
      el.insertAdjacentHTML('afterend', '<div class="alert alert-danger small liveValidateMessage"></div>')
    })
  }
}
