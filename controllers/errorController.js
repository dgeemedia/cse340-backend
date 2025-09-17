// controllers/errorController.js
exports.throw500 = function(req, res, next){
  // intentionally throwing an error to be caught by middleware
  next(new Error("Intentional server error (500) for testing"))
}
