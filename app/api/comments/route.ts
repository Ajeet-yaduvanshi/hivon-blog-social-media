import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const admin = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { post_id, comment_text } = body;
    if (!post_id || !comment_text?.trim()) return NextResponse.json({ error: 'Post ID and comment required' }, { status: 400 });

    const { data: comment, error } = await admin
      .from('comments')
      .insert({ post_id, user_id: user.id, comment_text: comment_text.trim() })
      .select('*, user:users!comments_user_id_fkey(id, name)')
      .single();

    if (error) throw error;
    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error('POST /api/comments error:', error);
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const admin = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const commentId = new URL(request.url).searchParams.get('id');
    if (!commentId) return NextResponse.json({ error: 'Comment ID required' }, { status: 400 });

    const { data: currentUser } = await supabase.from('users').select('role').eq('id', user.id).single();
    const { data: comment } = await supabase.from('comments').select('*').eq('id', commentId).single();
    if (!comment) return NextResponse.json({ error: 'Comment not found' }, { status: 404 });

    const canDelete = currentUser?.role === 'admin' || comment.user_id === user.id;
    if (!canDelete) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await admin.from('comments').delete().eq('id', commentId);
    return NextResponse.json({ message: 'Comment deleted' });
  } catch (error) {
    console.error('DELETE /api/comments error:', error);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}
