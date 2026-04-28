// ─── App Controller ───

document.addEventListener('DOMContentLoaded', () => {
  // ── Tab switching ──
  const tabs = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab).classList.add('active');
    });
  });

  // ══════════════════════════════════
  //  APRIORI
  // ══════════════════════════════════
  const aprioriForm = document.getElementById('apriori-form');
  const aprioriResult = document.getElementById('apriori-result');
  const aprioriExample = document.getElementById('apriori-example');

  aprioriExample.addEventListener('click', () => {
    document.getElementById('transactions-input').value =
      'milk, bread, butter\nmilk, bread\nmilk, butter\nbread, butter\nmilk, bread, butter, jam';
    document.getElementById('min-support').value = '0.4';
    document.getElementById('min-confidence').value = '0.5';
  });

  aprioriForm.addEventListener('submit', e => {
    e.preventDefault();
    const raw = document.getElementById('transactions-input').value;
    const minSup = parseFloat(document.getElementById('min-support').value);
    const minConf = parseFloat(document.getElementById('min-confidence').value);

    if (!raw.trim()) {
      showError(aprioriResult, 'Please enter at least one transaction.');
      return;
    }
    if (isNaN(minSup) || minSup <= 0 || minSup > 1) {
      showError(aprioriResult, 'Min Support must be between 0 and 1.');
      return;
    }
    if (isNaN(minConf) || minConf <= 0 || minConf > 1) {
      showError(aprioriResult, 'Min Confidence must be between 0 and 1.');
      return;
    }

    const transactions = parseTransactions(raw);
    const { frequentItemsets, rules } = apriori(transactions, minSup, minConf);
    renderAssociationResults(aprioriResult, frequentItemsets, rules, transactions.length, 'Apriori');
  });

  // ══════════════════════════════════
  //  FP-GROWTH
  // ══════════════════════════════════
  const fpForm = document.getElementById('fpgrowth-form');
  const fpResult = document.getElementById('fpgrowth-result');
  const fpExample = document.getElementById('fpgrowth-example');

  fpExample.addEventListener('click', () => {
    document.getElementById('fp-transactions-input').value =
      'milk, bread, butter\nmilk, bread\nmilk, butter\nbread, butter\nmilk, bread, butter, jam';
    document.getElementById('fp-min-support').value = '0.4';
    document.getElementById('fp-min-confidence').value = '0.5';
  });

  fpForm.addEventListener('submit', e => {
    e.preventDefault();
    const raw = document.getElementById('fp-transactions-input').value;
    const minSup = parseFloat(document.getElementById('fp-min-support').value);
    const minConf = parseFloat(document.getElementById('fp-min-confidence').value);

    if (!raw.trim()) {
      showError(fpResult, 'Please enter at least one transaction.');
      return;
    }
    if (isNaN(minSup) || minSup <= 0 || minSup > 1) {
      showError(fpResult, 'Min Support must be between 0 and 1.');
      return;
    }
    if (isNaN(minConf) || minConf <= 0 || minConf > 1) {
      showError(fpResult, 'Min Confidence must be between 0 and 1.');
      return;
    }

    const transactions = parseTransactions(raw);
    const { frequentItemsets, rules } = fpGrowth(transactions, minSup, minConf);
    renderAssociationResults(fpResult, frequentItemsets, rules, transactions.length, 'FP-Growth');
  });

  // ══════════════════════════════════
  //  K-MEANS
  // ══════════════════════════════════
  const kmeansForm = document.getElementById('kmeans-form');
  const kmeansResult = document.getElementById('kmeans-result');
  const kmeansExample = document.getElementById('kmeans-example');

  kmeansExample.addEventListener('click', () => {
    document.getElementById('points-input').value =
      '1.0, 2.0\n1.5, 1.8\n1.0, 1.0\n0.5, 1.5\n8.0, 8.0\n8.5, 7.5\n9.0, 8.0\n8.0, 9.0\n1.0, 8.0\n1.5, 8.5\n0.5, 9.0\n1.0, 9.5';
    document.getElementById('k-value').value = '3';
    document.getElementById('max-iterations').value = '100';
  });

  kmeansForm.addEventListener('submit', e => {
    e.preventDefault();
    const raw = document.getElementById('points-input').value;
    const k = parseInt(document.getElementById('k-value').value, 10);
    const maxIter = parseInt(document.getElementById('max-iterations').value, 10) || 100;
    const distanceMetric = document.getElementById('distance-metric').value;
    const initialCentroids = document.getElementById('initial-centroids').value;

    if (!raw.trim()) {
      showError(kmeansResult, 'Please enter at least one data point.');
      return;
    }

    const data = parsePoints(raw);
    if (data.length === 0) {
      showError(kmeansResult, 'Could not parse any valid data points.');
      return;
    }
    if (isNaN(k) || k < 1) {
      showError(kmeansResult, 'K must be a positive integer.');
      return;
    }
    if (k > data.length) {
      showError(kmeansResult, `K (${k}) cannot be larger than the number of data points (${data.length}).`);
      return;
    }

    const result = kMeans(data, k, maxIter, distanceMetric, initialCentroids);
    renderKMeansResults(kmeansResult, result, data);
  });
});

// ─── Render Helpers ───

function showError(container, msg) {
  container.innerHTML = `<div class="error-msg"><span class="error-icon">!</span> ${msg}</div>`;
  container.classList.add('visible');
}

/**
 * Shared renderer for both Apriori and FP-Growth results.
 */
function renderAssociationResults(container, itemsets, rules, totalTx, algorithmName) {
  // Sort itemsets: largest first, then by support desc
  itemsets.sort((a, b) => b.items.length - a.items.length || b.support - a.support);

  let html = `<div class="result-header">
    <h3>${algorithmName} Results</h3>
    <span class="badge">${totalTx} transactions analysed</span>
  </div>`;

  // Frequent Itemsets Table
  html += `<h4>Frequent Itemsets <span class="count">(${itemsets.length})</span></h4>`;
  if (itemsets.length === 0) {
    html += `<p class="empty">No frequent itemsets found. Try lowering the minimum support.</p>`;
  } else {
    html += `<div class="table-wrap"><table>
      <thead><tr><th>#</th><th>Itemset</th><th>Support</th></tr></thead><tbody>`;
    itemsets.forEach((is, i) => {
      html += `<tr><td>${i + 1}</td><td><span class="itemset">{${is.items.join(', ')}}</span></td>
        <td>${(is.support * 100).toFixed(1)}%</td></tr>`;
    });
    html += `</tbody></table></div>`;
  }

  // Association Rules Table
  html += `<h4 style="margin-top:1.5rem">Association Rules <span class="count">(${rules.length})</span></h4>`;
  if (rules.length === 0) {
    html += `<p class="empty">No rules generated. Try lowering thresholds.</p>`;
  } else {
    html += `<div class="table-wrap"><table>
      <thead><tr><th>#</th><th>Rule</th><th>Confidence</th><th>Support</th></tr></thead><tbody>`;
    rules.forEach((r, i) => {
      html += `<tr><td>${i + 1}</td>
        <td><span class="itemset">{${r.antecedent.join(', ')}}</span> <span class="arrow">&rarr;</span> <span class="itemset">{${r.consequent.join(', ')}}</span></td>
        <td>${(r.confidence * 100).toFixed(1)}%</td>
        <td>${(r.support * 100).toFixed(1)}%</td></tr>`;
    });
    html += `</tbody></table></div>`;
  }

  container.innerHTML = html;
  container.classList.add('visible');
}

/**
 * K-Means results — centroids table + cluster membership (no scatter plot).
 */
function renderKMeansResults(container, result, data) {
  const { centroids, clusters, iterations } = result;

  let html = `<div class="result-header">
    <h3>K-Means Results</h3>
    <span class="badge">${data.length} points | ${centroids.length} clusters | ${iterations} iterations</span>
  </div>`;

  // Centroids Table
  html += `<h4>Centroids</h4>
  <div class="table-wrap"><table>
    <thead><tr><th>Cluster</th><th>Centroid</th><th>Size</th></tr></thead><tbody>`;
  centroids.forEach((c, i) => {
    const label = `Cluster ${i + 1}`;
    const coords = c.map(v => v.toFixed(2)).join(', ');
    html += `<tr><td><span class="cluster-dot" style="background:${clusterColor(i)}"></span>${label}</td>
      <td>(${coords})</td><td>${clusters[i].length}</td></tr>`;
  });
  html += `</tbody></table></div>`;

  // Cluster Membership Table
  html += `<h4 style="margin-top:1.5rem">Cluster Membership</h4>
  <div class="table-wrap"><table>
    <thead><tr><th>Cluster</th><th>Points</th></tr></thead><tbody>`;
  clusters.forEach((cluster, i) => {
    const pointsStr = cluster.map(p => `(${p.map(v => v.toFixed(2)).join(', ')})`).join(', ');
    html += `<tr><td><span class="cluster-dot" style="background:${clusterColor(i)}"></span>Cluster ${i + 1}</td>
      <td class="points-list">${pointsStr}</td></tr>`;
  });
  html += `</tbody></table></div>`;

  container.innerHTML = html;
  container.classList.add('visible');
}

const CLUSTER_COLORS = [
  '#415a77', '#778da9', '#e0e1dd', '#5e81ac', '#88c0d0',
  '#81a1c1', '#b48ead', '#a3be8c', '#bf616a', '#d08770',
];

function clusterColor(i) {
  return CLUSTER_COLORS[i % CLUSTER_COLORS.length];
}
