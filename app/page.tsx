import Link from 'next/link';

export default function HomePage() {
  return (
    <>
      <section style={{
        padding: '5rem 0 4rem',
        background: 'linear-gradient(160deg, var(--cream) 0%, var(--cream-dark) 100%)',
        borderBottom: '1px solid var(--border)', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 80px, var(--border) 80px, var(--border) 81px)',
          opacity: 0.3, pointerEvents: 'none',
        }} />
        <div className="container fade-up" style={{ position: 'relative', textAlign: 'center' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: '600', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '1.25rem' }}>
            A space for ideas
          </p>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(2.8rem, 7vw, 5rem)',
            fontWeight: '700', lineHeight: '1.08', letterSpacing: '-0.03em', marginBottom: '1.5rem',
          }}>
            Stories that matter.<br />
            <em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>Voices that inspire.</em>
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--ink-muted)', maxWidth: '520px', margin: '0 auto 2.5rem', lineHeight: '1.7' }}>
            A curated blogging platform with AI-powered summaries, role-based access, and clean design.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/blog" className="btn btn-primary btn-lg">Explore Stories →</Link>
            <Link href="/auth/register" className="btn btn-secondary btn-lg">Start Writing</Link>
          </div>
        </div>
      </section>

      <section style={{ padding: '4rem 0' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
            {[
              { icon: '✦', title: 'AI-Powered Summaries', desc: 'Every post gets a Gemini-generated summary so you can decide what to read in depth.', color: 'var(--accent)' },
              { icon: '◈', title: 'Role-Based Access', desc: 'Authors write, Viewers read & comment, Admins moderate — with proper permissions throughout.', color: 'var(--gold)' },
              { icon: '◉', title: 'Thoughtful Design', desc: 'Clean, distraction-free reading with search, pagination, and focus on the content.', color: 'var(--success)' },
            ].map(f => (
              <div key={f.title} className="card card-body fade-up">
                <div style={{ fontSize: '1.75rem', marginBottom: '1rem', color: f.color }}>{f.icon}</div>
                <h3 style={{ marginBottom: '0.5rem' }}>{f.title}</h3>
                <p style={{ color: 'var(--ink-muted)', fontSize: '0.9rem', lineHeight: '1.65' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '4rem 0', background: 'var(--ink)', textAlign: 'center' }}>
        <div className="container">
          <h2 style={{ color: 'var(--cream)', marginBottom: '1rem', fontSize: 'clamp(1.5rem, 3vw, 2.25rem)' }}>
            Ready to share your story?
          </h2>
          <p style={{ color: 'var(--cream-darker)', marginBottom: '2rem' }}>
            Join as an Author and publish your first post in minutes.
          </p>
          <Link href="/auth/register" className="btn btn-primary btn-lg">Create Your Account</Link>
        </div>
      </section>
    </>
  );
}
