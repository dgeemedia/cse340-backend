// models/reviews-model.js
const pool = require('../database')

/* Reviews */

async function addReview(inv_id, account_id, rating = 5, comment = null) {
  try {
    const sql = `INSERT INTO public.reviews (inv_id, account_id, rating, comment)
                 VALUES ($1,$2,$3,$4) RETURNING *`
    const result = await pool.query(sql, [inv_id, account_id, rating, comment || null])
    return result.rows[0]
  } catch (error) {
    throw error
  }
}

async function getReviewById(review_id) {
  try {
    const sql = `SELECT r.*, a.account_firstname, a.account_lastname
                 FROM public.reviews r
                 LEFT JOIN public.account a ON r.account_id = a.account_id
                 WHERE r.review_id = $1`
    const result = await pool.query(sql, [review_id])
    return result.rows[0]
  } catch (error) {
    throw error
  }
}

async function updateReview(review_id, rating, comment) {
  try {
    const sql = `UPDATE public.reviews
                 SET rating = $1, comment = $2, updated_at = now()
                 WHERE review_id = $3 RETURNING *`
    const result = await pool.query(sql, [rating, comment || null, review_id])
    return result.rows[0]
  } catch (error) {
    throw error
  }
}

async function deleteReview(review_id) {
  try {
    const sql = `DELETE FROM public.reviews WHERE review_id = $1`
    const result = await pool.query(sql, [review_id])
    return result
  } catch (error) {
    throw error
  }
}

async function getAverageRatingByInventory(inv_id) {
  try {
    const sql = `SELECT COALESCE(ROUND(AVG(rating)::numeric,2),0) as avg_rating, COUNT(*)::int as count
                 FROM public.reviews WHERE inv_id = $1`
    const result = await pool.query(sql, [inv_id])
    return result.rows[0] || { avg_rating: 0, count: 0 }
  } catch (error) {
    throw error
  }
}

/* Get reviews and include top-level replies (and nested replies optionally) */
async function getReviewsByInventory(inv_id, limit = 10, offset = 0) {
  try {
    // Get reviews with author info
    const sql = `SELECT r.*, a.account_firstname, a.account_lastname
                 FROM public.reviews r
                 LEFT JOIN public.account a ON r.account_id = a.account_id
                 WHERE r.inv_id = $1
                 ORDER BY r.created_at DESC
                 LIMIT $2 OFFSET $3`
    const reviewsRes = await pool.query(sql, [inv_id, limit, offset])
    const reviews = reviewsRes.rows

    // fetch replies for the returned reviews
    const reviewIds = reviews.map(r => r.review_id)
    if (reviewIds.length === 0) return reviews

    const placeholders = reviewIds.map((_, i) => `$${i+1}`).join(', ')
    const repliesSql = `SELECT rr.*, a.account_firstname, a.account_lastname
                        FROM public.review_replies rr
                        LEFT JOIN public.account a ON rr.account_id = a.account_id
                        WHERE rr.review_id IN (${placeholders})
                        ORDER BY rr.created_at ASC`
    const repliesRes = await pool.query(repliesSql, reviewIds)
    const replies = repliesRes.rows

    // group replies under review_id and also attach parent-child if parent_reply_id used
    const map = {}
    reviews.forEach(r => { map[r.review_id] = { ...r, replies: [] } })
    replies.forEach(rep => {
      if (map[rep.review_id]) map[rep.review_id].replies.push(rep)
    })

    return Object.values(map)
  } catch (error) {
    throw error
  }
}

/* Replies (threaded) */
async function addReviewReply(review_id, account_id, reply_text, parent_reply_id = null) {
  try {
    const sql = `INSERT INTO public.review_replies (review_id, account_id, parent_reply_id, reply_text)
                 VALUES ($1,$2,$3,$4) RETURNING *`
    const result = await pool.query(sql, [review_id, account_id || null, parent_reply_id || null, reply_text])
    return result.rows[0]
  } catch (error) {
    throw error
  }
}

module.exports = {
  addReview,
  getReviewById,
  updateReview,
  deleteReview,
  getAverageRatingByInventory,
  getReviewsByInventory,
  addReviewReply,
}
