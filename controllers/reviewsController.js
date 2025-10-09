// controllers/reviewsController.js
const reviewsModel = require("../models/reviews-model")
const utilities = require("../utilities")

const reviewsController = {}

reviewsController.addReview = async (req, res, next) => {
  try {
    // require login via middleware (routes use utilities.checkLogin)
    const account = res.locals.accountData
    if (!account || !account.account_id) {
      req.flash('notice', 'Please log in to post a review.')
      return res.redirect('/account/login')
    }

    // parse and validate inputs
    const inv_id = parseInt(req.body.inv_id, 10)
    const rating = parseInt(req.body.rating || '5', 10)
    const comment = (req.body.comment || '').trim()

    if (!inv_id || Number.isNaN(inv_id)) {
      req.flash('error', 'Invalid vehicle selected.')
      const referer = req.get('referer') || '/inv'
      return res.redirect(referer)
    }
    if (Number.isNaN(rating) || rating < 1 || rating > 5) {
      req.flash('error', 'Rating must be between 1 and 5.')
      return res.redirect(`/inv/detail/${inv_id}`)
    }

    await reviewsModel.addReview(inv_id, account.account_id, rating, comment)
    req.flash("success", "Review posted.")
    return res.redirect(`/inv/detail/${inv_id}#reviews`)
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
    const rating = parseInt(req.body.rating || '5', 10)
    const comment = (req.body.comment || '').trim()
    const inv_id = parseInt(req.body.inv_id, 10)

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

module.exports = reviewsController
