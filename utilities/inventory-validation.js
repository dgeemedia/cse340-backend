// utilities/inventory-validation.js
const { body, validationResult } = require('express-validator')
const utilities = require('.')

/* validation rules for creating/updating inventory */
function newInventoryRules() {
  return [
    body('classification_id').trim().notEmpty().withMessage('Classification is required'),
    body('inv_make').trim().notEmpty().withMessage('Make is required'),
    body('inv_model').trim().notEmpty().withMessage('Model is required'),
    body('inv_price')
      .trim()
      .notEmpty()
      .withMessage('Price is required')
      .bail()
      .isFloat({ gt: 0 })
      .withMessage('Price must be a number greater than 0'),
    body('inv_year')
      .optional({ checkFalsy: true })
      .isInt({ min: 1900, max: 2099 })
      .withMessage('Year must be a valid year'),
    body('inv_miles')
      .optional({ checkFalsy: true })
      .isInt()
      .withMessage('Mileage must be numeric'),
    // other fields are optional and free text
  ]
}

/* middleware: used for add-inventory route — render add view on errors */
async function checkInventoryData(req, res, next) {
  const errors = validationResult(req)
  const classificationList = await utilities.buildClassificationList(req.body.classification_id)
  if (!errors.isEmpty()) {
    // rebuild nav and return to add-inventory with sticky values
    const nav = await utilities.getNav()
    const inv = {
      inv_make: req.body.inv_make,
      inv_model: req.body.inv_model,
      inv_description: req.body.inv_description,
      inv_image: req.body.inv_image,
      inv_thumbnail: req.body.inv_thumbnail,
      inv_price: req.body.inv_price,
      inv_miles: req.body.inv_miles,
      inv_color: req.body.inv_color,
      inv_body: req.body.inv_body,
      inv_transmission: req.body.inv_transmission,
      inv_year: req.body.inv_year,
      classification_id: req.body.classification_id,
    }
    return res.status(400).render('inventory/add-inventory', {
      title: 'Add Inventory Item',
      nav,
      classificationList,
      errors: errors.array(),
      inv,
    })
  }
  return next()
}

/* middleware: used for update route — render edit view on errors (sticky) */
async function checkUpdateData(req, res, next) {
  const errors = validationResult(req)
  // keep selected classification sticky
  const classificationList = await utilities.buildClassificationList(req.body.classification_id)
  if (!errors.isEmpty()) {
    const nav = await utilities.getNav()
    // include inv_id so the hidden field remains populated
    return res.status(400).render('inventory/edit-inventory', {
      title: req.body.inv_make && req.body.inv_model ? `Edit ${req.body.inv_make} ${req.body.inv_model}` : 'Edit Inventory Item',
      nav,
      classificationSelect: classificationList,
      errors: errors.array(),
      inv_id: req.body.inv_id,
      inv_make: req.body.inv_make,
      inv_model: req.body.inv_model,
      inv_year: req.body.inv_year,
      inv_description: req.body.inv_description,
      inv_image: req.body.inv_image,
      inv_thumbnail: req.body.inv_thumbnail,
      inv_price: req.body.inv_price,
      inv_miles: req.body.inv_miles,
      inv_color: req.body.inv_color,
      classification_id: req.body.classification_id,
      inv_transmission: req.body.inv_transmission,
      inv_body: req.body.inv_body,
    })
  }
  return next()
}

module.exports = {
  newInventoryRules,
  checkInventoryData,
  checkUpdateData,
}
