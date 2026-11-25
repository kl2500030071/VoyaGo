function delay(ms=350){return new Promise(resolve=>setTimeout(resolve,ms))}
function defaultTravelDate(){return new Date(Date.now()+86400000).toISOString().slice(0,10)}
function inventorySnapshot(){
  const inv=Store.read(KEYS.inventory,{});
  return {
    flights:Array.isArray(inv.flights)?inv.flights:[],
    hotels:Array.isArray(inv.hotels)?inv.hotels:[],
    cabs:Array.isArray(inv.cabs)?inv.cabs:[],
    trains:Array.isArray(inv.trains)?inv.trains:[]
  };
}
function cityList(){
  const inv=inventorySnapshot(),set=new Set();
  [
    ...inv.flights.flatMap(x=>[x?.from,x?.to]),
    ...inv.hotels.map(x=>x?.city),
    ...inv.cabs.map(x=>x?.city),
    ...inv.trains.flatMap(x=>[x?.from,x?.to])
  ].forEach(x=>x&&set.add(x));
  return [...set].sort((a,b)=>a.localeCompare(b));
}
function withinMax(itemPrice,max){
  return !max||getTrueTotal(Number(itemPrice)||0).total<=Number(max);
}
async function searchFlights(filters={}){
  await delay(350);
  const date=filters.travelDate||defaultTravelDate();
  return inventorySnapshot().flights
    .filter(x=>
      (!filters.from||x.from===filters.from)&&
      (!filters.to||x.to===filters.to)&&
      (!filters.airline||x.airline===filters.airline)&&
      (!filters.stops||String(x.stops)===String(filters.stops))&&
      withinMax(x.price,filters.max)
    )
    .map(x=>({...x,travelDate:date}));
}
async function searchTrains(filters={}){
  await delay(400);
  const date=filters.travelDate||defaultTravelDate();
  const cls=filters.className||'SL';
  return inventorySnapshot().trains
    .filter(x=>
      (!filters.from||x.from===filters.from)&&
      (!filters.to||x.to===filters.to)&&
      withinMax(x.fares?.[cls]??x.price,filters.max)
    )
    .map(x=>{
      const selectedPrice=Number((x.fares?.[cls]??x.price)??0);
      return {
        ...x,
        travelDate:date,
        approximate:true,
        timingLabel:'approximate',
        selectedClass:cls,
        price:selectedPrice
      };
    });
}
async function searchHotels(filters={}){
  await delay(420);
  const date=filters.travelDate||defaultTravelDate();
  return inventorySnapshot().hotels
    .filter(x=>
      (!filters.city||x.city===filters.city)&&
      (!filters.rating||Number(x.rating||0)>=Number(filters.rating))&&
      withinMax(x.price,filters.max)
    )
    .map(x=>({...x,travelDate:date,checkIn:'14:00'}));
}
async function searchCabs(filters={}){
  await delay(300);
  const date=filters.travelDate||defaultTravelDate();
  return inventorySnapshot().cabs
    .filter(x=>
      (!filters.city||x.city===filters.city)&&
      (!filters.kind||x.kind===filters.kind)&&
      withinMax(x.price,filters.max)
    )
    .map(x=>({...x,travelDate:date}));
}
