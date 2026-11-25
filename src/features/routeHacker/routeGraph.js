// Hardcoded demo network. Prices and durations are illustrative one-way estimates in INR.
export const CITIES = [
  "Vijayawada", "Hyderabad", "Visakhapatnam", "Chennai", "Bengaluru",
  "Mumbai", "Delhi", "Kolkata", "Pune", "Tirupati", "Guntur",
  "Nagpur", "Ahmedabad", "Kochi", "Jaipur",
];

const edge = (from, to, mode, price, durationMins, label = "") => ({
  from, to, mode, price, durationMins,
  label: label || `${mode[0].toUpperCase()}${mode.slice(1)} ${from} → ${to}`,
});

// Bidirectional services are represented as two directed edges.
const pairs = [
  ["Vijayawada","Hyderabad","train",420,360], ["Vijayawada","Hyderabad","bus",650,330],
  ["Vijayawada","Hyderabad","flight",3600,75],
  ["Vijayawada","Visakhapatnam","train",310,330], ["Vijayawada","Visakhapatnam","bus",520,300],
  ["Vijayawada","Chennai","train",520,390], ["Vijayawada","Chennai","bus",780,420],
  ["Vijayawada","Bengaluru","train",610,570], ["Vijayawada","Bengaluru","bus",1050,510],
  ["Vijayawada","Tirupati","train",260,300], ["Vijayawada","Guntur","train",90,55],
  ["Guntur","Hyderabad","bus",480,300], ["Guntur","Chennai","train",470,360],
  ["Hyderabad","Mumbai","train",650,780], ["Hyderabad","Mumbai","bus",1250,720],
  ["Hyderabad","Mumbai","flight",4200,95],
  ["Hyderabad","Delhi","train",850,1320], ["Hyderabad","Delhi","flight",5100,130],
  ["Hyderabad","Bengaluru","train",480,570], ["Hyderabad","Bengaluru","bus",850,510],
  ["Hyderabad","Chennai","train",520,660], ["Hyderabad","Chennai","flight",3900,85],
  ["Hyderabad","Nagpur","train",390,480], ["Hyderabad","Pune","bus",900,570],
  ["Visakhapatnam","Kolkata","train",620,900], ["Visakhapatnam","Chennai","train",480,780],
  ["Chennai","Bengaluru","train",240,360], ["Chennai","Bengaluru","bus",520,390],
  ["Chennai","Bengaluru","flight",3100,65],
  ["Chennai","Tirupati","train",180,210], ["Tirupati","Bengaluru","bus",650,300],
  ["Chennai","Kochi","train",560,780], ["Chennai","Kochi","flight",4300,105],
  ["Bengaluru","Mumbai","train",720,1020], ["Bengaluru","Mumbai","flight",3900,105],
  ["Bengaluru","Kochi","train",390,660], ["Bengaluru","Kochi","bus",700,540],
  ["Mumbai","Pune","train",160,210], ["Mumbai","Pune","bus",350,210],
  ["Mumbai","Ahmedabad","train",420,480], ["Mumbai","Ahmedabad","flight",3400,75],
  ["Mumbai","Delhi","train",950,1080], ["Mumbai","Delhi","flight",4800,125],
  ["Pune","Nagpur","train",520,780], ["Nagpur","Delhi","train",680,900],
  ["Delhi","Jaipur","train",250,300], ["Delhi","Jaipur","bus",420,330],
  ["Delhi","Jaipur","flight",2600,65],
  ["Delhi","Kolkata","train",780,1020], ["Delhi","Kolkata","flight",5200,135],
  ["Jaipur","Ahmedabad","bus",550,540], ["Kolkata","Kochi","flight",6200,180],
  ["Ahmedabad","Jaipur","train",460,600], ["Kochi","Chennai","bus",850,720],
];

export const ROUTE_GRAPH = pairs.flatMap(([a,b,mode,price,duration]) => [
  edge(a,b,mode,price,duration),
  edge(b,a,mode,Math.round(price * 1.03),duration + (mode === "flight" ? 5 : 10)),
]);

export default ROUTE_GRAPH;
