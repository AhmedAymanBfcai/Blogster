const mongoose = require('mongoose');
const requireLogin = require('../middlewares/requireLogin');

const Blog = mongoose.model('Blog');

module.exports = (app) => {
  app.get('/api/blogs/:id', requireLogin, async (req, res) => {
    const blog = await Blog.findOne({
      _user: req.user.id,
      _id: req.params.id,
    });

    res.send(blog);
  });

  app.get('/api/blogs', requireLogin, async (req, res) => {
    const redis = require('redis');
    const redisUrl = 'https://127.0.0.1:6379';
    const client = redis.createClient(redisUrl);
    const util = require('util'); // Util is a standard lib included in node runtime. It has some utility functions we can use.
    client.get = util.promisify(client.get); // Promisify is a function we can pass it another function and it will return a new standard output for this function (Promies)

    // Do we have any cached data in redis related to this query
    const cachedBlogs = await client.get(req.user.id); //cachedBlogs is JSON.

    // If yes! Then response to the request right away and return
    if (cachedBlogs) {
      return res.send(JSON.parse(cachedBlogs)); // We need to convert cachedBlogs from JSON to reqular js array.
    }

    // If No! We need to respond to requst and update our cache to store data.
    const blogs = await Blog.find({ _user: req.user.id });
    res.send(blogs); //blogs here is array of objects.
    client.set(req.user.id, JSON.stringify(blogs)); //Whenever we store object in redis we have to strinfigy them into JSON.
  });

  app.post('/api/blogs', requireLogin, async (req, res) => {
    const { title, content } = req.body;

    const blog = new Blog({
      title,
      content,
      _user: req.user.id,
    });

    try {
      await blog.save();
      res.send(blog);
    } catch (err) {
      res.send(400, err);
    }
  });
};
