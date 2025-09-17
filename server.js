/* ******************************************
 * server.js — primary file for the application
 *******************************************/

/* ***********************
 * Require Statements
 *************************/
const express = require("express")
const expressLayouts = require("express-ejs-layouts")
require("dotenv").config()

const app = express()

const static = require("./routes/static")
const inventoryRoute = require("./routes/inventoryRoute")
const baseController = require("./controllers/baseController")
const miscRoute = require("./routes/misc")
const errorHandler = require("./middleware/errorHandler")
const utilities = require("./utilities")

/* ***********************
 * Middleware / Parsers
 *************************/
// parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }))
// parse application/json
app.use(express.json())

// serve static files early
app.use(static)

// make nav available to every view (must be BEFORE routes that render views)
app.use(async (req, res, next) => {
  try {
    res.locals.nav = await utilities.getNav() || ""
    next()
  } catch (err) {
    next(err)
  }
})

/* ***********************
 * View Engine and Templates
 *************************/
app.set("view engine", "ejs")
app.use(expressLayouts)
app.set("layout", "./layouts/layout")

/* ***********************
 * Routes
 *************************/
// Index route
app.get("/", baseController.buildHome)

// Inventory routes
app.use("/inv", inventoryRoute)

// misc route for error trigger (mounted at root so path is /error/trigger)
app.use("/", miscRoute)

/* ***********************
 * 404 fallback (not found)
 *************************/
app.use((req, res, next) => {
  const err = new Error("Not Found")
  err.status = 404
  next(err)
})

/* ***********************
 * Global error handler (must be last)
 *************************/
app.use(errorHandler)

/* ***********************
 * Local Server Information
 * Values from .env (environment) file
 *************************/
const port = process.env.PORT || 5500
const host = process.env.HOST || "localhost"

/* ***********************
 * Log statement to confirm server operation
 *************************/
app.listen(port, () => {
  console.log(`app listening on ${host}:${port}`)
})
