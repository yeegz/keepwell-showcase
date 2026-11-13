// Cancels a work order made while rehearsing a tour, so it leaves the demo drawing. Usage: node tools/cancel-wo.cjs <email> <workOrderId>
const API = require('./api.cjs');
(async () => {
  const [email, id] = process.argv.slice(2);
  const a = await API.as(email);
  const d = await a.get('/work-orders/' + id);
  const r = await a.post(`/work-orders/${id}/transitions`, { to: 'cancelled', reason: 'Showcase rehearsal, not a real report', baseVersion: d.version });
  console.log(d.number, '->', r.status);
})();
