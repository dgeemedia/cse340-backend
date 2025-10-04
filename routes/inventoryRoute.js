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

/* -------------------------
   Administrative routes (protected)
   ------------------------- */
// Add classification (protected)
router.get(
  "/add-classification",
  utilities.checkAdmin, // <-- ADDED: restrict to Employee/Admin
  utilities.handleErrors(invController.buildAddClassification)
)
router.post(
  "/add-classification",
  utilities.checkAdmin, // <-- ADDED
  utilities.handleErrors(invController.addClassification)
)

// Add inventory (protected)
router.get(
  "/add-inventory",
  utilities.checkAdmin, // <-- ADDED
  utilities.handleErrors(invController.buildAddInventory)
)
// validate then controller (protected)
router.post(
  "/add-inventory",
  utilities.checkAdmin, // <-- ADDED
  invValidate.newInventoryRules(),
  invValidate.checkInventoryData,
  utilities.handleErrors(invController.addInventory)
)

// Edit inventory (show edit form) (protected)
router.get(
  "/edit/:inv_id",
  utilities.checkAdmin, // <-- ADDED
  utilities.handleErrors(invController.editInventoryView)
)
// Update inventory (form POST) — validation for updates (protected)
router.post(
  "/update",
  utilities.checkAdmin, // <-- ADDED
  invValidate.newInventoryRules(),
  invValidate.checkUpdateData,
  utilities.handleErrors(invController.updateInventory)
)

// Delete confirmation (show confirmation view) (protected)
router.get(
  "/delete/:inv_id",
  utilities.checkAdmin, // <-- ADDED
  utilities.handleErrors(invController.deleteConfirmView)
)
// Delete (perform delete) (protected)
router.post(
  "/delete",
  utilities.checkAdmin, // <-- ADDED
  utilities.handleErrors(invController.deleteInventory)
)

/* -------------------------
   Public routes
   ------------------------- */
// type and detail classification (public)
router.get("/type/:classificationId", utilities.handleErrors(invController.buildByClassificationId))
router.get("/detail/:invId", utilities.handleErrors(invController.buildByInventoryId))

module.exports = router
