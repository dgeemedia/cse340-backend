//routes/inventoryRoute.js
const express = require("express")
const router = new express.Router()
const invController = require("../controllers/invController")
const utilities = require("../utilities")
const invValidate = require("../utilities/inventory-validation") // <-- added

// Management view (Task 1) - mounted at /inv/
router.get("/", utilities.handleErrors(invController.buildManagement))

// JSON endpoint used by client-side JS to fetch inventory by classification
router.get("/getInventory/:classification_id", utilities.handleErrors(invController.getInventoryJSON))

// Add classification
router.get("/add-classification", utilities.handleErrors(invController.buildAddClassification))
router.post("/add-classification", utilities.handleErrors(invController.addClassification))

// Add inventory
router.get("/add-inventory", utilities.handleErrors(invController.buildAddInventory))
// validate then controller
router.post("/add-inventory", invValidate.newInventoryRules(), invValidate.checkInventoryData, utilities.handleErrors(invController.addInventory))

// Edit inventory (show edit form)
router.get("/edit/:inv_id", utilities.handleErrors(invController.editInventoryView))
// Update inventory (form POST) — validation for updates
router.post("/update", invValidate.newInventoryRules(), invValidate.checkUpdateData, utilities.handleErrors(invController.updateInventory))

// Delete confirmation (show confirmation view)
router.get("/delete/:inv_id", utilities.handleErrors(invController.deleteConfirmView))
// Delete (perform delete)
router.post("/delete", utilities.handleErrors(invController.deleteInventory))

// type and detail classification
router.get("/type/:classificationId", utilities.handleErrors(invController.buildByClassificationId))
router.get("/detail/:invId", utilities.handleErrors(invController.buildByInventoryId))

module.exports = router
