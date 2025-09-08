// app.js
document.addEventListener('DOMContentLoaded', startApp);

let lineChart, pieChart;

function startApp(){
  const session = requireAuth();
  const email = session.email;
  document.getElementById('userName').textContent = session.name;

  // dark mode persisted
  const theme = localStorage.getItem('mf_theme') || 'light';
  setTheme(theme);
  document.getElementById('darkToggle').checked = (theme==='dark');
  document.getElementById('darkToggle').addEventListener('change', e=>{
    setTheme(e.target.checked ? 'dark' : 'light');
  });

  // nav
  document.querySelectorAll('.nav-btn').forEach(btn=>{
    btn.addEventListener('click', ()=> {
      document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      showPage(btn.dataset.page);
    });
  });

  // init elements
  document.getElementById('btnLogout').onclick = ()=> {
    localStorage.removeItem('mf_session');
    location.href = 'index.html';
  };

  document.getElementById('btnAddTxn').onclick = () => {
    addTransaction(email);
  };

  document.getElementById('btnClearDummy').onclick = () => {
    addSampleData(email);
    renderAll(email);
  };

  document.getElementById('btnExportCSV').onclick = () => exportCSV(email);
  document.getElementById('importCSV').onchange = (e) => importCSVFile(e, email);

  document.getElementById('btnAddGoal').onclick = () => addGoal(email);

  // render charts and data
  initCharts();
  renderAll(email);
}

// theme helper
function setTheme(t){
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('mf_theme', t);
}

// show page
function showPage(name){
  document.querySelectorAll('.page').forEach(p=>p.classList.add('hidden'));
  document.getElementById('page-'+name).classList.remove('hidden');
}

// add transaction
function addTransaction(email){
  const type = document.getElementById('txnType').value;
  const amount = parseFloat(document.getElementById('txnAmount').value);
  const date = document.getElementById('txnDate').value || new Date().toISOString().slice(0,10);
  const desc = document.getElementById('txnDesc').value.trim();
  const category = document.getElementById('txnCategory').value || 'Other';
  if(!amount || amount <= 0){ alert('Enter a valid amount'); return; }

  const txns = readTxns(email);
  txns.push({ id: uid(), type, amount, date, desc, category });
  writeTxns(email, txns);
  // clear form
  document.getElementById('txnAmount').value = '';
  document.getElementById('txnDesc').value = '';
  renderAll(email);
}

// sample data
function addSampleData(email){
  const t = readTxns(email);
  const now = new Date();
  const sample = [
    {id:uid(), type:'income', amount:40000, date: addDays(now,-40), desc:'Salary', category:'Salary'},
    {id:uid(), type:'expense', amount:4500, date: addDays(now,-30), desc:'Rent', category:'Bills'},
    {id:uid(), type:'expense', amount:600, date: addDays(now,-28), desc:'Lunch', category:'Food'},
    {id:uid(), type:'expense', amount:1200, date: addDays(now,-22), desc:'Movie & travel', category:'Travel'},
    {id:uid(), type:'income', amount:2000, date: addDays(now,-10), desc:'Freelance', category:'Salary'},
    {id:uid(), type:'expense', amount:900, date: addDays(now,-5), desc:'Shopping', category:'Shopping'}
  ];
  writeTxns(email, t.concat(sample));
}
function addDays(d,n){ const x = new Date(d); x.setDate(x.getDate()+n); return x.toISOString().slice(0,10) }

// render everything
function renderAll(email){
  renderStats(email);
  renderTable(email);
  renderGoals(email);
  updateCharts(email);
}

// stats
function renderStats(email){
  const txns = readTxns(email);
  const income = txns.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  const expense = txns.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  const balance = income - expense;
  document.getElementById('totalBalance').textContent = currency(balance);
  document.getElementById('totalIncome').textContent = currency(income);
  document.getElementById('totalExpense').textContent = currency(expense);
}

// table
function renderTable(email){
  const txns = readTxns(email).sort((a,b)=>b.date.localeCompare(a.date));
  const tbody = document.querySelector('#txnTable tbody');
  tbody.innerHTML = '';
  txns.forEach(t=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${t.date}</td>
      <td>${t.type}</td>
      <td>${t.category}</td>
      <td>${escapeHtml(t.desc||'')}</td>
      <td>${currency(t.amount)}</td>
      <td><button class="btn small" data-id="${t.id}">Delete</button></td>`;
    tbody.appendChild(tr);
  });
  tbody.querySelectorAll('button').forEach(b=>{
    b.onclick = () => {
      const id = b.dataset.id;
      const arr = readTxns(email).filter(x=>x.id!==id);
      writeTxns(email, arr);
      renderAll(email);
    };
  });
}

function escapeHtml(s){ return s.replace(/[&<>"]/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' })[c]); }

// goals
function addGoal(email){
  const name = document.getElementById('goalName').value.trim();
  const amount = parseFloat(document.getElementById('goalAmount').value);
  if(!name || !amount){ alert('Enter goal name and amount'); return; }
  const g = readGoals(email);
  g.push({id:uid(), name, target:amount, saved:0});
  writeGoals(email,g);
  document.getElementById('goalName').value=''; document.getElementById('goalAmount').value='';
  renderGoals(email);
}
function renderGoals(email){
  const g = readGoals(email);
  const wrapper = document.getElementById('goalsList');
  wrapper.innerHTML = '';
  g.forEach(goal=>{
    const div = document.createElement('div');
    div.className = 'card';
    div.style.marginBottom = '8px';
    div.innerHTML = `<h4>${escapeHtml(goal.name)} <small class="muted">Target ${currency(goal.target)}</small></h4>
      <div>Saved: ${currency(goal.saved)}</div>
      <div class="form-row" style="margin-top:8px;">
        <input type="number" id="g-${goal.id}-amt" placeholder="Add amount" />
        <button class="btn small" data-id="${goal.id}">Add</button>
        <button class="btn small danger" data-del="${goal.id}">Delete</button>
      </div>`;
    wrapper.appendChild(div);
  });
  wrapper.querySelectorAll('button[data-id]').forEach(btn=>{
    btn.onclick = () => {
      const id = btn.dataset.id;
      const amt = parseFloat(document.getElementById('g-'+id+'-amt').value);
      if(!amt || amt<=0) { alert('Enter valid amount'); return; }
      const goals = readGoals(requireAuth().email).map(g=>{
        if(g.id === id) g.saved = (g.saved||0) + amt;
        return g;
      });
      writeGoals(requireAuth().email, goals);
      renderGoals(requireAuth().email);
    };
  });
  wrapper.querySelectorAll('button[data-del]').forEach(btn=>{
    btn.onclick = () => {
      const id = btn.dataset.del;
      const goals = readGoals(requireAuth().email).filter(g=>g.id!==id);
      writeGoals(requireAuth().email, goals);
      renderGoals(requireAuth().email);
    };
  });
}

// export CSV
function exportCSV(email){
  const txns = readTxns(email);
  if(!txns.length){ alert('No transactions to export'); return; }
  const rows = [['id','date','type','category','description','amount']];
  txns.forEach(t=> rows.push([t.id, t.date, t.type, t.category, t.desc||'', t.amount]));
  const csv = rows.map(r=> r.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'mini-finance-transactions.csv'; a.click();
  URL.revokeObjectURL(url);
}

// import CSV (file input handler)
function importCSVFile(e, email){
  const f = e.target.files[0];
  if(!f) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const txt = ev.target.result;
    try{
      const parsed = parseCsv(txt);
      const header = parsed[0].map(h=>h.toLowerCase());
      const arr = parsed.slice(1).map(row=>{
        const obj = {};
        header.forEach((h,i)=> obj[h] = row[i] || '');
        return {
          id: obj.id || uid(),
          date: obj.date || new Date().toISOString().slice(0,10),
          type: (obj.type || 'expense'),
          category: obj.category || 'Other',
          desc: obj.description || obj.desc || '',
          amount: parseFloat(obj.amount) || 0
        };
      }).filter(r=>r.amount>0);
      const existing = readTxns(email);
      writeTxns(email, existing.concat(arr));
      alert('Imported ' + arr.length + ' transactions');
      renderAll(email);
    }catch(err){
      alert('Import failed: ' + err);
    }
  };
  reader.readAsText(f);
  e.target.value = '';
}

// simple CSV parse
function parseCsv(text){
  // very small parser supporting quotes
  const rows = [];
  let cur = [];
  let i=0; const N=text.length;
  let field = ''; let inQ=false;
  while(i<N){
    const ch = text[i];
    if(inQ){
      if(ch === '"'){
        if(text[i+1] === '"'){ field += '"'; i+=2; continue; }
        inQ=false; i++; continue;
      } else { field += ch; i++; continue; }
    } else {
      if(ch === '"'){ inQ=true; i++; continue; }
      if(ch === ','){ cur.push(field); field=''; i++; continue; }
      if(ch === '\r'){ i++; continue; }
      if(ch === '\n'){ cur.push(field); rows.push(cur); cur=[]; field=''; i++; continue; }
      field += ch; i++;
    }
  }
  if(field || cur.length) { cur.push(field); rows.push(cur); }
  return rows;
}

