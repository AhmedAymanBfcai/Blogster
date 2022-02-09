// To locate any code that touches many different parts of out project.

const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util'); //Built in node runtime, Has some function utils we can use.

const redisUrl = 'redis://127.0.0.1:6379';
const client = redis.createClient(redisUrl);
client.get = util.promisify(client.get); // To promisify a function (To return a promise instead of using callback)
const exec = mongoose.Query.prototype.exec; // To get a reference to the existing default exec function that is defined on a mongoose query. UnTouched copy of the query supposed to be executed.

// We need to override exec function and adding some additional logic for it. Must be not an arrow function (as of this).
mongoose.Query.prototype.exec = async function () {
  //Object.assign is used to safely copy properties from one object to another.
  const key = JSON.stringify(
    Object.assign({}, this.getQuery(), {
      collection: this.mongooseCollection.name,
    })
  );

  // See if we have a value for 'key' in redis
  const cacheValue = await client.get(key);

  // If we do, return that
  if (cacheValue) {
    //Creating a new instance of the query model and storing it in a doc const.
    const doc = JSON.parse(cachedValue);

    // To take all the data we've stored and try to turn it into an actual document.
    // this.model is a reference of the model that represents this query or this query is attached to.
    return Array.isArray(doc)
      ? doc.map((d) => new this.model(d))
      : new this.model(doc);
  }

  //Otherwise, issue the query and store the result in redis.
  const result = await exec.apply(this, arguments);
  client.set(key, JSON.stringify(result));
  return result;
};

// exec returns Mongoose Documents
// Redis handles JSON.
