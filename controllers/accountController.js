// controllers/accountController.js
const utilities = require("../utilities")
const accountModel = require("../models/account-model")
const bcrypt = require("bcryptjs")

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

module.exports = { buildLogin, buildRegister, registerAccount }
