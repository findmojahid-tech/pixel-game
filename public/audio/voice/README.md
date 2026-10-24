# Bengali voice integration

No human recordings ship in this milestone. Dialogue always has Bengali subtitles and an English translation. The game never substitutes a synthetic voice for an authentic recording.

To add licensed recordings, put OGG/WAV/MP3 files here, add entries to manifest.json, and record the speaker's consent and redistribution license. Playback is routed to the Voice bus and ducks ambience.

IDs: `seller.greeting`, `seller.milk`, `seller.lemon`, `seller.insufficient`, `seller.story`.

Example (replace with a real licensed asset; do not add this until the recording exists):

```json
{"recordings":{"seller.greeting":{"file":"/audio/voice/greeting.ogg","license":"CC-BY-4.0","credit":"Speaker name — source URL"}}}
```

Spoken script:
- seller.greeting: আসেন ভাই! একটু বসেন। গরম চা দিই?
- seller.milk: এই নেন, গরম দুধ চা। সাবধানে খাইয়েন!
- seller.lemon: এই নেন লেবু চা। মনটা জুড়ায়া যাবে!
- seller.insufficient: টাকা কম পড়ছে? সমস্যা নাই, পরে আইসেন।
- seller.story: এই দোকানটা আমার আব্বার ছিল। কত মানুষ আসে, কত গল্প হয়! চায়ের কাপেই তো আড্ডা জমে।
