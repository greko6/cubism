> [Wiki](Home) ▸ [API Reference](API-Reference) ▸ <b>QuestDB</b>

A source for [QuestDB](https://questdb.io/) metrics. To create a source, first create a [context](Context). Then, use [context.questdb](Context#wiki-questdb) to specify the URL and path to the QuestDB server:

```js
var context = cubism.context()
    .serverDelay(5 * 1000) // allow 5 seconds of collection lag
    .step(10000) // ten seconds per value
    .size(1440); // fetch 1440 values (24 hours at 1min intervals)
var questdb = context.questdb({"host": "http://localhost:9000", "apiPath": "/exec"});
```

After you create the context add some metrics:

<a name="metric" href="#wiki-metric">#</a> questdb.<b>metric</b>

Creates a new [metric](Metric) for a given QuestDB table and column. You need to specify table name, column name, and optionally aggregation function, timestamp column, and WHERE conditions:

```js
var system_metrics = [
  questdb.metric({
    "table": "system_stats", 
    "column": "cpu_usage", 
    "timestampColumn": "ts",
    "aggregation": "avg",
    "where": "host = 'web1'"
  }).alias("web1 cpu"),
  
  questdb.metric({
    "table": "system_stats", 
    "column": "memory_usage", 
    "timestampColumn": "ts",
    "aggregation": "max",
    "where": "host = 'web1'"
  }).alias("web1 memory"),
  
  questdb.metric({
    "table": "network_stats", 
    "column": "bytes_per_sec", 
    "timestampColumn": "timestamp",
    "aggregation": "sum"
  }).alias("total network")
];
```

### Configuration Options

- **table** (required): QuestDB table name
- **column** (required): Column name to aggregate
- **timestampColumn** (optional): Timestamp column name (default: `"timestamp"`)
- **aggregation** (optional): SQL aggregation function (default: `"avg"`)
  - Common values: `"avg"`, `"sum"`, `"count"`, `"min"`, `"max"`
- **where** (optional): Additional WHERE clause conditions
- **titleGenerator** (optional): Custom function to generate metric titles
- **onChangeCallback** (optional): Custom callback function for data changes

### Advanced Usage

```js
// Custom title generator
var customMetric = questdb.metric({
  "table": "app_metrics",
  "column": "response_time",
  "aggregation": "percentile",
  "where": "service = 'api' AND status = 200",
  "titleGenerator": function(info) {
    return "API P95 Response Time";
  }
});

// With change callback
var monitoredMetric = questdb.metric({
  "table": "alerts",
  "column": "error_count",
  "aggregation": "sum",
  "onChangeCallback": function(start, stop) {
    console.log("Alert data updated for period:", start, "to", stop);
  }
});
```

After that you just need to add some colors to use and append the metrics into the DOM:

```js
var horizon = context.horizon().colors(["#08519c", "#3182bd", "#6baed6", "#fee6ce", "#fdae6b", "#e6550d"]);

d3.select("body").selectAll(".axis")
    .data(["top", "bottom"])
  .enter().append("div").attr("class", "fluid-row")
    .attr("class", function(d) { return d + " axis"; })
    .each(function(d) { d3.select(this).call(context.axis().ticks(12).orient(d)); });

d3.select("body").append("div")
    .attr("class", "rule")
    .call(context.rule());

d3.select("body").selectAll(".horizon")
    .data(system_metrics)
  .enter().insert("div", ".bottom")
    .attr("class", "horizon").call(horizon.extent([0, 100]));

context.on("focus", function(i) {
  d3.selectAll(".value").style("right", i == null ? null : context.size() - 1 - i + "px");
});
```

Please note the **horizon.extent([0, 100])**. Those are minimum and maximum values for your metric. Choose those carefully based on your expected data range.

### SQL Query Generation

The QuestDB source automatically generates time-bucketed SQL queries using QuestDB's `SAMPLE BY` functionality:

```sql
SELECT 
  dateadd('s', (cast((timestamp - timestamp('2023-01-01T00:00:00.000Z')) / 1000000 as long) / 10) * 10, 
         timestamp('2023-01-01T00:00:00.000Z')) as time_bucket,
  avg(cpu_usage) as value 
FROM system_stats 
WHERE timestamp >= '2023-01-01T00:00:00.000Z' 
  AND timestamp < '2023-01-01T01:00:00.000Z' 
  AND host = 'web1'
SAMPLE BY 10s 
ORDER BY time_bucket
```

<a name="toString" href="#wiki-toString">#</a> questdb.<b>toString</b>()

Returns the QuestDB server URL and API path used by the source [constructor](#wiki-questdb).