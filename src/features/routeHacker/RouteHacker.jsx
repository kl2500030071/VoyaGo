import React, { useMemo, useState } from "react";
import { CITIES, ROUTE_GRAPH } from "./routeGraph";
import { dijkstra, summarizePath } from "./dijkstra";
import "./routeHacker.css";

const HISTORY_KEY = "voyago_route_history";
const MODE_META = {
  train: { icon: "🚆", site: "https://www.irctc.co.in/nget/train-search" },
  bus: { icon: "🚌", site: "https://www.redbus.in/" },
  flight: { icon: "✈️", site: "https://www.google.com/travel/flights" },
};
const money = (n) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const duration = (mins) => `${Math.floor(mins / 60)}h ${mins % 60}m`;
const readHistory = () => {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
};

export default function RouteHacker() {
  const [source, setSource] = useState("Vijayawada");
  const [destination, setDestination] = useState("Mumbai");
  const [optimize, setOptimize] = useState("cheapest");
  const [timeValue, setTimeValue] = useState(500);
  const [modes, setModes] = useState(["train", "bus", "flight"]);
  const [history, setHistory] = useState(readHistory);
  const [showHow, setShowHow] = useState(false);
  const [searched, setSearched] = useState(false);

  const weightFn = useMemo(() => {
    if (optimize === "fastest") return (e) => e.durationMins;
    if (optimize === "balanced") return (e) => e.price + e.durationMins * (timeValue / 60);
    return (e) => e.price;
  }, [optimize, timeValue]);

  const best = useMemo(() => source !== destination && modes.length
    ? dijkstra(ROUTE_GRAPH, source, destination, {
        weightFn, allowedModes: modes, timeValuePerMin: optimize === "fastest" ? 1 : optimize === "balanced" ? timeValue / 60 : 0,
      }) : null, [source, destination, modes, weightFn, optimize, timeValue]);

  const direct = ROUTE_GRAPH.filter(e => e.from === source && e.to === destination && modes.includes(e.mode))
    .sort((a,b) => weightFn(a)-weightFn(b))[0];

  const alternatives = useMemo(() => {
    if (!best?.path?.length) return [];
    const candidates = [];
    best.path.forEach((edge) => {
      const alt = dijkstra(ROUTE_GRAPH, source, destination, {
        weightFn, allowedModes: modes, timeValuePerMin: optimize === "fastest" ? 1 : optimize === "balanced" ? timeValue / 60 : 0,
        excludedEdges: [edge],
      });
      if (alt?.path.length && !candidates.some(x => x.path.map(y=>`${y.from}-${y.to}-${y.mode}`).join() === alt.path.map(y=>`${y.from}-${y.to}-${y.mode}`).join())) candidates.push(alt);
    });
    return candidates.sort((a,b)=>a.score-b.score).slice(0,3);
  }, [best, source, destination, weightFn, modes, optimize, timeValue]);

  const runSearch = () => {
    setSearched(true);
    if (source === destination || !modes.length) return;
    const entry = { source, destination, optimize, timeValue, modes };
    const next = [entry, ...readHistory().filter(x => !(x.source===source && x.destination===destination && x.optimize===optimize))].slice(0,5);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    setHistory(next);
  };
  const restore = (item) => {
    setSource(item.source); setDestination(item.destination); setOptimize(item.optimize);
    setTimeValue(item.timeValue); setModes(item.modes); setSearched(true);
  };
  const toggleMode = (mode) => setModes(old => old.includes(mode) ? old.filter(x=>x!==mode) : [...old,mode]);

  const RouteCard = ({ route, title = "Recommended route" }) => (
    <div className="rh-card">
      <h3>{title}</h3>
      <div className="rh-totals">
        <div><strong>{money(route.totalPrice)}</strong><span>Total price</span></div>
        <div><strong>{duration(route.totalDurationMins)}</strong><span>Estimated journey</span></div>
        <div><strong>{route.transfers}</strong><span>Transfers</span></div>
      </div>
      <div className="rh-timeline">
        {route.path.map((leg, i) => <div className="rh-leg" key={`${leg.from}-${leg.to}-${i}`}>
          <div className="rh-leg-icon">{MODE_META[leg.mode].icon}</div>
          <div className="rh-leg-main">
            <b>{leg.from} <span>→</span> {leg.to}</b>
            <small>{leg.label} · {duration(leg.durationMins)}</small>
          </div>
          <div className="rh-leg-price">{money(leg.price)}</div>
          <a className="rh-book" href={MODE_META[leg.mode].site} target="_blank" rel="noopener noreferrer">Book / Check prices ↗</a>
        </div>)}
      </div>
    </div>
  );

  const bestSummary = best ? summarizePath(best.path) : null;
  return <main className="rh-page">
    <header className="rh-header"><span className="rh-kicker">VOYAGO SMART ROUTING</span><h1>Route Hacker</h1>
      <p>Find a smarter journey by combining trains, buses and flights.</p></header>
    <section className="rh-card rh-controls">
      <div className="rh-form-grid">
        <label>From<select value={source} onChange={e=>setSource(e.target.value)}>{CITIES.map(c=><option key={c}>{c}</option>)}</select></label>
        <label>To<select value={destination} onChange={e=>setDestination(e.target.value)}>{CITIES.map(c=><option key={c}>{c}</option>)}</select></label>
      </div>
      <div className="rh-field"><span className="rh-label">Optimize for</span><div className="rh-segment">
        {["cheapest","fastest","balanced"].map(v=><button type="button" className={optimize===v?"active":""} onClick={()=>setOptimize(v)} key={v}>{v[0].toUpperCase()+v.slice(1)}</button>)}
      </div></div>
      <label className="rh-time-value">My time is worth <b>{money(timeValue)}</b> per hour
        <input type="range" min="0" max="2000" step="50" value={timeValue} onChange={e=>setTimeValue(Number(e.target.value))}/>
      </label>
      <div className="rh-field"><span className="rh-label">Travel modes</span><div className="rh-checks">
        {["train","bus","flight"].map(m=><label key={m}><input type="checkbox" checked={modes.includes(m)} onChange={()=>toggleMode(m)}/>{MODE_META[m].icon} {m}</label>)}
      </div></div>
      <button className="rh-primary" onClick={runSearch}>Find my best route</button>
    </section>

    {history.length>0 && <section className="rh-history"><b>Recent searches</b>{history.map((h,i)=><button key={i} onClick={()=>restore(h)}>{h.source} → {h.destination}</button>)}</section>}
    {searched && source===destination && <div className="rh-notice">Choose two different cities to find a route.</div>}
    {searched && !modes.length && <div className="rh-notice">Select at least one travel mode.</div>}
    {searched && source!==destination && modes.length>0 && !best && <div className="rh-notice">No route found with these mode filters. Try enabling another travel mode.</div>}
    {best && <div className="rh-results">
      <RouteCard route={best} />
      <section className="rh-card rh-direct"><h3>Compare with direct</h3>
        {!direct ? <p>No direct service is listed for this city pair. The recommended route connects through available hubs.</p> :
          <><div className="rh-compare-row"><span>Optimized: {money(best.totalPrice)} · {duration(best.totalDurationMins)}</span><span>Direct {MODE_META[direct.mode].icon}: {money(direct.price)} · {duration(direct.durationMins)}</span></div>
          {best.totalPrice < direct.price || best.totalDurationMins < direct.durationMins
            ? <p className="rh-savings">Compared with direct, this route saves {money(Math.max(0,direct.price-best.totalPrice))} and/or {duration(Math.max(0,direct.durationMins-best.totalDurationMins))}.</p>
            : <p>The direct option is already competitive for this optimization.</p>}</>}
      </section>
      {alternatives.length>0 && <section><h3 className="rh-section-title">Alternative routes</h3><div className="rh-alt-grid">{alternatives.map((r,i)=><div className="rh-card rh-alt" key={i}><b>Option {i+1}</b><strong>{money(r.totalPrice)}</strong><span>{duration(r.totalDurationMins)} · {r.transfers} transfers</span><small>{r.path.map(x=>`${x.from} → ${x.to}`).join(" · ")}</small></div>)}</div></section>}
    </div>}
    <section className="rh-card rh-how"><button onClick={()=>setShowHow(v=>!v)} aria-expanded={showHow}>How it works <span>{showHow?"−":"＋"}</span></button>
      {showHow && <ol><li>We model cities and available services as a weighted graph.</li><li>Dijkstra searches the lowest-cost path for your chosen price, time or balanced score.</li><li>Alternative paths are found by temporarily excluding legs from the best route; estimates are demo data.</li></ol>}
    </section>
  </main>;
}
