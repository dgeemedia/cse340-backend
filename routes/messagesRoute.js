// routes/messagesRoute.js
const express = require('express')
const router = express.Router()
const utilities = require('../utilities')
const messagesController = require('../controllers/messagesController')

// All pages require login
router.get('/compose', utilities.checkLogin, utilities.handleErrors(messagesController.composeView))
router.post('/send', utilities.checkLogin, utilities.handleErrors(messagesController.sendMessage))

router.get('/inbox', utilities.checkLogin, utilities.handleErrors(messagesController.inboxView))
router.get('/outbox', utilities.checkLogin, utilities.handleErrors(messagesController.outboxView))
router.get('/view/:message_id', utilities.checkLogin, utilities.handleErrors(messagesController.viewMessage))

// AJAX endpoints (allow JSON)
router.post('/mark-read', utilities.checkLogin, utilities.handleErrors(messagesController.markReadHandler))
router.post('/delete', utilities.checkLogin, utilities.handleErrors(messagesController.deleteHandler))

module.exports = router
