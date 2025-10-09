// models/messages-model.js
const pool = require('../database')

/**
 * Send a message (insert)
 * returns the inserted row
 */
async function sendMessage(senderId, recipientId, subject, body) {
  const sql = `INSERT INTO public.messages (sender_id, recipient_id, subject, body, created_at)
               VALUES ($1,$2,$3,$4, now()) RETURNING *`
  const params = [senderId, recipientId, subject || '', body || '']
  const { rows } = await pool.query(sql, params)
  return rows[0]
}

/**
 * Get inbox messages for a user
 */
async function getInbox(accountId) {
  const sql = `SELECT m.*, s.account_firstname AS sender_first, s.account_lastname AS sender_last
               FROM public.messages m
               LEFT JOIN public.account s ON m.sender_id = s.account_id
               WHERE m.recipient_id = $1
               ORDER BY m.created_at DESC`
  const { rows } = await pool.query(sql, [accountId])
  return rows
}

/**
 * Get outbox (sent) messages for a user
 */
async function getOutbox(accountId) {
  const sql = `SELECT m.*, r.account_firstname AS recipient_first, r.account_lastname AS recipient_last
               FROM public.messages m
               LEFT JOIN public.account r ON m.recipient_id = r.account_id
               WHERE m.sender_id = $1
               ORDER BY m.created_at DESC`
  const { rows } = await pool.query(sql, [accountId])
  return rows
}

/**
 * Get single message by id (for view)
 */
async function getMessageById(messageId) {
  const sql = `SELECT m.*, s.account_firstname AS sender_first, s.account_lastname AS sender_last,
                      r.account_firstname AS recipient_first, r.account_lastname AS recipient_last
               FROM public.messages m
               LEFT JOIN public.account s ON m.sender_id = s.account_id
               LEFT JOIN public.account r ON m.recipient_id = r.account_id
               WHERE m.message_id = $1`
  const { rows } = await pool.query(sql, [messageId])
  return rows[0]
}

/**
 * Mark a message read/unread
 */
async function markRead(messageId, isRead) {
  const sql = `UPDATE public.messages SET is_read = $1 WHERE message_id = $2 RETURNING *`
  const { rows } = await pool.query(sql, [isRead, messageId])
  return rows[0]
}

/**
 * Delete message by id (sender or recipient allowed)
 */
async function deleteMessage(messageId) {
  const sql = `DELETE FROM public.messages WHERE message_id = $1 RETURNING *`
  const { rows } = await pool.query(sql, [messageId])
  return rows[0]
}

/**
 * Utility to list recipients filtered by account types
 * Accepts array of role strings (e.g. ['Employee','Manager']) - returns id + firstname/lastname
 */
async function listRecipientsByRoles(roles = []) {
  try {
    // ensure roles are lowercased strings
    const normalized = roles.map(r => String(r).toLowerCase())
    // note: cast account_type to text before calling lower()
    const sql = `
      SELECT account_id, account_firstname, account_lastname, account_email, account_type
      FROM public.account
      WHERE lower(account_type::text) = ANY($1::text[])
      ORDER BY account_firstname, account_lastname
    `
    const result = await pool.query(sql, [normalized])
    return result.rows
  } catch (err) {
    throw err
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
