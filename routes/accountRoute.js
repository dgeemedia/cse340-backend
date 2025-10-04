// routes/accountRoute.js
const express = require("express")
const router = express.Router()
const utilities = require("../utilities")
const accountController = require("../controllers/accountController")
const regValidate = require('../utilities/account-validation')
const acctValidate = require('../utilities/account-validation') // we will add update/password rules there

// GET /account/ (protected account management view)
router.get("/", utilities.checkLogin, utilities.handleErrors(accountController.buildManagement))

// GET /account/login
router.get("/login", utilities.handleErrors(accountController.buildLogin))

// GET /account/register
router.get("/register", utilities.handleErrors(accountController.buildRegister))
router.post("/register", regValidate.registationRules(), regValidate.checkRegData, utilities.handleErrors(accountController.registerAccount))

// Process the login attempt
router.post("/login", regValidate.loginRules(), regValidate.checkLoginData, utilities.handleErrors(accountController.accountLogin))

// Account edit view (only for logged in user)
router.get("/edit/:account_id", utilities.checkLogin, utilities.handleErrors(accountController.buildAccountEdit))

/**
 * Show change-password page (redirect to edit page if account logged in)
 * If you want a standalone change-password page later, replace the inline
 * handler with accountController.buildChangePassword and create a view.
 */
router.get(
  "/change-password",
  utilities.checkLogin,
  utilities.handleErrors(async function (req, res) {
    const account = res.locals.accountData || null
    if (account && account.account_id) {
      return res.redirect(`/account/edit/${account.account_id}`)
    }
    // fallback: if somehow not logged in, go to login
    return res.redirect("/account/login")
  })
)

// Process account update
router.post("/update", utilities.checkLogin, acctValidate.updateAccountRules(), acctValidate.checkUpdateData, utilities.handleErrors(accountController.updateAccountInfo))

// Process password change
router.post("/change-password", utilities.checkLogin, acctValidate.passwordChangeRules(), acctValidate.checkPasswordData, utilities.handleErrors(accountController.changePassword))

// Logout (clear cookie)
router.post("/logout", utilities.handleErrors(accountController.logout))

module.exports = router
