#!/usr/bin/env node

const path    = require('path');
const express = require('express');
const session = require('express-session');

const app  = express();
const port = process.argv[2] || 0;

// Use the session middleware
app.enable('trust proxy');
app.use(session({
  secret: "secret",
  resave: true,
  saveUninitialized: true,
  proxy: true
}));

// Use middleware to parse request body as JSON.
// bodyParser is deprecated and now merged into express itself.
app.use(express.json());

// Use middleware to serve static files from the public directory.
app.use(express.static(path.join(__dirname, 'public')));

// Log connections
app.use((req, res, next) => {
  console.log(`From ${req.ip}, Request ${req.url}`);
  next();
});

app.get('/todos', (req, res) => {
  req.session.todos = req.session.todos || [];
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(req.session.todos));
});

app.post('/todos', (req, res) => {
  req.session.todos = req.session.todos || [];
  req.session.todos.push(req.body.text);
  res.setHeader('Content-Type', 'application/json');
  res.send(req.session.todos);
});

app.get('/todos/:id', (req, res) => {
  const id = req.params.id;
  req.session.todos = req.session.todos || [];
  if (id < 0 || id >= req.session.todos.length) {
    res.status(404);
    res.end('NOT FOUND');
  } else {
    res.setHeader('Content-Type', 'application/json');
    res.send(req.session.todos[req.params.id]);
  }
});

app.put('/todos/:id', (req, res) => {
  const id = req.params.id;
  req.session.todos = req.session.todos || [];
  if (id < 0 || id >= req.session.todos.length) {
    res.status(404);
    res.end('NOT FOUND');
  } else {
    req.session.todos[req.params.id] = req.body.text;
    res.setHeader('Content-Type', 'application/json');
    res.send(req.session.todos);
  }
});

app.delete('/todos/:id', (req, res) => {
  const id = req.params.id;
  req.session.todos = req.session.todos || [];
  if (id < 0 || id >= req.session.todos.length) {
    res.status(404);
    res.end('NOT FOUND');
  } else {
    req.session.todos.splice(req.params.id, 1);
    res.setHeader('Content-Type', 'application/json');
    res.send(req.session.todos);
  }
});

const server = app.listen(port, function () {
  const host = server.address().address;
  const port = server.address().port;
  console.log(`server listening to ${host}:${port}`);
});
