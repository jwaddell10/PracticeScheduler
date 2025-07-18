// import { createClient } from '@supabase/supabase-js'

// const supabaseUrl = 'https://nugqfaokqrotfakpjqnk.supabase.co'
// const supabaseAnonKey = 'sb_publishable_gVhAWzkuEF9zvUGsfeOmZw_oNJczBcC'
// const supabaseServiceRoleKey = process.env.SUPABASE_KEY

// console.log('URL', supabaseUrl)

// const supabase = createClient(supabaseUrl, supabaseAnonKey)

// // Authenticate as the service role
// const { data: { session }, error } = await supabase.auth.signInWithPassword({
//   email: 'test@gmail.com',
//   password: 'password'
// })

// if (error) {
//   console.error('Error:', error.message)
// } else {
//   console.log('Access token:', session.access_token)
// }