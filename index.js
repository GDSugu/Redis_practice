
//const express = require('express');
//const fetch = require('node-fetch');
//const redis = require('redis');

import express from 'express';
import fetch from "node-fetch";
// import redis from 'redis'

const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.env.REDIS_PORT|| 6379;

// const client = redis.createClient({url:"redis://redis-14017.c114.us-east-1-4.ec2.cloud.redislabs.com:14017"});

import { createClient } from 'redis';

const client = createClient({
    password: 'JOwPFzideoXc95Pt2juw4045viqVHjqh',
    socket: {
        host: 'redis-14017.c114.us-east-1-4.ec2.cloud.redislabs.com',
        port: 14017
    }
    
});

//   client.connect();

const app = express();

// Set response
function setResponse(username, repos) {
  return `<h2>${username} has ${repos} Github repos</h2>`;
}

// Make request to Github for data
async function getRepos(req, res, next) {
  try {
    console.log('Fetching Data...');

    const { username } = req.params;


    const response = await fetch(`https://api.github.com/users/${username}`);

    const data = await response.json();

    const repos = data.public_repos;

    // Set data to Redis
    client.setex(username, 3600, repos);

    res.send(setResponse(username, repos));
  } catch (err) {
    console.error(err);
    res.status(500);
  }
}


// Cache middleware
function cache(req, res, next) {
  const { username } = req.params;

  client.get(username, (err, data) => {
    if (err) throw err;

    if (data !== null) {
      res.send(setResponse(username, data));
    } else {
      next();
    }
  });
}


app.get('/repos/:username', cache, getRepos);

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});