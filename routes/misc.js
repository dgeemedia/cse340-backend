// routes/misc.js
const express = require("express")
const router = express.Router()
const errorController = require("../controllers/errorController")

router.get("/error/trigger", errorController.throw500)

module.exports = router
