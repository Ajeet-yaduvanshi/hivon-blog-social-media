import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const supabase = await createServerSupabaseClient();
    const { data: post } = await supabase
      .from('posts')
      .select('*, author:users!posts_author_id_fkey(id, name, email), comments(id, comment_text, created_at, user:users!comments_user_id_fkey(id, name))')
      .eq('slug', slug)
      .eq('published', true)
      .single();

    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    return NextResponse.json({ post });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const supabase = await createServerSupabaseClient();
    const admin = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: currentUser } = await supabase.from('users').select('role').eq('id', user.id).single();
    const { data: post } = await supabase.from('posts').select('*').eq('slug', slug).single();
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

    const canEdit = currentUser?.role === 'admin' || (currentUser?.role === 'author' && post.author_id === user.id);
    if (!canEdit) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { data: updated } = await admin.from('posts')
      .update({ title: body.title || post.title, body: body.body || post.body, image_url: body.image_url !== undefined ? body.image_url : post.image_url })
      .eq('id', post.id).select('*').single();

    return NextResponse.json({ post: updated });
  } catch {
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const supabase = await createServerSupabaseClient();
    const admin = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: currentUser } = await supabase.from('users').select('role').eq('id', user.id).single();
    const { data: post } = await supabase.from('posts').select('*').eq('slug', slug).single();
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

    const canDelete = currentUser?.role === 'admin' || (currentUser?.role === 'author' && post.author_id === user.id);
    if (!canDelete) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await admin.from('posts').delete().eq('id', post.id);
    return NextResponse.json({ message: 'Post deleted' });
  } catch {
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
