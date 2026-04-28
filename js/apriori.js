// ─── Apriori Algorithm (Pure JS) ───

/**
 * Parse raw text input into an array of transactions.
 * Each line = one transaction; items separated by commas.
 */
function parseTransactions(raw) {
  return raw
    .trim()
    .split('\n')
    .filter(line => line.trim() !== '')
    .map(line =>
      line
        .split(',')
        .map(item => item.trim().toLowerCase())
        .filter(item => item !== '')
    );
}

/**
 * Create a unique string key from a sorted array of items.
 */
function itemsetKey(items) {
  return [...items].sort().join(',');
}

/**
 * Count support for each 1-itemset.
 */
function countSingletons(transactions) {
  const counts = {};
  transactions.forEach(t => {
    const unique = [...new Set(t)];
    unique.forEach(item => {
      const key = itemsetKey([item]);
      counts[key] = (counts[key] || 0) + 1;
    });
  });
  return counts;
}

/**
 * Generate candidate itemsets of size k from frequent itemsets of size k-1.
 */
function generateCandidates(prevKeys, k) {
  const candidates = new Set();
  const prevItems = prevKeys.map(key => key.split(','));

  for (let i = 0; i < prevItems.length; i++) {
    for (let j = i + 1; j < prevItems.length; j++) {
      const merged = [...new Set([...prevItems[i], ...prevItems[j]])].sort();
      if (merged.length === k) {
        candidates.add(itemsetKey(merged));
      }
    }
  }
  return [...candidates];
}

/**
 * Check if an itemset (array) is a subset of a transaction (array).
 */
function isSubset(itemset, transaction) {
  return itemset.every(item => transaction.includes(item));
}

/**
 * Main Apriori function.
 * Returns { frequentItemsets: [{items, support}], rules: [{antecedent, consequent, confidence}] }
 */
function apriori(transactions, minSupport, minConfidence) {
  const n = transactions.length;
  if (n === 0) return { frequentItemsets: [], rules: [] };

  // ── Step 1: Find frequent 1-itemsets ──
  const singleCounts = countSingletons(transactions);
  let frequent = {};
  for (const [key, count] of Object.entries(singleCounts)) {
    const sup = count / n;
    if (sup >= minSupport) {
      frequent[key] = sup;
    }
  }

  const allFrequent = { ...frequent };
  let k = 2;

  // ── Step 2: Iteratively find frequent k-itemsets ──
  while (Object.keys(frequent).length > 0) {
    const candidates = generateCandidates(Object.keys(frequent), k);
    const candidateCounts = {};
    candidates.forEach(c => (candidateCounts[c] = 0));

    transactions.forEach(t => {
      candidates.forEach(c => {
        if (isSubset(c.split(','), t)) {
          candidateCounts[c]++;
        }
      });
    });

    frequent = {};
    for (const [key, count] of Object.entries(candidateCounts)) {
      const sup = count / n;
      if (sup >= minSupport) {
        frequent[key] = sup;
      }
    }

    Object.assign(allFrequent, frequent);
    k++;
  }

  // ── Step 3: Build the result array ──
  const frequentItemsets = Object.entries(allFrequent).map(([key, support]) => ({
    items: key.split(','),
    support: support,
  }));

  // ── Step 4: Generate association rules ──
  const rules = [];
  for (const [key, support] of Object.entries(allFrequent)) {
    const items = key.split(',');
    if (items.length < 2) continue;

    const subsets = getNonEmptySubsets(items);
    subsets.forEach(antecedent => {
      const consequent = items.filter(i => !antecedent.includes(i));
      if (consequent.length === 0) return;

      const antKey = itemsetKey(antecedent);
      if (allFrequent[antKey] === undefined) return;

      const confidence = support / allFrequent[antKey];
      if (confidence >= minConfidence) {
        rules.push({
          antecedent,
          consequent,
          confidence,
          support,
        });
      }
    });
  }

  return { frequentItemsets, rules };
}

/**
 * Get all non-empty proper subsets of an array.
 */
function getNonEmptySubsets(arr) {
  const result = [];
  const total = 1 << arr.length;
  for (let i = 1; i < total - 1; i++) {
    const subset = [];
    for (let j = 0; j < arr.length; j++) {
      if (i & (1 << j)) subset.push(arr[j]);
    }
    result.push(subset);
  }
  return result;
}
