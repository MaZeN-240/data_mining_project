// ─── FP-Growth Algorithm (Pure JS) ───

/**
 * FP-Tree Node
 */
class FPNode {
  constructor(item, count, parent) {
    this.item = item;
    this.count = count;
    this.parent = parent;
    this.children = {};
    this.next = null; // link to next node with same item
  }
}

/**
 * Build the FP-Tree from transactions.
 * Returns { root, headerTable }
 */
function buildFPTree(transactions, minSupportCount) {
  // Step 1: Count item frequencies
  const itemCounts = {};
  transactions.forEach(t => {
    t.forEach(item => {
      itemCounts[item] = (itemCounts[item] || 0) + 1;
    });
  });

  // Filter infrequent items
  const frequentItems = {};
  for (const [item, count] of Object.entries(itemCounts)) {
    if (count >= minSupportCount) {
      frequentItems[item] = count;
    }
  }

  if (Object.keys(frequentItems).length === 0) {
    return { root: null, headerTable: {} };
  }

  // Header table: item -> { count, nodeLink }
  const headerTable = {};
  for (const [item, count] of Object.entries(frequentItems)) {
    headerTable[item] = { count, nodeLink: null };
  }

  // Step 2: Build tree
  const root = new FPNode(null, 0, null);

  transactions.forEach(transaction => {
    // Filter and sort by frequency (descending), then alphabetically for ties
    const filtered = transaction
      .filter(item => item in frequentItems)
      .sort((a, b) => {
        const diff = frequentItems[b] - frequentItems[a];
        return diff !== 0 ? diff : a.localeCompare(b);
      });

    if (filtered.length === 0) return;

    let current = root;
    filtered.forEach(item => {
      if (current.children[item]) {
        current.children[item].count++;
      } else {
        const newNode = new FPNode(item, 1, current);
        current.children[item] = newNode;

        // Update header table link
        if (headerTable[item].nodeLink === null) {
          headerTable[item].nodeLink = newNode;
        } else {
          let node = headerTable[item].nodeLink;
          while (node.next !== null) {
            node = node.next;
          }
          node.next = newNode;
        }
      }
      current = current.children[item];
    });
  });

  return { root, headerTable };
}

/**
 * Check if tree has a single path.
 */
function isSinglePath(node) {
  const children = Object.values(node.children);
  if (children.length === 0) return true;
  if (children.length > 1) return false;
  return isSinglePath(children[0]);
}

/**
 * Get all items along a single path.
 */
function getSinglePathItems(node) {
  const items = [];
  let current = node;
  while (Object.keys(current.children).length > 0) {
    const child = Object.values(current.children)[0];
    items.push({ item: child.item, count: child.count });
    current = child;
  }
  return items;
}

/**
 * Find conditional pattern base for an item.
 */
function findConditionalPatternBase(headerTable, item) {
  const patterns = [];
  let node = headerTable[item].nodeLink;

  while (node !== null) {
    const prefix = [];
    let parent = node.parent;
    while (parent !== null && parent.item !== null) {
      prefix.push(parent.item);
      parent = parent.parent;
    }
    if (prefix.length > 0) {
      patterns.push({ pattern: prefix.reverse(), count: node.count });
    }
    node = node.next;
  }

  return patterns;
}

/**
 * Build conditional FP-Tree from a conditional pattern base.
 */
function buildConditionalTree(patterns, minSupportCount) {
  const transactions = [];
  patterns.forEach(({ pattern, count }) => {
    for (let i = 0; i < count; i++) {
      transactions.push([...pattern]);
    }
  });
  return buildFPTree(transactions, minSupportCount);
}

/**
 * Mine the FP-Tree recursively.
 * Returns array of { items: [...], support: count }
 */
function mineFPTree(headerTable, root, minSupportCount, prefix, results) {
  if (root === null) return;

  // Sort header table items by frequency (ascending) for bottom-up mining
  const sortedItems = Object.entries(headerTable)
    .sort((a, b) => a[1].count - b[1].count)
    .map(([item]) => item);

  for (const item of sortedItems) {
    // New frequent pattern
    const newPattern = [...prefix, item];
    const support = headerTable[item].count;
    results.push({ items: newPattern, support });

    // Find conditional pattern base
    const conditionalPatterns = findConditionalPatternBase(headerTable, item);

    // Build conditional FP-Tree
    const { root: condRoot, headerTable: condHeader } =
      buildConditionalTree(conditionalPatterns, minSupportCount);

    if (condRoot !== null && Object.keys(condHeader).length > 0) {
      mineFPTree(condHeader, condRoot, minSupportCount, newPattern, results);
    }
  }
}

/**
 * Main FP-Growth function.
 * Returns { frequentItemsets: [{items, support}], rules: [{antecedent, consequent, confidence, support}] }
 */
function fpGrowth(transactions, minSupport, minConfidence) {
  const n = transactions.length;
  if (n === 0) return { frequentItemsets: [], rules: [] };

  const minSupportCount = Math.ceil(minSupport * n);

  // Build FP-Tree
  const { root, headerTable } = buildFPTree(transactions, minSupportCount);

  if (root === null) return { frequentItemsets: [], rules: [] };

  // Mine frequent patterns
  const rawResults = [];
  mineFPTree(headerTable, root, minSupportCount, [], rawResults);

  // Convert to support ratio
  const frequentItemsets = rawResults.map(r => ({
    items: r.items.sort(),
    support: r.support / n,
  }));

  // Build lookup for rule generation
  const supportMap = {};
  frequentItemsets.forEach(fi => {
    const key = fi.items.join(',');
    supportMap[key] = fi.support;
  });

  // Generate association rules
  const rules = [];
  for (const fi of frequentItemsets) {
    if (fi.items.length < 2) continue;

    const subsets = getNonEmptySubsetsFP(fi.items);
    for (const antecedent of subsets) {
      const consequent = fi.items.filter(i => !antecedent.includes(i));
      if (consequent.length === 0) continue;

      const antKey = antecedent.sort().join(',');
      if (supportMap[antKey] === undefined) continue;

      const confidence = fi.support / supportMap[antKey];
      if (confidence >= minConfidence) {
        rules.push({
          antecedent,
          consequent,
          confidence,
          support: fi.support,
        });
      }
    }
  }

  return { frequentItemsets, rules };
}

/**
 * Get all non-empty proper subsets of an array.
 */
function getNonEmptySubsetsFP(arr) {
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
