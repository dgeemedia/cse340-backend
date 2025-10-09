// models/review-replies-model.js
const pool = require('../database')

async function addReply(review_id, account_id, reply_text) {
  const sql = `INSERT INTO public.review_replies (review_id, account_id, reply_text) VALUES ($1,$2,$3) RETURNING *`
  const params = [review_id, account_id, reply_text]
  const result = await pool.query(sql, params)
  return result.rows[0]
}

async function getRepliesByReview(review_id) {
  const sql = `
    SELECT rr.reply_id, rr.review_id, rr.account_id, rr.reply_text, rr.created_at,
           a.account_firstname, a.account_lastname, a.account_type
    FROM public.review_replies rr
    LEFT JOIN public.account a ON rr.account_id = a.account_id
    WHERE rr.review_id = $1
    ORDER BY rr.created_at ASC
  `
  const result = await pool.query(sql, [review_id])
  return result.rows
}

module.exports = {
  addReply,
  getRepliesByReview,
}
