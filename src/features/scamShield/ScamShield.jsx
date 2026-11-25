import React, { useState } from "react";
import { checkUrl } from "./scamChecker";
import "./scamShield.css";

const HISTORY_KEY="voyago_scam_history";
const EXAMPLES=[
  {url:"https://www.irctc.co.in",label:"Official · IRCTC"},
  {url:"https://www.makemytrip.com",label:"Official · MakeMyTrip"},
  {url:"https://irctc-refund.xyz/claim",label:"Fake · IRCTC refund"},
  {url:"https://makemytrlp.com/login",label:"Fake · MakeMyTrip look-alike"},
  {url:"https://redbus-ticket-offer.click",label:"Fake · redBus offer"},
];
const readHistory=()=>{try{return JSON.parse(localStorage.getItem(HISTORY_KEY)||"[]")}catch{return[]}};

export default function ScamShield(){
  const [input,setInput]=useState("");
  const [result,setResult]=useState(null);
  const [history,setHistory]=useState(readHistory);
  const [toast,setToast]=useState("");
  const check=()=>{
    const next=checkUrl(input);setResult(next);
    if(next.status!=="invalid"){
      const entry={url:input.trim(),verdict:next.verdict,score:next.score,checkedAt:Date.now()};
      const updated=[entry,...readHistory().filter(x=>x.url!==entry.url)].slice(0,10);
      localStorage.setItem(HISTORY_KEY,JSON.stringify(updated));setHistory(updated);
    }
  };
  const report=()=>{
    if(!input.trim())return;
    let reports=[];try{reports=JSON.parse(localStorage.getItem("voyago_reported_links")||"[]")}catch{}
    if(!reports.includes(input.trim()))reports.push(input.trim());
    localStorage.setItem("voyago_reported_links",JSON.stringify(reports));
    setToast("Link saved to your local report list.");setTimeout(()=>setToast(""),2600);
  };
  const clear=()=>{localStorage.removeItem(HISTORY_KEY);setHistory([])};
  const color=result?.status==="official"?"official":result?.score>=70?"danger":result?.score>=30?"warning":"unknown";
  return <main className="ss-page">
    <header className="ss-header"><span className="ss-kicker">VOYAGO SAFETY TOOLS</span><h1>Scam Shield</h1><p>Check a travel or booking link before you share details or pay.</p></header>
    <section className="ss-card ss-checker">
      <label htmlFor="ss-url">Paste a travel or booking URL</label>
      <div className="ss-input-row"><input id="ss-url" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&check()} placeholder="https://example.com/booking"/><button onClick={check}>Check Link</button></div>
      <div className="ss-examples"><b>Try an example:</b>{EXAMPLES.map(x=><button key={x.url} onClick={()=>{setInput(x.url);setResult(checkUrl(x.url));}}>{x.label}</button>)}</div>
    </section>
    {result&&<section className={`ss-card ss-result ss-${color}`}>
      <div className="ss-result-top"><div><span className="ss-small-label">LINK ASSESSMENT</span><h2>{result.verdict}</h2><p>{result.hostname||"Invalid address"}</p></div><span className="ss-verdict-pill">{result.status==="official"?"✓":result.score>=70?"!":"?"} {result.verdict}</span></div>
      {result.status!=="invalid"&&<><div className="ss-meter-label"><b>Risk score</b><strong>{result.score}/100</strong></div><div className="ss-meter"><span style={{width:`${result.score}%`}}/></div></>}
      <ul className="ss-reasons">{result.reasons.map((r,i)=><li key={i}>{r}</li>)}</ul>
      {result.brand&&<div className="ss-imitation"><b>This may be an imitation of {result.brand.name}.</b><p>The trusted domain is <strong>{result.brand.domain}</strong>.</p><a href={result.officialUrl} target="_blank" rel="noopener noreferrer">Open official site ↗</a></div>}
      {result.status!=="invalid"&&<button className="ss-report" onClick={report}>Report this link</button>}
    </section>}
    <section className="ss-card ss-history"><div className="ss-history-head"><h3>Recent checks</h3><button onClick={clear} disabled={!history.length}>Clear</button></div>
      {history.length?history.map((h,i)=><button className="ss-history-item" key={`${h.url}-${i}`} onClick={()=>{setInput(h.url);setResult(checkUrl(h.url));}}><span>{h.url}</span><b>{h.verdict}</b></button>):<p>No links checked yet. Your last 10 checks will appear here.</p>}
    </section>
    <p className="ss-disclaimer">This is a heuristic check, not a guarantee. Always verify before paying.</p>
    {toast&&<div className="ss-toast" role="status">{toast}</div>}
  </main>;
}
