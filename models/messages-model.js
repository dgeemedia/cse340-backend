// models/messages-model.js
const pool = require('../database')

/**
 * Simple inbox/outbox message model
 */

async function sendMessage(sender_id, recipient_id, subject, body) {
  try {
    const sql = `INSERT INTO public.messages
      (sender_id, recipient_id, subject, body)
      VALUES ($1,$2,$3,$4) RETURNING *`
    const result = await pool.query(sql, [sender_id || null, recipient_id || null, subject || null, body])
    return result.rows[0]
  } catch (error) {
    throw error
  }
}

async function getInbox(recipient_id) {
  try {
    const sql = `SELECT m.*, s.account_firstname as sender_first, s.account_lastname as sender_last
                 FROM public.messages m
                 LEFT JOIN public.account s ON m.sender_id = s.account_id
                 WHERE m.recipient_id = $1
                 ORDER BY m.created_at DESC`
    const result = await pool.query(sql, [recipient_id])
    return result.rows
  } catch (error) {
    throw error
  }
}

async function getOutbox(sender_id) {
  try {
    const sql = `SELECT m.*, r.account_firstname as recipient_first, r.account_lastname as recipient_last
                 FROM public.messages m
                 LEFT JOIN public.account r ON m.recipient_id = r.account_id
                 WHERE m.sender_id = $1
                 ORDER BY m.created_at DESC`
    const result = await pool.query(sql, [sender_id])
    return result.rows
  } catch (error) {
    throw error
  }
}

async function getMessageById(message_id) {
  try {
    const sql = `SELECT m.*, s.account_firstname as sender_first, s.account_lastname as sender_last,
                        r.account_firstname as recipient_first, r.account_lastname as recipient_last
                 FROM public.messages m
                 LEFT JOIN public.account s ON m.sender_id = s.account_id
                 LEFT JOIN public.account r ON m.recipient_id = r.account_id
                 WHERE m.message_id = $1`
    const result = await pool.query(sql, [message_id])
    return result.rows[0]
  } catch (error) {
    throw error
  }
}

async function markRead(message_id, is_read = true) {
  try {
    const sql = `UPDATE public.messages SET is_read = $1, updated_at = now() WHERE message_id = $2 RETURNING *`
    const result = await pool.query(sql, [is_read, message_id])
    return result.rows[0]
  } catch (error) {
    throw error
  }
}

async function deleteMessage(message_id) {
  try {
    const sql = `DELETE FROM public.messages WHERE message_id = $1`
    const result = await pool.query(sql, [message_id])
    return result
  } catch (error) {
    throw error
  }
}

/**
 * List recipients filtered by roles (useful for compose UI).
 * Uses LOWER(account_type::text) to avoid "function lower(...) does not exist" when account_type isn't plain text.
 * Accepts array of roles: ['Employee','Manager'] (case-insensitive).
 */
async function listRecipientsByRoles(roles = []) {
  try {
    if (!roles || !roles.length) return []
    // build parameterized IN list
    const params = roles.map(r => r.toLowerCase())
    const placeholders = params.map((_, i) => `$${i+1}`).join(', ')
    const sql = `SELECT account_id, account_firstname, account_lastname, account_email, account_type
                 FROM public.account
                 WHERE LOWER(account_type::text) IN (${placeholders})
                 ORDER BY account_firstname, account_lastname`
    const result = await pool.query(sql, params)
    return result.rows
  } catch (error) {
    throw error
  }
}

module.exports = {
  sendMessage,
  getInbox,
  getOutbox,
  getMessageById,
  markRead,
  deleteMessage,
  listRecipientsByRoles,
}
