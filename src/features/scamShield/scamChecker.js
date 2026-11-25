import { TRUSTED_DOMAINS } from "./trustedDomains";

const SUSPICIOUS_TLDS = new Set(["xyz","top","click","live","shop","online","site","icu","buzz","rest"]);
const SCAM_WORDS = ["refund","kyc","lottery","free-ticket","cashback","verify-account","offer-claim"];

function levenshtein(a,b) {
  const row = Array.from({length:b.length+1},(_,i)=>i);
  for(let i=1;i<=a.length;i++){
    let prev=row[0]; row[0]=i;
    for(let j=1;j<=b.length;j++){
      const old=row[j];
      row[j]=Math.min(row[j]+1,row[j-1]+1,prev+(a[i-1]===b[j-1]?0:1));
      prev=old;
    }
  }
  return row[b.length];
}
function registrable(host) {
  const parts=host.split(".");
  if(parts.length<=2)return host;
  const compound=new Set(["co.in","com.au","co.uk","com.br","co.nz","co.jp"]);
  const suffix=parts.slice(-2).join(".");
  return compound.has(suffix) ? parts.slice(-3).join(".") : suffix;
}
function normalizeLookalike(value) {
  return value.toLowerCase().replace(/0/g,"o").replace(/[1li]/g,"i").replace(/rn/g,"m").replace(/vv/g,"w");
}
const trustedMatch = (host, domain) => host===domain || host.endsWith(`.${domain}`);

export function checkUrl(input) {
  const raw=String(input ?? "").trim();
  if(!raw)return {status:"invalid",verdict:"Invalid URL",score:0,reasons:["Enter a website address to check."],hostname:""};
  let url;
  try { url=new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)?raw:`https://${raw}`); }
  catch { return {status:"invalid",verdict:"Invalid URL",score:0,reasons:["The address could not be parsed as a valid URL."],hostname:""}; }

  const hostname=url.hostname.toLowerCase().replace(/^www\./,"").replace(/\.$/,"");
  if(!hostname || !hostname.includes("."))return {status:"invalid",verdict:"Invalid URL",score:0,reasons:["Enter a complete domain name."],hostname};
  const domain=registrable(hostname);
  const official=TRUSTED_DOMAINS.find(x=>trustedMatch(hostname,x.domain));
  if(official)return {status:"official",verdict:"Official",score:0,reasons:[`Verified domain match for ${official.name}.`],hostname,domain,brand:official,officialUrl:`https://${official.domain}`,scheme:url.protocol};

  let score=0; const reasons=[]; let imitation=null;
  const hostNoPunct=domain.split(".")[0].replace(/[^a-z0-9]/g,"");
  for(const trusted of TRUSTED_DOMAINS){
    const trustedBase=trusted.domain.split(".")[0];
    const distance=levenshtein(hostNoPunct,trustedBase);
    const normalized=normalizeLookalike(hostNoPunct);
    const normalizedTarget=normalizeLookalike(trustedBase);
    if(distance>=1 && distance<=2 && Math.abs(hostNoPunct.length-trustedBase.length)<=2){
      score=Math.max(score,65); imitation=trusted;
      reasons.push(`The hostname is very similar to ${trusted.name} (${trusted.domain}).`);
      break;
    }
    if(normalized===normalizedTarget && hostNoPunct!==trustedBase){
      score=Math.max(score,70); imitation=trusted;
      reasons.push(`Possible character substitution impersonating ${trusted.name}.`);
      break;
    }
  }
  const brandMention=TRUSTED_DOMAINS.find(t=>hostname.includes(t.domain.split(".")[0]));
  if(brandMention){score+=30;imitation=imitation||brandMention;reasons.push(`The ${brandMention.name} brand appears in a domain that is not controlled by its trusted domain.`);}
  const tld=hostname.split(".").pop();
  if(SUSPICIOUS_TLDS.has(tld)){score+=25;reasons.push(`The .${tld} top-level domain is commonly used in suspicious links.`);}
  if(url.username || url.password || raw.includes("@")){score+=35;reasons.push("The URL contains an @ sign or embedded credentials.");}
  if(/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)){score+=40;reasons.push("The link uses an IP address instead of a recognizable domain.");}
  if(hostname.includes("xn--")){score+=35;reasons.push("The hostname contains punycode, which can disguise look-alike characters.");}
  if((hostname.match(/-/g)||[]).length>=3){score+=15;reasons.push("The hostname contains an unusually large number of hyphens.");}
  if((hostname.match(/\d/g)||[]).length>=4){score+=15;reasons.push("The hostname contains an unusual number of digits.");}
  if(hostname.length>45){score+=15;reasons.push("The hostname is unusually long.");}
  if(url.protocol!=="https:"){score+=15;reasons.push("The connection does not use HTTPS.");}
  let full = `${url.pathname}${url.search}`.toLowerCase();

try {
  full = decodeURIComponent(full);
} catch {
  // Keep the raw URL text when percent-encoding is malformed.
}
  const keyword=SCAM_WORDS.find(word=>full.includes(word) || hostname.includes(word));
  if(keyword){score+=25;reasons.push(`The link contains the suspicious keyword “${keyword}”.`);}
  score=Math.min(100,score);
  if(!reasons.length)reasons.push("No strong warning signs were detected, but this domain is not on the trusted list.");
  const verdict=score>=70?"Dangerous":score>=30?"Suspicious":"Likely Safe / Unknown";
  return {status:"unknown",verdict,score,reasons,hostname,domain,brand:imitation,officialUrl:imitation?`https://${imitation.domain}`:null,scheme:url.protocol};
}

// Example checks:
// checkUrl("https://www.irctc.co.in") -> { verdict: "Official", score: 0 }
// checkUrl("makemytrlp.com") -> suspicious/dangerous imitation warning
// checkUrl("https://unknown-travel.example") -> "Likely Safe / Unknown" absent other signals
