function pad2(n){return String(n).padStart(2,'0')}
function dateTime(date,time){return new Date(`${date}T${time}:00`)}
function isoFor(date,time){return dateTime(date,time).toISOString()}
function timeLabel(iso){return new Date(iso).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',hour12:false})}
function dateLabel(iso){return new Date(iso).toLocaleDateString([], {day:'2-digit',month:'short',year:'numeric'})}
function flightArrivalISO(item){
  const departure=dateTime(item.travelDate,item.depart);
  let arrival=dateTime(item.travelDate,item.arrive);
  if(arrival<=departure)arrival=new Date(arrival.getTime()+86400000);
  return arrival.toISOString();
}
function flightDepartureISO(item){return isoFor(item.travelDate,item.depart)}
function hotelBaseISO(item){return isoFor(item.travelDate||new Date().toISOString().slice(0,10),'14:00')}
function cabBaseISO(item){return isoFor(item.travelDate||new Date().toISOString().slice(0,10),'10:00')}

function createBooking(user,item,traveller,payment){
  const p=getTrueTotal(item.price||0);
  const booking={id:uid('VG'),userId:user.id,type:item.type,itemId:item.id,item:{...item},traveller,paymentMethod:payment,price:p,status:'Confirmed',createdAt:nowISO(),refund:0,refundRate:0,timeline:{delayMinutes:0}};
  if(item.type==='flight'){
    booking.timeline.departureAt=flightDepartureISO(item);
    booking.timeline.arrivalAt=flightArrivalISO(item);
    booking.timeline.originalArrivalAt=booking.timeline.arrivalAt;
    booking.eventAt=booking.timeline.departureAt;
  }else if(item.type==='hotel'){
    booking.timeline.checkInAt=hotelBaseISO(item);
    booking.timeline.originalCheckInAt=booking.timeline.checkInAt;
    booking.timeline.note='Hotel check-in at 14:00';
    booking.eventAt=booking.timeline.checkInAt;
  }else{
    booking.timeline.pickupAt=cabBaseISO(item);
    booking.timeline.originalPickupAt=booking.timeline.pickupAt;
    booking.timeline.note='Cab pickup scheduled';
    booking.eventAt=booking.timeline.pickupAt;
  }
  return booking;
}
function saveBooking(booking){Store.patch(KEYS.bookings,a=>[booking,...a]);return booking}
function userBookings(userId){return Store.read(KEYS.bookings).filter(b=>b.userId===userId)}
function userTrips(userId){return Store.read(KEYS.trips).filter(t=>t.userId===userId)}
function userAlerts(userId){return Store.read(KEYS.alerts).filter(a=>a.userId===userId||a.userId==='all').map(a=>({...a,visibleRead:a.userId==='all'?(a.readBy||[]).includes(userId):!!a.read}))}
function markUserAlertsRead(userId){Store.patch(KEYS.alerts,a=>a.map(x=>x.userId===userId?{...x,read:true}:x.userId==='all'?{...x,readBy:[...new Set([...(x.readBy||[]),userId])]}:x))}

function tripBookings(trip){const ids=new Set(trip.bookingIds||[]);return Store.read(KEYS.bookings).filter(b=>ids.has(b.id))}
function destinationForBooking(booking){return booking.item.to||booking.item.city||booking.item.from||'Trip'}
function createTrip(userId,booking,name){const trip={id:uid('TRIP'),userId,name:name||`Trip to ${destinationForBooking(booking)}`,destination:destinationForBooking(booking),bookingIds:[booking.id],createdAt:nowISO()};Store.patch(KEYS.trips,a=>[trip,...a]);rebuildTripTimeline(trip.id);return trip}
function addBookingToTrip(userId,bookingId,tripId){const booking=Store.read(KEYS.bookings).find(b=>b.id===bookingId&&b.userId===userId);if(!booking)return null;let trip=Store.read(KEYS.trips).find(t=>t.id===tripId&&t.userId===userId);if(!trip)trip=createTrip(userId,booking);else{Store.patch(KEYS.trips,a=>a.map(t=>t.userId===userId&&t.id!==trip.id?{...t,bookingIds:(t.bookingIds||[]).filter(id=>id!==bookingId)}:t.id===trip.id?{...t,bookingIds:[...new Set([...(t.bookingIds||[]),bookingId])]}:t));rebuildTripTimeline(trip.id);trip=Store.read(KEYS.trips).find(t=>t.id===trip.id)}return trip}

function rebuildTripTimeline(tripId){
  const trip=Store.read(KEYS.trips).find(t=>t.id===tripId);if(!trip)return null;
  const bs=tripBookings(trip),flight=bs.find(b=>b.type==='flight'),hotel=bs.find(b=>b.type==='hotel'),cab=bs.find(b=>b.type==='cab');
  if(flight){
    const arrival=new Date(flight.timeline.arrivalAt||flightArrivalISO(flight.item));
    if(cab){const pickup=new Date(arrival.getTime()+30*60000);cab.timeline.pickupAt=pickup.toISOString();cab.timeline.originalPickupAt=cab.timeline.originalPickupAt||pickup.toISOString();cab.timeline.note='Pickup = flight arrival + 30 min';cab.eventAt=cab.timeline.pickupAt;}
    if(hotel){const base=new Date(hotel.timeline.originalCheckInAt||hotelBaseISO(hotel.item));const delay=flight.timeline.delayMinutes||0;const checkIn=new Date(base.getTime()+delay*60000);hotel.timeline.checkInAt=checkIn.toISOString();hotel.timeline.originalCheckInAt=hotel.timeline.originalCheckInAt||base.toISOString();hotel.timeline.note=delay?`Hotel notified · check-in moved +${delay} min`:'Hotel check-in at 14:00';hotel.eventAt=hotel.timeline.checkInAt;}
    flight.eventAt=flight.timeline.departureAt;
    Store.patch(KEYS.bookings,a=>a.map(b=>b.id===flight.id?flight:b.id===cab?.id?cab:b.id===hotel?.id?hotel:b));
  }
  const updated=tripBookings(Store.read(KEYS.trips).find(t=>t.id===tripId)||trip);
  const timeline=[];
  updated.forEach(b=>{
    if(b.type==='flight'){
      timeline.push({key:`${b.id}-departure`,bookingId:b.id,type:'flight-departure',at:b.timeline.departureAt,title:`Flight ${b.item.flightNo}`,subtitle:`${b.item.from} → ${b.item.to}`,status:b.status,detail:`Departure · ${b.item.airline}`});
      timeline.push({key:`${b.id}-arrival`,bookingId:b.id,type:'flight-arrival',at:b.timeline.arrivalAt,title:`Flight arrival`,subtitle:`Arrived at ${b.item.to}`,status:b.status,detail:`Arrival · ${timeLabel(b.timeline.arrivalAt)}`});
    }else if(b.type==='cab')timeline.push({key:`${b.id}-cab`,bookingId:b.id,type:'cab',at:b.timeline.pickupAt,title:`Cab pickup · ${b.item.kind}`,subtitle:b.item.city,status:b.status,detail:b.timeline.note});
    else if(b.type==='hotel')timeline.push({key:`${b.id}-hotel`,bookingId:b.id,type:'hotel',at:b.timeline.checkInAt,title:`Hotel check-in · ${b.item.name}`,subtitle:b.item.city,status:b.status,detail:b.timeline.note});
  });
  timeline.sort((a,b)=>new Date(a.at)-new Date(b.at));
  Store.patch(KEYS.trips,a=>a.map(t=>t.id===tripId?{...t,timeline}:t));
  return timeline;
}
function getTripTimeline(trip){return (trip.timeline||[]).slice().sort((a,b)=>new Date(a.at)-new Date(b.at))}

function refundRateForBooking(booking,now=new Date()){
  const event=booking.eventAt?new Date(booking.eventAt):new Date(booking.createdAt);
  const hours=(event-now)/3600000;
  if(hours>=48)return .9;if(hours>=24)return .7;return .4;
}
function refundBreakdown(booking,now=new Date()){
  const rate=refundRateForBooking(booking,now),amount=Math.round((booking.price?.total||0)*rate),event=booking.eventAt?new Date(booking.eventAt):new Date(booking.createdAt);
  return {rate,percent:Math.round(rate*100),amount,hoursRemaining:Math.max(0,(event-now)/3600000),total:booking.price?.total||0,eventAt:event.toISOString()};
}
function cancelBooking(id,userId){
  let out;
  Store.patch(KEYS.bookings,a=>a.map(b=>{
    if(b.id!==id|| (userId&&b.userId!==userId))return b;
    if(b.status==='Cancelled'){out=b;return b;}
    const r=refundBreakdown(b);out={...b,status:'Cancelled',refund:r.amount,refundRate:r.rate,refundPercent:r.percent,cancelledAt:nowISO()};return out;
  }));
  if(out?.status==='Cancelled')Store.patch(KEYS.trips,a=>a.map(t=>t.bookingIds?.includes(out.id)?{...t,timeline:(t.timeline||[]).map(n=>n.bookingId===out.id?{...n,status:'Cancelled'}:n)}:t));
  return out;
}

function shiftFlightDelayInTrip(tripId,flightBookingId,minutes,alertUser=true){
  const trip=Store.read(KEYS.trips).find(t=>t.id===tripId),flight=Store.read(KEYS.bookings).find(b=>b.id===flightBookingId);
  if(!trip||!flight||flight.status!=='Confirmed'||flight.type!=='flight')return null;
  const oldArrival=flight.timeline.arrivalAt||flightArrivalISO(flight.item),newArrival=new Date(new Date(oldArrival).getTime()+minutes*60000).toISOString();
  Store.patch(KEYS.bookings,a=>a.map(b=>b.id===flight.id?{...b,timeline:{...b.timeline,delayMinutes:(b.timeline.delayMinutes||0)+minutes,arrivalAt:newArrival}}:b));
  rebuildTripTimeline(tripId);
  const updatedTrip=Store.read(KEYS.trips).find(t=>t.id===tripId),updatedBookings=tripBookings(updatedTrip),cab=updatedBookings.find(b=>b.type==='cab'),hotel=updatedBookings.find(b=>b.type==='hotel');
  Store.patch(KEYS.trips,a=>a.map(t=>t.id===tripId?{...t,lastDelay:{bookingId:flight.id,minutes,oldArrival,newArrival,shiftedBookingIds:[flight.id,...(cab?[cab.id]:[]),...(hotel?[hotel.id]:[])]}}:t));
  const cabTime=cab?timeLabel(cab.timeline.pickupAt):null;
  if(alertUser){const message=cab?`Cab pickup moved to ${cabTime}, hotel notified.`:`Flight arrival moved to ${timeLabel(newArrival)}.`;Store.patch(KEYS.alerts,a=>[{id:uid('A'),userId:flight.userId,type:'travel',title:'Itinerary repaired',message,bookingId:flight.id,createdAt:nowISO(),read:false},...a]);}
  return {flightId:flight.id,minutes,oldArrival,newArrival,cabPickupAt:cab?.timeline.pickupAt||null,hotelCheckInAt:hotel?.timeline.checkInAt||null,tripId};
}
function simulateDelay(bookingId,minutes=60){
  const booking=Store.read(KEYS.bookings).find(b=>b.id===bookingId);
  if(!booking||booking.status!=='Confirmed'||booking.type!=='flight')return null;
  const trip=Store.read(KEYS.trips).find(t=>t.userId===booking.userId&&(t.bookingIds||[]).includes(bookingId));
  if(!trip){
    const old=booking.timeline.arrivalAt,newAt=new Date(new Date(old).getTime()+Number(minutes)*60000).toISOString();
    Store.patch(KEYS.bookings,a=>a.map(b=>b.id===booking.id?{...b,timeline:{...b.timeline,delayMinutes:(b.timeline.delayMinutes||0)+Number(minutes),arrivalAt:newAt}}:b));
    const alert={id:uid('A'),userId:booking.userId,type:'travel',title:'Flight delay',message:`Flight arrival moved to ${timeLabel(newAt)}.`,bookingId:booking.id,createdAt:nowISO(),read:false};Store.patch(KEYS.alerts,a=>[alert,...a]);return {flightId:booking.id,minutes:Number(minutes),oldArrival:old,newArrival:newAt,cabPickupAt:null,hotelCheckInAt:null,tripId:null};
  }
  return shiftFlightDelayInTrip(trip.id,bookingId,Number(minutes),true);
}

function broadcastDelayForFlight(flightNo,minutes){
  const affected=[];const bookings=Store.read(KEYS.bookings);const flightBookings=bookings.filter(b=>b.type==='flight'&&b.status==='Confirmed'&&b.item?.flightNo===flightNo);
  flightBookings.forEach(f=>{
    const trip=Store.read(KEYS.trips).find(t=>t.userId===f.userId&&(t.bookingIds||[]).includes(f.id));
    const result=trip?shiftFlightDelayInTrip(trip.id,f.id,Number(minutes),false):simulateDelayWithoutTrip(f.id,Number(minutes));
    if(result){affected.push({userId:f.userId,bookingId:f.id,result});Store.patch(KEYS.alerts,a=>[{id:uid('A'),userId:f.userId,type:'travel',title:'Admin flight delay',message:`Flight ${flightNo} delayed ${minutes} min. Your itinerary has been updated.`,bookingId:f.id,createdAt:nowISO(),read:false},...a]);}
  });
  return affected;
}
function simulateDelayWithoutTrip(bookingId,minutes){const b=Store.read(KEYS.bookings).find(x=>x.id===bookingId);if(!b||b.status!=='Confirmed'||b.type!=='flight')return null;const old=b.timeline.arrivalAt,newAt=new Date(new Date(old).getTime()+minutes*60000).toISOString();Store.patch(KEYS.bookings,a=>a.map(x=>x.id===bookingId?{...x,timeline:{...x.timeline,delayMinutes:(x.timeline.delayMinutes||0)+minutes,arrivalAt:newAt}}:x));return {flightId:bookingId,minutes,oldArrival:old,newArrival:newAt,cabPickupAt:null,hotelCheckInAt:null,tripId:null}}

function demoItineraryState(){
  const date=new Date(Date.now()+86400000).toISOString().slice(0,10),flight={id:'DEMO-F',type:'flight',from:'Delhi',to:'Mumbai',flightNo:'VG204',airline:'VoyaGo Air',depart:'10:30',arrive:'12:15',travelDate:date},hotel={id:'DEMO-H',type:'hotel',city:'Mumbai',name:'Aster Mumbai',travelDate:date},cab={id:'DEMO-C',type:'cab',city:'Mumbai',kind:'Sedan',travelDate:date};
  const bookings=[createBooking({id:'DEMO',name:'Demo',email:'demo@voyago.local'},flight,{},'demo'),createBooking({id:'DEMO',name:'Demo',email:'demo@voyago.local'},hotel,{},'demo'),createBooking({id:'DEMO',name:'Demo',email:'demo@voyago.local'},cab,{},'demo')];
  const trip={id:'DEMO-TRIP',userId:'DEMO',bookingIds:bookings.map(b=>b.id)};
  const oldFlight=bookings[0],arrival=flightArrivalISO(flight);oldFlight.timeline.arrivalAt=arrival;bookings[1].timeline.originalCheckInAt=hotelBaseISO(hotel);bookings[2].timeline.originalPickupAt=new Date(new Date(arrival).getTime()+1800000).toISOString();
  const update=()=>{const a=bookings[0].timeline.arrivalAt;bookings[2].timeline.pickupAt=new Date(new Date(a).getTime()+1800000).toISOString();bookings[1].timeline.checkInAt=new Date(new Date(bookings[1].timeline.originalCheckInAt).getTime()+(bookings[0].timeline.delayMinutes||0)*60000).toISOString();return {flight:bookings[0],cab:bookings[2],hotel:bookings[1]}};update();
  return {trip,bookings,update};
}
