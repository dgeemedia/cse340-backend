// public/js/messages.js
// Handles read/unread toggles on the Inbox page using event delegation.
document.addEventListener('DOMContentLoaded', () => {
  const table = document.querySelector('.container table.card')
  if (!table) return

  table.addEventListener('change', async (e) => {
    const checkbox = e.target.closest('.mark-read')
    if (!checkbox) return

    const id = checkbox.dataset.id
    const is_read = checkbox.checked

    try {
      const res = await fetch('/account/messages/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message_id: id, is_read })
      })

      if (!res.ok) {
        console.error('Failed to update read state', await res.text())
      } else {
        // let other parts of the UI react if needed
        window.dispatchEvent(new CustomEvent('message_marked', { detail: { id, is_read } }))
      }
    } catch (err) {
      console.error('Error marking message read/unread', err)
    }
  })
})
