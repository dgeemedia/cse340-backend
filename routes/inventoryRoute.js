//routes/inventoryRoute.js
const express = require("express")
const router = express.Router()
const invController = require("../controllers/invController")
const utilities = require("../utilities")
const invValidate = require("../utilities/inventory-validation") // validation middleware

/* -------------------------
   Administrative routes (protected)
   Mounted at /inv/ in app
   ------------------------- */

// Management view (Task 1) - protected
router.get(
  "/",
  utilities.checkAdmin, // restrict to Employee / Manager / Admin
  utilities.handleErrors(invController.buildManagement)
)

// JSON endpoint used by client-side JS to fetch inventory by classification
router.get("/getInventory/:classification_id", utilities.handleErrors(invController.getInventoryJSON))

// Add classification (protected)
router.get(
  "/add-classification",
  utilities.checkAdmin,
  utilities.handleErrors(invController.buildAddClassification)
)
router.post(
  "/add-classification",
  utilities.checkAdmin,
  utilities.handleErrors(invController.addClassification)
)

// Add inventory (protected) — validation then controller
router.get(
  "/add-inventory",
  utilities.checkAdmin,
  utilities.handleErrors(invController.buildAddInventory)
)
router.post(
  "/add-inventory",
  utilities.checkAdmin,
  invValidate.newInventoryRules(),
  invValidate.checkInventoryData,
  utilities.handleErrors(invController.addInventory)
)

// Edit inventory (show edit form) (protected)
router.get(
  "/edit/:inv_id",
  utilities.checkAdmin,
  utilities.handleErrors(invController.editInventoryView)
)
// Update inventory (form POST) — validation for updates (protected)
router.post(
  "/update",
  utilities.checkAdmin,
  invValidate.newInventoryRules(),
  invValidate.checkUpdateData,
  utilities.handleErrors(invController.updateInventory)
)

// Delete confirmation (show confirmation view) (protected)
router.get(
  "/delete/:inv_id",
  utilities.checkAdmin,
  utilities.handleErrors(invController.deleteConfirmView)
)
// Delete (perform delete) (protected)
router.post(
  "/delete",
  utilities.checkAdmin,
  utilities.handleErrors(invController.deleteInventory)
)

/* -------------------------
   Public routes
   ------------------------- */

// type and detail classification (public)
router.get("/type/:classificationId", utilities.handleErrors(invController.buildByClassificationId))
router.get("/detail/:invId", utilities.handleErrors(invController.buildByInventoryId))

module.exports = router
