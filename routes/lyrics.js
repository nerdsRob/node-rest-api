require('dotenv').config();

const express = require('express');
const router = express.Router();
const Lyricist = require('lyricist');
const redis = require('redis');
const client = redis.createClient();

lyricist = new Lyricist(process.env.GENIUS_API_TOKEN);

const fetchLyrics = async (req, res) => {
  try {
    const songId = req.params.songId;
    const song = await lyricist.song(songId, { fetchLyrics: true });
    client.setex(songId, 3600, JSON.stringify(song));
    res.json(song);
  } catch (e) {
    next(e)
  }
};

const readSongFromCache = (req, res) => {
  const songId = req.params.songId;
  client.get(songId, (err, result) => {
    if (result) {
      res.send(result);
      console.log("Cache hit {song_id}: " + songId);
    } else {
      fetchLyrics(req, res);
    }
  });
}

const search = async (req, res) => {
  try {
    const searchTerm = req.params.term;
    const results = await lyricist.search(searchTerm);
    client.setex(searchTerm, 3600, JSON.stringify(results));
    res.json(results);
  } catch (e) {
    next(e)
  }
}

const readSearchResultsFromCache = (req, res) => {
  const searchTerm = req.params.term;
  client.get(searchTerm, (err, result) => {
    if (result) {
      res.send(result);
      console.log("Cache hit {search_term}: " + searchTerm);
    } else {
      search(req, res);
    }
  });
}

router.get('/:songId', readSongFromCache);
router.get('/search/:term', readSearchResultsFromCache);

module.exports = router;
