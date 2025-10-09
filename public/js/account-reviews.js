// public/js/account-reviews.js
(function () {
  function toast(msg, type = 'info') {
    const el = document.createElement('div')
    el.textContent = msg
    Object.assign(el.style, {
      position: 'fixed',
      right: '16px',
      bottom: '16px',
      padding: '10px 14px',
      borderRadius: '8px',
      boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
      zIndex: 2000,
      background: type === 'error' ? '#ffe9e9' : '#eafffb',
      color: type === 'error' ? '#7a1a1a' : '#064e4a',
    })
    document.body.appendChild(el)
    setTimeout(() => el.remove(), 3000)
  }

  // Toggle reply form visibility
  function initToggleReply() {
    document.querySelectorAll('.reply-toggle-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const reviewId = btn.dataset.reviewId || btn.getAttribute('data-review-id')
        const wrap = document.querySelector(`.reply-form-wrap[data-review-id="${reviewId}"]`)
        if (!wrap) return
        wrap.style.display = (wrap.style.display === 'none' || wrap.style.display === '') ? 'block' : 'none'
        const textarea = wrap.querySelector('textarea')
        if (textarea) textarea.focus()
      })
    })

    // cancel buttons
    document.querySelectorAll('button[data-cancel-review]').forEach(b => {
      b.addEventListener('click', () => {
        const reviewId = b.getAttribute('data-cancel-review')
        const wrap = document.querySelector(`.reply-form-wrap[data-review-id="${reviewId}"]`)
        if (wrap) wrap.style.display = 'none'
      })
    })
  }

  // Toggle view/hide replies
  function initViewReplies() {
    document.querySelectorAll('.view-replies-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-review-id')
        const list = document.querySelector(`.replies-list[data-review-id="${id}"]`)
        if (!list) return
        const visible = list.style.display === 'block'
        list.style.display = visible ? 'none' : 'block'
        btn.textContent = visible ? `View replies (${list.children.length})` : `Hide replies (${list.children.length})`
      })
    })
  }

  // Submit reply forms with AJAX and optimistic UI update
  function initReplySubmit() {
    document.querySelectorAll('.reply-post-form').forEach(form => {
      // submit via Enter as well
      const textarea = form.querySelector('textarea')
      if (textarea) {
        textarea.addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter' && !ev.shiftKey) {
            ev.preventDefault()
            form.requestSubmit ? form.requestSubmit() : form.submit()
          }
        })
      }

      form.addEventListener('submit', async (ev) => {
        ev.preventDefault()
        const fd = new FormData(form)
        const payload = {}
        fd.forEach((v, k) => payload[k] = v)
        if (!payload.reply_text || !payload.reply_text.trim()) {
          toast('Please enter a reply', 'error'); return
        }
        try {
          const res = await fetch(form.action, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            credentials: 'same-origin'
          })
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const data = await res.json().catch(() => ({}))

          // optimistic: append reply to UI (use server-returned reply if available)
          const reviewId = form.dataset.reviewId
          const repliesWrap = form.closest('li')?.querySelector('.replies-list') || document.querySelector(`.replies-list[data-review-id="${reviewId}"]`)
          const replyHtml = document.createElement('div')
          replyHtml.className = 'reply-item'
          replyHtml.style = 'margin-bottom:8px; padding-left:12px; border-left:2px solid rgba(15,23,42,0.04);'
          const now = new Date().toLocaleString()
          const name = window.CURRENT_USER_NAME || 'You'
          const text = payload.reply_text.replace(/</g,'&lt;').replace(/>/g,'&gt;')
          replyHtml.innerHTML = `<div class="reply-meta"><strong>${name}</strong> <span class="muted"> — ${now}</span></div><div class="reply-text">${text}</div>`
          if (repliesWrap) {
            repliesWrap.appendChild(replyHtml)
            // ensure list visible
            repliesWrap.style.display = 'block'
            const viewBtn = document.querySelector(`.view-replies-btn[data-review-id="${reviewId}"]`)
            if (viewBtn) viewBtn.textContent = `Hide replies (${repliesWrap.children.length})`
          }
          // clear & hide
          form.querySelector('textarea').value = ''
          form.closest('.reply-form-wrap').style.display = 'none'
          toast('Reply posted')

        } catch (err) {
          console.error('Reply submit error', err)
          toast('Failed to post reply', 'error')
          // fallback: submit the form normally (this will navigate away)
          form.submit()
        }
      })
    })
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  document.addEventListener('DOMContentLoaded', () => {
    initToggleReply()
    initReplySubmit()
    initViewReplies()

    // delegate confirm for review delete forms
    document.body.addEventListener('submit', (e) => {
      const form = e.target
      if (form.matches && form.matches('.review-delete-form')) {
        const ok = confirm('Are you sure you want to delete this review? This action cannot be undone.')
        if (!ok) {
          e.preventDefault()
          return false
        }
      }
    })
  })

  // Socket listeners: append replies pushed from server (if socket exists)
  if (window.io) {
    try {
      const socket = io()
      socket.on('review_reply', (payload) => {
        // payload: { review_id, reply }
        const reviewId = String(payload.review_id)
        const list = document.querySelector(`.replies-list[data-review-id="${reviewId}"]`)
        if (!list) return
        const reply = payload.reply
        const el = document.createElement('div')
        el.className = 'reply-item'
        el.style = 'margin-bottom:8px; padding-left:12px; border-left:2px solid rgba(15,23,42,0.04);'
        const when = new Date(reply.created_at).toLocaleString()
        const name = (reply.account_firstname || 'Staff')
        el.innerHTML = `<div class="reply-meta"><strong>${escapeHtml(name)}</strong> <span class="muted"> — ${when}</span></div><div class="reply-text">${(reply.reply_text||'').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>`
        list.appendChild(el)
        list.style.display = 'block'
        const viewBtn = document.querySelector(`.view-replies-btn[data-review-id="${reviewId}"]`)
        if (viewBtn) viewBtn.textContent = `Hide replies (${list.children.length})`
      })
    } catch (err) {
      // ignore if socket lib not loaded
    }
  }
})()
