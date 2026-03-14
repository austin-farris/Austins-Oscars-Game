import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { CATEGORIES, CATEGORY_GROUPS, calculatePoints } from './categories';

// Admin password - CHANGE THIS!
const ADMIN_PASSWORD = "oscar2026";

// Buffered odds input
function OddsInput({ nominee, currentOdds, onSave, calculatePoints, styles }) {
  const [localVal, setLocalVal] = useState(String(currentOdds));
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { setLocalVal(String(currentOdds)); }, [currentOdds]);

  async function commit() {
    const parsed = parseFloat(localVal);
    if (isNaN(parsed) || parsed < 0 || parsed > 1) {
      setError('Must be 0–1');
      setTimeout(() => setError(null), 2000);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(parsed);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (err) {
      setError('Save failed');
      setTimeout(() => setError(null), 3000);
    }
    setSaving(false);
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
      <span style={{ minWidth: '150px', fontSize: '0.9rem' }}>{nominee.name}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input type="number" step="0.01" min="0" max="1" value={localVal}
          onChange={(e) => setLocalVal(e.target.value)} onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') { commit(); e.target.blur(); } }}
          style={{ width: '80px', padding: '6px', borderRadius: '4px', border: `1px solid ${error ? '#ef4444' : saved ? '#22c55e' : 'rgba(255,215,0,0.4)'}`, background: 'rgba(0,0,0,0.3)', color: '#f5f5f5', textAlign: 'center', transition: 'border-color 0.3s', opacity: saving ? 0.5 : 1 }}
          disabled={saving}
        />
        <span style={{ fontFamily: "'Helvetica Neue', sans-serif", color: error ? '#ef4444' : saved ? '#22c55e' : '#ffd700', width: '90px', fontSize: '0.85rem', transition: 'color 0.3s' }}>
          {error ? error : saving ? '...' : saved ? '✓ saved' : `= ${calculatePoints(parseFloat(localVal) || currentOdds)} pts`}
        </span>
      </div>
    </div>
  );
}

export default function App() {
  // Core state
  const [players, setPlayers] = useState([]);
  const [winners, setWinners] = useState({});
  const [manualOdds, setManualOdds] = useState({});
  const [polymarketOdds, setPolymarketOdds] = useState({});
  const [loading, setLoading] = useState(true);

  // UI state
  const [view, setView] = useState('submit');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [picks, setPicks] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);

  // Player tracking — remember who submitted from this device
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [showMyPicks, setShowMyPicks] = useState(true);

  // Admin state
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [adminTab, setAdminTab] = useState('winners');

  // Load saved state on mount
  useEffect(() => {
    const savedAdmin = localStorage.getItem('oscars_admin_unlocked');
    if (savedAdmin === 'true') setAdminUnlocked(true);
    const savedPlayer = localStorage.getItem('oscars_player_name');
    if (savedPlayer) {
      setCurrentPlayer(savedPlayer);
      setView('leaderboard');
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadData();
    const playersSub = supabase.channel('players-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, loadPlayers).subscribe();
    const settingsSub = supabase.channel('settings-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, loadSettings).subscribe();
    const oddsSub = supabase.channel('odds-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'odds' }, loadPolymarketOdds).subscribe();
    return () => { supabase.removeChannel(playersSub); supabase.removeChannel(settingsSub); supabase.removeChannel(oddsSub); };
  }, []);

  async function loadData() {
    setLoading(true);
    await Promise.all([loadPlayers(), loadSettings(), loadPolymarketOdds()]);
    setLoading(false);
  }

  async function loadPlayers() {
    const { data, error } = await supabase.from('players').select('*').order('created_at', { ascending: true });
    if (!error && data) setPlayers(data);
  }

  async function loadSettings() {
    const { data, error } = await supabase.from('settings').select('*').eq('id', 1).single();
    if (!error && data) {
      if (data.winners) setWinners(data.winners);
      if (data.manual_odds) setManualOdds(data.manual_odds);
    }
  }

  async function loadPolymarketOdds() {
    const { data, error } = await supabase.from('odds').select('*');
    if (!error && data) {
      const oddsMap = {};
      data.forEach(o => { oddsMap[o.nominee_id] = o.odds; });
      setPolymarketOdds(oddsMap);
    }
  }

  const getOdds = (nominee) => {
    if (manualOdds[nominee.id] !== undefined) return manualOdds[nominee.id];
    if (polymarketOdds[nominee.id] !== undefined) return polymarketOdds[nominee.id];
    return nominee.odds;
  };

  const handleAdminLogin = () => {
    if (passwordInput === ADMIN_PASSWORD) {
      setAdminUnlocked(true);
      setPasswordError(false);
      localStorage.setItem('oscars_admin_unlocked', 'true');
    } else { setPasswordError(true); }
  };

  const handleAdminLogout = () => {
    setAdminUnlocked(false);
    localStorage.removeItem('oscars_admin_unlocked');
    setView('leaderboard');
  };

  // Submit ballot — save player name to localStorage
  async function submitBallot() {
    if (!newPlayerName.trim()) return;
    const totalPicks = Object.keys(picks).length;
    if (totalPicks < CATEGORIES.length) {
      if (!confirm(`You've only picked ${totalPicks} of ${CATEGORIES.length} categories. Submit anyway?`)) return;
    }
    const existing = players.find(p => p.name.toLowerCase() === newPlayerName.toLowerCase());
    if (existing) { alert('Someone with that name already submitted!'); return; }

    setSubmitting(true);
    const { error } = await supabase.from('players').insert([{ name: newPlayerName.trim(), picks }]);
    if (error) { alert('Error submitting ballot'); console.error(error); }
    else {
      localStorage.setItem('oscars_player_name', newPlayerName.trim());
      setCurrentPlayer(newPlayerName.trim());
      setNewPlayerName('');
      setPicks({});
      setView('leaderboard');
    }
    setSubmitting(false);
  }

  async function setWinner(categoryId, nomineeId) {
    const newWinners = { ...winners, [categoryId]: nomineeId };
    const { error } = await supabase.from('settings').update({ winners: newWinners }).eq('id', 1);
    if (!error) setWinners(newWinners);
  }

  async function clearWinner(categoryId) {
    const newWinners = { ...winners };
    delete newWinners[categoryId];
    const { error } = await supabase.from('settings').update({ winners: newWinners }).eq('id', 1);
    if (!error) setWinners(newWinners);
  }

  async function updateNomineeOdds(nomineeId, newOdds) {
    const parsed = parseFloat(newOdds);
    if (isNaN(parsed) || parsed < 0 || parsed > 1) throw new Error('Odds must be between 0 and 1');
    const newManualOdds = { ...manualOdds, [nomineeId]: parsed };
    const { error } = await supabase.from('settings').update({ manual_odds: newManualOdds }).eq('id', 1);
    if (error) { console.error('Manual odds save error:', error); throw new Error(error.message); }
    setManualOdds(newManualOdds);
  }

  async function removePlayer(playerId) { await supabase.from('players').delete().eq('id', playerId); }

  async function resetAll() {
    if (!confirm('Delete ALL players and winners? This cannot be undone!')) return;
    await supabase.from('players').delete().neq('id', 0);
    await supabase.from('settings').update({ winners: {}, manual_odds: {} }).eq('id', 1);
    setWinners({}); setManualOdds({});
  }

  const calculatePlayerScore = (player) => {
    let total = 0, correct = 0;
    if (!player.picks) return { total: 0, correct: 0 };
    for (const [categoryId, nomineeId] of Object.entries(player.picks)) {
      if (winners[categoryId] === nomineeId) {
        const category = CATEGORIES.find(c => c.id === categoryId);
        const nominee = category?.nominees.find(n => n.id === nomineeId);
        if (nominee) { total += calculatePoints(getOdds(nominee)); correct++; }
      }
    }
    return { total, correct };
  };

  const leaderboard = players
    .map(player => { const { total, correct } = calculatePlayerScore(player); return { ...player, points: total, correct }; })
    .sort((a, b) => b.points - a.points || b.correct - a.correct);

  const announcedCount = Object.keys(winners).length;

  // Find current player's data
  const myPlayerData = currentPlayer ? players.find(p => p.name.toLowerCase() === currentPlayer.toLowerCase()) : null;

  // Styles
  const s = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)', fontFamily: "'Playfair Display', Georgia, serif", color: '#f5f5f5' },
    header: { background: 'linear-gradient(90deg, #b8860b 0%, #ffd700 50%, #b8860b 100%)', padding: '24px', textAlign: 'center', borderBottom: '4px solid #ffd700', boxShadow: '0 4px 30px rgba(255, 215, 0, 0.3)' },
    title: { fontSize: '2rem', fontWeight: '700', color: '#0a0a0a', margin: 0, letterSpacing: '3px' },
    subtitle: { margin: '8px 0 0', color: '#1a1a2e', fontSize: '0.9rem', letterSpacing: '2px', fontFamily: "'Helvetica Neue', sans-serif" },
    nav: { display: 'flex', justifyContent: 'center', gap: '8px', padding: '16px', background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid rgba(255,215,0,0.2)', flexWrap: 'wrap' },
    navBtn: (active) => ({ padding: '12px 24px', background: active ? 'linear-gradient(135deg, #ffd700, #b8860b)' : 'transparent', border: active ? 'none' : '1px solid rgba(255,215,0,0.4)', borderRadius: '8px', color: active ? '#0a0a0a' : '#ffd700', cursor: 'pointer', fontFamily: "'Helvetica Neue', sans-serif", fontSize: '0.9rem', fontWeight: active ? '700' : '400' }),
    main: { maxWidth: '1000px', margin: '0 auto', padding: '24px 16px' },
    card: { background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '24px', marginBottom: '20px', border: '1px solid rgba(255,215,0,0.2)' },
    cardTitle: { color: '#ffd700', marginTop: 0, marginBottom: '16px', fontSize: '1.3rem' },
    sectionTitle: { color: '#ffd700', fontSize: '1.1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' },
    catCard: (done) => ({ background: done ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.03)', border: done ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px', marginBottom: '12px', cursor: 'pointer' }),
    nomBtn: (sel) => ({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: sel ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.03)', border: sel ? '2px solid #ffd700' : '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', cursor: 'pointer', marginBottom: '8px', width: '100%', textAlign: 'left', color: '#f5f5f5' }),
    input: { flex: 1, minWidth: '200px', padding: '14px 18px', borderRadius: '8px', border: '1px solid rgba(255,215,0,0.4)', background: 'rgba(0,0,0,0.3)', color: '#f5f5f5', fontSize: '1rem', fontFamily: "'Helvetica Neue', sans-serif" },
    submitBtn: (dis) => ({ padding: '14px 32px', background: dis ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #ffd700, #b8860b)', border: 'none', borderRadius: '8px', color: dis ? 'rgba(255,255,255,0.3)' : '#0a0a0a', cursor: dis ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '1rem', fontFamily: "'Helvetica Neue', sans-serif" }),
    lbRow: (correct) => ({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: correct ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', marginBottom: '8px' }),
    medal: (i) => ({ width: '36px', height: '36px', borderRadius: '50%', background: i === 0 ? 'linear-gradient(135deg, #ffd700, #b8860b)' : i === 1 ? 'linear-gradient(135deg, #c0c0c0, #a0a0a0)' : i === 2 ? 'linear-gradient(135deg, #cd7f32, #8b4513)' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: i < 3 ? '#0a0a0a' : '#f5f5f5', fontFamily: "'Helvetica Neue', sans-serif", flexShrink: 0 }),
    progressBar: { height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', marginTop: '8px' },
    progressFill: (pct, win) => ({ width: `${pct}%`, height: '100%', background: win ? '#22c55e' : 'linear-gradient(90deg, #ffd700, #b8860b)', borderRadius: '4px' }),
    sans: { fontFamily: "'Helvetica Neue', sans-serif" },
  };

  if (loading) {
    return (<div style={{ ...s.container, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ color: '#ffd700', fontSize: '1.5rem' }}>Loading... 🏆</div></div>);
  }

  return (
    <div style={s.container}>
      <header style={s.header}>
        <h1 style={s.title}>🏆 Austin's Oscars Ballot 🏆</h1>
        <p style={s.subtitle}>98th Academy Awards · March 15, 2026</p>
      </header>

      <nav style={s.nav}>
        {[
          { id: 'submit', label: currentPlayer ? `📝 New Ballot` : `📝 Submit Ballot (${Object.keys(picks).length}/${CATEGORIES.length})` },
          { id: 'leaderboard', label: `📊 Leaderboard (${announcedCount}/${CATEGORIES.length})` },
          { id: 'admin', label: adminUnlocked ? '⚙️ Admin' : '🔐 Admin' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setView(tab.id)} style={s.navBtn(view === tab.id)}>{tab.label}</button>
        ))}
      </nav>

      <main style={s.main}>
        {/* SUBMIT VIEW */}
        {view === 'submit' && (
          <div>
            {currentPlayer && (
              <div style={{ ...s.card, background: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)', textAlign: 'center' }}>
                <p style={{ ...s.sans, marginBottom: '8px' }}>✅ You already submitted as <strong>{currentPlayer}</strong></p>
                <p style={{ ...s.sans, fontSize: '0.85rem', opacity: 0.7 }}>Check the Leaderboard to track your picks. You can submit another ballot with a different name below.</p>
              </div>
            )}
            <div style={s.card}>
              <h2 style={s.cardTitle}>Your Name</h2>
              <input type="text" placeholder="Enter your name" value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} style={{ ...s.input, width: '100%' }} />
            </div>

            {CATEGORY_GROUPS.map(group => (
              <div key={group.name} style={{ marginBottom: '32px' }}>
                <h3 style={s.sectionTitle}>
                  <span>{group.emoji}</span><span>{group.name}</span>
                  <span style={{ ...s.sans, fontSize: '0.85rem', opacity: 0.6, marginLeft: 'auto' }}>{group.categoryIds.filter(id => picks[id]).length}/{group.categoryIds.length}</span>
                </h3>
                {group.categoryIds.map(categoryId => {
                  const category = CATEGORIES.find(c => c.id === categoryId);
                  if (!category) return null;
                  const isExpanded = expandedCategory === categoryId;
                  const selectedNominee = category.nominees.find(n => n.id === picks[categoryId]);
                  return (
                    <div key={categoryId} style={s.catCard(!!picks[categoryId])} onClick={() => setExpandedCategory(isExpanded ? null : categoryId)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div><span style={{ marginRight: '8px' }}>{category.emoji}</span><strong>{category.name}</strong></div>
                        {selectedNominee ? (
                          <span style={{ ...s.sans, fontSize: '0.85rem', color: '#22c55e' }}>✓ {selectedNominee.name}</span>
                        ) : (
                          <span style={{ ...s.sans, fontSize: '0.85rem', opacity: 0.5 }}>Tap to pick →</span>
                        )}
                      </div>
                      {isExpanded && (
                        <div style={{ marginTop: '16px' }} onClick={e => e.stopPropagation()}>
                          {[...category.nominees].sort((a, b) => getOdds(b) - getOdds(a)).map(nominee => (
                            <button key={nominee.id} onClick={() => setPicks(prev => ({ ...prev, [categoryId]: nominee.id }))} style={s.nomBtn(picks[categoryId] === nominee.id)}>
                              <div>
                                <div style={{ fontWeight: '600' }}>{nominee.name}</div>
                                <div style={{ ...s.sans, fontSize: '0.8rem', opacity: 0.6 }}>{nominee.meta}</div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ ...s.sans, color: '#ffd700', fontWeight: '700' }}>{calculatePoints(getOdds(nominee))} pts</div>
                                <div style={{ ...s.sans, fontSize: '0.75rem', opacity: 0.5 }}>{(getOdds(nominee) * 100).toFixed(0)}%</div>
                              </div>
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
              <p style={{ ...s.sans, marginBottom: '16px', opacity: 0.7 }}>{Object.keys(picks).length} of {CATEGORIES.length} categories selected</p>
              <button onClick={submitBallot} disabled={!newPlayerName.trim() || submitting} style={s.submitBtn(!newPlayerName.trim() || submitting)}>
                {submitting ? 'Submitting...' : '🎬 Submit Ballot'}
              </button>
            </div>
          </div>
        )}

        {/* LEADERBOARD VIEW */}
        {view === 'leaderboard' && (
          <div>
            {/* Progress */}
            <div style={s.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ ...s.cardTitle, margin: 0 }}>📊 Live Standings</h2>
                <span style={{ ...s.sans, color: '#ffd700' }}>{announcedCount}/{CATEGORIES.length} announced</span>
              </div>
              <div style={s.progressBar}><div style={s.progressFill((announcedCount / CATEGORIES.length) * 100, true)} /></div>
            </div>

            {/* Leaderboard */}
            <div style={s.card}>
              {players.length === 0 ? (
                <p style={{ ...s.sans, textAlign: 'center', opacity: 0.5 }}>No ballots submitted yet</p>
              ) : (
                leaderboard.map((player, index) => (
                  <div key={player.id} style={{ ...s.lbRow(player.correct > 0), border: myPlayerData && player.id === myPlayerData.id ? '2px solid #ffd700' : '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={s.medal(index)}>{index + 1}</div>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>
                          {player.name}
                          {myPlayerData && player.id === myPlayerData.id && <span style={{ ...s.sans, fontSize: '0.75rem', color: '#ffd700', marginLeft: '8px' }}>← You</span>}
                        </div>
                        <div style={{ ...s.sans, fontSize: '0.85rem', opacity: 0.6 }}>{player.correct}/{announcedCount} correct</div>
                      </div>
                    </div>
                    <div style={{ ...s.sans, fontSize: '1.5rem', fontWeight: '700', color: player.points > 0 ? '#22c55e' : 'rgba(255,255,255,0.3)' }}>{player.points} pts</div>
                  </div>
                ))
              )}
            </div>

            {/* MY PICKS SECTION */}
            {myPlayerData && (
              <div style={s.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setShowMyPicks(!showMyPicks)}>
                  <h2 style={{ ...s.cardTitle, margin: 0 }}>📝 My Picks — {myPlayerData.name}</h2>
                  <span style={{ ...s.sans, color: '#ffd700', fontSize: '0.9rem' }}>{showMyPicks ? 'Hide ▲' : 'Show ▼'}</span>
                </div>

                {showMyPicks && (
                  <div style={{ marginTop: '16px' }}>
                    {CATEGORY_GROUPS.map(group => (
                      <div key={group.name} style={{ marginBottom: '24px' }}>
                        <h4 style={{ ...s.sectionTitle, marginBottom: '8px' }}><span>{group.emoji}</span><span>{group.name}</span></h4>
                        {group.categoryIds.map(categoryId => {
                          const category = CATEGORIES.find(c => c.id === categoryId);
                          if (!category) return null;
                          const myPickId = myPlayerData.picks?.[categoryId];
                          const myPick = category.nominees.find(n => n.id === myPickId);
                          const winnerNomineeId = winners[categoryId];
                          const hasWinner = !!winnerNomineeId;
                          const isCorrect = hasWinner && myPickId === winnerNomineeId;
                          const isWrong = hasWinner && myPickId && myPickId !== winnerNomineeId;
                          const winnerNominee = hasWinner ? category.nominees.find(n => n.id === winnerNomineeId) : null;
                          const pointsEarned = isCorrect && myPick ? calculatePoints(getOdds(myPick)) : 0;

                          return (
                            <div key={categoryId} style={{
                              padding: '10px 14px', marginBottom: '6px', borderRadius: '8px',
                              background: isCorrect ? 'rgba(34,197,94,0.15)' : isWrong ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.03)',
                              border: `1px solid ${isCorrect ? 'rgba(34,197,94,0.3)' : isWrong ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)'}`,
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  <span style={{ fontSize: '0.8rem', opacity: 0.6, ...s.sans }}>{category.emoji} {category.name}</span>
                                  <div style={{ fontWeight: '600', fontSize: '0.95rem', marginTop: '2px' }}>
                                    {isCorrect && '✅ '}{isWrong && '❌ '}
                                    {myPick ? myPick.name : <span style={{ opacity: 0.4, fontStyle: 'italic' }}>No pick</span>}
                                  </div>
                                  {isWrong && winnerNominee && (
                                    <div style={{ ...s.sans, fontSize: '0.8rem', color: '#22c55e', marginTop: '2px' }}>
                                      Winner: {winnerNominee.name}
                                    </div>
                                  )}
                                </div>
                                <div style={{ textAlign: 'right', ...s.sans }}>
                                  {isCorrect ? (
                                    <span style={{ color: '#22c55e', fontWeight: '700', fontSize: '1rem' }}>+{pointsEarned}</span>
                                  ) : hasWinner ? (
                                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>0 pts</span>
                                  ) : myPick ? (
                                    <span style={{ color: '#ffd700', fontSize: '0.85rem' }}>{calculatePoints(getOdds(myPick))} pts</span>
                                  ) : null}
                                  {!hasWinner && <div style={{ fontSize: '0.7rem', opacity: 0.4, marginTop: '2px' }}>Pending</div>}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                    {/* Not you? */}
                    <div style={{ textAlign: 'center', marginTop: '16px' }}>
                      <button onClick={() => { localStorage.removeItem('oscars_player_name'); setCurrentPlayer(null); }}
                        style={{ ...s.sans, padding: '8px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '0.8rem' }}>
                        Not {myPlayerData.name}? Switch player
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* If not logged in, prompt to claim */}
            {!myPlayerData && players.length > 0 && (
              <div style={{ ...s.card, textAlign: 'center' }}>
                <p style={{ ...s.sans, marginBottom: '12px', opacity: 0.7 }}>Track your picks during the show!</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                  {players.map(p => (
                    <button key={p.id} onClick={() => { localStorage.setItem('oscars_player_name', p.name); setCurrentPlayer(p.name); }}
                      style={{ padding: '10px 20px', background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.4)', borderRadius: '8px', color: '#ffd700', cursor: 'pointer', fontFamily: "'Helvetica Neue', sans-serif", fontSize: '0.9rem' }}>
                      I'm {p.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Pick Distribution */}
            {announcedCount > 0 && players.length > 0 && CATEGORY_GROUPS.map(group => {
              const groupCategories = group.categoryIds.map(id => CATEGORIES.find(c => c.id === id)).filter(c => c && winners[c.id]);
              if (groupCategories.length === 0) return null;
              return (
                <div key={group.name} style={s.card}>
                  <h3 style={s.sectionTitle}><span>{group.emoji}</span><span>{group.name} Results</span></h3>
                  {groupCategories.map(category => {
                    const winnerNominee = category.nominees.find(n => n.id === winners[category.id]);
                    const pickCounts = {};
                    category.nominees.forEach(n => { pickCounts[n.id] = 0; });
                    players.forEach(p => { if (p.picks && p.picks[category.id]) { pickCounts[p.picks[category.id]] = (pickCounts[p.picks[category.id]] || 0) + 1; } });
                    return (
                      <div key={category.id} style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontWeight: '600' }}>{category.emoji} {category.name}</span>
                          <span style={{ ...s.sans, color: '#22c55e' }}>🏆 {winnerNominee?.name}</span>
                        </div>
                        {category.nominees.map(nominee => {
                          const count = pickCounts[nominee.id] || 0;
                          const pct = players.length > 0 ? (count / players.length) * 100 : 0;
                          const isWinner = nominee.id === winners[category.id];
                          if (count === 0 && !isWinner) return null;
                          return (
                            <div key={nominee.id} style={{ marginBottom: '8px' }}>
                              <div style={{ ...s.sans, display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                                <span style={{ color: isWinner ? '#22c55e' : 'inherit' }}>{isWinner && '✓ '}{nominee.name}</span>
                                <span>{count} ({pct.toFixed(0)}%)</span>
                              </div>
                              <div style={s.progressBar}><div style={s.progressFill(pct, isWinner)} /></div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* ADMIN VIEW */}
        {view === 'admin' && (
          <div>
            {!adminUnlocked ? (
              <div style={{ ...s.card, maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
                <h2 style={s.cardTitle}>🔐 Admin Access</h2>
                <input type="password" placeholder="Password" value={passwordInput}
                  onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(false); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                  style={{ ...s.input, width: '100%', marginBottom: '12px', borderColor: passwordError ? '#ef4444' : undefined }}
                />
                {passwordError && <p style={{ ...s.sans, color: '#ef4444', marginBottom: '12px' }}>Incorrect password</p>}
                <button onClick={handleAdminLogin} style={s.submitBtn(false)}>Unlock</button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  {[{ id: 'winners', label: '🏆 Announce Winners' }, { id: 'odds', label: '📈 Update Odds' }, { id: 'players', label: '👥 Manage Players' }].map(tab => (
                    <button key={tab.id} onClick={() => setAdminTab(tab.id)} style={s.navBtn(adminTab === tab.id)}>{tab.label}</button>
                  ))}
                </div>

                {adminTab === 'winners' && (
                  <div>
                    {CATEGORY_GROUPS.map(group => (
                      <div key={group.name} style={{ marginBottom: '32px' }}>
                        <h3 style={s.sectionTitle}><span>{group.emoji}</span><span>{group.name}</span></h3>
                        {group.categoryIds.map(categoryId => {
                          const category = CATEGORIES.find(c => c.id === categoryId);
                          if (!category) return null;
                          const hasWinner = !!winners[categoryId];
                          return (
                            <div key={categoryId} style={s.catCard(hasWinner)}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: hasWinner ? '8px' : 0 }}>
                                <strong>{category.emoji} {category.name}</strong>
                                {hasWinner && (
                                  <button onClick={() => clearWinner(categoryId)} style={{ ...s.sans, background: 'rgba(239,68,68,0.2)', border: '1px solid #ef4444', padding: '4px 8px', borderRadius: '4px', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}>Clear</button>
                                )}
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px', marginTop: '12px' }}>
                                {category.nominees.map(nominee => (
                                  <button key={nominee.id} onClick={() => setWinner(categoryId, nominee.id)}
                                    style={{ padding: '10px', background: winners[categoryId] === nominee.id ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'rgba(255,255,255,0.05)', border: winners[categoryId] === nominee.id ? '2px solid #22c55e' : '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', cursor: 'pointer', color: '#f5f5f5', textAlign: 'left' }}>
                                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{nominee.name}</div>
                                    {winners[categoryId] === nominee.id && <div style={{ ...s.sans, fontSize: '0.75rem', marginTop: '4px' }}>✓ WINNER</div>}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}

                {adminTab === 'odds' && (
                  <div>
                    <div style={{ ...s.card, background: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)' }}>
                      <p style={{ ...s.sans, marginBottom: '12px' }}>🔄 <strong>Fetch from Polymarket</strong></p>
                      <button onClick={async () => {
                        try { const res = await fetch('/api/update-odds'); const data = await res.json(); if (data.success) { alert(`✓ Updated odds!`); loadPolymarketOdds(); } else { alert('Error: ' + (data.error || 'Unknown')); } } catch (err) { alert('Failed: ' + err.message); }
                      }} style={{ ...s.submitBtn(false), background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>🔄 Fetch Live Odds</button>
                    </div>
                    <div style={{ ...s.card, background: 'rgba(255,165,0,0.1)', borderColor: 'rgba(255,165,0,0.3)' }}>
                      <p style={{ ...s.sans, fontSize: '0.9rem', marginBottom: '8px' }}>✏️ <strong>Manual overrides below</strong> — these take priority over Polymarket odds.</p>
                      <p style={{ ...s.sans, fontSize: '0.8rem', opacity: 0.7 }}>Enter as decimal: 0.75 = 75%</p>
                      {Object.keys(manualOdds).length > 0 && (
                        <button onClick={async () => { if (!confirm('Clear all manual overrides?')) return; const { error } = await supabase.from('settings').update({ manual_odds: {} }).eq('id', 1); if (!error) setManualOdds({}); }}
                          style={{ ...s.sans, marginTop: '8px', padding: '6px 12px', background: 'rgba(239,68,68,0.2)', border: '1px solid #ef4444', borderRadius: '4px', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}>
                          Clear All Manual Overrides ({Object.keys(manualOdds).length})
                        </button>
                      )}
                    </div>
                    {CATEGORIES.map(category => (
                      <div key={category.id} style={{ ...s.card, padding: '16px' }}>
                        <h4 style={{ color: '#ffd700', marginTop: 0, marginBottom: '12px' }}>{category.name}</h4>
                        {category.nominees.map(nominee => (
                          <OddsInput key={nominee.id} nominee={nominee} currentOdds={getOdds(nominee)} onSave={(val) => updateNomineeOdds(nominee.id, val)} calculatePoints={calculatePoints} styles={s} />
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {adminTab === 'players' && (
                  <div style={s.card}>
                    <h2 style={s.cardTitle}>👥 Manage Players</h2>
                    {players.length === 0 ? (
                      <p style={{ ...s.sans, opacity: 0.5 }}>No players yet</p>
                    ) : (
                      players.map(player => (
                        <div key={player.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', marginBottom: '8px' }}>
                          <div><strong>{player.name}</strong><span style={{ ...s.sans, marginLeft: '12px', opacity: 0.6, fontSize: '0.85rem' }}>{Object.keys(player.picks || {}).length} picks</span></div>
                          <button onClick={() => removePlayer(player.id)} style={{ ...s.sans, background: 'rgba(239,68,68,0.2)', border: '1px solid #ef4444', padding: '6px 12px', borderRadius: '4px', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}>Remove</button>
                        </div>
                      ))
                    )}
                    <button onClick={resetAll} style={{ marginTop: '20px', padding: '12px 24px', background: 'rgba(239,68,68,0.2)', border: '1px solid #ef4444', borderRadius: '8px', color: '#ef4444', cursor: 'pointer', fontFamily: "'Helvetica Neue', sans-serif" }}>🗑️ Reset Everything</button>
                  </div>
                )}

                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                  <button onClick={handleAdminLogout} style={{ ...s.sans, padding: '12px 24px', background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>🔒 Lock Admin & Logout</button>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      <footer style={{ textAlign: 'center', padding: '24px', borderTop: '1px solid rgba(255,215,0,0.2)', fontFamily: "'Helvetica Neue', sans-serif", fontSize: '0.8rem', opacity: 0.5 }}>
        Points = 10 ÷ odds · 50% = 20pts · 10% = 100pts · Min 10pts · Riskier picks = more points ⚡
      </footer>
    </div>
  );
}
