// models/reviews-model.js
const pool = require("../database")

async function addReview(inv_id, account_id, rating, comment) {
  const sql = `INSERT INTO public.reviews (inv_id, account_id, rating, comment)
               VALUES ($1,$2,$3,$4) RETURNING *`
  const res = await pool.query(sql, [inv_id, account_id, rating, comment])
  return res.rows[0]
}

// get reviews for an inventory item with optional pagination
async function getReviewsByInventory(inv_id, limit = 10, offset = 0) {
  const sql = `SELECT r.*, a.account_firstname, a.account_lastname
               FROM public.reviews r
               JOIN public.account a ON r.account_id = a.account_id
               WHERE r.inv_id = $1
               ORDER BY r.created_at DESC
               LIMIT $2 OFFSET $3`
  const res = await pool.query(sql, [inv_id, limit, offset])
  return res.rows
}

async function getReviewCountByInventory(inv_id) {
  const sql = `SELECT COUNT(*)::int AS count FROM public.reviews WHERE inv_id = $1`
  const res = await pool.query(sql, [inv_id])
  return res.rows[0].count || 0
}

async function getAverageRatingByInventory(inv_id) {
  const sql = `SELECT COALESCE(ROUND(AVG(rating)::numeric,2), 0) AS avg_rating,
                      COUNT(*)::int AS count
               FROM public.reviews
               WHERE inv_id = $1`
  const res = await pool.query(sql, [inv_id])
  return res.rows[0] || { avg_rating: 0, count: 0 }
}

async function getReviewById(review_id) {
  const sql = `SELECT * FROM public.reviews WHERE review_id = $1`
  const res = await pool.query(sql, [review_id])
  return res.rows[0]
}

// get reviews by account with pagination for management page
async function getReviewsByAccount(account_id, limit = 5, offset = 0) {
  const sql = `SELECT r.*, i.inv_make, i.inv_model
               FROM public.reviews r
               LEFT JOIN public.inventory i ON r.inv_id = i.inv_id
               WHERE r.account_id = $1
               ORDER BY r.created_at DESC
               LIMIT $2 OFFSET $3`
  const res = await pool.query(sql, [account_id, limit, offset])
  return res.rows
}

async function getReviewCountByAccount(account_id) {
  const sql = `SELECT COUNT(*)::int AS count FROM public.reviews WHERE account_id = $1`
  const res = await pool.query(sql, [account_id])
  return res.rows[0].count || 0
}

async function updateReview(review_id, rating, comment) {
  const sql = `UPDATE public.reviews
               SET rating = $1, comment = $2, updated_at = now()
               WHERE review_id = $3 RETURNING *`
  const res = await pool.query(sql, [rating, comment, review_id])
  return res.rows[0]
}

async function deleteReview(review_id) {
  const sql = `DELETE FROM public.reviews WHERE review_id = $1`
  return await pool.query(sql, [review_id])
}

module.exports = {
  addReview,
  getReviewsByInventory,
  getReviewCountByInventory,
  getAverageRatingByInventory,
  getReviewById,
  getReviewsByAccount,
  getReviewCountByAccount,
  updateReview,
  deleteReview,
}
