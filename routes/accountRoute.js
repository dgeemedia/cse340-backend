// routes/accountRoute.js
const express = require("express")
const router = express.Router()
const utilities = require("../utilities")
const accountController = require("../controllers/accountController")

// GET /account/login  (server mounts '/account')
router.get("/login", utilities.handleErrors(accountController.buildLogin))

module.exports = router
