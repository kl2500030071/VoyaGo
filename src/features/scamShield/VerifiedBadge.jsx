import React from "react";
import { TRUSTED_DOMAINS } from "./trustedDomains";

export default function VerifiedBadge({ url, className = "" }) {
  let host = "";
  try { host = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(url) ? url : `https://${url}`).hostname.toLowerCase().replace(/^www\./,""); }
  catch { return null; }
  const match = TRUSTED_DOMAINS.find(({domain}) => host===domain || host.endsWith(`.${domain}`));
  if (!match) return null;
  return <span className={`ss-verified-badge ${className}`} title={`Trusted domain: ${match.domain}`}>✓ Verified platform</span>;
}
