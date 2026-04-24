import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getArtist, getArtists } from "@/lib/spotify/artist";
import { getAlbum, getAlbums } from "@/lib/spotify/album";
import { getSong, getSongs } from "@/lib/spotify/song";

// resolves spotify image urls for a user's favorites
// the frontend sends db ids, which are then translated here into spotify_id values,
// which are then used to request the corresponding spotify artwork
export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // read any favorite item id passed in the query string
        const params = req.nextUrl.searchParams;
        const artistIds = params.getAll('artistId');
        const albumIds = params.getAll('albumId');
        const songIds = params.getAll('songId');

        // artist image resolution
        let artistImages: { id: string; spotify_image: string }[] = [];
        if (artistIds.length > 0) {
            const { data } = await supabase
                .from('artists')
                .select('id, spotify_id')
                .in('id', artistIds);

            const rows = data || [];
            if (rows.length > 0) {
                const spotifyIds = rows.map((r: any) => r.spotify_id || '');
                const spotifyRes = rows.length === 1
                    ? await getArtist(spotifyIds[0])
                    : await getArtists(spotifyIds);

                if (spotifyRes && spotifyRes.artists) {
                    const idToImage: Record<string, string> = {};
                    for (const a of spotifyRes.artists) {
                        idToImage[a.id] = a.images?.[0]?.url || '';
                    }
                    artistImages = rows.map((r: any) => ({
                        id: String(r.id),
                        spotify_image:idToImage[r.spotify_id] || '',
                    }));
                }
            }
        }

        // album image resolution
        let albumImages: { id: string; spotify_image: string }[] = [];
        if (albumIds.length > 0) {
            const { data } = await supabase
                .from('albums')
                .select('id, spotify_id')
                .in('id', albumIds);

            const rows = data || [];
            if (rows.length > 0) {
                const spotifyIds = rows.map((r: any) => r.spotify_id || '');
                const spotifyRes = rows.length === 1
                    ? await getAlbum(spotifyIds[0])
                    : await getAlbums(spotifyIds);

                if (spotifyRes && spotifyRes.albums) {
                    const idToImage: Record<string, string> = {};
                    for (const a of spotifyRes.albums) {
                        idToImage[a.id] = a.images?.[0]?.url || '';
                    }
                    albumImages = rows.map((r: any) => ({
                        id: String(r.id),
                        spotify_image:idToImage[r.spotify_id] || '',
                    }));
                }
            }
        }

        // song image resolution
        let songImages: { id: string; spotify_image: string }[] = [];
        if (songIds.length > 0) {
            const { data } = await supabase
                .from('songs')
                .select('id, spotify_id')
                .in('id', songIds);

            const rows = data || [];

            if (rows.length > 0) {
                const spotifyIds = rows.map((r: any) => r.spotify_id || '');
                const spotifyRes = rows.length === 1
                    ? await getSong(spotifyIds[0])
                    : await getSongs(spotifyIds);
                // spotify track images live on the album object
                if (spotifyRes && spotifyRes.tracks) {
                    const idToImage: Record<string, string> = {};
                    for (const a of spotifyRes.tracks) {
                        idToImage[a.id] = a.album?.images?.[0]?.url || '';
                    }
                    songImages = rows.map((r: any) => ({
                        id: String(r.id),
                        spotify_image:idToImage[r.spotify_id] || '',
                    }));
                }
            }
        }

        return NextResponse.json({ 
            artists: artistImages,
            albums: albumImages,
            songs: songImages,
        });
    } catch (error: any) {
        console.error('Favorites images error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch favorite images' },
            { status: 500 }
        );
    }
}