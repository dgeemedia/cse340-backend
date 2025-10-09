// public/js/messages.js
// Unified messages script:
// - event-delegation for mark-read checkboxes
// - delete confirmation + fetch POST (URL-encoded) with graceful fallback
// - small toasts and custom events for UI integration

(function () {
  // tiny toast helper
  function toast(msg, type = 'info') {
    const el = document.createElement('div')
    el.textContent = msg
    el.className = `simple-toast simple-toast--${type}`
    // basic inline styling to avoid relying on CSS changes
    el.style.position = 'fixed'
    el.style.right = '16px'
    el.style.bottom = '16px'
    el.style.padding = '10px 14px'
    el.style.borderRadius = '8px'
    el.style.boxShadow = '0 6px 18px rgba(0,0,0,0.12)'
    el.style.zIndex = 2000
    el.style.background = type === 'error' ? '#ffe9e9' : '#eafffb'
    el.style.color = type === 'error' ? '#7a1a1a' : '#064e4a'
    document.body.appendChild(el)
    setTimeout(() => {
      el.style.transition = 'opacity .25s'
      el.style.opacity = '0'
      setTimeout(() => el.remove(), 250)
    }, 2200)
  }

  // convert FormData -> URLSearchParams (for application/x-www-form-urlencoded)
  function formDataToUrlParams(formData) {
    const params = new URLSearchParams()
    for (const pair of formData.entries()) {
      params.append(pair[0], pair[1])
    }
    return params.toString()
  }

  // mark-read handler (uses JSON POST)
  async function handleMarkReadToggle(checkbox) {
    const id = checkbox.dataset.id
    const is_read = checkbox.checked

    // optimistic UI: keep checked state; revert if fails
    try {
      const res = await fetch('/account/messages/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ message_id: id, is_read })
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(`HTTP ${res.status} ${text}`)
      }
      // dispatch for other UI
      window.dispatchEvent(new CustomEvent('message_marked', { detail: { id, is_read } }))
      toast('Message updated')
    } catch (err) {
      console.error('mark-read error', err)
      toast('Failed to update message', 'error')
      // revert UI
      checkbox.checked = !is_read
    }
  }

  // delete handler: confirmation + URL-encoded fetch POST -> removes table row on success
  async function handleDeleteForm(form) {
    // confirmation
    const proceed = window.confirm('Are you sure you want to delete this item? This action cannot be undone.')
    if (!proceed) return

    const action = form.getAttribute('action') || window.location.href
    const method = (form.getAttribute('method') || 'POST').toUpperCase()

    // build url-encoded payload (works with bodyParser.urlencoded)
    const fd = new FormData(form)
    const payload = formDataToUrlParams(fd)

    try {
      const res = await fetch(action, {
        method,
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: payload
      })

      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        throw new Error(`Delete failed: HTTP ${res.status} ${txt}`)
      }

      toast('Deleted')
      // remove row visually
      const tr = form.closest('tr')
      if (tr) tr.remove()
      // optional: dispatch event
      window.dispatchEvent(new CustomEvent('message_deleted', { detail: { formAction: action } }))
    } catch (err) {
      console.error('delete error', err)
      // fallback: submit the form the classic way (navigates)
      try {
        form.submit()
      } catch (submitErr) {
        console.error('fallback submit failed', submitErr)
        toast('Delete failed', 'error')
      }
    }
  }

  // general delegated event wiring
  document.addEventListener('DOMContentLoaded', function () {
    const container = document.querySelector('.container') || document.body

    // handle change events (mark-read toggles)
    container.addEventListener('change', function (ev) {
      const cb = ev.target.closest('.mark-read')
      if (!cb) return
      // ensure dataset id exists
      if (!cb.dataset || !cb.dataset.id) {
        console.warn('mark-read checkbox missing data-id')
        return
      }
      handleMarkReadToggle(cb)
    })

    // handle click events for delete buttons and form submit interception
    container.addEventListener('click', function (ev) {
      // delete button inside inline-delete-form
      const deleteBtn = ev.target.closest('.btn-delete') || ev.target.closest('.review-delete-btn')
      if (deleteBtn) {
        const form = deleteBtn.closest('form')
        if (form) {
          ev.preventDefault()
          handleDeleteForm(form)
        }
      }
    })

    // intercept submit on forms with class inline-delete-form or review-delete-form
    container.querySelectorAll('form.inline-delete-form, form.review-delete-form').forEach(form => {
      form.addEventListener('submit', function (ev) {
        ev.preventDefault()
        handleDeleteForm(form)
      })
    })
  })
})()
