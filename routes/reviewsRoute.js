const express = require("express")
const router = express.Router()
const utilities = require("../utilities")
const reviewsController = require("../controllers/reviewsController")

// Post a review (clients only)
router.post("/add", utilities.checkLogin, utilities.handleErrors(reviewsController.addReview))

// Get reviews JSON for an inventory item
router.get("/json/:inv_id", utilities.handleErrors(reviewsController.getReviewsJSON))

// Edit view (GET)
router.get("/edit/:review_id", utilities.checkLogin, utilities.handleErrors(reviewsController.editView))
// Update (POST)
router.post("/update", utilities.checkLogin, utilities.handleErrors(reviewsController.updateReview))
// Delete
router.post("/delete", utilities.checkLogin, utilities.handleErrors(reviewsController.deleteReview))

module.exports = router
