// To locate any code that touches many different parts of our project.

const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util'); //Built in node runtime, Has some function utils we can use.

const redisUrl = 'redis://127.0.0.1:6379';
const client = redis.createClient(redisUrl);
client.hget = util.promisify(client.hget); // To promisify a function (To return a promise instead of using callback)
const exec = mongoose.Query.prototype.exec; // To get a reference to the existing default exec function that is defined on a mongoose query. UnTouched copy of the query supposed to be executed.

mongoose.Query.prototype.cache = function (options = {}) {
  this.useCache = true; //This is equal the query instance, and we have to use a reqular function as the arrow function will miss with the vlaue of this.
  this.hashKey = JSON.stringify(options.key || ''); // If the user pass a key, It will be assigned for hash key so that we can use it in the exec function.
  return this; // To make the function chinable if it called to any property.
};

// We need to override exec function and adding some additional logic for it. Must be not an arrow function (as of this).
mongoose.Query.prototype.exec = async function () {
  if (!this.useCache) {
    // If useCache is false we will skip all the caching logic and simply run the original exec function. Which does not include any caching logic.
    return exec.apply(this, arguments);
  }
  // IF useCache is true we will run all the caching logic what we want.
  //Object.assign is used to safely copy properties from one object to another.
  const key = JSON.stringify(
    Object.assign({}, this.getQuery(), {
      collection: this.mongooseCollection.name,
    })
  );

  // See if we have a value for 'key' in redis
  const cacheValue = await client.hget(this.hashkey, key);

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
  client.hset(this.hashKey, JSON.stringify(result), 'EX', 10); //EX refers to expiratioin time, 10 (seconds).
  return result;
};

// exec returns Mongoose Documents
// Redis handles JSON.
