export async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`);
  return body;
}

export const demo = {
  health: { store:'memory', message:'Seeded demo data is active' },
  dashboard: {
    totalSkus: 1254, totalUnits: 18420, lowStock: 3, outOfStock: 0,
    binUtilization: 78, openAlerts: 3, pendingMoves: 3,
    lowStockItems: [
      {sku:'WF-1003',name:'Laptop Mouse',qty:8,reorderPoint:25,bin:'B2-10',movement:'High',riskDays:4,reorderQty:50,risk:'High'},
      {sku:'WF-1007',name:'Webcam HD',qty:18,reorderPoint:20,bin:'B1-03',movement:'Medium',riskDays:9,reorderQty:22,risk:'Medium'},
      {sku:'WF-1010',name:'Noise Cancelling Headphones',qty:5,reorderPoint:15,bin:'C2-08',movement:'High',riskDays:3,reorderQty:25,risk:'High'},
    ],
  },
  inventory: [
    {sku:'WF-1001',name:'Laptop 14" Pro',qty:48,reorderPoint:20,bin:'A1-01',movement:'High',status:'In stock',riskDays:10,reorderQty:40},
    {sku:'WF-1002',name:'Wireless Keyboard',qty:120,reorderPoint:30,bin:'A1-02',movement:'Medium',status:'In stock',riskDays:20,reorderQty:60},
    {sku:'WF-1003',name:'Laptop Mouse',qty:8,reorderPoint:25,bin:'B2-10',movement:'High',status:'Low stock',riskDays:4,reorderQty:50},
    {sku:'WF-1004',name:'USB-C Dock',qty:62,reorderPoint:20,bin:'B2-11',movement:'Medium',status:'In stock',riskDays:20,reorderQty:40},
    {sku:'WF-1005',name:'27" Monitor',qty:36,reorderPoint:15,bin:'A3-04',movement:'Medium',status:'In stock',riskDays:18,reorderQty:30},
    {sku:'WF-1006',name:'HDMI Cable',qty:200,reorderPoint:50,bin:'C1-01',movement:'High',status:'In stock',riskDays:23,reorderQty:100},
    {sku:'WF-1007',name:'Webcam HD',qty:18,reorderPoint:20,bin:'B1-03',movement:'Medium',status:'Low stock',riskDays:9,reorderQty:22},
    {sku:'WF-1008',name:'Laptop Stand',qty:75,reorderPoint:25,bin:'B1-04',movement:'Low',status:'In stock',riskDays:38,reorderQty:50},
    {sku:'WF-1009',name:'External SSD 1TB',qty:22,reorderPoint:20,bin:'C2-07',movement:'High',status:'In stock',riskDays:6,reorderQty:40},
    {sku:'WF-1010',name:'Noise Cancelling Headphones',qty:5,reorderPoint:15,bin:'C2-08',movement:'High',status:'Low stock',riskDays:3,reorderQty:25},
  ],
  bins: [
    {key:'A102',sku:'A102',name:'Wireless Scanner',from:'D4',to:'A2',picksPerWeek:248,distanceReduction:62,priority:'High',status:'Pending',reason:'High picking frequency and closer to dispatch. Destination bin has verified capacity.'},
    {key:'WF-1003',sku:'WF-1003',name:'Laptop Mouse',from:'B2-10',to:'A1-05',picksPerWeek:193,distanceReduction:38,priority:'Medium',status:'Pending',reason:'Frequently picked with laptop accessories. Nearby bin has open capacity.'},
  ],
  alerts: [
    {key:'SEC-2401',type:'Suspicious modification',severity:'High',resource:'SSD-1TB',user:'User X',oldValue:'40 units',newValue:'5 units',time:'2:17 AM',status:'Open',description:'Large quantity change detected at an unusual access time.'},
    {key:'SEC-2398',type:'Unusual sign-in time',severity:'Medium',resource:'User X',user:'User X',oldValue:'Typical: 8 AM–7 PM',newValue:'Sign-in: 1:12 AM',time:'1:12 AM',status:'Review',description:'Sign-in occurred outside the user’s usual activity window.'},
    {key:'INV-1182',type:'Stock below threshold',severity:'Low',resource:'WF-1003',user:'System',oldValue:'25 units',newValue:'8 units',time:'8:56 AM',status:'Open',description:'Available quantity is below its reorder point.'},
  ],
  reports: {unitsOnHand:18420,lowStock:3,pendingMoves:3,openAlerts:3,binUtilization:78,pickAccuracy:98.2,weeklyMovement:[58,68,51,79,63,88,72,93,64,80,60,76]},
  audit: [
    {actor:'User X',resource:'SSD-1TB',action:'Quantity changed',before:'40 units',after:'5 units',source:'Flagged',createdAt:'Apr 24, 2:17 AM'},
    {actor:'Ashik K',resource:'WF-0048',action:'Cycle count',before:'36 units',after:'48 units',source:'User',createdAt:'Apr 24, 9:17 AM'},
    {actor:'Ashik K',resource:'SKU A102',action:'Bin move approved',before:'D4',after:'A2',source:'Recommendation',createdAt:'Apr 23, 4:21 PM'},
  ],
};
