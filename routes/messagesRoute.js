const express = require("express")
const router = express.Router()
const utilities = require("../utilities")
const messagesController = require("../controllers/messagesController")

// Inbox / Outbox
router.get("/inbox", utilities.checkLogin, utilities.handleErrors(messagesController.inboxView))
router.get("/outbox", utilities.checkLogin, utilities.handleErrors(messagesController.outboxView))

// Send message (form)
router.post("/send", utilities.checkLogin, utilities.handleErrors(messagesController.sendMessage))

// Mark read/unread (AJAX)
router.post("/mark-read", utilities.checkLogin, utilities.handleErrors(messagesController.markRead))

module.exports = router
