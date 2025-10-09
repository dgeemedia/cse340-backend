// public/js/account-reviews.js
document.addEventListener('DOMContentLoaded', () => {
  // Delegate confirm for all review delete forms
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
