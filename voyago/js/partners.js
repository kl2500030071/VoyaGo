const PARTNERS_CONFIG={
  flight:[
    {id:'mmt',name:'MakeMyTrip',color:'#e51b23',url:'https://www.makemytrip.com/',feeModel:'₹149 + 1–5% markup',markupRange:[.01,.05],active:true},
    {id:'goibibo',name:'Goibibo',color:'#ff6b00',url:'https://www.goibibo.com/',feeModel:'₹99 + 1–4% markup',markupRange:[.01,.04],active:true},
    {id:'cleartrip',name:'Cleartrip',color:'#ef3f2f',url:'https://www.cleartrip.com/',feeModel:'₹79 + 2–5% markup',markupRange:[.02,.05],active:true},
    {id:'easemytrip',name:'EaseMyTrip',color:'#f58220',url:'https://www.easemytrip.com/',feeModel:'₹0 + 0–2% markup',markupRange:[0,.02],active:true},
    {id:'ixigo',name:'Ixigo',color:'#f15a29',url:'https://www.ixigo.com/',feeModel:'₹99 + 1–4% markup',markupRange:[.01,.04],active:true},
    {id:'yatra',name:'Yatra',color:'#e31837',url:'https://www.yatra.com/',feeModel:'₹129 + 1–5% markup',markupRange:[.01,.05],active:true},
    {id:'airline',name:'Airline site',color:'#2563eb',url:'https://www.goindigo.in/',feeModel:'₹0 + 0–3% markup',markupRange:[0,.03],active:true}
  ],
  train:[
    {id:'irctc',name:'IRCTC',color:'#0b5cab',url:'https://www.irctc.co.in/',feeModel:'₹20 + 0–1% markup',markupRange:[0,.01],active:true},
    {id:'confirmtkt',name:'ConfirmTkt',color:'#ff7a00',url:'https://www.confirmtkt.com/',feeModel:'₹25 + 1–3% markup',markupRange:[.01,.03],active:true},
    {id:'ixigo-trains',name:'Ixigo Trains',color:'#f15a29',url:'https://www.ixigo.com/',feeModel:'₹20 + 1–3% markup',markupRange:[.01,.03],active:true},
    {id:'mmt-trains',name:'MakeMyTrip Trains',color:'#e51b23',url:'https://www.makemytrip.com/',feeModel:'₹25 + 1–3% markup',markupRange:[.01,.03],active:true}
  ],
  hotel:[
    {id:'booking',name:'Booking.com',color:'#003580',url:'https://www.booking.com/',feeModel:'₹0 + 2–7% markup',markupRange:[.02,.07],active:true},
    {id:'mmt-hotels',name:'MakeMyTrip',color:'#e51b23',url:'https://www.makemytrip.com/',feeModel:'₹99 + 2–6% markup',markupRange:[.02,.06],active:true},
    {id:'goibibo-hotels',name:'Goibibo',color:'#ff6b00',url:'https://www.goibibo.com/',feeModel:'₹79 + 2–6% markup',markupRange:[.02,.06],active:true},
    {id:'agoda',name:'Agoda',color:'#5b2c83',url:'https://www.agoda.com/',feeModel:'₹0 + 3–8% markup',markupRange:[.03,.08],active:true},
    {id:'cleartrip-hotels',name:'Cleartrip',color:'#ef3f2f',url:'https://www.cleartrip.com/',feeModel:'₹79 + 2–6% markup',markupRange:[.02,.06],active:true},
    {id:'oyo',name:'OYO',color:'#e91e63',url:'https://www.oyorooms.com/',feeModel:'₹49 + 1–5% markup',markupRange:[.01,.05],active:true}
  ],
  cab:[
    {id:'uber',name:'Uber',color:'#111111',url:'https://www.uber.com/in/en/',feeModel:'₹25 + 1–5% markup',markupRange:[.01,.05],active:true},
    {id:'ola',name:'Ola',color:'#54b948',url:'https://www.olacabs.com/',feeModel:'₹20 + 1–5% markup',markupRange:[.01,.05],active:true},
    {id:'rapido',name:'Rapido',color:'#f7c600',url:'https://www.rapido.bike/',feeModel:'₹15 + 0–4% markup',markupRange:[0,.04],active:true}
  ]
};
function ensurePartnerStore(){const fallback=JSON.parse(JSON.stringify(PARTNERS_CONFIG)),saved=Store.read(KEYS.partners,null);if(!saved||typeof saved!=='object'||Array.isArray(saved)){Store.write(KEYS.partners,fallback);return fallback}const merged={};Object.keys(fallback).forEach(mode=>{const old=Array.isArray(saved[mode])?saved[mode]:[];merged[mode]=fallback[mode].map(p=>({...p,...(old.find(x=>x.id===p.id)||{})})).concat(old.filter(x=>!fallback[mode].some(p=>p.id===x.id)))});Store.write(KEYS.partners,merged);return merged}
function partnersFor(mode){const all=ensurePartnerStore();return (all[mode]||[]).filter(p=>p.active)}
ensurePartnerStore();
