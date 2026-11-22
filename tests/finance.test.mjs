import test from 'node:test';
import assert from 'node:assert/strict';
import { totals, walletBalance, totalBalance, spentBudget, categoryExpenses, budgetRate, budgetAlertLevel, cashFlowForecast, validateAmount } from '../src/lib/finance.ts';

const sample = {
  profile: { name: 'Demo', email: 'demo@example.com', currency: 'IDR', timezone: 'Asia/Jakarta' },
  wallets: [{ id: 'w1', name: 'Tunai', type: 'CASH', initial: 1000000, status: 'ACTIVE' }, { id: 'w2', name: 'Bank', type: 'BANK', initial: 500000, status: 'ACTIVE' }],
  categories: [{id: 'c1', name: 'Gaji', type: 'INCOME', icon: 'briefcase', color: '#008f65', status:'ACTIVE', isDefault:true}, {id: 'c2', name:'Makanan', type: 'EXPENSE', icon:'utensils',color:'#ffaa55',status:'ACTIVE',isDefault:true}],
  transactions: [
    {id:'t1',walletId:'w1',categoryId:'c1',type:'INCOME',amount:800000,description:'Gaji',date:'2026-11-02',createdAt:'2026-11-02T08:00:00Z'},
    {id:'t2',walletId:'w1',categoryId:'c2',type:'EXPENSE',amount:250000,description:'Belanja',date:'2026-11-03',createdAt:'2026-11-03T08:00:00Z'},
    {id:'t3',walletId:'w2',categoryId:'c2',type:'EXPENSE',amount:100000,description:'Makan',date:'2026-10-03',createdAt:'2026-10-03T08:00:00Z'},
  ],
  budgets: [{id:'b1',categoryId:'c2',limit:300000,month:11,year:2026}],goals:[],recurring:[],
};

test('Income, expense and net flow follow transaction type', () => {
  const t = totals(sample.transactions);
  assert.deepEqual(t, {income:800000, expense:350000});
  assert.equal(t.income-t.expense,450000);
});
test('Wallet balance is initial + income - expense', () => {
  assert.equal(walletBalance(sample.wallets[0], sample),1550000);
  assert.equal(walletBalance(sample.wallets[1], sample),400000);
  assert.equal(totalBalance(sample),1950000);
});
test('Budget only counts expense in its month/year and category', () => {
  assert.equal(spentBudget(sample.budgets[0],sample),250000);
  assert.equal(budgetRate(sample.budgets[0],sample),83);
});
test('Expense grouping excludes income and sorts highest first', () => {
  const rows=categoryExpenses(sample,sample.transactions);
  assert.equal(rows.length,1);
  assert.equal(rows[0].name,'Makanan');
  assert.equal(rows[0].value,350000);
});
test('Budget alert changes at warning and over thresholds', () => {
  assert.equal(budgetAlertLevel(sample.budgets[0], sample), 'warning');
  const over = { ...sample, transactions: [...sample.transactions, { id: 't4', walletId: 'w1', categoryId: 'c2', type: 'EXPENSE', amount: 100000, description: 'Lainnya', date: '2026-11-04', createdAt: '2026-11-04T08:00:00Z' }] };
  assert.equal(budgetAlertLevel(over.budgets[0], over), 'over');
});
test('Cash-flow forecast applies upcoming recurring changes', () => {
  const forecast = cashFlowForecast({ ...sample, recurring: [{ id: 'r1', description: 'Gaji', type: 'INCOME', amount: 500000, categoryId: 'c1', walletId: 'w1', frequency: 'MONTHLY', day: 21, status: 'ACTIVE', lastRun: '', nextRun: new Date().toISOString().slice(0, 10) }] }, 2);
  assert.equal(forecast[0].change, 500000);
});
test('Money validation allows integer rupiah only', () => {
  assert.equal(validateAmount(1),true);
  assert.equal(validateAmount(0),false);
  assert.equal(validateAmount(-2),false);
  assert.equal(validateAmount(42.5),false);
  assert.equal(validateAmount(Number.MAX_SAFE_INTEGER+1),false);
});
