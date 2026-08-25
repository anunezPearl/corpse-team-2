# Team 2: Pearl's Rhyme Machine

Pearl's Rhyme Machine is a self-contained browser toy that turns a word into a
tiny, gloriously corny song moment.

- Words ending in a **consonant** are looked up with Datamuse's phonetic rhyme
  API. Pearl returns a real rhyme, a playful original lyric, and a
  procedurally generated group name such as "The Velvet Waffles."
- Each result also includes a completely unrelated surprise YouTube search,
  because the soundtrack should keep everyone guessing.
- Words ending in a **vowel** get `💩` instead of a rhyme.

## Use It

Open `index.html` directly in a modern browser. There is no build step, Node
process, API key, or separate server to run. An internet connection is needed
only to look up rhymes through Datamuse and to open the optional YouTube link.
