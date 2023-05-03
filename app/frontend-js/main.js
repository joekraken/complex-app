import Chat from './modules/chat'
import Search from './modules/search'
import RegistrationForm from './modules/registration-form'

if (document.querySelector('#chat-wrapper')) {new Chat()}
if (document.querySelector('.header-search-icon')) {new Search()}
if (document.querySelector('#registration-form')) {new RegistrationForm()}
