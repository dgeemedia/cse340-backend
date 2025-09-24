// routes/accountRoute.js
const express = require("express")
const router = express.Router()
const utilities = require("../utilities")
const accountController = require("../controllers/accountController")

// GET /account/login  (server mounts '/account')
router.get("/login", utilities.handleErrors(accountController.buildLogin))

// GET /account/register  (server mounts '/account')
router.get("/register", utilities.handleErrors(accountController.buildRegister))
router.post("/register", utilities.handleErrors(accountController.registerAccount))

module.exports = router
