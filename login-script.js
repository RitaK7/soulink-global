// -- login-script.js --
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  form.addEventListener('submit', e => {
    e.preventDefault();
    console.log('Login handler triggered');
    const email    = form.email.value;
    const password = form.password.value;
    firebase.auth()
      .signInWithEmailAndPassword(email, password)
      .then(() => {
        console.log('Login successful, redirecting...');
        window.location.href = 'home.html';
      })
      .catch(err => {
        console.error('Login error', err);
        alert(`Login failed: ${err.message}`);
      });
  });
});
