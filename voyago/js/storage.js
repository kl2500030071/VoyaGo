const KEYS=Object.freeze({
  users:'voyago_users',
  session:'voyago_session',
  bookings:'voyago_bookings',
  trips:'voyago_trips',
  inventory:'voyago_inventory',
  alerts:'voyago_alerts',
  wishlist:'voyago_wishlist',
  settings:'voyago_settings',
  selected:'voyago_selected',
  redirects:'voyago_redirects',
  searches:'voyago_searches',
  priceAlerts:'voyago_price_alerts',
  partners:'voyago_partners',
  seedVersion:'voyago_seed_version'
});

const Store={
  read(key,fallback=[]){
    try{
      const raw=localStorage.getItem(key);
      return raw===null?fallback:JSON.parse(raw);
    }catch{return fallback}
  },
  write(key,value){
    localStorage.setItem(key,JSON.stringify(value));
    return value;
  },
  patch(key,fn,fallback=[]){
    const value=fn(this.read(key,fallback));
    return this.write(key,value);
  },
  remove(key){localStorage.removeItem(key)},
  keys:KEYS
};

function uid(prefix='VG'){
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
}
function formatINR(n){
  return new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(Number(n)||0);
}
function nowISO(){return new Date().toISOString()}

const VOYAGO_SEED_VERSION=7;

const VOYAGO_CITIES=Object.freeze([
  {name:'Delhi',code:'DEL',rail:true,airport:true},
  {name:'Mumbai',code:'BOM',rail:true,airport:true},
  {name:'Bengaluru',code:'BLR',rail:true,airport:true},
  {name:'Hyderabad',code:'HYD',rail:true,airport:true},
  {name:'Chennai',code:'MAA',rail:true,airport:true},
  {name:'Kolkata',code:'CCU',rail:true,airport:true,label:'Kolkata (Howrah Jn)'},
  {name:'Goa',code:'GOI',rail:true,airport:true},
  {name:'Vijayawada',code:'VGA',rail:true,airport:true},
  {name:'Ahmedabad',code:'AMD',rail:true,airport:true},
  {name:'Jaipur',code:'JAI',rail:true,airport:true},
  {name:'Kochi',code:'COK',rail:true,airport:true},
  {name:'Manali',code:'HIM',rail:false,airport:false},
  {name:'Dubai',code:'DXB',rail:false,airport:false},
  {name:'Singapore',code:'SIN',rail:false,airport:false},
  {name:'Bangkok',code:'BKK',rail:false,airport:false},
  {name:'Colombo',code:'CMB',rail:false,airport:false},
  {name:'Paris',code:'CDG',rail:false,airport:false},
  {name:'London',code:'LHR',rail:false,airport:false},
  {name:'Tokyo',code:'NRT',rail:false,airport:false},
  {name:'Bali',code:'DPS',rail:false,airport:false}
]);

const AIRPORT_COORDS=Object.freeze({
  Delhi:[28.5562,77.1000],
  Mumbai:[19.0896,72.8656],
  Bengaluru:[13.1986,77.7066],
  Hyderabad:[17.2403,78.4294],
  Chennai:[12.9900,80.1693],
  Kolkata:[22.6547,88.4467],
  Goa:[15.3808,73.8314],
  Vijayawada:[16.5304,80.7968],
  Ahmedabad:[23.0772,72.6347],
  Jaipur:[26.8242,75.8122],
  Kochi:[10.1520,76.4019],
  Dubai:[25.2532,55.3657],
  Singapore:[1.3644,103.9915],
  Bangkok:[13.6900,100.7501],
  Colombo:[7.1808,79.8841],
  Paris:[49.0097,2.5479],
  London:[51.4700,-0.4543],
  Tokyo:[35.5494,139.7798],
  Bali:[-8.7482,115.1670]
});

function haversineKm(a,b){
  const A=AIRPORT_COORDS[a],B=AIRPORT_COORDS[b];
  if(!A||!B)return 500;
  const rad=Math.PI/180;
  const dLat=(B[0]-A[0])*rad,dLon=(B[1]-A[1])*rad;
  const x=Math.sin(dLat/2)**2+Math.cos(A[0]*rad)*Math.cos(B[0]*rad)*Math.sin(dLon/2)**2;
  return Math.round(6371*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x)));
}

function safeSlug(s){
  return String(s).replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').toUpperCase();
}

function addMinutesToClock(clock,minutes){
  const [h,m]=String(clock).split(':').map(Number);
  const total=((h*60+m+minutes)%1440+1440)%1440;
  return `${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`;
}

function flightDurationMinutes(from,to){
  const km=haversineKm(from,to);
  return Math.max(55,Math.round((km/780)*60+35));
}

const AIRLINES=Object.freeze([
  {name:'IndiGo',code:'6E',start:200,digits:3,base:5800},
  {name:'Air India',code:'AI',start:900,digits:3,base:6100},
  {name:'Akasa Air',code:'QP',start:1200,digits:4,base:5400},
  {name:'SpiceJet',code:'SG',start:8100,digits:4,base:5200}
]);

const INTERNATIONAL_PRICES=Object.freeze({
  Dubai:18500,
  Singapore:23500,
  Bangkok:19000,
  Colombo:15500,
  Paris:46000,
  London:46000,
  Tokyo:47000,
  Bali:25500
});

const DOMESTIC_HOTEL_NAMES=Object.freeze({
  Delhi:['Taj Palace, New Delhi','ITC Maurya','Le Méridien New Delhi','Lemon Tree Premier Delhi'],
  Mumbai:['Taj Mahal Palace','ITC Maratha','The Westin Mumbai Powai Lake','Lemon Tree Premier Mumbai'],
  Bengaluru:['ITC Gardenia','JW Marriott Hotel Bengaluru','Lemon Tree Premier Bengaluru','The Oberoi Bengaluru'],
  Hyderabad:['Taj Falaknuma Palace','ITC Kakatiya','Novotel Hyderabad Airport','Lemon Tree Premier Hyderabad'],
  Chennai:['Taj Coromandel','ITC Grand Chola','Lemon Tree Hotel Chennai','The Residency Towers'],
  Kolkata:['ITC Royal Bengal','Taj Bengal','The Oberoi Grand Kolkata','Lemon Tree Premier Kolkata'],
  Goa:['Taj Resort & Convention Centre Goa','ITC Grand Goa Resort','Lemon Tree Hotel Candolim','Marriott Resort Goa'],
  Vijayawada:['Novotel Vijayawada Varun','Lemon Tree Premier Vijayawada','The Gateway Hotel MG Road','Hotel Minerva Grand Vijayawada'],
  Ahmedabad:['Hyatt Regency Ahmedabad','Courtyard by Marriott Ahmedabad','Lemon Tree Hotel Ahmedabad','ITC Narmada'],
  Jaipur:['ITC Rajputana','Jaipur Marriott Hotel','Lemon Tree Premier Jaipur','Holiday Inn Jaipur City Centre'],
  Kochi:['Grand Hyatt Kochi Bolgatty','Taj Malabar Resort & Spa','Courtyard by Marriott Kochi Airport','Lemon Tree Hotel Kochi'],
  Manali:['The Himalayan, Manali','Snow Valley Resorts','Holiday Heights Manali','Apple Country Resort'],
  Dubai:['JW Marriott Marquis Hotel Dubai','Taj Jumeirah Lakes Towers','Marriott Resort Palm Jumeirah','Rove Downtown Dubai'],
  Singapore:['Marina Bay Sands','JW Marriott Hotel Singapore South Beach','Holiday Inn Express Singapore Clarke Quay','PARKROYAL on Pickering'],
  Bangkok:['Marriott Marquis Queen’s Park','Holiday Inn Bangkok','Novotel Bangkok Platinum','Amari Watergate Bangkok'],
  Colombo:['Taj Samudra Colombo','Shangri-La Colombo','Cinnamon Grand Colombo','Hilton Colombo'],
  Paris:['Paris Marriott Opera Ambassador Hotel','Novotel Paris Centre Tour Eiffel','Pullman Paris Tour Eiffel','Citadines Les Halles Paris'],
  London:['London Marriott Hotel County Hall','The Savoy London','Novotel London West','Holiday Inn London - Kensington High St.'],
  Tokyo:['Marriott Hotel Tokyo','Hotel New Otani Tokyo','The Prince Gallery Tokyo Kioicho','Hotel Metropolitan Tokyo'],
  Bali:['Courtyard by Marriott Bali Seminyak Resort','The Westin Resort Nusa Dua','Four Points by Sheraton Bali Ungasan','Holiday Inn Resort Bali Nusa Dua']
});

const HOTEL_BASE=Object.freeze({
  Delhi:6500,Mumbai:7200,Bengaluru:5600,Hyderabad:5200,Chennai:5000,Kolkata:4800,
  Goa:7600,Vijayawada:3900,Ahmedabad:4500,Jaipur:4300,Kochi:6200,Manali:5900,
  Dubai:12500,Singapore:14500,Bangkok:7200,Colombo:6500,Paris:14500,London:14000,
  Tokyo:14500,Bali:11000
});

const TRAIN_CATALOG=Object.freeze([
  {name:'Mumbai Rajdhani',number:'12951'},
  {name:'Howrah Rajdhani',number:'12301'},
  {name:'Karnataka Express',number:'12627'},
  {name:'Telangana Express',number:'12723'},
  {name:'Mumbai Central–Ahmedabad Shatabdi',number:'12009'},
  {name:'Tamil Nadu Express',number:'12621'}
]);

const BASE_TRAIN_DEPARTS=['05:40','06:25','07:10','16:50','17:30','21:15'];

const CAB_TEMPLATES=Object.freeze([
  {kind:'Mini',brand:'Ola',offset:0},
  {kind:'Sedan',brand:'Uber',offset:1},
  {kind:'SUV',brand:'Rapido',offset:2},
  {kind:'Premium',brand:'BluSmart',offset:3}
]);

function buildFlightRecord(from,to,routeIndex,slot){
  const airline=AIRLINES[(routeIndex+slot)%AIRLINES.length];
  const domesticCities=VOYAGO_CITIES.filter(c=>c.airport&&!['Dubai','Singapore','Bangkok','Colombo','Paris','London','Tokyo','Bali'].includes(c.name)).map(c=>c.name);
  const domestic=domesticCities.includes(from)&&domesticCities.includes(to);
  const international=INTERNATIONAL_PRICES[to]??INTERNATIONAL_PRICES[from];
  const km=haversineKm(from,to);
  const duration=flightDurationMinutes(from,to);
  const specialManali=from==='Manali'||to==='Manali';
  const base=domestic
    ? Math.round((airline.base+Math.max(0,km-500)*1.25+(routeIndex%5)*180)/50)*50
    : specialManali
      ? Math.round((8500+(routeIndex%4)*350+slot*450)/100)*100
      : Math.round((international+(routeIndex%4)*900+slot*650)/100)*100;
  const start=slot===0?(5*60+35+(routeIndex%8)*55):(13*60+20+(routeIndex%8)*50);
  const depart=addMinutesToClock('00:00',start);
  const arrive=addMinutesToClock(depart,duration);
  const code=String(airline.start+routeIndex*2+slot).padStart(airline.digits,'0');
  return {
    id:`GEN-F-${safeSlug(from)}-${safeSlug(to)}-${slot+1}`,
    type:'flight',
    from,to,
    airline:airline.name,
    flightNo:`${airline.code} ${code}`,
    depart,arrive,
    duration:`${Math.floor(duration/60)}h ${duration%60}m`,
    durationMinutes:duration,
    stops:0,
    price:base,
    rating:Number((4.1+((routeIndex+slot)%8)*.08).toFixed(1)),
    seats:9+((routeIndex+slot)%15),
    travelDate:null,
    distanceKm:km
  };
}

function requiredFlightRoutes(){
  const indian=VOYAGO_CITIES.filter(c=>c.airport&&['Delhi','Mumbai','Bengaluru','Hyderabad','Chennai','Kolkata','Goa','Vijayawada','Ahmedabad','Jaipur','Kochi'].includes(c.name)).map(c=>c.name);
  const routes=[];
  for(const from of indian)for(const to of indian)if(from!==to)routes.push([from,to]);
  const intlHubs={
    Dubai:['Delhi','Mumbai','Hyderabad'],
    Singapore:['Delhi','Mumbai','Bengaluru','Chennai'],
    Bangkok:['Delhi','Mumbai','Bengaluru','Hyderabad'],
    Colombo:['Chennai','Delhi','Mumbai'],
    Paris:['Delhi','Mumbai'],
    London:['Delhi','Mumbai'],
    Tokyo:['Delhi','Mumbai'],
    Bali:['Delhi','Mumbai','Bengaluru']
  };
  Object.entries(intlHubs).forEach(([to,hubs])=>hubs.forEach(from=>{routes.push([from,to]);routes.push([to,from])}));
  routes.push(['Delhi','Manali'],['Manali','Delhi']);
  return routes;
}

function generatedFlights(){
  const out=[],routes=requiredFlightRoutes();
  routes.forEach(([from,to],i)=>{
    out.push(buildFlightRecord(from,to,i*2,0));
    out.push(buildFlightRecord(from,to,i*2,1));
  });
  return out;
}

function generatedHotels(){
  const out=[];
  VOYAGO_CITIES.forEach((city,ci)=>{
    const names=DOMESTIC_HOTEL_NAMES[city.name]||[
      `Taj ${city.name}`,`Marriott ${city.name}`,`Lemon Tree ${city.name}`,`Treebo ${city.name} Central`
    ];
    names.slice(0,4).forEach((name,j)=>{
      out.push({
        id:`GEN-H-${safeSlug(city.name)}-${j+1}`,
        type:'hotel',
        city:city.name,
        name,
        rating:Number((4.2+j*.15).toFixed(1)),
        amenities:['Wi‑Fi','Breakfast',j===1?'Pool':'Parking','AC',j>=2?'Gym':'Restaurant'],
        price:(HOTEL_BASE[city.name]||6000)+j*750,
        rooms:5+j
      });
    });
  });
  return out;
}

function generatedCabs(){
  const out=[];
  VOYAGO_CITIES.forEach((city,ci)=>{
    CAB_TEMPLATES.forEach((t,j)=>{
      const base=city.name==='Dubai'?850:city.name==='Singapore'?780:['Paris','London','Tokyo'].includes(city.name)?1050:360+ci*14;
      out.push({
        id:`GEN-C-${safeSlug(city.name)}-${safeSlug(t.kind)}`,
        type:'cab',
        city:city.name,
        brand:t.brand,
        kind:t.kind,
        eta:5+j*3,
        price:Math.round(base+j*115),
        rating:Number((4.1+j*.15).toFixed(1))
      });
    });
  });
  return out;
}

function trainDurationMinutes(from,to,index){
  const km=haversineKm(from,to);
  const base=Math.round((km/58)*60)+index*12;
  return Math.max(210,Math.min(1800,base));
}

function generatedTrains(){
  const railCities=VOYAGO_CITIES.filter(c=>c.rail).map(c=>c.name);
  const out=[];
  let i=0;
  for(const from of railCities)for(const to of railCities)if(from!==to){
    const catalog=TRAIN_CATALOG[i%TRAIN_CATALOG.length];
    const durationMinutes=trainDurationMinutes(from,to,i%5);
    const depart=BASE_TRAIN_DEPARTS[i%BASE_TRAIN_DEPARTS.length];
    const arrive=addMinutesToClock(depart,durationMinutes);
    const km=haversineKm(from,to);
    const sl=Math.max(250,Math.round(km*.55));
    const fares={
      SL:sl,
      '3A':Math.round(sl*1.82),
      '2A':Math.round(sl*2.45),
      '1A':Math.round(sl*3.05)
    };
    out.push({
      id:`GEN-T-${safeSlug(from)}-${safeSlug(to)}`,
      type:'train',
      from,to,
      name:catalog.name,
      trainNo:catalog.number,
      depart,arrive,
      duration:`${Math.floor(durationMinutes/60)}h ${durationMinutes%60}m`,
      durationMinutes,
      approximate:true,
      timingLabel:'approximate',
      serviceNote:'Approximate demo timing; verify on the partner site.',
      fares,
      price:fares.SL
    });
    i++;
  }
  return out;
}

function generatedInventory(){
  return {
    flights:generatedFlights(),
    hotels:generatedHotels(),
    cabs:generatedCabs(),
    trains:generatedTrains()
  };
}

function normalizeLegacyTrain(t){
  if(!t||typeof t!=='object')return t;
  const out={...t};
  if(out.from==='Howrah')out.from='Kolkata';
  if(out.to==='Howrah')out.to='Kolkata';
  return out;
}

function mergeMissingById(existing,generated){
  const list=Array.isArray(existing)?existing.slice():[];
  const ids=new Set(list.map(x=>x?.id).filter(Boolean));
  generated.forEach(item=>{
    if(!ids.has(item.id)){
      list.push({...item});
      ids.add(item.id);
    }
  });
  return list;
}

function ensureCoverage(existing,generated){
  const current={
    flights:Array.isArray(existing?.flights)?existing.flights.slice():[],
    hotels:Array.isArray(existing?.hotels)?existing.hotels.slice():[],
    cabs:Array.isArray(existing?.cabs)?existing.cabs.slice():[],
    trains:Array.isArray(existing?.trains)?existing.trains.map(normalizeLegacyTrain):[]
  };

  // Add only missing generated records. Existing records, including admin edits, remain unchanged.
  current.flights=mergeMissingById(current.flights,generated.flights);
  current.hotels=mergeMissingById(current.hotels,generated.hotels);
  current.cabs=mergeMissingById(current.cabs,generated.cabs);
  current.trains=mergeMissingById(current.trains,generated.trains);

  return current;
}

function rawState(key){
  try{
    const raw=localStorage.getItem(key);
    return raw===null
      ?{exists:false,valid:false,value:null}
      :{exists:true,valid:true,value:JSON.parse(raw)};
  }catch{return {exists:true,valid:false,value:null}}
}

function seedData(){
  const ADMIN_HASH='e86f78a8a3caf0b60d8e74e5942aa6d86dc150cd3c03338aef25b7d2d7e3acc7';
  const admin={id:'U-ADMIN',name:'VoyaGo Admin',email:'admin@voyago.com',passwordHash:ADMIN_HASH,role:'admin',blocked:false,createdAt:nowISO()};
  const generated=generatedInventory();
  const invState=rawState(KEYS.inventory);
  const currentVersion=Number(Store.read(KEYS.seedVersion,0))||0;
  const baseInventoryValid=invState.valid&&invState.value&&typeof invState.value==='object'&&!Array.isArray(invState.value)
    &&Array.isArray(invState.value.flights)&&Array.isArray(invState.value.hotels)&&Array.isArray(invState.value.cabs);
  const inventoryNeedsSeed=!invState.exists||!invState.valid||!baseInventoryValid;
  const needsMigration=inventoryNeedsSeed||currentVersion<VOYAGO_SEED_VERSION;

  if(needsMigration){
    const merged=ensureCoverage(invState.valid&&baseInventoryValid?invState.value:{},generated);
    Store.write(KEYS.inventory,merged);
    Store.write(KEYS.seedVersion,VOYAGO_SEED_VERSION);
  }else if(!invState.valid||!baseInventoryValid){
    Store.write(KEYS.inventory,generated);
    Store.write(KEYS.seedVersion,VOYAGO_SEED_VERSION);
  }

  const users=rawState(KEYS.users);
  if(!users.exists||!users.valid||!Array.isArray(users.value)){
    Store.write(KEYS.users,[admin]);
  }else if(!users.value.some(u=>u&&u.email==='admin@voyago.com')){
    Store.write(KEYS.users,[...users.value,admin]);
  }else{
    Store.write(KEYS.users,users.value.map(u=>u&&u.email==='admin@voyago.com'
      ?{...u,passwordHash:ADMIN_HASH,role:'admin',blocked:false}
      :u));
  }

  const stores=[
    [KEYS.bookings,Array.isArray,[]],
    [KEYS.trips,Array.isArray,[]],
    [KEYS.alerts,Array.isArray,[]],
    [KEYS.wishlist,Array.isArray,[]],
    [KEYS.redirects,Array.isArray,[]],
    [KEYS.searches,Array.isArray,[]],
    [KEYS.priceAlerts,Array.isArray,[]],
    [KEYS.partners,v=>!!v&&typeof v==='object'&&!Array.isArray(v),{}],
    [KEYS.settings,v=>!!v&&typeof v==='object'&&!Array.isArray(v),{theme:'light'}]
  ];
  stores.forEach(([key,validator,fallback])=>{
    const state=rawState(key);
    if(!state.exists||!state.valid||!validator(state.value))Store.write(key,fallback);
  });
}
seedData();
