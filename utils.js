// utils.js
function uid(){ return 'id_'+Math.random().toString(36).slice(2,9); }

function currency(v){
  if (isNaN(v)) return '₹0';
  return '₹' + Number(v).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function readSession(){
  const s = localStorage.getItem('mf_session');
  return s ? JSON.parse(s) : null;
}

function requireAuth(){
  const s = readSession();
  if(!s) location.href = 'index.html';
  return s;
}

// transactions are stored per-user: key 'mf_txns_<email>'
function txnsKey(email){ return 'mf_txns_' + email; }
function readTxns(email){ return JSON.parse(localStorage.getItem(txnsKey(email)) || '[]'); }
function writeTxns(email, txns){ localStorage.setItem(txnsKey(email), JSON.stringify(txns)); }

// goals
function goalsKey(email){ return 'mf_goals_' + email; }
function readGoals(email){ return JSON.parse(localStorage.getItem(goalsKey(email)) || '[]'); }
function writeGoals(email, goals){ localStorage.setItem(goalsKey(email), JSON.stringify(goals)); }
