'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { formatDistanceToNow } from 'date-fns';

export default function AdminPage() {
  const { user, loading } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [tab, setTab] = useState<'posts' | 'comments' | 'users'>('posts');
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) { router.replace('/auth/login'); return; }
    if (!loading && user && user.role !== 'admin') { router.replace('/dashboard'); return; }

    if (!loading && user?.role === 'admin') {
      const supabase = createClient();
      Promise.all([
        supabase.from('posts').select('*, author:users!posts_author_id_fkey(id, name, email)').order('created_at', { ascending: false }),
        supabase.from('comments').select('*, user:users!comments_user_id_fkey(id, name), post:posts(id, title, slug)').order('created_at', { ascending: false }),
        supabase.from('users').select('*').order('created_at', { ascending: false }),
      ]).then(([{ data: p }, { data: c }, { data: u }]) => {
        setPosts(p || []); setComments(c || []); setUsers(u || []);
        setDataLoading(false);
      });
    }
  }, [user, loading, router]);

  const handleDeletePost = async (slug: string) => {
    if (!confirm('Delete this post and all comments?')) return;
    const res = await fetch(`/api/posts/${slug}`, { method: 'DELETE' });
    if (res.ok) setPosts(prev => prev.filter(p => p.slug !== slug));
  };

  const handleDeleteComment = async (id: string) => {
    if (!confirm('Delete this comment?')) return;
    const res = await fetch(`/api/comments?id=${id}`, { method: 'DELETE' });
    if (res.ok) setComments(prev => prev.filter(c => c.id !== id));
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    const supabase = createClient();
    const { error } = await supabase.from('users').update({ role: newRole }).eq('id', userId);
    if (!error) setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
  };

  if (loading || dataLoading) return <div style={{ textAlign: 'center', padding: '6rem' }}><div className="spinner" style={{ margin: '0 auto', width: '32px', height: '32px' }} /></div>;

  const tabStyle = (t: string) => ({
    padding: '0.6rem 1.25rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '500' as const, fontSize: '0.9rem',
    background: tab === t ? 'var(--accent)' : 'var(--white)',
    color: tab === t ? 'white' : 'var(--ink-soft)',
    borderBottom: tab === t ? 'none' : '1.5px solid var(--border)',
  });

  return (
    <div style={{ padding: '3rem 0 5rem' }}>
      <div className="container fade-up">
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ marginBottom: '0.4rem' }}>Admin Panel</h1>
          <p style={{ color: 'var(--ink-muted)' }}>Manage all posts, comments, and users.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
          <button style={tabStyle('posts')} onClick={() => setTab('posts')}>Posts ({posts.length})</button>
          <button style={tabStyle('comments')} onClick={() => setTab('comments')}>Comments ({comments.length})</button>
          <button style={tabStyle('users')} onClick={() => setTab('users')}>Users ({users.length})</button>
        </div>

        {tab === 'posts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {posts.map(post => (
              <div key={post.id} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link href={`/blog/${post.slug}`} style={{ fontWeight: '600', color: 'var(--ink)', fontSize: '0.95rem', display: 'block', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.title}</Link>
                  <span style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>by {post.author?.name} · {post.created_at ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true }) : ''}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link href={`/dashboard/posts/${post.slug}/edit`} className="btn btn-secondary btn-sm">Edit</Link>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeletePost(post.slug)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'comments' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {comments.map(comment => (
              <div key={comment.id} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.25rem 1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div>
                    <strong>{comment.user?.name}</strong>
                    <span style={{ color: 'var(--ink-muted)', fontSize: '0.82rem', marginLeft: '0.5rem' }}>on <Link href={`/blog/${comment.post?.slug}`} style={{ color: 'var(--accent)' }}>{comment.post?.title}</Link></span>
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteComment(comment.id)}>Delete</button>
                </div>
                <p style={{ color: 'var(--ink-soft)', fontSize: '0.9rem', margin: 0 }}>{comment.comment_text}</p>
              </div>
            ))}
          </div>
        )}

        {tab === 'users' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {users.map(u => (
              <div key={u.id} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: '600' }}>{u.name}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>{u.email}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span className={`badge badge-${u.role}`}>{u.role}</span>
                  {u.id !== user?.id && (
                    <select value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)}
                      style={{ padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1.5px solid var(--border)', fontSize: '0.85rem', background: 'var(--white)' }}>
                      <option value="viewer">viewer</option>
                      <option value="author">author</option>
                      <option value="admin">admin</option>
                    </select>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
