// charts.js
function initCharts(){
  const lc = document.getElementById('lineChart').getContext('2d');
  const pc = document.getElementById('pieChart').getContext('2d');

  lineChart = new Chart(lc, {
    type: 'line',
    data: { labels: [], datasets: [
      { label: 'Income', data: [], fill: false, tension:0.3 },
      { label: 'Expense', data: [], fill:false, tension:0.3 }
    ]},
    options: { responsive:true, plugins:{legend:{position:'top'}} , scales:{ y:{ beginAtZero:true }}}
  });

  pieChart = new Chart(pc, {
    type: 'pie',
    data: { labels: [], datasets: [{ data: [], label: 'Categories' }]},
    options: { responsive:true, plugins:{legend:{position:'right'}} }
  });
}

function updateCharts(email){
  const txns = readTxns(email);
  // monthly trend: last 6 months
  const months = getLastMonths(6);
  const incomeData = months.map(m=> totalForMonth(txns, m, 'income'));
  const expenseData = months.map(m=> totalForMonth(txns, m, 'expense'));
  lineChart.data.labels = months.map(m=> m.label);
  lineChart.data.datasets[0].data = incomeData;
  lineChart.data.datasets[1].data = expenseData;
  lineChart.update();

  // category distribution for last 90 days
  const recent = txns.filter(t=> new Date(t.date) >= subtractDays(new Date(), 90));
  const categories = [...new Set(recent.map(t=>t.category))];
  const sums = categories.map(c => recent.filter(t=>t.category===c).reduce((s,t)=>s+t.amount,0));
  pieChart.data.labels = categories;
  pieChart.data.datasets[0].data = sums;
  pieChart.update();
}

function getLastMonths(n){
  const out = [];
  const now = new Date();
  for(let i=n-1;i>=0;i--){
    const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
    const label = d.toLocaleString('default', { month:'short', year:'2-digit' });
    out.push({ date: d, key: `${d.getFullYear()}-${('0'+(d.getMonth()+1)).slice(-2)}`, label });
  }
  return out;
}

function totalForMonth(txns, monthObj, type){
  const key = monthObj.key; // YYYY-MM
  return txns.filter(t=> t.type===type && t.date.startsWith(key)).reduce((s,t)=>s+t.amount,0);
}

function subtractDays(d,n){ const x=new Date(d); x.setDate(x.getDate()-n); return x; }
