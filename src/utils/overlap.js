// Caps concurrent columns so a pile-up of overlapping items (e.g. 10 events at once)
// doesn't produce hairline-width blocks — anything past this just stacks into the last column.
const MAX_COLUMNS = 4;

// Lays out timed items that overlap in time side-by-side. Returns a Map from item.id to
// { left, width } (0-1 fractions). Sweeps items in start order into clusters (an item joins
// the running cluster if it starts before the cluster's max end so far); within a cluster,
// each item claims the first column whose last item has already ended.
export function computeOverlapLayout(timedItems) {
  const layout = new Map();
  const sorted = [...timedItems].sort((a, b) => a.scheduledStart - b.scheduledStart);

  let cluster = [];
  let clusterMaxEnd = null;

  function flushCluster() {
    if (cluster.length === 0) return;
    const columnEnds = []; // last end time assigned to each column so far
    const columnByItemId = new Map();

    cluster.forEach((item) => {
      let col = columnEnds.findIndex((end) => end <= item.scheduledStart);
      if (col === -1) col = columnEnds.length;
      columnEnds[col] = item.scheduledEnd;
      columnByItemId.set(item.id, col);
    });

    const columns = Math.min(Math.max(columnEnds.length, 1), MAX_COLUMNS);
    const width = 1 / columns;
    cluster.forEach((item) => {
      const col = Math.min(columnByItemId.get(item.id), columns - 1);
      layout.set(item.id, { left: col * width, width });
    });

    cluster = [];
    clusterMaxEnd = null;
  }

  sorted.forEach((item) => {
    if (cluster.length > 0 && item.scheduledStart < clusterMaxEnd) {
      cluster.push(item);
      if (item.scheduledEnd > clusterMaxEnd) clusterMaxEnd = item.scheduledEnd;
    } else {
      flushCluster();
      cluster.push(item);
      clusterMaxEnd = item.scheduledEnd;
    }
  });
  flushCluster();

  return layout;
}
