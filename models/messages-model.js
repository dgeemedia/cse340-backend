const pool = require("../database")

async function sendMessage(sender_id, recipient_id, subject, body) {
  const sql = `INSERT INTO public.messages (sender_id, recipient_id, subject, body)
               VALUES ($1,$2,$3,$4) RETURNING *`
  const res = await pool.query(sql, [sender_id, recipient_id, subject, body])
  return res.rows[0]
}

async function getInbox(account_id) {
  const sql = `SELECT m.*, s.account_firstname AS sender_first, s.account_lastname AS sender_last
               FROM public.messages m
               LEFT JOIN public.account s ON m.sender_id = s.account_id
               WHERE m.recipient_id = $1
               ORDER BY m.created_at DESC`
  const res = await pool.query(sql, [account_id])
  return res.rows
}

async function getOutbox(account_id) {
  const sql = `SELECT m.*, r.account_firstname AS recipient_first, r.account_lastname AS recipient_last
               FROM public.messages m
               LEFT JOIN public.account r ON m.recipient_id = r.account_id
               WHERE m.sender_id = $1
               ORDER BY m.created_at DESC`
  const res = await pool.query(sql, [account_id])
  return res.rows
}

async function markRead(message_id, is_read = true) {
  const sql = `UPDATE public.messages SET is_read = $1, updated_at = now() WHERE message_id = $2 RETURNING *`
  const res = await pool.query(sql, [is_read, message_id])
  return res.rows[0]
}

async function getMessageById(message_id) {
  const sql = `SELECT m.*, s.account_firstname AS sender_first, r.account_firstname AS recipient_first
               FROM public.messages m
               LEFT JOIN public.account s ON m.sender_id = s.account_id
               LEFT JOIN public.account r ON m.recipient_id = r.account_id
               WHERE m.message_id = $1`
  const res = await pool.query(sql, [message_id])
  return res.rows[0]
}

module.exports = {
  sendMessage,
  getInbox,
  getOutbox,
  markRead,
  getMessageById,
}
