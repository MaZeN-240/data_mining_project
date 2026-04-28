// ─── K-Means Algorithm  ───

function parsePoints(raw) {
  return raw
    .trim()
    .split('\n')
    .filter(line => line.trim() !== '')
    .map(line => {
      const parts = line.split(',').map(v => parseFloat(v.trim()));
      return parts.filter(v => !isNaN(v));
    })
    .filter(p => p.length >= 2);
}

/**
 * Euclidean distance between two points.
 */
function euclideanDistance(a, b) {
  return Math.sqrt(a.reduce((sum, val, i) => sum + (val - b[i]) ** 2, 0));
}

/**
 * Manhattan distance between two points.
 */
function manhattanDistance(a, b) {
  return a.reduce((sum, val, i) => sum + Math.abs(val - b[i]), 0);
}

/**
 * Init centroids either from user-selected indices or default to the first k points.
 */
function initCentroids(data, k, initialIndicesStr) {
  if (initialIndicesStr && initialIndicesStr.trim() !== '') {
    const indices = initialIndicesStr.split(',')
      .map(v => parseInt(v.trim(), 10) - 1)
      .filter(v => !isNaN(v) && v >= 0 && v < data.length);
      
    if (indices.length > 0) {
      const selected = [];
      const used = new Set();
      
      for (const i of indices) {
        if (!used.has(i)) {
          selected.push([...data[i]]);
          used.add(i);
        }
        if (selected.length === k) break;
      }
      
      // If fewer valid indices were provided than k, fill the rest from unused points randomly
      if (selected.length < k) {
        const remainingIdxs = Array.from(data.keys()).filter(idx => !used.has(idx)).sort(() => Math.random() - 0.5);
        for(let i = 0; i < remainingIdxs.length && selected.length < k; i++) {
           selected.push([...data[remainingIdxs[i]]]);
        }
      }
      return selected;
    }
  }

  // Default: first k points
  return data.slice(0, k).map(p => [...p]);
}

/**
 * Assign each point to the nearest centroid. Returns array of cluster indices.
 */
function assignClusters(data, centroids, distanceMetric) {
  const distFn = distanceMetric === 'manhattan' ? manhattanDistance : euclideanDistance;
  return data.map(point => {
    let minDist = Infinity;
    let minIdx = 0;
    centroids.forEach((c, idx) => {
      const d = distFn(point, c);
      if (d < minDist) {
        minDist = d;
        minIdx = idx;
      }
    });
    return minIdx;
  });
}

/**
 * Recompute centroids as the mean of all points in each cluster.
 */
function recomputeCentroids(data, assignments, k) {
  const dims = data[0].length;
  const sums = Array.from({ length: k }, () => new Array(dims).fill(0));
  const counts = new Array(k).fill(0);

  data.forEach((point, i) => {
    const c = assignments[i];
    counts[c]++;
    point.forEach((v, d) => (sums[c][d] += v));
  });

  return sums.map((s, i) => {
    if (counts[i] === 0) {
      // If a cluster is empty, re-pick a random point
      return [...data[Math.floor(Math.random() * data.length)]];
    }
    return s.map(v => v / counts[i]);
  });
}

/**
 * Main K-Means function.
 * Returns { centroids, clusters, iterations }
 *   centroids: [[x, y], ...]
 *   clusters:  [ [point, ...], ... ]
 */
function kMeans(data, k, maxIter = 100, distanceMetric = 'euclidean', initialIndicesStr = '') {
  if (data.length === 0 || k <= 0) {
    return { centroids: [], clusters: [], iterations: 0 };
  }

  k = Math.min(k, data.length);
  let centroids = initCentroids(data, k, initialIndicesStr);
  let assignments = [];
  let iter = 0;

  for (iter = 0; iter < maxIter; iter++) {
    assignments = assignClusters(data, centroids, distanceMetric);
    const newCentroids = recomputeCentroids(data, assignments, k);

    // Convergence check
    const converged = centroids.every((c, i) =>
      c.every((v, d) => Math.abs(v - newCentroids[i][d]) < 1e-9)
    );
    centroids = newCentroids;
    if (converged) break;
  }

  // Group points into clusters
  const clusters = Array.from({ length: k }, () => []);
  data.forEach((point, i) => clusters[assignments[i]].push(point));

  return { centroids, clusters, iterations: iter + 1 };
}
