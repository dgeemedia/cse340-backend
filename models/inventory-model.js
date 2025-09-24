// models/inventory-model.js
const pool = require("../database")

// Get all classifications
async function getClassifications(){
  return await pool.query("SELECT * FROM public.classification ORDER BY classification_name")
}

// Get inventory items by classification_id
async function getInventoryByClassificationId(classification_id) {
  try {
    const data = await pool.query(
      `SELECT * FROM public.inventory AS i 
      JOIN public.classification AS c 
      ON i.classification_id = c.classification_id 
      WHERE i.classification_id = $1`,
      [classification_id]
    )
    return data.rows
  } catch (error) {
    console.error("getclassificationsbyid error " + error)
  }
}

// Get inventory item by inv_id
async function getInventoryById(inv_id) {
  try {
    const data = await pool.query(
      `SELECT * FROM public.inventory AS i
       JOIN public.classification AS c
       ON i.classification_id = c.classification_id
       WHERE i.inv_id = $1`,
      [inv_id]
    )
    return data.rows[0]
  } catch (error) {
    console.error("getInventoryById error: ", error)
    throw error
  }
}
  
// add Classification
async function addClassification(classification_name) {
  try {
    const sql = `INSERT INTO public.classification (classification_name)
                 VALUES ($1) RETURNING *`
    const result = await pool.query(sql, [classification_name])
    return result
  } catch (error) {
    throw error
  }
}

// add inventory item
async function addInventoryItem(inv) {
  /* inv should be an object with keys:
     inv_make, inv_model, inv_description, inv_image, inv_thumbnail,
     inv_price, inv_miles, inv_color, inv_body, inv_transmission,
     inv_year, classification_id
  */
  try {
    const sql = `INSERT INTO public.inventory
      (inv_make, inv_model, inv_description, inv_image, inv_thumbnail, inv_price, inv_miles, inv_color, inv_body, inv_transmission, inv_year, classification_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`
    const params = [
      inv.inv_make,
      inv.inv_model,
      inv.inv_description,
      inv.inv_image,
      inv.inv_thumbnail,
      inv.inv_price,
      inv.inv_miles,
      inv.inv_color,
      inv.inv_body,
      inv.inv_transmission,
      inv.inv_year,
      inv.classification_id,
    ]
    const result = await pool.query(sql, params)
    return result
  } catch (error) {
    throw error
  }
}

module.exports = {
  getClassifications,
  getInventoryByClassificationId,
  getInventoryById,
  addClassification,
  addInventoryItem,
}
