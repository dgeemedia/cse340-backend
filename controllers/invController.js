//controllers/invController.js
const invModel = require("../models/inventory-model")
const utilities = require("../utilities/")

const invCont = {}

// Build inventory by classification view
invCont.buildByClassificationId = async function (req, res, next) {
  const classification_id = req.params.classificationId
  const data = await invModel.getInventoryByClassificationId(classification_id)
  const grid = await utilities.buildClassificationGrid(data)
  let nav = await utilities.getNav()
  const className = data[0].classification_name
  res.render("./inventory/classification", {
    title: className + " vehicles",
    nav,
    grid,
  })
}

// Build inventory detail view
invCont.buildByInventoryId = async function (req, res, next) {
  try {
    const invId = req.params.invId
    const vehicle = await invModel.getInventoryById(invId)
    if (!vehicle) {
      let nav = await utilities.getNav()
      return res.status(404).render("./inventory/detail", {
        title: "Vehicle not found",
        nav,
        detail: '<p class="notice">Sorry, that vehicle could not be found.</p>',
      })
    }
    const detail = await utilities.buildInventoryDetail(vehicle)
    const nav = await utilities.getNav()
    res.render("./inventory/detail", {
      title: `${vehicle.inv_make} ${vehicle.inv_model}`,
      nav,
      detail,
    })
  } catch (error) {
    next(error)
  }
}

// --- Management view (Task 1)
invCont.buildManagement = async function (req, res, next) {
  try {
    const nav = await utilities.getNav()
    const classificationSelect = await utilities.buildClassificationList()
    res.render("inventory/manage", {
      title: "Inventory Management",
      nav,
      classificationSelect,
    })
  } catch (error) {
    next(error)
  }
}

// --- Build add-classification view (GET) (Task 2)
invCont.buildAddClassification = async function (req, res, next) {
  try {
    const nav = await utilities.getNav()
    res.render("inventory/add-classification", {
      title: "Add Classification",
      nav,
      errors: null,
    })
  } catch (error) {
    next(error)
  }
}

// --- Process add-classification (POST) with server validation
invCont.addClassification = async function (req, res, next) {
  try {
    const nav = await utilities.getNav()
    const { classification_name } = req.body

    // server-side validation: no spaces or special chars (only letters+numbers)
    const valid = /^[A-Za-z0-9]+$/.test(classification_name || "")
    if (!classification_name || !valid) {
      req.flash("error", "Classification name is required and must contain no spaces or special characters.")
      return res.status(400).render("inventory/add-classification", {
        title: "Add Classification",
        nav,
        errors: [{ msg: "Invalid classification name" }],
      })
    }

    const result = await invModel.addClassification(classification_name)
    if (result && result.rowCount > 0) {
      // rebuild nav so new classification appears immediately
      const newNav = await utilities.getNav()
      req.flash("success", `Classification "${classification_name}" added successfully.`)
      return res.render("inventory/manage", { title: "Inventory Management", nav: newNav })
    } else {
      req.flash("error", "Failed to add classification.")
      return res.status(500).render("inventory/add-classification", { title: "Add Classification", nav })
    }
  } catch (error) {
    next(error)
  }
}

// --- Build add-inventory view (GET) (Task 3)
invCont.buildAddInventory = async function (req, res, next) {
  try {
    const nav = await utilities.getNav()
    // classification select HTML (no preselected value)
    const classificationList = await utilities.buildClassificationList()
    res.render("inventory/add-inventory", {
      title: "Add Inventory Item",
      nav,
      classificationList,
      errors: null,
      // sticky default empty object
      inv: {},
    })
  } catch (error) {
    next(error)
  }
}

// --- Process add-inventory POST with server-side validation
invCont.addInventory = async function (req, res, next) {
  try {
    const nav = await utilities.getNav()
    const classificationList = await utilities.buildClassificationList(req.body.classification_id)
    // Collect expected fields (data-trail names)
    const inv = {
      inv_make: req.body.inv_make,
      inv_model: req.body.inv_model,
      inv_description: req.body.inv_description || "",
      inv_image: req.body.inv_image || "/images/vehicles/no-image.png",
      inv_thumbnail: req.body.inv_thumbnail || "/images/vehicles/no-image-tn.png",
      inv_price: req.body.inv_price,
      inv_miles: req.body.inv_miles,
      inv_color: req.body.inv_color,
      inv_body: req.body.inv_body,
      inv_transmission: req.body.inv_transmission,
      inv_year: req.body.inv_year,
      classification_id: req.body.classification_id,
    }

    // server-side validation
    const errors = []
    if (!inv.inv_make) errors.push({ msg: "Make is required" })
    if (!inv.inv_model) errors.push({ msg: "Model is required" })
    if (!inv.classification_id) errors.push({ msg: "Classification is required" })
    if (!inv.inv_price || isNaN(Number(inv.inv_price))) errors.push({ msg: "Price is required and must be a number" })
    if (inv.inv_year && isNaN(Number(inv.inv_year))) errors.push({ msg: "Year must be numeric" })

    if (errors.length > 0) {
      req.flash("error", "Please fix the errors below.")
      return res.status(400).render("inventory/add-inventory", {
        title: "Add Inventory Item",
        nav,
        classificationList,
        errors,
        inv, // sticky values
      })
    }

    // attempt insert
    const result = await invModel.addInventoryItem(inv)
    if (result && result.rowCount > 0) {
      const newNav = await utilities.getNav()
      req.flash("success", `Inventory item ${inv.inv_make} ${inv.inv_model} added successfully.`)
      return res.render("inventory/manage", { title: "Inventory Management", nav: newNav })
    } else {
      req.flash("error", "Failed to add inventory item.")
      return res.status(500).render("inventory/add-inventory", {
        title: "Add Inventory Item",
        nav,
        classificationList,
        errors: [{ msg: "Database insertion failed" }],
        inv,
      })
    }
  } catch (error) {
    next(error)
  }
}

/* ***************************
 *  Return Inventory by Classification As JSON
 * ************************** */
invCont.getInventoryJSON = async (req, res, next) => {
  const classification_id = parseInt(req.params.classification_id)
  const invData = await invModel.getInventoryByClassificationId(classification_id)
  if (invData[0].inv_id) {
    return res.json(invData)
  } else {
    next(new Error("No data returned"))
  }
}

/* ***************************
 *  Build edit inventory view
 * ************************** */
invCont.editInventoryView = async function (req, res, next) {
  const inv_id = parseInt(req.params.inv_id)
  let nav = await utilities.getNav()
  const itemData = await invModel.getInventoryById(inv_id)
  const classificationSelect = await utilities.buildClassificationList(itemData.classification_id)
  const itemName = `${itemData.inv_make} ${itemData.inv_model}`
  res.render("./inventory/edit-inventory", {
    title: "Edit " + itemName,
    nav,
    classificationSelect: classificationSelect,
    errors: null,
    inv_id: itemData.inv_id,
    inv_make: itemData.inv_make,
    inv_model: itemData.inv_model,
    inv_year: itemData.inv_year,
    inv_description: itemData.inv_description,
    inv_image: itemData.inv_image,
    inv_thumbnail: itemData.inv_thumbnail,
    inv_price: itemData.inv_price,
    inv_miles: itemData.inv_miles,
    inv_color: itemData.inv_color,
    classification_id: itemData.classification_id
  })
}

/* ***************************
 *  Process update-inventory POST with server-side validation
 * ************************** */
invCont.updateInventory = async function (req, res, next) {
  try {
    const nav = await utilities.getNav()
    // keep the currently selected classification sticky
    const classificationList = await utilities.buildClassificationList(req.body.classification_id)

    // collect fields (note inv_id comes from a hidden input)
    const inv = {
      inv_id: parseInt(req.body.inv_id, 10),
      inv_make: req.body.inv_make,
      inv_model: req.body.inv_model,
      inv_description: req.body.inv_description || "",
      inv_image: req.body.inv_image || "/images/vehicles/no-image.png",
      inv_thumbnail: req.body.inv_thumbnail || "/images/vehicles/no-image-tn.png",
      inv_price: req.body.inv_price,
      inv_miles: req.body.inv_miles,
      inv_color: req.body.inv_color,
      inv_body: req.body.inv_body || null,
      inv_transmission: req.body.inv_transmission || null,
      inv_year: req.body.inv_year,
      classification_id: req.body.classification_id,
    }

    // server-side validation (same rules as addInventory)
    const errors = []
    if (!inv.inv_make) errors.push({ msg: "Make is required" })
    if (!inv.inv_model) errors.push({ msg: "Model is required" })
    if (!inv.classification_id) errors.push({ msg: "Classification is required" })
    if (!inv.inv_price || isNaN(Number(inv.inv_price))) errors.push({ msg: "Price is required and must be a number" })
    if (inv.inv_year && isNaN(Number(inv.inv_year))) errors.push({ msg: "Year must be numeric" })

    if (errors.length > 0) {
      req.flash("error", "Please fix the errors below.")
      // preserve the same locals that editInventoryView renders so the form is sticky
      return res.status(400).render("inventory/edit-inventory", {
        title: req.body.inv_make && req.body.inv_model ? `Edit ${req.body.inv_make} ${req.body.inv_model}` : "Edit Inventory Item",
        nav,
        classificationSelect: classificationList,
        errors,
        inv_id: inv.inv_id,
        inv_make: inv.inv_make,
        inv_model: inv.inv_model,
        inv_year: inv.inv_year,
        inv_description: inv.inv_description,
        inv_image: inv.inv_image,
        inv_thumbnail: inv.inv_thumbnail,
        inv_price: inv.inv_price,
        inv_miles: inv.inv_miles,
        inv_color: inv.inv_color,
        classification_id: inv.classification_id,
        inv_transmission: inv.inv_transmission,
        inv_body: inv.inv_body
      })
    }

    // attempt update - NOTE: your model must implement updateInventoryItem(inv)
    const result = await invModel.updateInventoryItem(inv)
    if (result && result.rowCount > 0) {
      const newNav = await utilities.getNav()
      req.flash("success", `Inventory item ${inv.inv_make} ${inv.inv_model} updated successfully.`)
      return res.render("inventory/manage", { title: "Inventory Management", nav: newNav })
    } else {
      req.flash("error", "Failed to update inventory item.")
      return res.status(500).render("inventory/edit-inventory", {
        title: `Edit ${inv.inv_make} ${inv.inv_model}`,
        nav,
        classificationSelect: classificationList,
        errors: [{ msg: "Database update failed" }],
        ...inv
      })
    }
  } catch (error) {
    next(error)
  }
}

module.exports = invCont