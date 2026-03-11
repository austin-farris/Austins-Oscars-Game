import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { CATEGORIES, CATEGORY_GROUPS, calculatePoints } from './categories';

// Admin password - CHANGE THIS!
const ADMIN_PASSWORD = "oscar2026";

// Buffered odds input — stores local string while editing, only saves to DB on blur or Enter
function OddsInput({ nominee, currentOdds, onSave, calculatePoints, styles }) {
  const [localVal, setLocalVal] = useState(String(currentOdds));
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Sync if parent odds change (e.g. after Polymarket fetch)
  useEffect(() => {
    setLocalVal(String(currentOdds));
  }, [currentOdds]);

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
        <input
          type="number"
          step="0.01"
          min="0"
          max="1"
          value={localVal}
          onChange={(e) => setLocalVal(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') { commit(); e.target.blur(); } }}
          style={{
            width: '80px',
            padding: '6px',
            borderRadius: '4px',
            border: `1px solid ${error ? '#ef4444' : saved ? '#22c55e' : 'rgba(255,215,0,0.4)'}`,
            background: 'rgba(0,0,0,0.3)',
            color: '#f5f5f5',
            textAlign: 'center',
            transition: 'border-color 0.3s',
            opacity: saving ? 0.5 : 1,
          }}
          disabled={saving}
        />
        <span style={{
          ...styles.sans,
          color: error ? '#ef4444' : saved ? '#22c55e' : '#ffd700',
          width: '90px',
          fontSize: '0.85rem',
          transition: 'color 0.3s',
        }}>
          {error ? error : saving ? '...' : saved ? '✓ saved' : `= ${calculatePoints(parseFloat(localVal) || currentOdds)} pts`}
        </span>
      </div>
    </div>
  );
}

export default function App() {
  // Core state
  const [players, setPlayers] = useState([]);
  const [winners, setWinners] = useState({}); // { categoryId: nomineeId }
  const [odds, setOdds] = useState({}); // { nomineeId: odds }
  const [loading, setLoading] = useState(true);

  // UI state
  const [view, setView] = useState('submit'); // 'submit' | 'leaderboard' | 'admin'
  const [newPlayerName, setNewPlayerName] = useState('');
  const [picks, setPicks] = useState({}); // { categoryId: nomineeId }
  const [submitting, setSubmitting] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);

  // Admin state
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [adminTab, setAdminTab] = useState('winners'); // 'winners' | 'odds' | 'players'

  // Check admin status on load
  useEffect(() => {
    const saved = localStorage.getItem('oscars_admin_unlocked');
    if (saved === 'true') setAdminUnlocked(true);
  }, []);

  // Load data on mount
  useEffect(() => {
    loadData();
    
    // Real-time subscriptions
    const playersSub = supabase
      .channel('players-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, loadPlayers)
      .subscribe();

    const settingsSub = supabase
      .channel('settings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, loadSettings)
      .subscribe();

    const oddsSub = supabase
      .channel('odds-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'odds' }, loadOdds)
      .subscribe();

    return () => {
      supabase.removeChannel(playersSub);
      supabase.removeChannel(settingsSub);
      supabase.removeChannel(oddsSub);
    };
  }, []);

  async function loadData() {
    setLoading(true);
    await Promise.all([loadPlayers(), loadSettings(), loadOdds()]);
    setLoading(false);
  }

  async function loadPlayers() {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('created_at', { ascending: true });
    if (!error && data) setPlayers(data);
  }

  async function loadSettings() {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .single();
    if (!error && data && data.winners) {
      setWinners(data.winners);
    }
  }

  async function loadOdds() {
    const { data, error } = await supabase.from('odds').select('*');
    if (!error && data) {
      const oddsMap = {};
      data.forEach(o => { oddsMap[o.nominee_id] = o.odds; });
      setOdds(oddsMap);
    }
  }

  // Get odds for a nominee (from DB or default)
  const getOdds = (nominee) => {
    return odds[nominee.id] !== undefined ? odds[nominee.id] : nominee.odds;
  };

  // Admin functions
  const handleAdminLogin = () => {
    if (passwordInput === ADMIN_PASSWORD) {
      setAdminUnlocked(true);
      setPasswordError(false);
      localStorage.setItem('oscars_admin_unlocked', 'true');
    } else {
      setPasswordError(true);
    }
  };

  const handleAdminLogout = () => {
    setAdminUnlocked(false);
    localStorage.removeItem('oscars_admin_unlocked');
    setView('leaderboard');
  };

  // Submit ballot
  async function submitBallot() {
    if (!newPlayerName.trim()) return;
    
    const totalPicks = Object.keys(picks).length;
    if (totalPicks < CATEGORIES.length) {
      if (!confirm(`You've only picked ${totalPicks} of ${CATEGORIES.length} categories. Submit anyway?`)) {
        return;
      }
    }

    const existing = players.find(p => p.name.toLowerCase() === newPlayerName.toLowerCase());
    if (existing) {
      alert('Someone with that name already submitted!');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase
      .from('players')
      .insert([{ name: newPlayerName.trim(), picks }]);
    
    if (error) {
      alert('Error submitting ballot');
      console.error(error);
    } else {
      setNewPlayerName('');
      setPicks({});
      setView('leaderboard');
    }
    setSubmitting(false);
  }

  // Admin: Set winner
  async function setWinner(categoryId, nomineeId) {
    const newWinners = { ...winners, [categoryId]: nomineeId };
    const { error } = await supabase
      .from('settings')
      .update({ winners: newWinners })
      .eq('id', 1);
    if (error) console.error(error);
    else setWinners(newWinners);
  }

  // Admin: Clear winner
  async function clearWinner(categoryId) {
    const newWinners = { ...winners };
    delete newWinners[categoryId];
    const { error } = await supabase
      .from('settings')
      .update({ winners: newWinners })
      .eq('id', 1);
    if (error) console.error(error);
    else setWinners(newWinners);
  }

  // Admin: Update odds for a nominee
  // Strategy: try update first (most common case), fall back to insert if no row exists
  async function updateNomineeOdds(nomineeId, newOdds) {
    const parsed = parseFloat(newOdds);
    if (isNaN(parsed) || parsed < 0 || parsed > 1) {
      throw new Error('Odds must be between 0 and 1');
    }

    // Try update first
    const { data: updated, error: updateErr } = await supabase
      .from('odds')
      .update({ odds: parsed })
      .eq('nominee_id', nomineeId)
      .select();

    if (updateErr) {
      console.error('Update error:', updateErr);
      // Fall through to insert
    }

    // If update touched a row, we're done
    if (updated && updated.length > 0) {
      setOdds(prev => ({ ...prev, [nomineeId]: parsed }));
      return;
    }

    // No existing row — insert
    const { error: insertErr } = await supabase
      .from('odds')
      .insert({ nominee_id: nomineeId, odds: parsed });

    if (insertErr) {
      console.error('Insert error:', insertErr);
      throw new Error(insertErr.message);
    }

    setOdds(prev => ({ ...prev, [nomineeId]: parsed }));
  }

  // Admin: Remove player
  async function removePlayer(playerId) {
    await supabase.from('players').delete().eq('id', playerId);
  }

  // Admin: Reset all
  async function resetAll() {
    if (!confirm('Delete ALL players and winners? This cannot be undone!')) return;
    await supabase.from('players').delete().neq('id', 0);
    await supabase.from('settings').update({ winners: {} }).eq('id', 1);
    setWinners({});
  }

  // Calculate player's total score
  const calculatePlayerScore = (player) => {
    let total = 0;
    let correct = 0;
    
    if (!player.picks) return { total: 0, correct: 0 };
    
    for (const [categoryId, nomineeId] of Object.entries(player.picks)) {
      if (winners[categoryId] === nomineeId) {
        const category = CATEGORIES.find(c => c.id === categoryId);
        const nominee = category?.nominees.find(n => n.id === nomineeId);
        if (nominee) {
          total += calculatePoints(getOdds(nominee));
          correct++;
        }
      }
    }
    return { total, correct };
  };

  // Build leaderboard
  const leaderboard = players
    .map(player => {
      const { total, correct } = calculatePlayerScore(player);
      return { ...player, points: total, correct };
    })
    .sort((a, b) => b.points - a.points || b.correct - a.correct);

  // Count announced winners
  const announcedCount = Object.keys(winners).length;

  // Styles
  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
      fontFamily: "'Playfair Display', Georgia, serif",
      color: '#f5f5f5',
    },
    header: {
      background: 'linear-gradient(90deg, #b8860b 0%, #ffd700 50%, #b8860b 100%)',
      padding: '24px',
      textAlign: 'center',
      borderBottom: '4px solid #ffd700',
      boxShadow: '0 4px 30px rgba(255, 215, 0, 0.3)',
    },
    title: {
      fontSize: '2rem',
      fontWeight: '700',
      color: '#0a0a0a',
      margin: 0,
      letterSpacing: '3px',
    },
    subtitle: {
      margin: '8px 0 0',
      color: '#1a1a2e',
      fontSize: '0.9rem',
      letterSpacing: '2px',
      fontFamily: "'Helvetica Neue', sans-serif",
    },
    nav: {
      display: 'flex',
      justifyContent: 'center',
      gap: '8px',
      padding: '16px',
      background: 'rgba(0,0,0,0.4)',
      borderBottom: '1px solid rgba(255,215,0,0.2)',
      flexWrap: 'wrap',
    },
    navButton: (active) => ({
      padding: '12px 24px',
      background: active ? 'linear-gradient(135deg, #ffd700, #b8860b)' : 'transparent',
      border: active ? 'none' : '1px solid rgba(255,215,0,0.4)',
      borderRadius: '8px',
      color: active ? '#0a0a0a' : '#ffd700',
      cursor: 'pointer',
      fontFamily: "'Helvetica Neue', sans-serif",
      fontSize: '0.9rem',
      fontWeight: active ? '700' : '400',
    }),
    main: {
      maxWidth: '1000px',
      margin: '0 auto',
      padding: '24px 16px',
    },
    card: {
      background: 'rgba(255,255,255,0.05)',
      borderRadius: '16px',
      padding: '24px',
      marginBottom: '20px',
      border: '1px solid rgba(255,215,0,0.2)',
    },
    cardTitle: {
      color: '#ffd700',
      marginTop: 0,
      marginBottom: '16px',
      fontSize: '1.3rem',
    },
    sectionTitle: {
      color: '#ffd700',
      fontSize: '1.1rem',
      marginBottom: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    categoryCard: (isComplete) => ({
      background: isComplete ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.03)',
      border: isComplete ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,255,255,0.1)',
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '12px',
      cursor: 'pointer',
    }),
    nomineeButton: (selected) => ({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 16px',
      background: selected ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.03)',
      border: selected ? '2px solid #ffd700' : '1px solid rgba(255,255,255,0.1)',
      borderRadius: '8px',
      cursor: 'pointer',
      marginBottom: '8px',
      width: '100%',
      textAlign: 'left',
      color: '#f5f5f5',
    }),
    input: {
      flex: 1,
      minWidth: '200px',
      padding: '14px 18px',
      borderRadius: '8px',
      border: '1px solid rgba(255,215,0,0.4)',
      background: 'rgba(0,0,0,0.3)',
      color: '#f5f5f5',
      fontSize: '1rem',
      fontFamily: "'Helvetica Neue', sans-serif",
    },
    submitButton: (disabled) => ({
      padding: '14px 32px',
      background: disabled ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #ffd700, #b8860b)',
      border: 'none',
      borderRadius: '8px',
      color: disabled ? 'rgba(255,255,255,0.3)' : '#0a0a0a',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontWeight: '700',
      fontSize: '1rem',
      fontFamily: "'Helvetica Neue', sans-serif",
    }),
    leaderboardRow: (isCorrect, hasWinner) => ({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 20px',
      background: isCorrect ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '12px',
      marginBottom: '8px',
    }),
    medal: (index) => ({
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      background: index === 0 ? 'linear-gradient(135deg, #ffd700, #b8860b)' 
        : index === 1 ? 'linear-gradient(135deg, #c0c0c0, #a0a0a0)'
        : index === 2 ? 'linear-gradient(135deg, #cd7f32, #8b4513)'
        : 'rgba(255,255,255,0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: '700',
      color: index < 3 ? '#0a0a0a' : '#f5f5f5',
      fontFamily: "'Helvetica Neue', sans-serif",
      flexShrink: 0,
    }),
    progressBar: {
      height: '8px',
      background: 'rgba(255,255,255,0.1)',
      borderRadius: '4px',
      overflow: 'hidden',
      marginTop: '8px',
    },
    progressFill: (pct, isWinner) => ({
      width: `${pct}%`,
      height: '100%',
      background: isWinner ? '#22c55e' : 'linear-gradient(90deg, #ffd700, #b8860b)',
      borderRadius: '4px',
    }),
    sans: {
      fontFamily: "'Helvetica Neue', sans-serif",
    },
  };

  if (loading) {
    return (
      <div style={{ ...styles.container, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#ffd700', fontSize: '1.5rem' }}>Loading... 🏆</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.title}>🏆 Austin's Oscars Ballot 🏆</h1>
        <p style={styles.subtitle}>98th Academy Awards · March 15, 2026</p>
      </header>

      {/* Navigation */}
      <nav style={styles.nav}>
        {[
          { id: 'submit', label: `📝 Submit Ballot (${Object.keys(picks).length}/${CATEGORIES.length})` },
          { id: 'leaderboard', label: `📊 Leaderboard (${announcedCount}/${CATEGORIES.length})` },
          { id: 'admin', label: adminUnlocked ? '⚙️ Admin' : '🔐 Admin' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            style={styles.navButton(view === tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main style={styles.main}>
        {/* SUBMIT VIEW */}
        {view === 'submit' && (
          <div>
            {/* Player Name */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Your Name</h2>
              <input
                type="text"
                placeholder="Enter your name"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                style={{ ...styles.input, width: '100%' }}
              />
            </div>

            {/* Categories by Group */}
            {CATEGORY_GROUPS.map(group => (
              <div key={group.name} style={{ marginBottom: '32px' }}>
                <h3 style={styles.sectionTitle}>
                  <span>{group.emoji}</span>
                  <span>{group.name}</span>
                  <span style={{ ...styles.sans, fontSize: '0.85rem', opacity: 0.6, marginLeft: 'auto' }}>
                    {group.categoryIds.filter(id => picks[id]).length}/{group.categoryIds.length}
                  </span>
                </h3>
                
                {group.categoryIds.map(categoryId => {
                  const category = CATEGORIES.find(c => c.id === categoryId);
                  if (!category) return null;
                  const isExpanded = expandedCategory === categoryId;
                  const selectedNominee = category.nominees.find(n => n.id === picks[categoryId]);
                  
                  return (
                    <div
                      key={categoryId}
                      style={styles.categoryCard(!!picks[categoryId])}
                      onClick={() => setExpandedCategory(isExpanded ? null : categoryId)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ marginRight: '8px' }}>{category.emoji}</span>
                          <strong>{category.name}</strong>
                        </div>
                        {selectedNominee ? (
                          <span style={{ ...styles.sans, fontSize: '0.85rem', color: '#22c55e' }}>
                            ✓ {selectedNominee.name}
                          </span>
                        ) : (
                          <span style={{ ...styles.sans, fontSize: '0.85rem', opacity: 0.5 }}>
                            Tap to pick →
                          </span>
                        )}
                      </div>
                      
                      {isExpanded && (
                        <div style={{ marginTop: '16px' }} onClick={e => e.stopPropagation()}>
                          {[...category.nominees]
                            .sort((a, b) => getOdds(b) - getOdds(a))
                            .map(nominee => (
                            <button
                              key={nominee.id}
                              onClick={() => setPicks(prev => ({ ...prev, [categoryId]: nominee.id }))}
                              style={styles.nomineeButton(picks[categoryId] === nominee.id)}
                            >
                              <div>
                                <div style={{ fontWeight: '600' }}>{nominee.name}</div>
                                <div style={{ ...styles.sans, fontSize: '0.8rem', opacity: 0.6 }}>
                                  {nominee.meta}
                                </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ ...styles.sans, color: '#ffd700', fontWeight: '700' }}>
                                  {calculatePoints(getOdds(nominee))} pts
                                </div>
                                <div style={{ ...styles.sans, fontSize: '0.75rem', opacity: 0.5 }}>
                                  {(getOdds(nominee) * 100).toFixed(0)}%
                                </div>
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

            {/* Submit Button */}
            <div style={{ ...styles.card, textAlign: 'center' }}>
              <p style={{ ...styles.sans, marginBottom: '16px', opacity: 0.7 }}>
                {Object.keys(picks).length} of {CATEGORIES.length} categories selected
              </p>
              <button
                onClick={submitBallot}
                disabled={!newPlayerName.trim() || submitting}
                style={styles.submitButton(!newPlayerName.trim() || submitting)}
              >
                {submitting ? 'Submitting...' : '🎬 Submit Ballot'}
              </button>
            </div>
          </div>
        )}

        {/* LEADERBOARD VIEW */}
        {view === 'leaderboard' && (
          <div>
            {/* Progress */}
            <div style={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ ...styles.cardTitle, margin: 0 }}>📊 Live Standings</h2>
                <span style={{ ...styles.sans, color: '#ffd700' }}>
                  {announcedCount}/{CATEGORIES.length} announced
                </span>
              </div>
              <div style={styles.progressBar}>
                <div style={styles.progressFill((announcedCount / CATEGORIES.length) * 100, true)} />
              </div>
            </div>

            {/* Leaderboard */}
            <div style={styles.card}>
              {players.length === 0 ? (
                <p style={{ ...styles.sans, textAlign: 'center', opacity: 0.5 }}>No ballots submitted yet</p>
              ) : (
                leaderboard.map((player, index) => (
                  <div key={player.id} style={styles.leaderboardRow(player.correct > 0, announcedCount > 0)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={styles.medal(index)}>{index + 1}</div>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>{player.name}</div>
                        <div style={{ ...styles.sans, fontSize: '0.85rem', opacity: 0.6 }}>
                          {player.correct}/{announcedCount} correct
                        </div>
                      </div>
                    </div>
                    <div style={{ ...styles.sans, fontSize: '1.5rem', fontWeight: '700', color: player.points > 0 ? '#22c55e' : 'rgba(255,255,255,0.3)' }}>
                      {player.points} pts
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pick Distribution by Category Group */}
            {announcedCount > 0 && players.length > 0 && CATEGORY_GROUPS.map(group => {
              const groupCategories = group.categoryIds
                .map(id => CATEGORIES.find(c => c.id === id))
                .filter(c => c && winners[c.id]);
              
              if (groupCategories.length === 0) return null;
              
              return (
                <div key={group.name} style={styles.card}>
                  <h3 style={styles.sectionTitle}>
                    <span>{group.emoji}</span>
                    <span>{group.name} Results</span>
                  </h3>
                  
                  {groupCategories.map(category => {
                    const winnerNominee = category.nominees.find(n => n.id === winners[category.id]);
                    const pickCounts = {};
                    category.nominees.forEach(n => { pickCounts[n.id] = 0; });
                    players.forEach(p => {
                      if (p.picks && p.picks[category.id]) {
                        pickCounts[p.picks[category.id]] = (pickCounts[p.picks[category.id]] || 0) + 1;
                      }
                    });
                    
                    return (
                      <div key={category.id} style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontWeight: '600' }}>{category.emoji} {category.name}</span>
                          <span style={{ ...styles.sans, color: '#22c55e' }}>
                            🏆 {winnerNominee?.name}
                          </span>
                        </div>
                        
                        {category.nominees.map(nominee => {
                          const count = pickCounts[nominee.id] || 0;
                          const pct = players.length > 0 ? (count / players.length) * 100 : 0;
                          const isWinner = nominee.id === winners[category.id];
                          
                          if (count === 0 && !isWinner) return null;
                          
                          return (
                            <div key={nominee.id} style={{ marginBottom: '8px' }}>
                              <div style={{ ...styles.sans, display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                                <span style={{ color: isWinner ? '#22c55e' : 'inherit' }}>
                                  {isWinner && '✓ '}{nominee.name}
                                </span>
                                <span>{count} ({pct.toFixed(0)}%)</span>
                              </div>
                              <div style={styles.progressBar}>
                                <div style={styles.progressFill(pct, isWinner)} />
                              </div>
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
              <div style={{ ...styles.card, maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
                <h2 style={styles.cardTitle}>🔐 Admin Access</h2>
                <input
                  type="password"
                  placeholder="Password"
                  value={passwordInput}
                  onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(false); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                  style={{ ...styles.input, width: '100%', marginBottom: '12px', borderColor: passwordError ? '#ef4444' : undefined }}
                />
                {passwordError && <p style={{ ...styles.sans, color: '#ef4444', marginBottom: '12px' }}>Incorrect password</p>}
                <button onClick={handleAdminLogin} style={styles.submitButton(false)}>Unlock</button>
              </div>
            ) : (
              <>
                {/* Admin Tabs */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  {[
                    { id: 'winners', label: '🏆 Announce Winners' },
                    { id: 'odds', label: '📈 Update Odds' },
                    { id: 'players', label: '👥 Manage Players' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setAdminTab(tab.id)}
                      style={styles.navButton(adminTab === tab.id)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Announce Winners */}
                {adminTab === 'winners' && (
                  <div>
                    {CATEGORY_GROUPS.map(group => (
                      <div key={group.name} style={{ marginBottom: '32px' }}>
                        <h3 style={styles.sectionTitle}>
                          <span>{group.emoji}</span>
                          <span>{group.name}</span>
                        </h3>
                        
                        {group.categoryIds.map(categoryId => {
                          const category = CATEGORIES.find(c => c.id === categoryId);
                          if (!category) return null;
                          const hasWinner = !!winners[categoryId];
                          
                          return (
                            <div key={categoryId} style={styles.categoryCard(hasWinner)}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: hasWinner ? '8px' : 0 }}>
                                <strong>{category.emoji} {category.name}</strong>
                                {hasWinner && (
                                  <button
                                    onClick={() => clearWinner(categoryId)}
                                    style={{ ...styles.sans, background: 'rgba(239,68,68,0.2)', border: '1px solid #ef4444', padding: '4px 8px', borderRadius: '4px', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}
                                  >
                                    Clear
                                  </button>
                                )}
                              </div>
                              
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px', marginTop: '12px' }}>
                                {category.nominees.map(nominee => (
                                  <button
                                    key={nominee.id}
                                    onClick={() => setWinner(categoryId, nominee.id)}
                                    style={{
                                      padding: '10px',
                                      background: winners[categoryId] === nominee.id ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'rgba(255,255,255,0.05)',
                                      border: winners[categoryId] === nominee.id ? '2px solid #22c55e' : '1px solid rgba(255,255,255,0.2)',
                                      borderRadius: '8px',
                                      cursor: 'pointer',
                                      color: '#f5f5f5',
                                      textAlign: 'left',
                                    }}
                                  >
                                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{nominee.name}</div>
                                    {winners[categoryId] === nominee.id && (
                                      <div style={{ ...styles.sans, fontSize: '0.75rem', marginTop: '4px' }}>✓ WINNER</div>
                                    )}
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

                {/* Update Odds */}
                {adminTab === 'odds' && (
                  <div>
                    <div style={{ ...styles.card, background: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)' }}>
                      <p style={{ ...styles.sans, marginBottom: '12px' }}>
                        🔄 <strong>Fetch from Polymarket</strong> — Click to sync all odds automatically
                      </p>
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch('/api/update-odds');
                            const data = await res.json();
                            if (data.success) {
                              alert(`✓ Updated odds from Polymarket!`);
                              loadOdds();
                            } else {
                              alert('Error: ' + (data.error || 'Unknown error'));
                            }
                          } catch (err) {
                            alert('Failed: ' + err.message);
                          }
                        }}
                        style={{ ...styles.submitButton(false), background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
                      >
                        🔄 Fetch Live Odds
                      </button>
                    </div>
                    
                    <p style={{ ...styles.sans, fontSize: '0.9rem', opacity: 0.7, marginBottom: '16px' }}>
                      Or manually update below (enter as decimal: 0.75 = 75%)
                    </p>
                    
                    {CATEGORIES.map(category => (
                      <div key={category.id} style={{ ...styles.card, padding: '16px' }}>
                        <h4 style={{ color: '#ffd700', marginTop: 0, marginBottom: '12px' }}>
                          {category.name}
                        </h4>
                        {category.nominees.map(nominee => (
                          <OddsInput
                            key={nominee.id}
                            nominee={nominee}
                            currentOdds={getOdds(nominee)}
                            onSave={(val) => updateNomineeOdds(nominee.id, val)}
                            calculatePoints={calculatePoints}
                            styles={styles}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {/* Manage Players */}
                {adminTab === 'players' && (
                  <div style={styles.card}>
                    <h2 style={styles.cardTitle}>👥 Manage Players</h2>
                    
                    {players.length === 0 ? (
                      <p style={{ ...styles.sans, opacity: 0.5 }}>No players yet</p>
                    ) : (
                      players.map(player => (
                        <div key={player.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', marginBottom: '8px' }}>
                          <div>
                            <strong>{player.name}</strong>
                            <span style={{ ...styles.sans, marginLeft: '12px', opacity: 0.6, fontSize: '0.85rem' }}>
                              {Object.keys(player.picks || {}).length} picks
                            </span>
                          </div>
                          <button
                            onClick={() => removePlayer(player.id)}
                            style={{ ...styles.sans, background: 'rgba(239,68,68,0.2)', border: '1px solid #ef4444', padding: '6px 12px', borderRadius: '4px', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}
                          >
                            Remove
                          </button>
                        </div>
                      ))
                    )}

                    <button
                      onClick={resetAll}
                      style={{ marginTop: '20px', padding: '12px 24px', background: 'rgba(239,68,68,0.2)', border: '1px solid #ef4444', borderRadius: '8px', color: '#ef4444', cursor: 'pointer', fontFamily: "'Helvetica Neue', sans-serif" }}
                    >
                      🗑️ Reset Everything
                    </button>
                  </div>
                )}

                {/* Logout */}
                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                  <button onClick={handleAdminLogout} style={{ ...styles.sans, padding: '12px 24px', background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
                    🔒 Lock Admin & Logout
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '24px', borderTop: '1px solid rgba(255,215,0,0.2)', fontFamily: "'Helvetica Neue', sans-serif", fontSize: '0.8rem', opacity: 0.5 }}>
        Points = 100 × (1 - odds) · Riskier picks = more points · Real-time sync ⚡
      </footer>
    </div>
  );
}
