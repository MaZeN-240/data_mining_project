# Data Mining Lab — Apriori, FP-Growth & K-Means

An interactive web application for exploring three fundamental data mining algorithms, built with **vanilla HTML, CSS & JavaScript** (no frameworks, no build tools).

## Algorithms

| Algorithm | Purpose |
|-----------|---------|
| **Apriori** | Finds frequent itemsets and generates association rules from transaction data |
| **FP-Growth** | Efficiently mines frequent itemsets without candidate generation using an FP-tree |
| **K-Means** | Clusters 2-D data points into K groups and visualises the result on a scatter plot |

## How to Use

1. Open **`index.html`** in any modern browser.
2. Pick an algorithm tab (**Apriori**, **FP-Growth**, or **K-Means**).
3. Enter your own data **or** click **Load Example** to populate sample data.
4. Adjust parameters (support, confidence, K, etc.) and click **Run**.
5. Results appear below — tables for Apriori rules, and a table + scatter plot for K-Means.

## Project Structure

```
data_mining_project/
├── index.html        # Main page
├── style.css         # All styles
├── js/
│   ├── apriori.js    # Apriori algorithm
│   ├── fpgrowth.js   # FP-Growth algorithm
│   ├── kmeans.js     # K-Means algorithm
│   └── app.js        # UI controller
└── README.md
```

## Input Format

### Apriori & FP-Growth
One transaction per line, items separated by commas:
```
milk, bread, butter
milk, bread
bread, butter, jam
```

### K-Means
One point per line, x and y separated by a comma:
```
1.0, 2.0
8.0, 8.0
1.0, 8.5
```

## License

This project is for educational purposes.
