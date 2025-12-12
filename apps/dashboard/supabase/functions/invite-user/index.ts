// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Create a Supabase client with the Auth context of the user calling the function
        const supabaseClient = createClient(
            // Supabase API URL - Env var automatically populated by Supabase
            Deno.env.get('SUPABASE_URL') ?? '',
            // Supabase Anon Key - Env var automatically populated by Supabase
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            // Create client with Auth context of the user that called the function
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        // Create a Supabase Admin client to perform the invite (requires SERVICE_ROLE_KEY)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Get the request body
        const { email, role, org_id } = await req.json()

        if (!email || !role || !org_id) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: email, role, org_id' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 1. Verify the requester has permission to invite to this org
        const { data: { user } } = await supabaseClient.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        const { data: requesterProfile } = await supabaseClient
            .from('profiles')
            .select('role, org_id')
            .eq('id', user.id)
            .single()

        if (!requesterProfile) throw new Error('Profile not found')

        // Check permissions:
        // - Super Admin can invite to any org
        // - Org Admin can only invite to their own org
        const isSuperAdmin = requesterProfile.role === 'super_admin'
        const isOrgAdmin = requesterProfile.role === 'org_admin' && requesterProfile.org_id === org_id

        if (!isSuperAdmin && !isOrgAdmin) {
            return new Response(
                JSON.stringify({ error: 'You do not have permission to invite users to this organization' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 2. Send the invite using Admin API
        const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            data: {
                org_id: org_id,
                role: role,
            },
            redirectTo: `${req.headers.get('origin')}/update-password`
        })

        if (error) throw error

        return new Response(
            JSON.stringify({ message: 'Invite sent successfully', user: data.user }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
