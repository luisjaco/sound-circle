import 'server-only';

import supabase from '../admin';
import { lookupByISRCComplete, searchRecordingComplete } from '@/lib/musicbrainz';
import { findRelationalData } from './artists';
import { getSpotifyTrackIdByISRC } from '@/lib/spotify';

export async function insertSong(isrc: string, artistName: string, songName: string) {
    // find song data from music brainz
    let MBSongData;

    MBSongData = await lookupByISRCComplete(isrc);
    if (!MBSongData) {
        console.log(`inital ISRC search for ISRC (${isrc}) failed, trying with parameters songName: ${songName}, artistName: ${artistName}`)
        MBSongData = await searchRecordingComplete(artistName, songName);
    }

    if (!MBSongData) {
        console.error(`could not find valid entry for combination artistName: ${artistName}, songName: ${songName}`);
        return null;
    }

    const MBID = MBSongData.id;

    const artistMBID = MBSongData["artist-credit"][0].artist.id
    // @ts-ignore
    const albumName = MBSongData.releases[0].title
    // @ts-ignore
    const albumMBID = MBSongData.releases[0].id


    // query supabase to see if artist or album exist
    const artistSearch = supabase
        .from('artists')
        .select('*')
        .eq('musicbrainz_id', artistMBID)
        .single()

    const albumSearch = supabase
        .from('albums')
        .select('*')
        .eq('musicbrainz_id', albumMBID)
        .single()

    const [artist, album] = await Promise.all([artistSearch, albumSearch])

    // handle artist
    let artistSBID;
    if (artist.error?.code === 'PGRST116') { // artist doesn't exist, create entry
        const { spotifyId, appleId } = await findRelationalData(artistMBID);

        const { data, error } = await supabase
            .from('artists')
            .insert({
                name: artistName,
                musicbrainz_id: artistMBID,
                spotify_id: spotifyId,
                apple_music_id: appleId
            })
            .select('id')
            .single();

        if (error) {
            console.error(`There was an error when inserting artist with MBID: ${artistMBID}`);
            console.error(error)
            return null;
        }
        artistSBID = data.id

    } else if (artist.error) {
        console.error(`There was an error when querying for artist with MBID: ${artistMBID}`);
        console.error(artist.error)
    }
    else {
        artistSBID = artist.data.id
    }

    // handle album
    let albumSBID;
    if (album.error?.code === 'PGRST116') { // album doesn't exist
        const { data, error } = await supabase
            .from('albums')
            .insert({
                name: albumName,
                musicbrainz_id: albumMBID,
                artist_id: artistSBID
            })
            .select('id')
            .single();

        if (error) {
            console.error(`There was an error when inserting album with MBID: ${albumMBID}`);
            console.error(error)
            return null;
        }
        albumSBID = data.id

    } else if (album.error) {
        console.error(`There was an error when querying for album with MBID: ${albumMBID}`);
        console.error(album.error)
        return null;
    }
    else {
        albumSBID = album.data.id
    }

    // at last, insert the song data and retrieve the song information
    if ( (!artistSBID) || (!albumMBID) ) return false;

    const { data, error } = await supabase
        .from('songs')
        .insert({
            name: songName,
            musicbrainz_id: MBID,
            isrc: isrc,
            album_id: albumSBID,
            artist_id: artistSBID
        })
        .select('*')
        .single()

    if ( error ) {
        console.error(`There was an error when inserting song with ISRC ${isrc}.`)
        console.error(error);
        return null;
    }

    return data;
}

