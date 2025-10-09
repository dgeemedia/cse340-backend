// server.js
const express = require("express")
const bodyParser = require("body-parser")
const expressLayouts = require("express-ejs-layouts")
const session = require("express-session")
const pool = require('./database')
require("dotenv").config()
const cookieParser = require('cookie-parser')

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

/* ***********************
 * Middleware
 * ************************/
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))
app.use(cookieParser())
app.use(utilities.checkJWTToken)

app.use(session({
  store: new (require('connect-pg-simple')(session))({
    createTableIfMissing: true,
    pool,
  }),
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  name: 'sessionId',
}))

// Express Messages Middleware
app.use(require('connect-flash')())
app.use(function(req, res, next){
  res.locals.messages = require('express-messages')(req, res)
  next()
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

// Account routes
app.use("/account", require("./routes/accountRoute"))

// Reviews routes
app.use("/reviews", require("./routes/reviewsRoute"))

// Messages routes
app.use("/account/messages", require("./routes/messagesRoute"))

// 404 handler
app.use((req, res, next) => {
  const err = new Error("Not Found")
  err.status = 404
  next(err)
})

// Error handling middleware
app.use(errorHandler)

/* -----------------------------
   Socket.IO integration + HTTP server
   ----------------------------- */
const http = require('http')
const server = http.createServer(app)
const { Server } = require("socket.io")
const io = new Server(server, {
  cors: { origin: true, credentials: true }
})

// make io available to controllers via req.app.get('io')
app.set('io', io)

// simple socket auth (reads jwt cookie and verifies)
const jwt = require('jsonwebtoken')
io.use((socket, next) => {
  const cookieHeader = socket.handshake.headers.cookie || ''
  const match = cookieHeader.split(';').map(s => s.trim()).find(s => s.startsWith('jwt='))
  if (!match) return next()
  const token = match.replace('jwt=', '')
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
    if (err) return next(new Error('Authentication error'))
    socket.account = payload
    next()
  })
})

// join rooms per user id
io.on('connection', (socket) => {
  if (!socket.account || !socket.account.account_id) return
  const uid = socket.account.account_id.toString()
  socket.join(`user:${uid}`)

  socket.on('direct_message', async (data) => {
    try {
      const messagesModel = require('./models/messages-model')
      const saved = await messagesModel.sendMessage(socket.account.account_id, data.to, data.subject || '', data.body)
      // notify recipient if online
      io.to(`user:${data.to}`).emit('incoming_message', saved)
      // confirm back to sender
      socket.emit('message_sent', saved)
    } catch (err) {
      console.error('socket direct_message error:', err)
      socket.emit('error', { message: 'Message failed to send' })
    }
  })
})

// start server (use HTTP server with socket.io)
const port = process.env.PORT || 5500
const host = process.env.HOST || "localhost"
server.listen(port, () => {
  console.log(`app listening on ${host}:${port}`)
})
