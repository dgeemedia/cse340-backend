// routes/messagesRoute.js
const express = require('express')
const router = express.Router()
const utilities = require('../utilities')
const messagesController = require('../controllers/messagesController')

// require login for all message routes
router.use(utilities.checkLogin)

// inbox/outbox/view
router.get('/inbox', utilities.handleErrors(messagesController.inboxView))
router.get('/outbox', utilities.handleErrors(messagesController.outboxView))
router.get('/view/:message_id', utilities.handleErrors(messagesController.viewMessage))

// compose + send
router.get('/compose', utilities.handleErrors(messagesController.composeView))
router.post('/send', utilities.handleErrors(messagesController.sendMessage))

// AJAX mark-read
router.post('/mark-read', utilities.handleErrors(messagesController.markRead))

// delete
router.post('/delete', utilities.handleErrors(messagesController.deleteMessageHandler))

module.exports = router
