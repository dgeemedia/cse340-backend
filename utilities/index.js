// utilities/index.js
const invModel = require("../models/inventory-model")
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

module.exports = Util