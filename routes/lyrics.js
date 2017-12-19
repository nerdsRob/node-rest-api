require('dotenv').config();

const express = require('express');
const router = express.Router();
const Lyricist = require('lyricist');

lyricist = new Lyricist(process.env.GENIUS_API_TOKEN);

router.get('/search/:term', async (request, response, next) => {
  try {
    const searchTerm = request.params.term;
    const results = await lyricist.search(searchTerm);
    response.json(results);
  } catch (e) {
    next(e)
  }
})

router.get('/:songId', async (request, response, next) => {
  try {
    const songId = request.params.songId;
    const song = await lyricist.song(songId, { fetchLyrics: true });
    response.json(song);
  } catch (e) {
    next(e)
  }
})

module.exports = router;
