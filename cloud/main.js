
Parse.Cloud.define('hello', function(req, res) {
  res.success('Hi');
});

Parse.Cloud.define('destroy-client-info', require('./destroy-client-info')(Parse));