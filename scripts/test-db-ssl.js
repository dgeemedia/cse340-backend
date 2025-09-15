// scripts/test-db-ssl.js
require('dotenv').config();
const { Pool } = require('pg');

function norm(v){ if(!v && v!=="") return ""; return String(v).trim().replace(/^['"]|['"]$/g,""); }
const conn = norm(process.env.DATABASE_URL||"");

async function tryConn(opts, label){
  console.log('--- trying', label, 'opts:', opts.ssl ? 'ssl on' : 'ssl off', opts.ssl ? `rejectUnauthorized=${opts.ssl.rejectUnauthorized}` : '');
  const pool = new Pool(Object.assign({ connectionString: conn }, opts));
  try {
    const client = await pool.connect();
    console.log(label, 'connected OK');
    const { rows } = await client.query('SELECT NOW() as now');
    console.log(label, 'SELECT NOW() ->', rows[0]);
    client.release();
    await pool.end();
  } catch (err) {
    console.error(label, 'failed:', err && (err.stack || err.message || err));
    try{ await pool.end(); }catch(_){}
  }
}

(async () => {
  // no SSL
  await tryConn({}, 'no-ssl');

  // SSL with rejectUnauthorized=false (common for hosted DBs)
  await tryConn({ ssl: { rejectUnauthorized: false } }, 'ssl-reject-false');

  // SSL strict
  await tryConn({ ssl: { rejectUnauthorized: true } }, 'ssl-strict-true');

  process.exit(0);
})();
