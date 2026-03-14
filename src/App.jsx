import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { CATEGORIES, CATEGORY_GROUPS, calculatePoints } from './categories';

const ADMIN_PASSWORD = "oscar2026";

function OddsInput({ nominee, currentOdds, onSave, calculatePoints, styles }) {
  const [localVal, setLocalVal] = useState(String(currentOdds));
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => { setLocalVal(String(currentOdds)); }, [currentOdds]);
  async function commit() {
    const parsed = parseFloat(localVal);
    if (isNaN(parsed) || parsed < 0 || parsed > 1) { setError('Must be 0–1'); setTimeout(() => setError(null), 2000); return; }
    setSaving(true); setError(null);
    try { await onSave(parsed); setSaved(true); setTimeout(() => setSaved(false), 1500); }
    catch { setError('Save failed'); setTimeout(() => setError(null), 3000); }
    setSaving(false);
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
      <span style={{ minWidth: '150px', fontSize: '0.9rem' }}>{nominee.name}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input type="number" step="0.01" min="0" max="1" value={localVal} onChange={(e) => setLocalVal(e.target.value)} onBlur={commit} onKeyDown={(e) => { if (e.key === 'Enter') { commit(); e.target.blur(); } }}
          style={{ width: '80px', padding: '6px', borderRadius: '4px', border: `1px solid ${error ? '#ef4444' : saved ? '#22c55e' : 'rgba(255,215,0,0.4)'}`, background: 'rgba(0,0,0,0.3)', color: '#f5f5f5', textAlign: 'center', opacity: saving ? 0.5 : 1 }} disabled={saving} />
        <span style={{ fontFamily: "'Helvetica Neue', sans-serif", color: error ? '#ef4444' : saved ? '#22c55e' : '#ffd700', width: '90px', fontSize: '0.85rem' }}>
          {error ? error : saving ? '...' : saved ? '✓ saved' : `= ${calculatePoints(parseFloat(localVal) || currentOdds)} pts`}
        </span>
      </div>
    </div>
  );
}

export default function App() {
  const [players, setPlayers] = useState([]);
  const [winners, setWinners] = useState({});
  const [manualOdds, setManualOdds] = useState({});
  const [polymarketOdds, setPolymarketOdds] = useState({});
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('submit');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [picks, setPicks] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [expandedPlayer, setExpandedPlayer] = useState(null); // player id to show picks
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [adminTab, setAdminTab] = useState('winners');

  useEffect(() => { if (localStorage.getItem('oscars_admin_unlocked') === 'true') setAdminUnlocked(true); }, []);

  useEffect(() => {
    loadData();
    const ch1 = supabase.channel('p').on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, loadPlayers).subscribe();
    const ch2 = supabase.channel('s').on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, loadSettings).subscribe();
    const ch3 = supabase.channel('o').on('postgres_changes', { event: '*', schema: 'public', table: 'odds' }, loadPolymarketOdds).subscribe();
    return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2); supabase.removeChannel(ch3); };
  }, []);

  async function loadData() { setLoading(true); await Promise.all([loadPlayers(), loadSettings(), loadPolymarketOdds()]); setLoading(false); }
  async function loadPlayers() { const { data } = await supabase.from('players').select('*').order('created_at', { ascending: true }); if (data) setPlayers(data); }
  async function loadSettings() { const { data } = await supabase.from('settings').select('*').eq('id', 1).single(); if (data) { if (data.winners) setWinners(data.winners); if (data.manual_odds) setManualOdds(data.manual_odds); } }
  async function loadPolymarketOdds() { const { data } = await supabase.from('odds').select('*'); if (data) { const m = {}; data.forEach(o => { m[o.nominee_id] = o.odds; }); setPolymarketOdds(m); } }

  const getOdds = (nom) => manualOdds[nom.id] !== undefined ? manualOdds[nom.id] : polymarketOdds[nom.id] !== undefined ? polymarketOdds[nom.id] : nom.odds;

  const handleAdminLogin = () => { if (passwordInput === ADMIN_PASSWORD) { setAdminUnlocked(true); setPasswordError(false); localStorage.setItem('oscars_admin_unlocked', 'true'); } else setPasswordError(true); };
  const handleAdminLogout = () => { setAdminUnlocked(false); localStorage.removeItem('oscars_admin_unlocked'); setView('leaderboard'); };

  async function submitBallot() {
    if (!newPlayerName.trim()) return;
    const totalPicks = Object.keys(picks).length;
    if (totalPicks < CATEGORIES.length && !confirm(`You've only picked ${totalPicks} of ${CATEGORIES.length} categories. Submit anyway?`)) return;
    if (players.find(p => p.name.toLowerCase() === newPlayerName.toLowerCase())) { alert('Someone with that name already submitted!'); return; }
    setSubmitting(true);
    const { error } = await supabase.from('players').insert([{ name: newPlayerName.trim(), picks }]);
    if (error) { alert('Error submitting ballot'); } else { setNewPlayerName(''); setPicks({}); setView('leaderboard'); }
    setSubmitting(false);
  }

  async function setWinner(catId, nomId) { const w = { ...winners, [catId]: nomId }; const { error } = await supabase.from('settings').update({ winners: w }).eq('id', 1); if (!error) setWinners(w); }
  async function clearWinner(catId) { const w = { ...winners }; delete w[catId]; const { error } = await supabase.from('settings').update({ winners: w }).eq('id', 1); if (!error) setWinners(w); }
  async function updateNomineeOdds(nomId, val) { const p = parseFloat(val); if (isNaN(p) || p < 0 || p > 1) throw new Error('Invalid'); const m = { ...manualOdds, [nomId]: p }; const { error } = await supabase.from('settings').update({ manual_odds: m }).eq('id', 1); if (error) throw new Error(error.message); setManualOdds(m); }
  async function removePlayer(id) { await supabase.from('players').delete().eq('id', id); }
  async function resetAll() { if (!confirm('Delete ALL players and winners?')) return; await supabase.from('players').delete().neq('id', 0); await supabase.from('settings').update({ winners: {}, manual_odds: {} }).eq('id', 1); setWinners({}); setManualOdds({}); }

  const calcScore = (player) => { let total = 0, correct = 0; if (!player.picks) return { total: 0, correct: 0 }; for (const [catId, nomId] of Object.entries(player.picks)) { if (winners[catId] === nomId) { const cat = CATEGORIES.find(c => c.id === catId); const nom = cat?.nominees.find(n => n.id === nomId); if (nom) { total += calculatePoints(getOdds(nom)); correct++; } } } return { total, correct }; };
  const leaderboard = players.map(p => { const { total, correct } = calcScore(p); return { ...p, points: total, correct }; }).sort((a, b) => b.points - a.points || b.correct - a.correct);
  const announcedCount = Object.keys(winners).length;

  // Render a player's full picks breakdown
  function renderPlayerPicks(player) {
    return (
      <div style={{ marginTop: '12px' }}>
        {CATEGORY_GROUPS.map(group => (
          <div key={group.name} style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '0.8rem', color: '#ffd700', fontWeight: '600', marginBottom: '6px', fontFamily: "'Helvetica Neue', sans-serif" }}>{group.emoji} {group.name}</div>
            {group.categoryIds.map(catId => {
              const cat = CATEGORIES.find(c => c.id === catId);
              if (!cat) return null;
              const pickId = player.picks?.[catId];
              const pick = cat.nominees.find(n => n.id === pickId);
              const winnerId = winners[catId];
              const hasWinner = !!winnerId;
              const isCorrect = hasWinner && pickId === winnerId;
              const isWrong = hasWinner && pickId && pickId !== winnerId;
              const winnerNom = hasWinner ? cat.nominees.find(n => n.id === winnerId) : null;
              const pts = isCorrect && pick ? calculatePoints(getOdds(pick)) : 0;
              return (
                <div key={catId} style={{ padding: '8px 12px', marginBottom: '4px', borderRadius: '6px', background: isCorrect ? 'rgba(34,197,94,0.15)' : isWrong ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.02)', borderLeft: `3px solid ${isCorrect ? '#22c55e' : isWrong ? '#ef4444' : 'rgba(255,255,255,0.1)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', opacity: 0.5, fontFamily: "'Helvetica Neue', sans-serif" }}>{cat.name}</span>
                      <div style={{ fontWeight: '600', fontSize: '0.9rem', marginTop: '1px' }}>
                        {isCorrect && '✅ '}{isWrong && '❌ '}
                        {pick ? pick.name : <span style={{ opacity: 0.3, fontStyle: 'italic' }}>No pick</span>}
                      </div>
                      {isWrong && winnerNom && <div style={{ fontFamily: "'Helvetica Neue', sans-serif", fontSize: '0.75rem', color: '#22c55e', marginTop: '1px' }}>Winner: {winnerNom.name}</div>}
                    </div>
                    <div style={{ textAlign: 'right', fontFamily: "'Helvetica Neue', sans-serif" }}>
                      {isCorrect ? <span style={{ color: '#22c55e', fontWeight: '700' }}>+{pts}</span>
                        : hasWinner ? <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.85rem' }}>0</span>
                        : pick ? <span style={{ color: '#ffd700', fontSize: '0.85rem' }}>{calculatePoints(getOdds(pick))} pts</span> : null}
                      {!hasWinner && <div style={{ fontSize: '0.65rem', opacity: 0.4 }}>Pending</div>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  }

  const sans = { fontFamily: "'Helvetica Neue', sans-serif" };
  const s = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)', fontFamily: "'Playfair Display', Georgia, serif", color: '#f5f5f5' },
    header: { background: 'linear-gradient(90deg, #b8860b 0%, #ffd700 50%, #b8860b 100%)', padding: '24px', textAlign: 'center', borderBottom: '4px solid #ffd700', boxShadow: '0 4px 30px rgba(255, 215, 0, 0.3)' },
    nav: { display: 'flex', justifyContent: 'center', gap: '8px', padding: '16px', background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid rgba(255,215,0,0.2)', flexWrap: 'wrap' },
    navBtn: (a) => ({ padding: '12px 24px', background: a ? 'linear-gradient(135deg, #ffd700, #b8860b)' : 'transparent', border: a ? 'none' : '1px solid rgba(255,215,0,0.4)', borderRadius: '8px', color: a ? '#0a0a0a' : '#ffd700', cursor: 'pointer', ...sans, fontSize: '0.9rem', fontWeight: a ? '700' : '400' }),
    main: { maxWidth: '1000px', margin: '0 auto', padding: '24px 16px' },
    card: { background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '24px', marginBottom: '20px', border: '1px solid rgba(255,215,0,0.2)' },
    cardTitle: { color: '#ffd700', marginTop: 0, marginBottom: '16px', fontSize: '1.3rem' },
    sectionTitle: { color: '#ffd700', fontSize: '1.1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' },
    catCard: (done) => ({ background: done ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.03)', border: done ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px', marginBottom: '12px', cursor: 'pointer' }),
    nomBtn: (sel) => ({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: sel ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.03)', border: sel ? '2px solid #ffd700' : '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', cursor: 'pointer', marginBottom: '8px', width: '100%', textAlign: 'left', color: '#f5f5f5' }),
    input: { flex: 1, minWidth: '200px', padding: '14px 18px', borderRadius: '8px', border: '1px solid rgba(255,215,0,0.4)', background: 'rgba(0,0,0,0.3)', color: '#f5f5f5', fontSize: '1rem', ...sans },
    submitBtn: (d) => ({ padding: '14px 32px', background: d ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #ffd700, #b8860b)', border: 'none', borderRadius: '8px', color: d ? 'rgba(255,255,255,0.3)' : '#0a0a0a', cursor: d ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '1rem', ...sans }),
    medal: (i) => ({ width: '36px', height: '36px', borderRadius: '50%', background: i === 0 ? 'linear-gradient(135deg, #ffd700, #b8860b)' : i === 1 ? 'linear-gradient(135deg, #c0c0c0, #a0a0a0)' : i === 2 ? 'linear-gradient(135deg, #cd7f32, #8b4513)' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: i < 3 ? '#0a0a0a' : '#f5f5f5', ...sans, flexShrink: 0 }),
    progressBar: { height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', marginTop: '8px' },
    progressFill: (pct, w) => ({ width: `${pct}%`, height: '100%', background: w ? '#22c55e' : 'linear-gradient(90deg, #ffd700, #b8860b)', borderRadius: '4px' }),
    sans,
  };

  if (loading) return <div style={{ ...s.container, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ color: '#ffd700', fontSize: '1.5rem' }}>Loading... 🏆</div></div>;

  return (
    <div style={s.container}>
      <header style={s.header}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#0a0a0a', margin: 0, letterSpacing: '3px' }}>🏆 Austin's Oscars Ballot 🏆</h1>
        <p style={{ margin: '8px 0 0', color: '#1a1a2e', fontSize: '0.9rem', letterSpacing: '2px', ...sans }}>98th Academy Awards · March 15, 2026</p>
      </header>

      <nav style={s.nav}>
        {[
          { id: 'submit', label: `📝 Submit Ballot (${Object.keys(picks).length}/${CATEGORIES.length})` },
          { id: 'leaderboard', label: `📊 Leaderboard (${announcedCount}/${CATEGORIES.length})` },
          { id: 'admin', label: adminUnlocked ? '⚙️ Admin' : '🔐 Admin' },
        ].map(t => <button key={t.id} onClick={() => setView(t.id)} style={s.navBtn(view === t.id)}>{t.label}</button>)}
      </nav>

      <main style={s.main}>
        {/* SUBMIT */}
        {view === 'submit' && (
          <div>
            <div style={s.card}>
              <h2 style={s.cardTitle}>Your Name</h2>
              <input type="text" placeholder="Enter your name" value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} style={{ ...s.input, width: '100%' }} />
            </div>
            {CATEGORY_GROUPS.map(group => (
              <div key={group.name} style={{ marginBottom: '32px' }}>
                <h3 style={s.sectionTitle}><span>{group.emoji}</span><span>{group.name}</span><span style={{ ...sans, fontSize: '0.85rem', opacity: 0.6, marginLeft: 'auto' }}>{group.categoryIds.filter(id => picks[id]).length}/{group.categoryIds.length}</span></h3>
                {group.categoryIds.map(catId => {
                  const cat = CATEGORIES.find(c => c.id === catId); if (!cat) return null;
                  const isExp = expandedCategory === catId;
                  const selNom = cat.nominees.find(n => n.id === picks[catId]);
                  return (
                    <div key={catId} style={s.catCard(!!picks[catId])} onClick={() => setExpandedCategory(isExp ? null : catId)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div><span style={{ marginRight: '8px' }}>{cat.emoji}</span><strong>{cat.name}</strong></div>
                        {selNom ? <span style={{ ...sans, fontSize: '0.85rem', color: '#22c55e' }}>✓ {selNom.name}</span> : <span style={{ ...sans, fontSize: '0.85rem', opacity: 0.5 }}>Tap to pick →</span>}
                      </div>
                      {isExp && (
                        <div style={{ marginTop: '16px' }} onClick={e => e.stopPropagation()}>
                          {[...cat.nominees].sort((a, b) => getOdds(b) - getOdds(a)).map(nom => (
                            <button key={nom.id} onClick={() => setPicks(prev => ({ ...prev, [catId]: nom.id }))} style={s.nomBtn(picks[catId] === nom.id)}>
                              <div><div style={{ fontWeight: '600' }}>{nom.name}</div><div style={{ ...sans, fontSize: '0.8rem', opacity: 0.6 }}>{nom.meta}</div></div>
                              <div style={{ textAlign: 'right' }}><div style={{ ...sans, color: '#ffd700', fontWeight: '700' }}>{calculatePoints(getOdds(nom))} pts</div><div style={{ ...sans, fontSize: '0.75rem', opacity: 0.5 }}>{(getOdds(nom) * 100).toFixed(0)}%</div></div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
            <div style={{ ...s.card, textAlign: 'center' }}>
              <p style={{ ...sans, marginBottom: '16px', opacity: 0.7 }}>{Object.keys(picks).length} of {CATEGORIES.length} categories selected</p>
              <button onClick={submitBallot} disabled={!newPlayerName.trim() || submitting} style={s.submitBtn(!newPlayerName.trim() || submitting)}>{submitting ? 'Submitting...' : '🎬 Submit Ballot'}</button>
            </div>
          </div>
        )}

        {/* LEADERBOARD */}
        {view === 'leaderboard' && (
          <div>
            <div style={s.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ ...s.cardTitle, margin: 0 }}>📊 Live Standings</h2>
                <span style={{ ...sans, color: '#ffd700' }}>{announcedCount}/{CATEGORIES.length} announced</span>
              </div>
              <div style={s.progressBar}><div style={s.progressFill((announcedCount / CATEGORIES.length) * 100, true)} /></div>
            </div>

            <div style={s.card}>
              <p style={{ ...sans, fontSize: '0.85rem', opacity: 0.5, marginBottom: '12px', marginTop: 0 }}>Tap a name to see their picks</p>
              {players.length === 0 ? (
                <p style={{ ...sans, textAlign: 'center', opacity: 0.5 }}>No ballots submitted yet</p>
              ) : (
                leaderboard.map((player, index) => {
                  const isExpanded = expandedPlayer === player.id;
                  return (
                    <div key={player.id} style={{ marginBottom: '8px' }}>
                      <div onClick={() => setExpandedPlayer(isExpanded ? null : player.id)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: player.correct > 0 ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.03)', border: isExpanded ? '2px solid #ffd700' : '1px solid rgba(255,255,255,0.1)', borderRadius: isExpanded ? '12px 12px 0 0' : '12px', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={s.medal(index)}>{index + 1}</div>
                          <div>
                            <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>
                              {player.name}
                              <span style={{ ...sans, fontSize: '0.75rem', opacity: 0.5, marginLeft: '8px' }}>{isExpanded ? '▲' : '▼'}</span>
                            </div>
                            <div style={{ ...sans, fontSize: '0.85rem', opacity: 0.6 }}>{player.correct}/{announcedCount} correct</div>
                          </div>
                        </div>
                        <div style={{ ...sans, fontSize: '1.5rem', fontWeight: '700', color: player.points > 0 ? '#22c55e' : 'rgba(255,255,255,0.3)' }}>{player.points} pts</div>
                      </div>
                      {isExpanded && (
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '2px solid #ffd700', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '16px 20px' }}>
                          {renderPlayerPicks(player)}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Pick Distribution */}
            {announcedCount > 0 && players.length > 0 && CATEGORY_GROUPS.map(group => {
              const cats = group.categoryIds.map(id => CATEGORIES.find(c => c.id === id)).filter(c => c && winners[c.id]);
              if (!cats.length) return null;
              return (
                <div key={group.name} style={s.card}>
                  <h3 style={s.sectionTitle}><span>{group.emoji}</span><span>{group.name} Results</span></h3>
                  {cats.map(cat => {
                    const winNom = cat.nominees.find(n => n.id === winners[cat.id]);
                    const counts = {}; cat.nominees.forEach(n => { counts[n.id] = 0; }); players.forEach(p => { if (p.picks?.[cat.id]) counts[p.picks[cat.id]] = (counts[p.picks[cat.id]] || 0) + 1; });
                    return (
                      <div key={cat.id} style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ fontWeight: '600' }}>{cat.emoji} {cat.name}</span><span style={{ ...sans, color: '#22c55e' }}>🏆 {winNom?.name}</span></div>
                        {cat.nominees.map(nom => { const c = counts[nom.id] || 0; const pct = players.length > 0 ? (c / players.length) * 100 : 0; const isW = nom.id === winners[cat.id]; if (c === 0 && !isW) return null; return (
                          <div key={nom.id} style={{ marginBottom: '8px' }}><div style={{ ...sans, display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}><span style={{ color: isW ? '#22c55e' : 'inherit' }}>{isW && '✓ '}{nom.name}</span><span>{c} ({pct.toFixed(0)}%)</span></div><div style={s.progressBar}><div style={s.progressFill(pct, isW)} /></div></div>
                        ); })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* ADMIN */}
        {view === 'admin' && (
          <div>
            {!adminUnlocked ? (
              <div style={{ ...s.card, maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
                <h2 style={s.cardTitle}>🔐 Admin Access</h2>
                <input type="password" placeholder="Password" value={passwordInput} onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(false); }} onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()} style={{ ...s.input, width: '100%', marginBottom: '12px', borderColor: passwordError ? '#ef4444' : undefined }} />
                {passwordError && <p style={{ ...sans, color: '#ef4444', marginBottom: '12px' }}>Incorrect password</p>}
                <button onClick={handleAdminLogin} style={s.submitBtn(false)}>Unlock</button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  {[{ id: 'winners', label: '🏆 Announce Winners' }, { id: 'odds', label: '📈 Update Odds' }, { id: 'players', label: '👥 Manage Players' }].map(t => <button key={t.id} onClick={() => setAdminTab(t.id)} style={s.navBtn(adminTab === t.id)}>{t.label}</button>)}
                </div>

                {adminTab === 'winners' && (
                  <div>{CATEGORY_GROUPS.map(group => (
                    <div key={group.name} style={{ marginBottom: '32px' }}>
                      <h3 style={s.sectionTitle}><span>{group.emoji}</span><span>{group.name}</span></h3>
                      {group.categoryIds.map(catId => { const cat = CATEGORIES.find(c => c.id === catId); if (!cat) return null; const hw = !!winners[catId]; return (
                        <div key={catId} style={s.catCard(hw)}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: hw ? '8px' : 0 }}>
                            <strong>{cat.emoji} {cat.name}</strong>
                            {hw && <button onClick={() => clearWinner(catId)} style={{ ...sans, background: 'rgba(239,68,68,0.2)', border: '1px solid #ef4444', padding: '4px 8px', borderRadius: '4px', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}>Clear</button>}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px', marginTop: '12px' }}>
                            {cat.nominees.map(nom => <button key={nom.id} onClick={() => setWinner(catId, nom.id)} style={{ padding: '10px', background: winners[catId] === nom.id ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'rgba(255,255,255,0.05)', border: winners[catId] === nom.id ? '2px solid #22c55e' : '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', cursor: 'pointer', color: '#f5f5f5', textAlign: 'left' }}><div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{nom.name}</div>{winners[catId] === nom.id && <div style={{ ...sans, fontSize: '0.75rem', marginTop: '4px' }}>✓ WINNER</div>}</button>)}
                          </div>
                        </div>
                      ); })}
                    </div>
                  ))}</div>
                )}

                {adminTab === 'odds' && (
                  <div>
                    <div style={{ ...s.card, background: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)' }}>
                      <p style={{ ...sans, marginBottom: '12px' }}>🔄 <strong>Fetch from Polymarket</strong></p>
                      <button onClick={async () => { try { const r = await fetch('/api/update-odds'); const d = await r.json(); if (d.success) { alert('✓ Updated!'); loadPolymarketOdds(); } else alert('Error: ' + (d.error || 'Unknown')); } catch (e) { alert('Failed: ' + e.message); } }} style={{ ...s.submitBtn(false), background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>🔄 Fetch Live Odds</button>
                    </div>
                    <div style={{ ...s.card, background: 'rgba(255,165,0,0.1)', borderColor: 'rgba(255,165,0,0.3)' }}>
                      <p style={{ ...sans, fontSize: '0.9rem', marginBottom: '8px' }}>✏️ <strong>Manual overrides</strong> — priority over Polymarket.</p>
                      <p style={{ ...sans, fontSize: '0.8rem', opacity: 0.7 }}>Enter as decimal: 0.75 = 75%</p>
                      {Object.keys(manualOdds).length > 0 && <button onClick={async () => { if (!confirm('Clear all?')) return; const { error } = await supabase.from('settings').update({ manual_odds: {} }).eq('id', 1); if (!error) setManualOdds({}); }} style={{ ...sans, marginTop: '8px', padding: '6px 12px', background: 'rgba(239,68,68,0.2)', border: '1px solid #ef4444', borderRadius: '4px', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}>Clear All ({Object.keys(manualOdds).length})</button>}
                    </div>
                    {CATEGORIES.map(cat => <div key={cat.id} style={{ ...s.card, padding: '16px' }}><h4 style={{ color: '#ffd700', marginTop: 0, marginBottom: '12px' }}>{cat.name}</h4>{cat.nominees.map(nom => <OddsInput key={nom.id} nominee={nom} currentOdds={getOdds(nom)} onSave={(v) => updateNomineeOdds(nom.id, v)} calculatePoints={calculatePoints} styles={s} />)}</div>)}
                  </div>
                )}

                {adminTab === 'players' && (
                  <div style={s.card}>
                    <h2 style={s.cardTitle}>👥 Manage Players</h2>
                    {players.length === 0 ? <p style={{ ...sans, opacity: 0.5 }}>No players yet</p> : players.map(p => (
                      <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', marginBottom: '8px' }}>
                        <div><strong>{p.name}</strong><span style={{ ...sans, marginLeft: '12px', opacity: 0.6, fontSize: '0.85rem' }}>{Object.keys(p.picks || {}).length} picks</span></div>
                        <button onClick={() => removePlayer(p.id)} style={{ ...sans, background: 'rgba(239,68,68,0.2)', border: '1px solid #ef4444', padding: '6px 12px', borderRadius: '4px', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}>Remove</button>
                      </div>
                    ))}
                    <button onClick={resetAll} style={{ marginTop: '20px', padding: '12px 24px', background: 'rgba(239,68,68,0.2)', border: '1px solid #ef4444', borderRadius: '8px', color: '#ef4444', cursor: 'pointer', ...sans }}>🗑️ Reset Everything</button>
                  </div>
                )}

                <div style={{ textAlign: 'center', marginTop: '24px' }}><button onClick={handleAdminLogout} style={{ ...sans, padding: '12px 24px', background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>🔒 Lock Admin & Logout</button></div>
              </>
            )}
          </div>
        )}
      </main>

      <footer style={{ textAlign: 'center', padding: '24px', borderTop: '1px solid rgba(255,215,0,0.2)', ...sans, fontSize: '0.8rem', opacity: 0.5 }}>
        Points = 10 ÷ odds · 50% = 20pts · 10% = 100pts · Min 10pts · Riskier picks = more points ⚡
      </footer>
    </div>
  );
}
