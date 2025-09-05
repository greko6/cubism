# Cubism.js v2.0

Cubism.js is a [D3](http://d3js.org) plugin for visualizing time series. Use Cubism to construct better realtime dashboards, pulling data from [Graphite](docs/Graphite.md), [Cube](docs/Cube.md), [QuestDB](docs/QuestDB.md), and other sources. Cubism is available under the [Apache License](LICENSE).

## What's New in v2.0

🚀 **Major Updates:**
- **D3 v7 Compatibility** - Full support for modern D3.js v7 (breaking change from v3)
- **QuestDB Integration** - New data source for [QuestDB](https://questdb.io/) time series database
- **Modern Build System** - Updated build process with npm scripts
- **Interactive Demo** - New working demo with horizon charts and proper styling ⭐ *New*

## Quick Start

```bash
npm install
npm run build    # Build cubism.v2.js and cubism.v2.min.js
npm run demo     # Run demo server
```

**[📊 View Interactive Demo](demo/index.html)** - See Cubism v2.0 in action with horizon charts

## Data Sources

Cubism supports multiple time series data sources:

- **[Graphite](docs/Graphite.md)** - Scalable time series database
- **[Cube](docs/Cube.md)** - Open-source time series analysis
- **[QuestDB](docs/QuestDB.md)** - High-performance time series database ⭐ *New in v2.0*
- **[Librato](docs/Librato.md)** - Cloud monitoring service
- **[Ganglia](docs/Ganglia.md)** - Distributed monitoring system

## Usage Example

```javascript
// Create context
var context = cubism.context()
    .serverDelay(5 * 1000)
    .step(10000)
    .size(1440);

// QuestDB source (new in v2.0)
var questdb = context.questdb({host: "http://localhost:9000"});
var cpuMetric = questdb.metric({
    table: "system_metrics",
    column: "cpu_usage",
    aggregation: "avg"
});

// Create horizon charts
d3.select("#charts").selectAll(".horizon")
    .data([cpuMetric])
    .enter().append("div")
    .attr("class", "horizon")
    .call(context.horizon().extent([0, 100]));
```

## Migration from v1.x

**Breaking Changes:**
- Requires D3 v7 (was v3)
- Built files now named `cubism.v2.js` / `cubism.v2.min.js`
- Event handling API updated for D3 v7

**Migration Steps:**
1. Update D3 to v7: `<script src="https://d3js.org/d3.v7.min.js"></script>`
2. Update Cubism: `<script src="cubism.v2.js"></script>`
3. Test your existing charts (most should work without changes)

Want to learn more? [See the wiki.](https://github.com/square/cubism/wiki)
