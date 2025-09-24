// public/js/script.js
// Toggle password show/hide for inputs that use the `pw-toggle` button pattern
(function () {
  document.addEventListener("DOMContentLoaded", function () {
    const toggle = document.getElementById('togglePassword');
    const pwd = document.getElementById('account_password');
    if (!toggle || !pwd) return;

    toggle.addEventListener('click', function (e) {
      e.preventDefault();
      const isPwd = pwd.getAttribute('type') === 'password';
      pwd.setAttribute('type', isPwd ? 'text' : 'password');
      this.textContent = isPwd ? 'Hide' : 'Show';
      this.setAttribute('aria-pressed', isPwd ? 'true' : 'false');
      // keep focus on the field for keyboard users
      if (isPwd) pwd.focus();
    });
  });
})();
