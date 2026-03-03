'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
    let supabase;
    try {
        supabase = await createClient()
    } catch (e: any) {
        if (e?.message === 'SUPABASE_NOT_CONFIGURED') {
            // No Supabase credentials — bypass auth and go straight to dashboard
            return redirect('/dashboard')
        }
        throw e
    }

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signInWithPassword(data)

    if (error) {
        return redirect('/login?message=Could not authenticate user')
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function signup(formData: FormData) {
    let supabase;
    try {
        supabase = await createClient()
    } catch (e: any) {
        if (e?.message === 'SUPABASE_NOT_CONFIGURED') {
            return redirect('/dashboard')
        }
        throw e
    }

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signUp(data)

    if (error) {
        return redirect('/login?message=Could not authenticate user')
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}
