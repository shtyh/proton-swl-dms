import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dguohpdqwyfxlpurnwjw.supabase.co'
const supabaseKey = 'sb_publishable_0ckNTrDF7EY0aDKjiLuhGw_XAANNNNt'

export const supabase = createClient(supabaseUrl, supabaseKey)
