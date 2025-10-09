// public/js/reviews.js
document.addEventListener("DOMContentLoaded", function () {
  const invDetail = document.querySelector('input[name="inv_id"]')
  if (!invDetail) return
  const invId = invDetail.value
  const reviewsList = document.getElementById("reviewsList")

  async function loadReviews() {
    const res = await fetch(`/reviews/json/${invId}`)
    const rows = await res.json()
    renderReviews(rows)
  }

  function renderReviews(rows) {
    if (!rows || rows.length === 0) {
      reviewsList.innerHTML = '<p class="text-muted">No reviews yet.</p>'
      return
    }
    reviewsList.innerHTML = rows.map(r => {
      const name = r.account_firstname ? `${r.account_firstname} ${r.account_lastname || ''}` : 'Guest'
      const myReview = (window.CURRENT_USER_ID && Number(window.CURRENT_USER_ID) === Number(r.account_id))
      return `
        <article class="card" style="padding:12px; margin-bottom:10px">
          <div style="display:flex; justify-content:space-between; gap:12px; align-items:center">
            <div>
              <strong>${escapeHtml(name)}</strong>
              <div class="text-muted">Rating: ${r.rating} · ${new Date(r.created_at).toLocaleString()}</div>
            </div>
            ${ myReview ? `<div>
              <a href="/reviews/edit/${r.review_id}" class="btn">Edit</a>
              <form style="display:inline" method="post" action="/reviews/delete">
                <input type="hidden" name="review_id" value="${r.review_id}">
                <button class="btn" type="submit">Delete</button>
              </form>
            </div>` : ''}
          </div>
          <p style="margin-top:8px">${escapeHtml(r.comment || '')}</p>
        </article>
      `
    }).join('')
  }

  // basic HTML escaping
  function escapeHtml(str = '') {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  loadReviews()
})
