cubism_contextPrototype.questdb = function(config) {
  var host = 'http://localhost:9000',
      apiPath = '/exec';

  if (arguments.length) {
    if (config.host) {
      host = config.host;
    }

    if (config.apiPath) {
      apiPath = config.apiPath;
    }
  }

  var source = {},
      context = this;

  source.metric = function(metricInfo) {

    /* Store the members from metricInfo into local variables. */
    var table = metricInfo.table,
        column = metricInfo.column,
        timestampColumn = metricInfo.timestampColumn || 'timestamp',
        whereClause = metricInfo.where || '',
        aggregation = metricInfo.aggregation || 'avg',
        titleGenerator = metricInfo.titleGenerator ||
          /* Reasonable default for titleGenerator. */
          function(unusedMetricInfo) {
            return (aggregation + '(' + column + ') from ' + table + 
                   (whereClause ? ' where ' + whereClause : ''));
          },
        onChangeCallback = metricInfo.onChangeCallback;

    var questdbMetric = context.metric(function(start, stop, step, callback) {

      function constructQuestDBQuery() {
        var startTime = Math.floor(start / 1000); // Convert to seconds
        var stopTime = Math.floor(stop / 1000);
        var stepSeconds = Math.floor(step / 1000);
        
        // Create time buckets for the query
        var query = 'SELECT ' +
          'dateadd(\'s\', (cast((' + timestampColumn + ' - timestamp(\'' + 
          new Date(start).toISOString() + '\')) / 1000000 as long) / ' + stepSeconds + ') * ' + 
          stepSeconds + ', timestamp(\'' + new Date(start).toISOString() + '\')) as time_bucket, ' +
          aggregation + '(' + column + ') as value ' +
          'FROM ' + table + ' ' +
          'WHERE ' + timestampColumn + ' >= \'' + new Date(start).toISOString() + '\' ' +
          'AND ' + timestampColumn + ' < \'' + new Date(stop).toISOString() + '\' ' +
          (whereClause ? 'AND ' + whereClause + ' ' : '') +
          'SAMPLE BY ' + stepSeconds + 's ' +
          'ORDER BY time_bucket';
          
        return query;
      }

      function constructRequestUrl() {
        var query = constructQuestDBQuery();
        return host + apiPath + '?query=' + encodeURIComponent(query);
      }

      d3.json(constructRequestUrl()).then(function(result) {
        if (!result || !result.dataset) {
          return callback(new Error("Unable to fetch QuestDB data"));
        }

        // Parse QuestDB response format
        var data = [];
        var expectedPoints = Math.ceil((stop - start) / step);
        
        // Initialize array with nulls
        for (var i = 0; i < expectedPoints; i++) {
          data[i] = null;
        }
        
        // Fill in actual data points
        if (result.dataset && result.dataset.length > 0) {
          result.dataset.forEach(function(row) {
            var timestamp = new Date(row[0]).getTime();
            var value = parseFloat(row[1]);
            var index = Math.floor((timestamp - start) / step);
            
            if (index >= 0 && index < expectedPoints && !isNaN(value)) {
              data[index] = value;
            }
          });
        }

        callback(null, data);
      }).catch(function(error) {
        callback(error);
      });

    }, titleGenerator(metricInfo));

    questdbMetric.toString = function() {
      return titleGenerator(metricInfo);
    };

    /* Allow users to run their custom code each time a questdbMetric changes. */
    if (onChangeCallback) {
      questdbMetric.on('change', onChangeCallback);
    }

    return questdbMetric;
  };

  // Returns the QuestDB host + apiPath.
  source.toString = function() {
    return host + apiPath;
  };

  return source;
};