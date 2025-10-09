// controllers/messagesController.js
const utilities = require('../utilities')
const messagesModel = require('../models/messages-model')

/* Show compose page (for clients: show employees/managers as recipients; for staff maybe allow choosing client) */
async function composeView(req, res, next) {
  try {
    const nav = await utilities.getNav()
    const me = res.locals.accountData || null

    // choose recipient list: staff (Employee/Manager) for client; for staff, optionally list clients
    let recipients = []
    if (me && (me.account_type || '').toLowerCase() === 'client') {
      recipients = await messagesModel.listRecipientsByRoles(['Employee', 'Manager'])
    } else {
      // staff: list clients to message or staff as needed
      recipients = await messagesModel.listRecipientsByRoles(['Client'])
    }

    res.render('messages/compose', { title: 'Compose Message', nav, recipients, errors: null })
  } catch (err) {
    next(err)
  }
}

async function sendMessage(req, res, next) {
  try {
    const me = res.locals.accountData
    if (!me || !me.account_id) {
      req.flash('notice', 'Please log in to send messages.')
      return res.redirect('/account/login')
    }

    const { recipient_id, subject, body } = req.body
    const rid = parseInt(recipient_id, 10)
    if (!rid || Number.isNaN(rid)) {
      req.flash('error', 'Please select a recipient.')
      return res.redirect('back')
    }
    if (!body || !body.trim()) {
      req.flash('error', 'Message body cannot be empty.')
      return res.redirect('back')
    }

    const saved = await messagesModel.sendMessage(me.account_id, rid, subject || '', body.trim())

    // If you want to notify via socket, you can emit here:
    // const io = req.app.get('io') // if you stored io on app in server.js
    // if (io) io.to(`user:${rid}`).emit('incoming_message', saved)

    req.flash('success', 'Message sent.')
    return res.redirect('/account/messages/outbox')
  } catch (err) {
    next(err)
  }
}

async function inboxView(req, res, next) {
  try {
    const me = res.locals.accountData
    const nav = await utilities.getNav()
    const inbox = me ? await messagesModel.getInbox(me.account_id) : []
    return res.render('messages/inbox', { title: 'Inbox', nav, inbox })
  } catch (err) {
    next(err)
  }
}

async function outboxView(req, res, next) {
  try {
    const me = res.locals.accountData
    const nav = await utilities.getNav()
    const outbox = me ? await messagesModel.getOutbox(me.account_id) : []
    return res.render('messages/outbox', { title: 'Sent Messages', nav, outbox })
  } catch (err) {
    next(err)
  }
}

async function viewMessage(req, res, next) {
  try {
    const message_id = parseInt(req.params.message_id, 10)
    const me = res.locals.accountData
    const nav = await utilities.getNav()
    const msg = await messagesModel.getMessageById(message_id)
    if (!msg) {
      req.flash('error', 'Message not found')
      return res.redirect('/account/messages/inbox')
    }
    // ensure user is participant (sender or recipient)
    if (!me || (me.account_id !== msg.recipient_id && me.account_id !== msg.sender_id)) {
      req.flash('notice', 'Not authorized to view that message.')
      return res.redirect('/account/messages/inbox')
    }
    // If recipient is viewing, mark as read
    if (me.account_id === msg.recipient_id && !msg.is_read) {
      await messagesModel.markRead(message_id, true)
    }
    return res.render('messages/view', { title: 'Message', nav, message: msg })
  } catch (err) {
    next(err)
  }
}

async function markReadHandler(req, res, next) {
  try {
    const { message_id, is_read } = req.body
    const me = res.locals.accountData
    const id = parseInt(message_id, 10)
    if (!me) return res.status(401).json({ error: 'Unauthorized' })
    const message = await messagesModel.getMessageById(id)
    if (!message) return res.status(404).json({ error: 'Not found' })
    // only recipient may toggle read/unread
    if (message.recipient_id !== me.account_id) return res.status(403).json({ error: 'Forbidden' })
    const updated = await messagesModel.markRead(id, Boolean(is_read))
    return res.json({ success: true, message: updated })
  } catch (err) {
    next(err)
  }
}

async function deleteHandler(req, res, next) {
  try {
    // body may be JSON or form data
    const id = parseInt(req.body.message_id, 10)
    const me = res.locals.accountData
    if (!me) {
      req.flash('notice', 'Please log in')
      return res.redirect('/account/login')
    }
    const message = await messagesModel.getMessageById(id)
    if (!message) {
      req.flash('error', 'Message not found')
      return res.redirect('/account/messages/inbox')
    }
    // allow sender or recipient to delete (this physically deletes row in current simple design)
    if (message.sender_id !== me.account_id && message.recipient_id !== me.account_id) {
      req.flash('notice', 'Not authorized')
      return res.redirect('/account/messages/inbox')
    }
    await messagesModel.deleteMessage(id)
    // respond OK for AJAX or redirect for forms
    if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
      return res.json({ success: true })
    }
    req.flash('success', 'Message deleted')
    return res.redirect('/account/messages/inbox')
  } catch (err) {
    next(err)
  }
}

module.exports = {
  composeView,
  sendMessage,
  inboxView,
  outboxView,
  viewMessage,
  markReadHandler,
  deleteHandler,
}
