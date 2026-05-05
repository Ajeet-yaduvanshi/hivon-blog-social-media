'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { PostWithRelations, CommentWithUser } from '@/types';
import { formatDistanceToNow } from 'date-fns';

export default function BlogPostPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [post, setPost] = useState<PostWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [commentError, setCommentError] = useState('');

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/posts/${params.slug}`);
      if (res.ok) {
        const data = await res.json();
        setPost(data.post);
      }
      setLoading(false);
    }
    load();
  }, [params.slug]);

  const handleDelete = async () => {
    if (!confirm('Delete this post?')) return;
    const res = await fetch(`/api/posts/${params.slug}`, { method: 'DELETE' });
    if (res.ok) router.push('/blog');
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    setCommentError('');
    const res = await fetch('/api/comments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: post?.id, comment_text: comment }),
    });
    if (res.ok) {
      const data = await res.json();
      setPost(prev => prev ? { ...prev, comments: [...(prev.comments || []), data.comment] } : prev);
      setComment('');
    } else {
      const err = await res.json();
      setCommentError(err.error || 'Failed to post comment');
    }
    setSubmitting(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;
    const res = await fetch(`/api/comments?id=${commentId}`, { method: 'DELETE' });
    if (res.ok) setPost(prev => prev ? { ...prev, comments: (prev.comments || []).filter(c => c.id !== commentId) } : prev);
  };

  const canEdit = user?.role === 'admin' || (user?.role === 'author' && post?.author_id === user?.id);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '6rem' }}>
      <div className="spinner" style={{ margin: '0 auto 1rem', width: '32px', height: '32px' }} />
      <p style={{ color: 'var(--ink-muted)' }}>Loading post...</p>
    </div>
  );

  if (!post) return (
    <div style={{ textAlign: 'center', padding: '6rem' }}>
      <h2>Post not found</h2>
      <Link href="/blog" className="btn btn-primary" style={{ marginTop: '1rem' }}>Back to Blog</Link>
    </div>
  );

  return (
    <article style={{ padding: '3rem 0 5rem' }}>
      <div className="content-container fade-up">
        <Link href="/blog" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--ink-muted)', fontSize: '0.875rem', marginBottom: '2rem' }}>
          ← Back to Blog
        </Link>

        {post.image_url && (
          <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '2.5rem' }}>
            <img src={post.image_url} alt={post.title} style={{ width: '100%', height: '460px', objectFit: 'cover' }} />
          </div>
        )}

        <h1 style={{ marginBottom: '1.25rem', lineHeight: '1.15' }}>{post.title}</h1>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>
              {post.author?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: '500' }}>{post.author?.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
                {post.created_at ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true }) : ''}
              </div>
            </div>
          </div>
          {canEdit && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link href={`/dashboard/posts/${post.slug}/edit`} className="btn btn-secondary btn-sm">Edit Post</Link>
              <button className="btn btn-danger btn-sm" onClick={handleDelete}>Delete</button>
            </div>
          )}
        </div>

        {post.summary && (
          <div style={{ background: 'linear-gradient(135deg,#fff8f7,#fff3f2)', border: '1.5px solid var(--accent-light)', borderRadius: '10px', padding: '1.5rem', marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)' }}>✦ AI-Generated Summary</span>
            </div>
            <p style={{ color: 'var(--ink-soft)', fontSize: '0.95rem', lineHeight: '1.7', margin: 0 }}>{post.summary}</p>
          </div>
        )}

        <div className="prose" dangerouslySetInnerHTML={{ __html: post.body }} />

        <div style={{ marginTop: '4rem', paddingTop: '3rem', borderTop: '1px solid var(--border)' }}>
          <h3 style={{ marginBottom: '2rem' }}>Comments ({post.comments?.length || 0})</h3>

          {user ? (
            <form onSubmit={handleComment} style={{ marginBottom: '2.5rem' }}>
              {commentError && <div className="alert alert-error">{commentError}</div>}
              <div className="form-group">
                <label className="form-label">Leave a comment</label>
                <textarea className="form-textarea" value={comment} onChange={e => setComment(e.target.value)}
                  placeholder="Share your thoughts..." rows={4} required />
              </div>
              <button type="submit" className="btn btn-primary" disabled={submitting || !comment.trim()}>
                {submitting ? <><span className="spinner" />Posting...</> : 'Post Comment'}
              </button>
            </form>
          ) : (
            <div className="alert alert-info" style={{ marginBottom: '2rem' }}>
              <Link href="/auth/login">Sign in</Link> to join the conversation.
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {(post.comments || []).length === 0 ? (
              <p style={{ color: 'var(--ink-muted)', fontStyle: 'italic' }}>No comments yet. Be the first!</p>
            ) : (
              [...(post.comments || [])].reverse().map((c: CommentWithUser) => (
                <div key={c.id} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--ink-soft)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: '700' }}>
                        {c.user?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span style={{ fontWeight: '500', fontSize: '0.9rem' }}>{c.user?.name}</span>
                        <span style={{ color: 'var(--ink-muted)', fontSize: '0.78rem', marginLeft: '0.5rem' }}>
                          {c.created_at ? formatDistanceToNow(new Date(c.created_at), { addSuffix: true }) : ''}
                        </span>
                      </div>
                    </div>
                    {(user?.id === c.user_id || user?.role === 'admin') && (
                      <button onClick={() => handleDeleteComment(c.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--ink-muted)', cursor: 'pointer', fontSize: '0.78rem' }}>
                        Delete
                      </button>
                    )}
                  </div>
                  <p style={{ color: 'var(--ink-soft)', fontSize: '0.9rem', margin: 0 }}>{c.comment_text}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
