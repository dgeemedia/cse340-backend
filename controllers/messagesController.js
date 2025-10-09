const messagesModel = require("../models/messages-model")
const utilities = require("../utilities")

const messagesController = {}

messagesController.inboxView = async (req, res, next) => {
  try {
    const nav = await utilities.getNav()
    const me = res.locals.accountData
    const inbox = await messagesModel.getInbox(me.account_id)
    res.render("messages/inbox", { title: "Inbox", nav, inbox })
  } catch (err) {
    next(err)
  }
}

messagesController.outboxView = async (req, res, next) => {
  try {
    const nav = await utilities.getNav()
    const me = res.locals.accountData
    const outbox = await messagesModel.getOutbox(me.account_id)
    res.render("messages/outbox", { title: "Sent", nav, outbox })
  } catch (err) {
    next(err)
  }
}

messagesController.sendMessage = async (req, res, next) => {
  try {
    const me = res.locals.accountData
    const { recipient_id, subject, body } = req.body
    const saved = await messagesModel.sendMessage(me.account_id, recipient_id, subject, body)

    // Emit real-time notification if io is available
    const io = req.app.get('io')
    if (io) {
      io.to(`user:${recipient_id}`).emit('incoming_message', saved)
    }

    req.flash("success", "Message sent.")
    return res.redirect("/account/messages/outbox")
  } catch (err) {
    next(err)
  }
}


messagesController.markRead = async (req, res, next) => {
  try {
    const me = res.locals.accountData
    const { message_id, is_read } = req.body
    // ensure only recipient can mark read/unread
    const msg = await messagesModel.getMessageById(message_id)
    if (!msg) return res.status(404).json({ error: "Not found" })
    if (msg.recipient_id !== me.account_id) return res.status(403).json({ error: "Not authorized" })
    const updated = await messagesModel.markRead(message_id, is_read === 'true' || is_read === true)
    return res.json({ success: true, message: updated })
  } catch (err) {
    next(err)
  }
}

module.exports = messagesController
