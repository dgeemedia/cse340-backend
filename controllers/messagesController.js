// controllers/messagesController.js
const messagesModel = require('../models/messages-model')
const utilities = require('../utilities')
const jwt = require('jsonwebtoken') // only if needed

// show inbox
async function inboxView(req, res, next) {
  try {
    const account = res.locals.accountData
    const nav = await utilities.getNav()
    const inbox = await messagesModel.getInbox(account.account_id)
    res.render('messages/inbox', { title: 'Inbox', nav, inbox })
  } catch (err) {
    next(err)
  }
}

// show outbox
async function outboxView(req, res, next) {
  try {
    const account = res.locals.accountData
    const nav = await utilities.getNav()
    const outbox = await messagesModel.getOutbox(account.account_id)
    res.render('messages/outbox', { title: 'Sent Messages', nav, outbox })
  } catch (err) {
    next(err)
  }
}

// view single message
async function viewMessage(req, res, next) {
  try {
    const id = parseInt(req.params.message_id, 10)
    if (!id) return res.redirect('/account/messages/inbox')
    const nav = await utilities.getNav()
    const message = await messagesModel.getMessageById(id)
    if (!message) {
      req.flash('error', 'Message not found.')
      return res.redirect('/account/messages/inbox')
    }
    // If current user is recipient and message is unread, mark read
    const account = res.locals.accountData
    if (message.recipient_id === account.account_id && !message.is_read) {
      await messagesModel.markRead(id, true)
      message.is_read = true
    }
    res.render('messages/view', { title: 'Message', nav, message })
  } catch (err) {
    next(err)
  }
}

// GET compose page (renders recipient list based on role)
async function composeView(req, res, next) {
  try {
    const account = res.locals.accountData
    const nav = await utilities.getNav()
    let recipients = []
    // If client -> show employees/managers
    if (account.account_type && account.account_type.toLowerCase() === 'client') {
      recipients = await messagesModel.listRecipientsByRoles(['Employee','Manager'])
    } else {
      // Employee or Manager -> show clients
      recipients = await messagesModel.listRecipientsByRoles(['Client'])
    }
    res.render('messages/compose', { title: 'Compose Message', nav, recipients })
  } catch (err) {
    next(err)
  }
}

// POST send message
async function sendMessage(req, res, next) {
  try {
    const account = res.locals.accountData
    const senderId = account.account_id
    const recipientId = parseInt(req.body.recipient_id, 10)
    const subject = (req.body.subject || '').trim()
    const body = (req.body.body || '').trim()

    // basic validation
    const errors = []
    if (!recipientId || Number.isNaN(recipientId)) errors.push('Please choose a recipient.')
    if (!body) errors.push('Message body cannot be empty.')

    // ensure recipient allowed: if sender is client, recipient must be Employee/Manager and vice-versa
    const allowedForClient = ['employee','manager']
    const requiredRole = (account.account_type || '').toLowerCase() === 'client' ? allowedForClient : ['client']

    // fetch recipients filtered server-side and check recipientId present
    const allowedList = await messagesModel.listRecipientsByRoles(requiredRole)
    const allowedIds = allowedList.map(r => r.account_id)
    if (!allowedIds.includes(recipientId)) {
      errors.push('Recipient is not available to you.')
    }

    if (errors.length) {
      req.flash('error', errors.join(' '))
      return res.redirect('/account/messages/compose')
    }

    const saved = await messagesModel.sendMessage(senderId, recipientId, subject, body)

    // emit socket notification if socket server available on req.app.locals.io
    try {
      const io = req.app.locals.io
      if (io) {
        io.to(`user:${recipientId}`).emit('incoming_message', saved)
      }
    } catch (emitErr) {
      console.error('Socket emit failed after message send', emitErr)
    }

    req.flash('success', 'Message sent.')
    return res.redirect('/account/messages/outbox')
  } catch (err) {
    next(err)
  }
}

// mark-read endpoint (AJAX)
async function markRead(req, res, next) {
  try {
    const { message_id, is_read } = req.body
    const id = parseInt(message_id, 10)
    if (!id) return res.status(400).json({ error: 'Invalid id' })
    const updated = await messagesModel.markRead(id, !!is_read)
    return res.json({ ok: true, updated })
  } catch (err) {
    next(err)
  }
}

// delete handler (POST from forms)
async function deleteMessageHandler(req, res, next) {
  try {
    const id = parseInt(req.body.message_id, 10)
    if (!id) {
      req.flash('error', 'Invalid message id.')
      return res.redirect('/account/messages/inbox')
    }
    // optionally check ownership (sender or recipient)
    const message = await messagesModel.getMessageById(id)
    if (!message) {
      req.flash('error', 'Message not found.')
      return res.redirect('/account/messages/inbox')
    }
    const account = res.locals.accountData
    if (message.recipient_id !== account.account_id && message.sender_id !== account.account_id) {
      req.flash('error', 'You are not authorized to delete that message.')
      return res.redirect('/account/messages/inbox')
    }
    await messagesModel.deleteMessage(id)
    req.flash('success', 'Message deleted.')
    return res.redirect('/account/messages/inbox')
  } catch (err) {
    next(err)
  }
}

module.exports = {
  inboxView,
  outboxView,
  viewMessage,
  composeView,
  sendMessage,
  markRead,
  deleteMessageHandler,
}
