// routes/statics.js
const express = require('express');
const path = require('path');
const router = express.Router();

// Serve public folder at root: /css, /js, /images etc. will be served from public subfolders
router.use(express.static(path.join(__dirname, '..', 'public')));

// if you also want explicit mounts (optional)
router.use('/css', express.static(path.join(__dirname, '..', 'public', 'css')));
router.use('/js', express.static(path.join(__dirname, '..', 'public', 'js')));
router.use('/images', express.static(path.join(__dirname, '..', 'public', 'images')));

module.exports = router;
