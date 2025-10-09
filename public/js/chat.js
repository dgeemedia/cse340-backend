// public/js/chat.js
// This file assumes socket.io client is loaded (script /socket.io/socket.io.js)
(function () {
  if (typeof io === 'undefined') return
  const socket = io()

  // incoming real-time message
  socket.on('incoming_message', (msg) => {
    console.log('incoming_message', msg)
    // Example: custom event so other UI code can react
    window.dispatchEvent(new CustomEvent('incoming_message', { detail: msg }))
    // TODO: update your message count badge or append to an open chat window
  })

  socket.on('message_sent', (msg) => {
    console.log('message_sent', msg)
    window.dispatchEvent(new CustomEvent('message_sent', { detail: msg }))
  })

  socket.on('error', (err) => {
    console.error('socket error', err)
  })

  // helper exposed globally
  window.sendDirect = function (recipientId, subject, body) {
    socket.emit('direct_message', { to: recipientId, subject, body })
  }
})()
