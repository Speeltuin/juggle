/**
 * Inserts the wipCounters into mongo.
 */
var insertWipCounters = function() {
  db.wipCounters.insert([
    {name: "Development", amount: 5, createdAt: new Date()},
    {name: "Code review", amount: 4, createdAt: new Date()},
    {name: "Acceptance", amount: 1, createdAt: new Date()}
  ]);
}

/**
 * Updates a wipCounter.
 */
var updateWipCounters = function() {
  WipCounters.update({name: "Development"},{$set: {amount: 8}});
}
