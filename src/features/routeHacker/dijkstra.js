// Dijkstra over (city, previous mode) states so transfer costs are path-aware.
// weightFn receives an edge and returns its base optimization cost.
export function dijkstra(graph, source, destination, {
  weightFn = (edge) => edge.price,
  allowedModes = ["train", "bus", "flight"],
  transferPenaltyMins = 45,
  timeValuePerMin = 0,
  excludedEdges = [],
} = {}) {
  if (source === destination) return { path: [], totalPrice: 0, totalDurationMins: 0, transfers: 0, score: 0 };

  const allowed = new Set(allowedModes);
  const excluded = new Set(excludedEdges.map((e) => `${e.from}|${e.to}|${e.mode}`));
  const adjacency = new Map();
  graph.forEach((e) => {
    if (!allowed.has(e.mode) || excluded.has(`${e.from}|${e.to}|${e.mode}`)) return;
    if (!adjacency.has(e.from)) adjacency.set(e.from, []);
    adjacency.get(e.from).push(e);
  });

  const keyOf = (city, mode) => `${city}::${mode || "START"}`;
  const start = keyOf(source, null);
  const dist = new Map([[start, 0]]);
  const states = new Map([[start, { city: source, lastMode: null }]]);
  const previous = new Map();
  const queue = [{ key: start, score: 0 }];

  while (queue.length) {
    queue.sort((a,b) => a.score - b.score);
    const current = queue.shift();
    if (current.score !== dist.get(current.key)) continue;
    const state = states.get(current.key);
    if (state.city === destination) {
      const path = [];
      let cursor = current.key;
      while (previous.has(cursor)) {
        const p = previous.get(cursor);
        path.unshift(p.edge);
        cursor = p.from;
      }
      const totals = summarizePath(path, transferPenaltyMins);
      return { path, ...totals, score: current.score };
    }

    for (const edge of adjacency.get(state.city) || []) {
      const transfer = state.lastMode !== null && state.lastMode !== edge.mode;
      const penaltyMins = state.lastMode !== null ? transferPenaltyMins : 0;
      const base = Number(weightFn(edge));
      // Transfer time is included in time-sensitive objectives, not monetary-only cost.
      const penaltyCost = timeValuePerMin > 0 ? penaltyMins * timeValuePerMin : 0;
      const nextScore = current.score + base + penaltyCost;
      const nextKey = keyOf(edge.to, edge.mode);
      if (nextScore < (dist.get(nextKey) ?? Infinity)) {
        dist.set(nextKey, nextScore);
        states.set(nextKey, { city: edge.to, lastMode: edge.mode });
        previous.set(nextKey, { from: current.key, edge });
        queue.push({ key: nextKey, score: nextScore });
      }
    }
  }
  return null;
}

export function summarizePath(path, transferPenaltyMins = 45) {
  const totalPrice = path.reduce((s,e) => s + e.price, 0);
  const baseDuration = path.reduce((s,e) => s + e.durationMins, 0);
  const transfers = Math.max(0, path.length - 1);
  const modeChanges = path.slice(1).filter((e,i) => e.mode !== path[i].mode).length;
  return {
    totalPrice,
    totalDurationMins: baseDuration + transfers * transferPenaltyMins,
    transfers,
    modeChanges,
  };
}

// Example checks:
// dijkstra(graph, "A", "C", { weightFn: e => e.price }) -> cheapest path
// dijkstra(graph, "A", "C", { weightFn: e => e.durationMins }) -> fastest path
// dijkstra(graph, "A", "C", { weightFn: e => e.price + e.durationMins * 2, timeValuePerMin: 2 })
// -> balanced path; null is returned when no allowed route exists.
