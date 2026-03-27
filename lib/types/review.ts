// Unified review types used by the /api/supabase/reviews endpoint and frontend consumers

export type ReviewType = 'song' | 'album';
export type ReviewFilter = 'songs' | 'albums';

export interface ReviewUser {
    id: string;
    username: string;
    name: string | null;
    profile_picture_url: string | null;
}

export interface ReviewArtist {
    id: number;
    name: string;
}

export interface ReviewSong {
    id: number;
    name: string;
    spotify_id: string | null;
    apple_music_id: string | null;
    artists: ReviewArtist;
    cover_art_url?: string | null;
}

export interface ReviewAlbum {
    id: number;
    name: string;
    spotify_id: string | null;
    apple_music_id: string | null;
    artists: ReviewArtist;
    cover_art_url?: string | null;
}

export interface UnifiedReview {
    id: number;
    review_type: ReviewType;
    is_public: boolean;
    rating: number | null;
    review: string | null;
    edited_at: string | null;
    created_at: string;
    is_flagged: boolean;
    user: ReviewUser;
    song: ReviewSong | null;
    album: ReviewAlbum | null;
    sort_date: string; // the effective date used for sorting (edited_at ?? created_at)
}
