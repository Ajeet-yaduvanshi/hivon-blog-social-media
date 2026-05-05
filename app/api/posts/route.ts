import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { generatePostSummary } from '@/lib/ai';
import { generateUniqueSlug } from '@/lib/slugify';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '9');
    const search = searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    let query = supabase
      .from('posts')
      .select('id, title, body, image_url, summary, slug, published, created_at, author_id, author:users!posts_author_id_fkey(id, name, email)', { count: 'exact' })
      .eq('published', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) query = query.or(`title.ilike.%${search}%,body.ilike.%${search}%`);

    const { data: posts, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({
      posts,
      pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) },
    });
  } catch (error) {
    console.error('GET /api/posts error:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const admin = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: currentUser } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (!currentUser || !['author', 'admin'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, body: postBody, image_url } = body;
    if (!title || !postBody) return NextResponse.json({ error: 'Title and body required' }, { status: 400 });

    const slug = generateUniqueSlug(title);
    const summary = await generatePostSummary(title, postBody);

    const { data: post, error } = await admin
      .from('posts')
      .insert([{ title, body: postBody, image_url: image_url || null, author_id: user.id, summary, slug, published: true }])
      .select('*, author:users!posts_author_id_fkey(id, name, email)')
      .single();

    if (error) throw error;
    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error('POST /api/posts error:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
