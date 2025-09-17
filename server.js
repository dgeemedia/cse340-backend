// server.js
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

// parse application
app.use(express.urlencoded({ extended: true }))
// parse application/json
app.use(express.json())

// static files
app.use(static)

// custom middleware to set nav for all views
app.use(async (req, res, next) => {
  try {
    res.locals.nav = await utilities.getNav() || ""
    next()
  } catch (err) {
    next(err)
  }
})

// view engine
app.set("view engine", "ejs")
app.use(expressLayouts)
app.set("layout", "./layouts/layout")


// Index route
app.get("/", baseController.buildHome)

// Inventory routes
app.use("/inv", inventoryRoute)

// misc route for error trigger
app.use("/", miscRoute)

// 404 handler
app.use((req, res, next) => {
  const err = new Error("Not Found")
  err.status = 404
  next(err)
})

// Error handling middleware
app.use(errorHandler)

// Server and  host
const port = process.env.PORT || 5500
const host = process.env.HOST || "localhost"

// Start server
app.listen(port, () => {
  console.log(`app listening on ${host}:${port}`)
})
