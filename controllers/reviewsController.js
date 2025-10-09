// controllers/reviewsController.js
const reviewsModel = require("../models/reviews-model")
const repliesModel = require("../models/review-replies-model")
const utilities = require("../utilities")

const reviewsController = {}

/**
 * Add a new review
 * - must be logged in
 * - must be a Client (not Employee/Manager)
 * - validate inv_id and rating (prevent empty strings from reaching DB)
 */
reviewsController.addReview = async (req, res, next) => {
  try {
    // Require login (routes should also use utilities.checkLogin)
    const account = res.locals.accountData
    if (!account || !account.account_id) {
      req.flash('notice', 'Please log in to post a review.')
      return res.redirect('/account/login')
    }

    // Only clients can post reviews
    const acctType = (account.account_type || '').toLowerCase()
    if (acctType !== 'client') {
      req.flash('error', 'Only clients may post reviews.')
      const back = req.get('referer') || `/inv`
      return res.redirect(back)
    }

    // parse and validate inputs safely
    // Note: parseInt('') === NaN, so this prevents empty string errors
    const inv_id_raw = (typeof req.body.inv_id !== 'undefined') ? String(req.body.inv_id).trim() : ''
    const rating_raw = (typeof req.body.rating !== 'undefined') ? String(req.body.rating).trim() : ''
    const comment_raw = (typeof req.body.comment !== 'undefined') ? String(req.body.comment).trim() : ''

    const inv_id = inv_id_raw === '' ? NaN : parseInt(inv_id_raw, 10)
    const rating = rating_raw === '' ? NaN : parseInt(rating_raw, 10)
    const comment = comment_raw.substring(0, 2000) // guard comment length

    // Validate inv_id
    if (!inv_id || Number.isNaN(inv_id)) {
      req.flash('error', 'Invalid vehicle selected.')
      const referer = req.get('referer') || '/inv'
      return res.redirect(referer)
    }

    // Validate rating properly
    if (Number.isNaN(rating) || rating < 1 || rating > 5) {
      req.flash('error', 'Rating must be an integer between 1 and 5.')
      return res.redirect(`/inv/detail/${inv_id}#reviews`)
    }

    // Optional: require a comment, or allow empty but trimmed — adjust as needed.
    // if (!comment) { req.flash('error', 'Please enter a comment.'); return res.redirect(...); }

    // Insert review - model should perform DB insert
    try {
      await reviewsModel.addReview(inv_id, account.account_id, rating, comment)
      req.flash("success", "Review posted.")
      return res.redirect(`/inv/detail/${inv_id}#reviews`)
    } catch (dbErr) {
      console.error('reviewsController.addReview DB error:', dbErr)
      // Provide a friendly error to the user, don't leak DB details
      req.flash('error', 'There was a problem saving your review. Please try again later.')
      return res.redirect(`/inv/detail/${inv_id}#reviews`)
    }
  } catch (err) {
    next(err)
  }
}

reviewsController.getReviewsJSON = async (req, res, next) => {
  try {
    const inv_id = parseInt(req.params.inv_id, 10)
    const limit = parseInt(req.query.limit || '10', 10)
    const offset = parseInt(req.query.offset || '0', 10)
    const rows = await reviewsModel.getReviewsByInventory(inv_id, limit, offset)
    return res.json(rows)
  } catch (err) {
    next(err)
  }
}

reviewsController.editView = async (req, res, next) => {
  try {
    const review_id = parseInt(req.params.review_id, 10)
    const review = await reviewsModel.getReviewById(review_id)
    const nav = await utilities.getNav()
    if (!review) {
      req.flash("error", "Review not found")
      return res.redirect("/account/")
    }
    const me = res.locals.accountData
    if (!me || me.account_id !== review.account_id) {
      req.flash("notice", "Not authorized")
      return res.redirect("/account/")
    }
    res.render("reviews/edit", { title: "Edit Review", nav, review, errors: null })
  } catch (err) {
    next(err)
  }
}

reviewsController.updateReview = async (req, res, next) => {
  try {
    const review_id = parseInt(req.body.review_id, 10)
    const rating_raw = (typeof req.body.rating !== 'undefined') ? String(req.body.rating).trim() : ''
    const rating = rating_raw === '' ? NaN : parseInt(rating_raw, 10)
    const comment = (typeof req.body.comment !== 'undefined') ? String(req.body.comment).trim().substring(0,2000) : ''
    const inv_id = parseInt(req.body.inv_id, 10)

    if (!review_id || Number.isNaN(review_id)) {
      req.flash("error", "Invalid review id.")
      return res.redirect("/account/")
    }

    if (Number.isNaN(rating) || rating < 1 || rating > 5) {
      req.flash("error", "Rating must be between 1 and 5.")
      return res.redirect(`/inv/detail/${inv_id}#reviews`)
    }

    const existing = await reviewsModel.getReviewById(review_id)
    if (!existing) {
      req.flash("error", "Review not found")
      return res.redirect("/account/")
    }
    const me = res.locals.accountData
    if (!me || me.account_id !== existing.account_id) {
      req.flash("notice", "Not authorized")
      return res.redirect("/account/")
    }

    await reviewsModel.updateReview(review_id, rating, comment)
    req.flash("success", "Review updated")
    return res.redirect(`/inv/detail/${inv_id}#reviews`)
  } catch (err) {
    next(err)
  }
}

reviewsController.deleteReview = async (req, res, next) => {
  try {
    const review_id = parseInt(req.body.review_id, 10)
    if (!review_id || Number.isNaN(review_id)) {
      req.flash("error", "Invalid review id.")
      return res.redirect("/account/")
    }

    const existing = await reviewsModel.getReviewById(review_id)
    if (!existing) {
      req.flash("error", "Review not found")
      return res.redirect("/account/")
    }
    const me = res.locals.accountData
    if (!me || me.account_id !== existing.account_id) {
      req.flash("notice", "Not authorized")
      return res.redirect("/account/")
    }
    await reviewsModel.deleteReview(review_id)
    req.flash("success", "Review deleted")
    return res.redirect(`/account/`)
  } catch (err) {
    next(err)
  }
}

reviewsController.addReply = async (req, res, next) => {
  try {
    // require login
    const account = res.locals.accountData
    if (!account || !account.account_id) {
      req.flash('notice', 'Please log in.')
      return res.redirect('/account/login')
    }

    const acctType = (account.account_type || '').toLowerCase()
    if (acctType !== 'employee' && acctType !== 'manager') {
      req.flash('notice', 'Only staff may reply to reviews.')
      return res.redirect('back')
    }

    const review_id = parseInt(req.body.review_id, 10)
    const reply_text = (req.body.reply_text || '').trim()
    if (!review_id || !reply_text) {
      req.flash('error', 'Missing reply text or review.')
      return res.redirect('back')
    }

    await repliesModel.addReply(review_id, account.account_id, reply_text)
    req.flash('success', 'Reply posted.')
    // optionally redirect to the inventory item; you can fetch review→inv_id, but simplest is to go back.
    return res.redirect('back')
  } catch (err) {
    next(err)
  }
}

module.exports = reviewsController
