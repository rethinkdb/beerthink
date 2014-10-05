
var express = require("express");
var r = require("rethinkdb");
var Q = require("q");
var fs = require("q-io/fs");

var config = require("./config");

var app = express();
app.use(express.static(__dirname + "/public"));

r.connect(config.database).then(function(conn) {
  this.conn = conn;
  return r.dbCreate(config.database.db).run(conn);
})
.then(function() {
  return Q.all([
    r.tableCreate("beers").run(this.conn),
    r.tableCreate("breweries").run(this.conn)])
})
.then(function() {
  return Q.all([
    r.table("beers").indexCreate("name").run(this.conn),
    r.table("breweries").indexCreate("name").run(this.conn),
    r.table("breweries").indexCreate("place", {geo:true}).run(this.conn)])
})
.then(function() {
  return Q.all([
    fs.read("data/beers.json"),
    fs.read("data/breweries.json")])
})
.then(function(content) {
  return Q.all([
    r.table("beers").insert(r.json(content[0])).run(this.conn),
    r.table("breweries").insert(
      r.json(content[1]).merge(function(item) {
        return {
          place: r.point(
            item("longitude").coerceTo("number"),
            item("latitude").coerceTo("number"))
        }
      })).run(this.conn)
  ])
})
.error(function(err) {
  if (err.msg.indexOf("already exists") == -1)
    console.log(err);
})
.finally(function() {
  if (this.conn) this.conn.close();
});

function paginate(table, index, limit, last) {
  return (!last ? table : table
    .between(last, null, {leftBound: "open", index: index}))
  .orderBy({index: index}).limit(limit)
}

app.use(function(req, res, next) {
  r.connect(config.database).then(function(conn) {
    req.db = conn;
    next();
  }).error(function(err) {
    res.status(500).json({error: err});
  });
});

app.get("/breweries", function(req, res) {
  var last = req.param("last");

  paginate(r.table("breweries"), "name", 50, last).run(req.db)
  .then(function(cursor) { return cursor.toArray(); })
  .then(function(output) { res.json(output); })
  .error(function(err) {
    res.status(500).json({error: err});
  });
});

app.get("/beers", function(req, res) {
  var last = req.param("last");

  paginate(r.table("beers"), "name", 50, last)
    .eqJoin("brewery_id", r.table("breweries"))
    .map(function(item) {
      return item("left").merge({"brewery": item("right")})
    }).without("brewery_id").run(req.db)
  .then(function(cursor) { return cursor.toArray(); })
  .then(function(output) { res.json(output); })
  .error(function(err) {
    res.status(500).json({error: err});
  });
});

app.get("/nearby", function(req, res) {
  var lat = parseFloat(req.param("latitude"));
  var lon = parseFloat(req.param("longitude"));

  if (!lat || !lon)
    return res.status(500).json({error: "Invalid point"});

  r.table("breweries")
    .getNearest(r.point(lon, lat),
      {index: "place", maxDist: 200, unit: "mi", maxResults: 50})
    .map(function(item) {
      return item("doc").merge({distance: item("dist")})
    }).run(req.db)
  .then(function(cursor) { return cursor.toArray(); })
  .then(function(output) { res.json(output); })
  .error(function(err) {
    res.status(500).json({error: err});
  });
});

app.use(function(req, res, next) {
  if (req.db) req.db.close();
});

app.listen(config.port);
console.log("Listening on port:", config.port);
