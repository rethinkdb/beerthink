# BeerThink

This application displays an alphabetized list of beers and breweries. The user can select an item to see additional information. It uses a data dump from the [Open Beer Database](https://github.com/brewdega/open-beer-database-dumps), which contains information about roughly 4,400 beers and 1,200 breweries.

BeerThink's backend, which is written with [RethinkDB](http://rethinkdb.com/) and node.js, exposes the beer list through a paginated API, returning 50 records at a time. The BeerThink frontend is built with Ionic, a popular AngularJS-based JavaScript framework designed for mobile web apps. BeerThink uses an infinite scrolling list to present the beers in alphabetical order.

![Beer List](/screenshots/beerlist.png?raw=true)
![Beer Details](/screenshots/beerdetail.png?raw=true)
