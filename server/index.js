import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'node:path';
import { InventoryItem, BinRecommendation, SecurityAlert, AuditEvent } from './models.js';

const app = express();
const PORT = Number(process.env.PORT || 5000);
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const memory = {
  inventory: [
    { sku:'WF-1001', name:'Laptop 14" Pro', qty:48, reorderPoint:20, bin:'A1-01', movement:'High', avgDailyDemand:5, leadTimeDays:4, category:'Computers' },
    { sku:'WF-1002', name:'Wireless Keyboard', qty:120, reorderPoint:30, bin:'A1-02', movement:'Medium', avgDailyDemand:6, leadTimeDays:5, category:'Accessories' },
    { sku:'WF-1003', name:'Laptop Mouse', qty:8, reorderPoint:25, bin:'B2-10', movement:'High', avgDailyDemand:2, leadTimeDays:3, category:'Accessories' },
    { sku:'WF-1004', name:'USB-C Dock', qty:62, reorderPoint:20, bin:'B2-11', movement:'Medium', avgDailyDemand:3, leadTimeDays:4, category:'Accessories' },
    { sku:'WF-1005', name:'27" Monitor', qty:36, reorderPoint:15, bin:'A3-04', movement:'Medium', avgDailyDemand:2, leadTimeDays:6, category:'Displays' },
    { sku:'WF-1006', name:'HDMI Cable', qty:200, reorderPoint:50, bin:'C1-01', movement:'High', avgDailyDemand:9, leadTimeDays:3, category:'Accessories' },
    { sku:'WF-1007', name:'Webcam HD', qty:18, reorderPoint:20, bin:'B1-03', movement:'Medium', avgDailyDemand:2, leadTimeDays:4, category:'Accessories' },
    { sku:'WF-1008', name:'Laptop Stand', qty:75, reorderPoint:25, bin:'B1-04', movement:'Low', avgDailyDemand:2, leadTimeDays:5, category:'Accessories' },
    { sku:'WF-1009', name:'External SSD 1TB', qty:22, reorderPoint:20, bin:'C2-07', movement:'High', avgDailyDemand:4, leadTimeDays:3, category:'Storage' },
    { sku:'WF-1010', name:'Noise Cancelling Headphones', qty:5, reorderPoint:15, bin:'C2-08', movement:'High', avgDailyDemand:2, leadTimeDays:5, category:'Audio' },
  ],
  bins: [
    { key:'A102', sku:'A102', name:'Wireless Scanner', from:'D4', to:'A2', picksPerWeek:248, distanceReduction:62, priority:'High', status:'Pending', reason:'High picking frequency and closer to dispatch. Destination bin has verified capacity.' },
    { key:'WF-1003', sku:'WF-1003', name:'Laptop Mouse', from:'B2-10', to:'A1-05', picksPerWeek:193, distanceReduction:38, priority:'Medium', status:'Pending', reason:'Frequently picked with laptop accessories. Nearby bin has open capacity.' },
    { key:'WF-1009', sku:'WF-1009', name:'External SSD 1TB', from:'C2-07', to:'A2-04', picksPerWeek:156, distanceReduction:31, priority:'Medium', status:'Pending', reason:'Move closer to the high-value pick lane and restricted access area.' },
  ],
  alerts: [
    { key:'SEC-2401', type:'Suspicious modification', severity:'High', resource:'SSD-1TB', user:'User X', oldValue:'40 units', newValue:'5 units', time:'2:17 AM', status:'Open', description:'Unusually large quantity change at an uncommon access time.' },
    { key:'SEC-2398', type:'Unusual sign-in time', severity:'Medium', resource:'User X', user:'User X', oldValue:'Typical: 8 AM–7 PM', newValue:'Sign-in: 1:12 AM', time:'1:12 AM', status:'Review', description:'Successful sign-in outside the user’s usual activity window.' },
    { key:'INV-1182', type:'Stock below threshold', severity:'Low', resource:'WF-1003', user:'System', oldValue:'25 units', newValue:'8 units', time:'8:56 AM', status:'Open', description:'Available quantity is below the configured reorder point.' },
  ],
  audit: [
    { actor:'User X', resource:'SSD-1TB', action:'Quantity changed', before:'40 units', after:'5 units', source:'Flagged', createdAt:'Apr 24, 2:17 AM' },
    { actor:'Ashik K', resource:'WF-0048', action:'Cycle count', before:'36 units', after:'48 units', source:'User', createdAt:'Apr 24, 9:17 AM' },
    { actor:'Ashik K', resource:'SKU A102', action:'Bin move approved', before:'D4', after:'A2', source:'Recommendation', createdAt:'Apr 23, 4:21 PM' },
  ],
};
let mongoReady = false;

function stockRisk(item) {
  const days = Math.max(1, Math.ceil(item.qty / Math.max(item.avgDailyDemand || 1, 1)));
  const reorderQty = Math.max(item.reorderPoint * 2, item.qty);
  return { riskDays: days, reorderQty, risk: days <= item.leadTimeDays ? 'High' : days <= item.leadTimeDays + 3 ? 'Medium' : 'Low', method: 'demo-rule-based' };
}
function toPlain(doc) { return doc?.toObject ? doc.toObject() : doc; }
async function getItems() { return mongoReady ? (await InventoryItem.find().sort({ sku:1 })).map(toPlain) : memory.inventory; }
async function getBins() { return mongoReady ? (await BinRecommendation.find().sort({ priority:1 })).map(toPlain) : memory.bins; }
async function getAlerts() { return mongoReady ? (await SecurityAlert.find().sort({ createdAt:-1 })).map(toPlain) : memory.alerts; }
async function addAudit(entry) {
  const row = { ...entry, createdAt: new Date() };
  if (mongoReady) await AuditEvent.create(row);
  else memory.audit.unshift({ ...entry, createdAt: new Date().toLocaleString() });
  return row;
}

async function seedMongo() {
  if (await InventoryItem.countDocuments() === 0) await InventoryItem.insertMany(memory.inventory);
  if (await BinRecommendation.countDocuments() === 0) await BinRecommendation.insertMany(memory.bins);
  if (await SecurityAlert.countDocuments() === 0) await SecurityAlert.insertMany(memory.alerts);
  if (await AuditEvent.countDocuments() === 0) await AuditEvent.insertMany(memory.audit.map(x => ({ ...x, createdAt:new Date() })));
}

app.get('/api/health', (_req,res) => res.json({ status:'ok', store:mongoReady?'mongodb':'memory', message:mongoReady?'MongoDB connected':'Seeded demo data is active' }));
app.get('/api/dashboard', async (_req,res,next) => {
  try {
    const [items,alerts,bins] = await Promise.all([getItems(),getAlerts(),getBins()]);
    const low = items.filter(x => x.qty <= x.reorderPoint);
    res.json({ totalSkus:1254, totalUnits:items.reduce((n,x)=>n+x.qty,0), lowStock:low.length, outOfStock:items.filter(x=>x.qty===0).length, binUtilization:78, openAlerts:alerts.filter(x=>x.status!=='Reviewed').length, pendingMoves:bins.filter(x=>x.status==='Pending').length, lowStockItems:low.map(x=>({ ...x, ...stockRisk(x) })) });
  } catch(e) { next(e); }
});
app.get('/api/inventory', async (req,res,next) => {
  try {
    let items=await getItems();
    const q=String(req.query.search||'').toLowerCase();
    const status=String(req.query.status||'all').toLowerCase();
    if(q) items=items.filter(x=>`${x.sku} ${x.name} ${x.bin}`.toLowerCase().includes(q));
    if(status==='low') items=items.filter(x=>x.qty<=x.reorderPoint);
    if(status==='in-stock') items=items.filter(x=>x.qty>x.reorderPoint);
    res.json(items.map(x=>({ ...x, ...stockRisk(x), status:x.qty<=x.reorderPoint?'Low stock':'In stock' })));
  } catch(e) { next(e); }
});
app.post('/api/inventory/adjust', async (req,res,next) => {
  try {
    const { sku, qty, reason='Manual stock adjustment' }=req.body;
    const nextQty=Number(qty);
    if(!sku || !Number.isInteger(nextQty) || nextQty<0) return res.status(400).json({ error:'Enter a SKU and a non-negative whole quantity.' });
    let item;
    if(mongoReady) { item=await InventoryItem.findOne({sku}); if(item){const before=item.qty;item.qty=nextQty;item.updatedAt=new Date();await item.save();await addAudit({actor:'Ashik K',resource:sku,action:reason,before:`${before} units`,after:`${nextQty} units`,source:'User'});item=item.toObject();} }
    else { item=memory.inventory.find(x=>x.sku.toLowerCase()===String(sku).toLowerCase()); if(item){const before=item.qty;item.qty=nextQty;await addAudit({actor:'Ashik K',resource:sku,action:reason,before:`${before} units`,after:`${nextQty} units`,source:'User'});} }
    if(!item) return res.status(404).json({error:'SKU not found.'});
    res.json({ ...item, ...stockRisk(item), status:item.qty<=item.reorderPoint?'Low stock':'In stock' });
  } catch(e) { next(e); }
});
app.get('/api/bins/recommendations', async (_req,res,next) => { try { res.json(await getBins()); } catch(e) { next(e); } });
app.post('/api/bins/recommendations/:id/approve', async (req,res,next) => {
  try {
    const key=req.params.id;let item;
    if(mongoReady){item=await BinRecommendation.findOneAndUpdate({key},{status:'Approved',approvedBy:'Ashik K',approvedAt:new Date()},{new:true});}
    else {item=memory.bins.find(x=>x.key===key);if(item){item.status='Approved';item.approvedBy='Ashik K';item.approvedAt=new Date().toISOString();}}
    if(!item)return res.status(404).json({error:'Recommendation not found.'});
    await addAudit({actor:'Ashik K',resource:item.sku,action:'Bin move approved',before:item.from,after:item.to,source:'Recommendation'});
    res.json(item);
  } catch(e) { next(e); }
});
app.get('/api/security/alerts', async (_req,res,next) => { try { res.json(await getAlerts()); } catch(e) { next(e); } });
app.post('/api/security/alerts/:id/review', async (req,res,next) => {
  try {
    const key=req.params.id;let item;let previousStatus='Open';
    if(mongoReady){const current=await SecurityAlert.findOne({key});previousStatus=current?.status||'Open';item=await SecurityAlert.findOneAndUpdate({key},{status:'Reviewed',reviewedBy:'Ashik K',reviewedAt:new Date()},{new:true});}
    else {item=memory.alerts.find(x=>x.key===key);if(item){previousStatus=item.status;item.status='Reviewed';}}
    if(!item)return res.status(404).json({error:'Alert not found.'});
    await addAudit({actor:'Ashik K',resource:item.resource,action:'Security alert reviewed',before:previousStatus,after:'Reviewed',source:'User'});
    res.json(item);
  } catch(e) { next(e); }
});
app.post('/api/reorders', async (req,res,next) => {
  try {
    const {sku,quantity}=req.body;const item=(await getItems()).find(x=>x.sku===sku);
    if(!item)return res.status(404).json({error:'SKU not found.'});
    const qty=Number(quantity)||stockRisk(item).reorderQty;
    await addAudit({actor:'Ashik K',resource:sku,action:'Reorder request created',before:`${item.qty} units`,after:`Request ${qty} units`,source:'Assistant'});
    res.status(201).json({status:'Queued for review',sku,quantity:qty,createdAt:new Date().toISOString()});
  } catch(e) { next(e); }
});
app.get('/api/audit', async (_req,res,next) => {
  try { const rows=mongoReady?(await AuditEvent.find().sort({createdAt:-1}).limit(100)).map(toPlain):memory.audit;res.json(rows); } catch(e) { next(e); }
});
app.get('/api/reports', async (_req,res,next) => {
  try { const [items,bins,alerts]=await Promise.all([getItems(),getBins(),getAlerts()]);res.json({unitsOnHand:18420,lowStock:items.filter(x=>x.qty<=x.reorderPoint).length,pendingMoves:bins.filter(x=>x.status==='Pending').length,openAlerts:alerts.filter(x=>x.status!=='Reviewed').length,binUtilization:78,pickAccuracy:98.2,weeklyMovement:[58,68,51,79,63,88,72,93,64,80,60,76]}); } catch(e) { next(e); }
});
if(process.env.NODE_ENV==='production'){
  const clientDir=path.resolve('dist');
  app.use(express.static(clientDir));
  app.use((req,res,next)=>{
    if(req.method==='GET'&&!req.path.startsWith('/api')) return res.sendFile(path.join(clientDir,'index.html'));
    next();
  });
}
app.use((err,_req,res,_next)=>{console.error(err);res.status(500).json({error:'The server could not complete this request.'});});

if(process.env.MONGODB_URI){
  mongoose.connect(process.env.MONGODB_URI,{serverSelectionTimeoutMS:5000}).then(seedMongo).then(()=>{mongoReady=true;console.log('MongoDB connected.');}).catch(err=>console.warn(`MongoDB unavailable; using seeded in-memory data. ${err.message}`));
} else console.log('MONGODB_URI not set; using seeded in-memory demo data.');
app.listen(PORT,()=>console.log(`WareFlow API listening on http://localhost:${PORT}`));
