async function run() {
    const isrc = "FR2X42553851";
    const headers = { 'User-Agent': 'SoundCircle/1.0.0 ( test@test.com )' };

    const res2 = await fetch(`https://musicbrainz.org/ws/2/isrc/${isrc}?inc=artist-credits+releases&fmt=json`, { headers });
    const data2 = await res2.json();
    console.log("ISRC lookup res:");
    console.log(JSON.stringify(data2, null, 2));
}
run();
