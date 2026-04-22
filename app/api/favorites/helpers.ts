import { SupabaseClient } from '@supabase/supabase-js'

// define the inputs required to fetch user musicbrainz favorites (fav artists, fav albums, fav songs)
type FetchMBFavoriteParams = {
    supabase: SupabaseClient;
    joinTable: string;
    foreignKey: string;
    relationName: string;
    selectFields: string;
    userId: string;
}

// fetch related favorite items from the given user join table and return the related object as a flat array
export async function fetchMBFavorites ({
    supabase,
    joinTable,
    foreignKey,
    relationName,
    selectFields,
    userId
}: FetchMBFavoriteParams) {
    const { data, error } = await supabase
    .from(joinTable)
    .select(`
        ${foreignKey},
        ${relationName} (
            ${selectFields}
        )    
    `)
    .eq('user_id', userId);

    if (error) {
        throw new Error(`Failed to fetch ${joinTable}`);
    }

    return (data || [])
        .map((row: any) => row[relationName])
        .filter(Boolean);
}