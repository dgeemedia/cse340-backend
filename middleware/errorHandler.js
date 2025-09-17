// middleware/errorHandler.js
function errorHandler(err, req, res, next) {
  console.error(err) 
  res.status(err.status || 500)
  res.render("error", {
    title: "Server Error",
    message: err.message || "An unexpected error occurred.",
    error: (process.env.NODE_ENV === "development") ? err : {}
  })
}

module.exports = errorHandler

