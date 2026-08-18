import { useState, useEffect } from 'react';
import api from '../api';

export default function SuggestedPanel({ user, onSwitchUser }) {
  const [accounts, setAccounts] = useState([]);
  const [followingMap, setFollowingMap] = useState({});

  useEffect(() => {
    api.getSuggestedAccounts().then(d => {
      const list = d.suggested_accounts || [];
      setAccounts(list);
      const initMap = {};
      list.forEach(a => { initMap[a.username] = Boolean(a.is_following); });
      setFollowingMap(initMap);
    }).catch(() => {});
  }, []);

  const toggleFollow = (username) => {
    setFollowingMap(prev => ({
      ...prev,
      [username]: !prev[username]
    }));
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
      
      {/* Current Logged In User Row */}
      {user && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img
              src={user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
              alt={user.username}
              style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--ig-border)' }}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ig-text)', display: 'flex', alignItems: 'center', gap: 4 }}>
                {user.username}
                <span style={{ color: 'var(--ig-blue)', fontSize: 11 }}>✓</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--ig-text-secondary)' }}>{user.full_name}</div>
            </div>
          </div>

          {onSwitchUser && (
            <button
              onClick={onSwitchUser}
              style={{
                background: 'none', border: 'none', color: 'var(--ig-blue)',
                fontWeight: 700, fontSize: 12, cursor: 'pointer',
              }}
            >
              Switch
            </button>
          )}
        </div>
      )}

      {/* Suggested Accounts Panel Header */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ig-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Suggested for you
          </span>
          <button style={{ background: 'none', border: 'none', color: 'var(--ig-text)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
            See All
          </button>
        </div>

        {/* List of Accounts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {accounts.map(acc => {
            const isFollowing = Boolean(followingMap[acc.username]);
            return (
              <div key={acc.account_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <img
                    src={acc.avatar}
                    alt={acc.username}
                    style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--ig-border)' }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--ig-text)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {acc.username}
                      {acc.verified && <span style={{ color: 'var(--ig-blue)', fontSize: 10 }}>✓</span>}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--ig-text-muted)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {acc.relation_reason}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => toggleFollow(acc.username)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: isFollowing ? 'var(--ig-text-muted)' : 'var(--ig-blue)',
                    fontWeight: 700,
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Links (Instagram layout) */}
      <div style={{ marginTop: 10 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 8px', fontSize: 10, color: 'var(--ig-text-muted)', lineHeight: 1.6 }}>
          <span>About</span> · <span>Help</span> · <span>Press</span> · <span>API</span> · <span>Jobs</span> · <span>Privacy</span> · <span>Terms</span> · <span>Locations</span>
        </div>
        <div style={{ fontSize: 10, color: 'var(--ig-text-muted)', marginTop: 12 }}>
          © 2026 INSTAGRAM FROM REELMIND AI
        </div>
      </div>

    </div>
  );
}
