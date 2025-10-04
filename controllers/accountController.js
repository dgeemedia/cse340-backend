// controllers/accountController.js
const utilities = require("../utilities")
const accountModel = require("../models/account-model")
const bcrypt = require("bcryptjs")
const jwt = require('jsonwebtoken')
require("dotenv").config()

/* Deliver login view */
async function buildLogin(req, res, next) {
  try {
    let nav = await utilities.getNav()
    res.render("account/login", { title: "Login", nav })
  } catch (err) {
    next(err)
  }
}

/* Deliver Register view */
async function buildRegister(req, res, next) {
  try {
    let nav = await utilities.getNav()
    res.render("account/register", { title: "Register", nav, errors: null, })
  } catch (err) {
    next(err)
  }
}

/* Process Account Registration */
async function registerAccount(req, res, next) {
  try {
    let nav = await utilities.getNav()

    const {
      account_firstname,
      account_lastname,
      account_email,
      account_password,
    } = req.body

    // Hash the password before storing
  let hashedPassword
  try {
    // regular password and cost (salt is generated automatically)
    hashedPassword = await bcrypt.hashSync(account_password, 10)
  } catch (error) {
    req.flash("error", 'Sorry, there was an error processing the registration.')
    res.status(500).render("account/register", {
      title: "Registration",
      nav,
      errors: null,
    })
  }

    const regResult = await accountModel.registerAccount(
      account_firstname,
      account_lastname,
      account_email,
      hashedPassword
    )

    if (regResult && regResult.rowCount > 0) {
      req.flash(
        "success",
        `Congratulations, you're registered ${account_firstname} ${account_lastname}. Please log in.`
      )
      return res.status(201).render("account/login", {
        title: "Login",
        nav,
      })
    } else {
      req.flash("error", "Sorry, the registration failed.")
      return res.status(500).render("account/register", {
        title: "Register",
        nav,
        errors: null,
      })
    }
  } catch (err) {
    next(err)
  }
}

/* ****************************************
 *  Process login request
 * ************************************ */
async function accountLogin(req, res) {
  let nav = await utilities.getNav()
  const { account_email, account_password } = req.body
  const accountData = await accountModel.getAccountByEmail(account_email)
  if (!accountData) {
    req.flash("notice", "Please check your credentials and try again.")
    res.status(400).render("account/login", {
      title: "Login",
      nav,
      errors: null,
      account_email,
    })
    return
  }
  try {
    if (await bcrypt.compare(account_password, accountData.account_password)) {
      delete accountData.account_password
      const accessToken = jwt.sign(accountData, process.env.ACCESS_TOKEN_SECRET, { expiresIn: 3600 * 1000 })
      if(process.env.NODE_ENV === 'development') {
        res.cookie("jwt", accessToken, { httpOnly: true, maxAge: 3600 * 1000 })
      } else {
        res.cookie("jwt", accessToken, { httpOnly: true, secure: true, maxAge: 3600 * 1000 })
      }
      return res.redirect("/account/")
    }
    else {
      req.flash("message notice", "Please check your credentials and try again.")
      res.status(400).render("account/login", {
        title: "Login",
        nav,
        errors: null,
        account_email,
      })
    }
  } catch (error) {
    throw new Error('Access Forbidden')
  }
}

/* Deliver account management view */
async function buildManagement(req, res, next) {
  try {
    let nav = await utilities.getNav()
    // account info (set by checkJWTToken middleware when logged in)
    const account = res.locals.accountData || null

    // Render the management view; show flash messages and any errors via express-messages
    res.render("account/management", {
      title: "Account Management",
      nav,
      account,
      errors: null,
    })
  } catch (err) {
    next(err)
  }
}

/* Deliver account edit (update) view */
async function buildAccountEdit(req, res, next) {
  try {
    const account_id = parseInt(req.params.account_id, 10)
    // fetch fresh account info from DB
    const account = await accountModel.getAccountById(account_id)
    const nav = await utilities.getNav()
    if (!account) {
      req.flash("error", "Account not found.")
      return res.redirect("/account/")
    }
    res.render("account/edit-account", {
      title: "Update Account",
      nav,
      account,
      errors: null,
    })
  } catch (error) {
    next(error)
  }
}

/* Process account info update */
async function updateAccountInfo(req, res, next) {
  try {
    const { account_id, account_firstname, account_lastname, account_email } = req.body
    const nav = await utilities.getNav()

    // attempt update via model
    const result = await accountModel.updateAccountInfo(account_id, account_firstname, account_lastname, account_email)
    if (result && result.rowCount > 0) {
      // re-query updated account for display
      const updated = await accountModel.getAccountById(account_id)
      // update token/cookie if logged-in user updated their own account so the UI shows new name/email
      // If user is the one logged in, replace JWT with new payload (optional but recommended)
      if (res.locals && res.locals.accountData && res.locals.accountData.account_id == account_id) {
        const tokenPayload = { ...updated }
        delete tokenPayload.account_password
        const accessToken = jwt.sign(tokenPayload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: 3600 * 1000 })
        if (process.env.NODE_ENV === 'development') {
          res.cookie("jwt", accessToken, { httpOnly: true, maxAge: 3600 * 1000 })
        } else {
          res.cookie("jwt", accessToken, { httpOnly: true, secure: true, maxAge: 3600 * 1000 })
        }
      }

      req.flash("success", "Account information updated successfully.")
      // deliver management view with updated account info
      return res.render("account/management", { title: "Account Management", nav, account: updated, errors: null })
    } else {
      req.flash("error", "Account update failed.")
      // show update form again with sticky values
      const account = {
        account_id,
        account_firstname,
        account_lastname,
        account_email
      }
      return res.status(400).render("account/edit-account", { title: "Update Account", nav, account, errors: [{ msg: "Update failed" }] })
    }
  } catch (err) {
    next(err)
  }
}

/* Process password change */
async function changePassword(req, res, next) {
  try {
    const { account_id, account_password } = req.body
    const nav = await utilities.getNav()

    // hash the new password
    const hashedPassword = await bcrypt.hash(account_password, 10)
    const result = await accountModel.updatePassword(account_id, hashedPassword)
    if (result && result.rowCount > 0) {
      // re-query updated account for display
      const updated = await accountModel.getAccountById(account_id)
      req.flash("success", "Password changed successfully.")
      return res.render("account/management", { title: "Account Management", nav, account: updated, errors: null })
    } else {
      req.flash("error", "Password update failed.")
      const account = await accountModel.getAccountById(account_id)
      return res.status(400).render("account/edit-account", { title: "Update Account", nav, account, errors: [{ msg: "Password update failed" }] })
    }
  } catch (err) {
    next(err)
  }
}

/* Logout - delete JWT cookie and redirect home */
async function logout(req, res, next) {
  try {
    res.clearCookie("jwt")
    req.flash("success", "You have been logged out.")
    return res.redirect("/")
  } catch (err) {
    next(err)
  }
}

module.exports = {
  buildLogin,
  buildRegister,
  registerAccount,
  accountLogin,
  buildManagement,
  buildAccountEdit,     
  updateAccountInfo,    
  changePassword,       
  logout,               
}


