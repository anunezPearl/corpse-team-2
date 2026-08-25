# Team 2: Pearl's Rhyme Machine

Pearl's Rhyme Machine is a playful AI-powered rhyme finder. Enter a word and
the app responds according to its final letter:

- **Consonant:** Pearl asks LiteLLM for a real, cheesy dad-joke-tier rhyme and
  writes a short, original song lyric about Pearl the bot that playfully
  roasts the user, using both the input and its rhyme.
- **Vowel:** Pearl skips the rhyme and responds with `💩`.

The responsive single-page interface is served by a small Node.js server. The
server validates requests and makes the LiteLLM call, keeping the API key out
of browser code. No third-party packages or build step are required.

## Run it

Copy `.env.example` to `.env` and add a valid LiteLLM key, then run:

```sh
npm start
```

Open <http://localhost:3000>. The API key stays on the server and is never sent to the browser.

## Configuration

The server reads:

- `LITELLM_BASE_URL` — the LiteLLM proxy URL
- `LITELLM_API_KEY` — the API key sent to the proxy
- `PORT` — optional local port; defaults to `3000`
