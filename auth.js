// auth.js
// Simple client-side auth (for demo). Passwords are stored hashed (simple hash) in localStorage per email.
// NOTE: Replace with real backend for production.

function simpleHash(str){
  // not cryptographically secure; demo-only (DJB2)
  let h = 5381;
  for(let i=0;i<str.length;i++) h = ((h<<5) + h) + str.charCodeAt(i);
  return h >>> 0;
}

const usersKey = 'mf_users'; // stores object { email: {name, passHash} }
function readUsers(){ return JSON.parse(localStorage.getItem(usersKey) || '{}'); }
function writeUsers(u){ localStorage.setItem(usersKey, JSON.stringify(u)); }

document.addEventListener('DOMContentLoaded',()=>{
  const loginBox = document.getElementById('loginBox');
  const registerBox = document.getElementById('registerBox');
  document.getElementById('showRegister').onclick = e => { e.preventDefault(); loginBox.classList.add('hidden'); registerBox.classList.remove('hidden'); }
  document.getElementById('showLogin').onclick = e => { e.preventDefault(); registerBox.classList.add('hidden'); loginBox.classList.remove('hidden'); }

  document.getElementById('btnRegister').onclick = () => {
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim().toLowerCase();
    const pass = document.getElementById('regPass').value;
    if(!name || !email || !pass){ alert('Please fill all fields'); return; }
    const users = readUsers();
    if(users[email]){ alert('Account exists. Please login.'); return; }
    users[email] = { name, passHash: simpleHash(pass) };
    writeUsers(users);
    alert('Registered! You can sign in now.');
    document.getElementById('showLogin').click();
  };

  document.getElementById('btnLogin').onclick = () => {
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const pass = document.getElementById('loginPass').value;
    const users = readUsers();
    if(!users[email] || users[email].passHash !== simpleHash(pass)){
      alert('Invalid login.');
      return;
    }
    // set session
    localStorage.setItem('mf_session', JSON.stringify({ email, name: users[email].name }));
    // redirect to dashboard
    location.href = 'dashboard.html';
  };

  // auto-redirect if session exists
  if(localStorage.getItem('mf_session')){
    location.href = 'dashboard.html';
  }
});
