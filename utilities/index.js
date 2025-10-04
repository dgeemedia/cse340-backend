// utilities/index.js
const invModel = require("../models/inventory-model")
const jwt = require('jsonwebtoken')
require("dotenv").config()
const Util = {}

// Generate navigation menu
Util.getNav = async function (req, res, next) {
  let data = await invModel.getClassifications()

  let list = "<ul>"
  list += '<li><a href="/" title="Home page">Home</a></li>'
  data.rows.forEach((row) => {
    list += "<li>"
    list +=
      '<a href="/inv/type/' +
      row.classification_id +
      '" title="See our inventory of ' +
      row.classification_name +
      ' vehicles">' +
      row.classification_name +
      "</a>"
    list += "</li>"
  })
  list += "</ul>"
  return list
}

// Build the classification view HTML
Util.buildClassificationGrid = async function(data){
  let grid = ''
  if (data.length > 0) {
    grid = '<ul id="inv-display">'
    data.forEach(vehicle => {
      const thumb = vehicle.inv_thumbnail
        ? (vehicle.inv_thumbnail.startsWith('/images') ? vehicle.inv_thumbnail : `/images/vehicles/${vehicle.inv_thumbnail}`)
        : '/images/site/placeholder-tn.jpg'

      grid += '<li>'
      grid +=  `<a href="/inv/detail/${vehicle.inv_id}" title="View ${vehicle.inv_make} ${vehicle.inv_model} details">`
      grid +=    `<img src="${thumb}" alt="Image of ${vehicle.inv_make} ${vehicle.inv_model} on CSE Motors" />`
      grid +=  '</a>'
      grid += '<div class="namePrice">'
      grid += '<hr />'
      grid += `<h2><a href="/inv/detail/${vehicle.inv_id}">${vehicle.inv_make} ${vehicle.inv_model}</a></h2>`
      grid += `<span>$${ new Intl.NumberFormat('en-US').format(vehicle.inv_price) }</span>`
      grid += '</div></li>'
    })
    grid += '</ul>'
  } else {
    grid = '<p class="notice">Sorry, no matching vehicles could be found.</p>'
  }
  return grid
}

// Build the inventory detail view HTML
Util.buildInventoryDetail = async function(vehicle){
  const imageFilename = vehicle.inv_image ||
                        (vehicle.inv_thumbnail && vehicle.inv_thumbnail.replace(/_tn(\.[a-z]+)$/i, '$1')) ||
                        'placeholder.jpg'

  const imagePath = imageFilename.startsWith('/images')
    ? imageFilename
    : `/images/vehicles/${imageFilename}`

  const price = new Intl.NumberFormat("en-US").format(vehicle.inv_price || 0)
  const mileage = vehicle.inv_miles ? new Intl.NumberFormat("en-US").format(vehicle.inv_miles) : "N/A"

  let html = ''
  html += '<div class="vehicle-detail">'
  html +=   `<div class="vehicle-image"><img src="${imagePath}" alt="${vehicle.inv_make} ${vehicle.inv_model}"></div>`
  html +=   '<div class="vehicle-info">'
  html +=     `<h2>${vehicle.inv_make} ${vehicle.inv_model} (${vehicle.inv_year || ""})</h2>`
  html +=     `<p class="price">$${price}</p>`
  html +=     `<p class="miles">Mileage: ${mileage} miles</p>`
  html +=     `<p class="desc">${vehicle.inv_description || ""}</p>`
  html +=     '<ul class="specs">'
  html +=       `<li>Classification: ${vehicle.classification_name || ""}</li>`
  html +=       `<li>Color: ${vehicle.inv_color || "N/A"}</li>`
  html +=       `<li>Transmission: ${vehicle.inv_transmission || "N/A"}</li>`
  html +=     '</ul></div></div>'

  return html
}

Util.handleErrors = function (fn) {
  return async function (req, res, next) {
    try {
      await fn(req, res, next)
    } catch (err) {
      next(err)
    }
  }
}

// utilities/index.js (add inside Util, before module.exports)
Util.buildClassificationList = async function (classification_id = null) {
  let data = await invModel.getClassifications()
  let classificationList =
    '<select name="classification_id" id="classificationList" required>'
  classificationList += "<option value=''>Choose a Classification</option>"
  data.rows.forEach((row) => {
    classificationList += '<option value="' + row.classification_id + '"'
    if (
      classification_id != null &&
      row.classification_id == classification_id
    ) {
      classificationList += " selected "
    }
    classificationList += ">" + row.classification_name + "</option>"
  })
  classificationList += "</select>"
  return classificationList
}

/* ****************************************
* Middleware to check token validity
**************************************** */
Util.checkJWTToken = (req, res, next) => {
 if (req.cookies.jwt) {
  jwt.verify(
   req.cookies.jwt,
   process.env.ACCESS_TOKEN_SECRET,
   function (err, accountData) {
    if (err) {
     req.flash("Please log in")
     res.clearCookie("jwt")
     return res.redirect("/account/login")
    }
    res.locals.accountData = accountData
    res.locals.loggedin = 1
    next()
   })
 } else {
  next()
 }
}

/* ****************************************
 *  Check Login
 * ************************************ */
 Util.checkLogin = (req, res, next) => {
  if (res.locals.loggedin) {
    next()
  } else {
    req.flash("notice", "Please log in.")
    return res.redirect("/account/login")
  }
 }

/* ****************************************
 *  Check Admin/Employee for inventory admin actions
 *  (Task 2)
 * **************************************** */
Util.checkAdmin = (req, res, next) => {
  const account = res.locals.accountData
  if (!account) {
    req.flash("notice", "Please log in.")
    return res.redirect("/account/login")
  }
  // allow only Employee or Admin account types
  const acctType = account.account_type || ""
  if (acctType === "Employee" || acctType === "Admin") {
    return next()
  } else {
    // not authorized for inventory admin actions
    req.flash("notice", "You do not have permission to access that resource.")
    return res.redirect("/account/login")
  }
}

module.exports = Util