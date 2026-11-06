import { useEffect, useRef, useState } from 'react';
import { api, auth, ws } from '@appdeploy/client';
import {
  ArrowUpRight, Gamepad2, Trophy, UserRound, Search, Play, Zap, Crown,
  Sparkles, RotateCcw, X, Users, Plus, Copy, LogOut, Wifi, ShieldCheck
} from 'lucide-react';

const catalog = [
  { id: 'tictactoe', name: 'Neon Tic-Tac-Toe', genre: 'Strategy', players: '1–2 players', color: 'violet', description: 'Challenge a friend in a live tactical duel.' },
  { id: 'memory', name: 'Memory Flux', genre: 'Puzzle', players: '1 player', color: 'cyan', description: 'Match the pairs. Train your focus.' },
  { id: 'coming', name: 'Orbit Runner', genre: 'Arcade', players: 'Coming soon', color: 'orange', description: 'Dodge, dash and chase a new high score.' },
];
const symbols = ['✦', '◈', '☄', '✺', '⬡', '❖', '✧', '◎'];
const emptyScores = { played: 0, wins: 0, losses: 0 };

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [active, setActive] = useState('home');
  const [game, setGame] = useState('');
  const [query, setQuery] = useState('');
  const [name, setName] = useState('Player');
  const [editing, setEditing] = useState(false);
  const [scores, setScores] = useState(emptyScores);
  const [leaderboard, setLeaderboard] = useState([]);
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [room, setRoom] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [connected, setConnected] = useState(false);
  const [memory, setMemory] = useState(() => makeMemory());
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const connectionRef = useRef(null);

  useEffect(() => {
    let alive = true;
    auth.getUser().then(async current => {
      if (!alive) return;
      setUser(current);
      if (current) {
        try {
          const response = await api.get('/api/profile');
          if (alive) {
            setName(response.data.profile?.name || current.name || current.email?.split('@')[0] || 'Player');
            setScores(response.data.profile?.stats || emptyScores);
          }
        } catch {
          if (alive) setName(current.name || current.email?.split('@')[0] || 'Player');
        }
      }
    }).catch(err => alive && setAuthError(err.message || 'Could not restore your session.'))
      .finally(() => alive && setAuthLoading(false));
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!user) return;
    const connection = ws.connect();
    connectionRef.current = connection;
    connection.onOpen(() => setConnected(true));
    connection.onClose(() => setConnected(false));
    connection.onError(() => setConnected(false));
    connection.onMessage(message => {
      if (message?.type !== 'entity.update' || message.payload?.entity_type !== 'room') return;
      setRoom(current => current?.code === message.payload.entity_id ? message.payload.data : current);
    });
    connection.ready.then(() => setConnected(true)).catch(() => setConnected(false));
    return () => {
      connection.disconnect();
      connectionRef.current = null;
      setConnected(false);
    };
  }, [user?.userId]);

  useEffect(() => {
    if (!room?.code || !connected || !connectionRef.current?.connectionId) return;
    const connectionId = connectionRef.current.connectionId;
    let cancelled = false;
    api.post('/api/subscriptions', { entity_type: 'room', entity_id: room.code, connection_id: connectionId }).catch(() => {
      if (!cancelled) setNotice('Live updates could not connect. Reopen the room to retry.');
    });
    return () => {
      cancelled = true;
      api.post('/api/subscriptions/remove', { entity_type: 'room', entity_id: room.code, connection_id: connectionId }).catch(() => {});
    };
  }, [room?.code, connected]);

  useEffect(() => {
    if (active !== 'leaderboard' || !user) return;
    api.get('/api/leaderboard').then(r => setLeaderboard(r.data.players || [])).catch(() => setNotice('Could not load global rankings.'));
  }, [active, user?.userId]);

  async function signIn() {
    setAuthError('');
    try { await auth.signInWithRedirect(); }
    catch (err) { setAuthError(err.message || 'Sign-in failed. Please try again.'); }
  }

  async function signOut() {
    if (room?.code && connectionRef.current?.connectionId) {
      await api.post('/api/subscriptions/remove', { entity_type: 'room', entity_id: room.code, connection_id: connectionRef.current.connectionId }).catch(() => {});
    }
    await auth.signOut();
    setUser(null); setRoom(null); setActive('home');
  }

  async function saveProfile() {
    const clean = name.trim().slice(0, 20);
    if (!clean) { setNotice('Choose a display name first.'); return; }
    setBusy(true);
    try {
      const response = await api.put('/api/profile', { name: clean });
      setName(response.data.profile.name);
      setScores(response.data.profile.stats || emptyScores);
      setEditing(false);
      setNotice('Profile saved to your PIXORA account.');
    } catch (err) { setNotice(err.response?.data?.error || err.message || 'Could not save profile.'); }
    finally { setBusy(false); }
  }

  async function createRoom() {
    setBusy(true); setNotice('');
    try {
      const response = await api.post('/api/rooms', { name });
      setRoom(response.data.room); setRoomCode(response.data.room.code); setActive('room');
    } catch (err) { setNotice(err.response?.data?.error || err.message || 'Could not create room.'); }
    finally { setBusy(false); }
  }

  async function joinRoom() {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) { setNotice('Enter the six-character room code.'); return; }
    setBusy(true); setNotice('');
    try {
      const response = await api.post('/api/rooms/' + code + '/join', { name });
      setRoom(response.data.room); setRoomCode(code); setActive('room');
    } catch (err) { setNotice(err.response?.data?.error || err.message || 'Could not join that room.'); }
    finally { setBusy(false); }
  }

  async function refreshRoom() {
    if (!roomCode) return;
    try {
      const response = await api.get('/api/rooms/' + roomCode);
      setRoom(response.data.room);
    } catch (err) { setNotice(err.response?.data?.error || 'Room could not be loaded.'); }
  }

  async function makeMove(index) {
    if (!room || room.status !== 'playing' || room.board[index] || busy) return;
    setBusy(true);
    try {
      const response = await api.post('/api/rooms/' + room.code + '/move', { index });
      setRoom(response.data.room);
    } catch (err) { setNotice(err.response?.data?.error || err.message || 'Move was not accepted.'); }
    finally { setBusy(false); }
  }

  async function copyCode() {
    try { await navigator.clipboard.writeText(room?.code || roomCode); setNotice('Room code copied. Send it to your friend.'); }
    catch { setNotice('Your room code is ' + (room?.code || roomCode)); }
  }

  function startLocalMemory() {
    setMemory(makeMemory()); setFlipped([]); setMatched([]); setMoves(0);
    setGame('memory'); setActive('play');
  }

  function flipCard(id) {
    if (flipped.length === 2 || flipped.includes(id) || matched.includes(id)) return;
    const next = [...flipped, id]; setFlipped(next);
    if (next.length === 2) {
      setMoves(m => m + 1);
      const [a, b] = next.map(n => memory.find(c => c.id === n));
      if (a.value === b.value) {
        const found = [...matched, ...next]; setMatched(found); setFlipped([]);
      } else window.setTimeout(() => setFlipped([]), 750);
    }
  }

  const filtered = catalog.filter(g => (g.name + g.genre).toLowerCase().includes(query.toLowerCase()));
  const myPlayer = room?.players?.find(p => p.userId === user?.userId);
  const winner = room?.winner || '';
  const myTurn = room?.status === 'playing' && room?.currentTurn === myPlayer?.mark;
  const nav = [
    { id: 'home', label: 'Discover', icon: Gamepad2 },
    { id: 'library', label: 'Library', icon: Zap },
    { id: 'online', label: 'Online play', icon: Users },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  ];

  if (authLoading) return <div className="auth-screen"><div className="brand-mark">P</div><h2>Loading your playverse…</h2></div>;
  if (!user) return (
    <div className="auth-screen">
      <div className="auth-glow" />
      <div className="auth-card">
        <div className="brand-mark auth-mark">P</div>
        <div className="eyebrow">THE MULTIPLAYER PLAYVERSE</div>
        <h1>PLAY<br/><span>TOGETHER.</span></h1>
        <p>Sign in to create rooms, challenge friends live, and build your global player record.</p>
        <button className="primary-btn auth-cta" onClick={signIn}>SIGN IN TO PIXORA <ArrowUpRight size={17}/></button>
        {authError && <p className="notice error">{authError}</p>}
        <div className="auth-foot"><ShieldCheck size={14}/> Secure account sign-in powered by PIXORA</div>
      </div>
    </div>
  );

  return (
    <div className="shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => setActive('home')}><span className="brand-mark">P</span><span>PIXORA<span className="brand-dot">.</span></span></button>
        <div className="side-label">PLAY</div>
        {nav.map(n => <button key={n.id} className={'nav-item '+(active===n.id?'selected':'')} onClick={() => setActive(n.id)}><n.icon size={18}/>{n.label}</button>)}
        <div className="side-bottom"><div className="online-dot"/> {connected ? 'LIVE CONNECTION' : 'RECONNECTING'} <span className="version">MULTIPLAYER BETA</span></div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div className="breadcrumb">PIXORA <span>/</span> {active === 'room' ? 'ROOM ' + roomCode : active.toUpperCase()}</div>
          <div className="top-actions"><span className="status-pill"><span/> {connected ? 'LIVE' : 'OFFLINE'}</span><button className="profile-button" onClick={() => setEditing(true)}><span className="avatar">{name.slice(0,1).toUpperCase()}</span><span>{name}</span><UserRound size={15}/></button><button className="icon-button" aria-label="Sign out" onClick={signOut}><LogOut size={16}/></button></div>
        </header>
        {notice && <div className="notice-bar">{notice}<button onClick={() => setNotice('')}><X size={14}/></button></div>}

        {active === 'home' && <section className="content">
          <div className="hero"><div className="hero-copy"><div className="eyebrow"><Sparkles size={14}/> YOUR NEXT OBSESSION STARTS HERE</div><h1>ENTER THE<br/><span>PLAYVERSE.</span></h1><p>Discover quick games, challenge your friends live, and make every break legendary.</p><button className="primary-btn" onClick={() => setActive('online')}>CHALLENGE A FRIEND <ArrowUpRight size={17}/></button></div><div className="hero-art"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="orb-core">P<span>✦</span></div><div className="float-chip chip-one">✕</div><div className="float-chip chip-two">◈</div><div className="float-chip chip-three">✧</div><div className="art-caption">NO LIMITS. JUST PLAY.</div></div><div className="hero-index">01 <span>/ 03</span></div></div>
          <div className="section-head"><div><div className="eyebrow">HANDPICKED FOR YOU</div><h2>Featured games</h2></div><button className="text-btn" onClick={() => setActive('library')}>VIEW ALL <ArrowUpRight size={15}/></button></div>
          <div className="game-grid">{catalog.slice(0,2).map((g,i)=><GameCard key={g.id} item={g} index={i} onPlay={() => g.id === 'memory' ? startLocalMemory() : setActive('online')}/>)}</div>
          <div className="bottom-stats"><div><span className="stat-icon"><Gamepad2 size={18}/></span><div><strong>{scores.played}</strong><small>GAMES PLAYED</small></div></div><div><span className="stat-icon"><Trophy size={18}/></span><div><strong>{scores.wins}</strong><small>VICTORIES</small></div></div><div><span className="stat-icon"><Crown size={18}/></span><div><strong>{scores.played?Math.round(scores.wins/scores.played*100):0}%</strong><small>WIN RATE</small></div></div></div>
        </section>}

        {active === 'library' && <section className="content"><div className="page-title"><div className="eyebrow">THE ARCADE</div><h1>GAME <span>LIBRARY.</span></h1><p>Pick your next challenge.</p></div><div className="search-wrap"><Search size={18}/><input aria-label="Search games" placeholder="Search games or genres..." value={query} onChange={e=>setQuery(e.target.value)}/></div><div className="game-grid">{filtered.map((g,i)=><GameCard key={g.id} item={g} index={i} onPlay={() => g.id==='memory'?startLocalMemory():setActive('online')}/>)}</div></section>}

        {active === 'online' && <section className="content">
          <div className="page-title"><div className="eyebrow"><Wifi size={13}/> REAL-TIME MULTIPLAYER</div><h1>PLAY <span>TOGETHER.</span></h1><p>Create a private room or join a friend with a six-character code.</p></div>
          <div className="online-grid">
            <div className="online-card"><div className="online-icon"><Plus size={22}/></div><div className="eyebrow">HOST A MATCH</div><h2>Create a room</h2><p>Start a Tic-Tac-Toe match and invite a friend to take the other side.</p><button className="primary-btn" disabled={busy} onClick={createRoom}>CREATE PRIVATE ROOM <ArrowUpRight size={16}/></button></div>
            <div className="online-card"><div className="online-icon cyan-icon"><Users size={22}/></div><div className="eyebrow">JOIN A FRIEND</div><h2>Enter room code</h2><p>Have a code? Join the lobby and play as the challenger.</p><input className="room-input" value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6))} placeholder="6-CHARACTER CODE" maxLength={6}/><button className="primary-btn" disabled={busy} onClick={joinRoom}>JOIN ROOM <ArrowUpRight size={16}/></button></div>
          </div>
          <div className="security-note"><ShieldCheck size={17}/> Every move is validated on the server. Players can only act on their own turn.</div>
        </section>}

        {active === 'room' && room && <section className="content play-content">
          <button className="back-btn" onClick={() => {setActive('online');setRoom(null);setRoomCode('');}}>← BACK TO MULTIPLAYER</button>
          <div className="page-title"><div className="eyebrow">PRIVATE MATCH / {room.status.toUpperCase()}</div><h1>NEON <span>DUEL.</span></h1><p>Share this room code with your opponent.</p></div>
          <div className="room-layout"><div className="game-panel multiplayer-panel">
            <div className="room-code-box"><div><small>ROOM CODE</small><strong>{room.code}</strong></div><button className="outline-btn" onClick={copyCode}><Copy size={14}/> COPY CODE</button></div>
            <div className="versus-row">{room.players.map(p=><div className={'versus-player '+(p.userId===user.userId?'you':'')} key={p.userId}><div className="big-avatar">{p.name.slice(0,1).toUpperCase()}</div><strong>{p.name} {p.userId===user.userId?'(YOU)':''}</strong><span>PLAYER {p.mark}</span></div>)}{room.players.length<2&&<div className="waiting-player"><Users size={25}/><strong>Waiting for challenger</strong><span>Send your code to a friend</span></div>}</div>
            {room.status==='waiting'&&<div className="waiting-banner"><span className="pulse-dot"/> ROOM OPEN · WAITING FOR PLAYER 2</div>}
            {room.status==='playing'&&<><div className="game-info"><span>{winner?winner==='draw'?'ROUND DRAWN':winner+' WINS THE MATCH':myTurn?'YOUR TURN':'OPPONENT’S TURN'}</span><strong>{winner?'ROUND COMPLETE':room.currentTurn+' TO MOVE'}</strong></div><div className="tic-grid">{room.board.map((v,i)=><button key={i} className={'tic-cell '+(v==='X'?'x-cell':v==='O'?'o-cell':'')} onClick={()=>makeMove(i)} disabled={!myTurn||!!v||!!winner||busy} aria-label={'Cell '+(i+1)}>{v}</button>)}</div></>}
            {room.status==='completed'&&<div className="match-result"><Trophy size={24}/><h2>{winner==='draw'?'IT’S A DRAW':winner+' WINS!'}</h2><p>{winner===myPlayer?.mark?'Victory added to your player record.':'Match completed. GG!'}</p><button className="primary-btn" onClick={()=>{setRoom(null);setRoomCode('');setActive('online');}}>BACK TO LOBBY <ArrowUpRight size={16}/></button></div>}
          </div><aside className="room-side"><div className="online-card"><div className="eyebrow">MATCH STATUS</div><h2>{room.status==='waiting'?'Waiting room':room.status==='playing'?'Live match':'Match complete'}</h2><p>{room.status==='waiting'?'Your room is ready. The match starts as soon as your friend joins.':room.status==='playing'?'Moves are synchronized live for both players.':'This match has been recorded.'}</p><div className="connection-line"><span className={connected?'online-dot':'offline-dot'}/>{connected?'LIVE SYNC ACTIVE':'RECONNECTING'}</div><button className="outline-btn full-btn" onClick={refreshRoom}>REFRESH ROOM</button></div></aside></div>
        </section>}

        {active === 'leaderboard' && <section className="content"><div className="page-title"><div className="eyebrow">THE HALL OF FAME</div><h1>GLOBAL <span>RANKINGS.</span></h1><p>Players competing across PIXORA.</p></div><div className="leader-card"><div className="leader-top"><Trophy size={24}/><span>TOP PLAYERS · ALL TIME</span></div>{leaderboard.length===0?<p className="local-note">No ranked matches yet. Be the first to finish a multiplayer game.</p>:leaderboard.map((p,i)=><div className="rank-row" key={p.userId}><span className="rank-number">{String(i+1).padStart(2,'0')}</span><div className="avatar">{p.name.slice(0,1).toUpperCase()}</div><div className="rank-name"><strong>{p.name}</strong><small>{p.stats?.played||0} MATCHES</small></div><div className="rank-score"><strong>{p.stats?.wins||0}</strong><small>WINS</small></div></div>)}<p className="local-note">Rankings are stored on PIXORA servers and shared across accounts.</p></div></section>}

        {active === 'play' && game === 'memory' && <section className="content play-content"><button className="back-btn" onClick={()=>setActive('home')}>← BACK TO DISCOVER</button><div className="page-title"><div className="eyebrow">NOW PLAYING</div><h1>MEMORY <span>FLUX.</span></h1></div><div className="game-panel"><div className="game-info"><span>MOVES</span><strong>{moves}</strong><span>MATCHED</span><strong>{matched.length/2} / 6</strong></div><div className="memory-grid">{memory.map(c=><button key={c.id} className={'memory-card '+(flipped.includes(c.id)||matched.includes(c.id)?'revealed':'')} onClick={()=>flipCard(c.id)}>{flipped.includes(c.id)||matched.includes(c.id)?c.value:'✦'}</button>)}</div>{matched.length===memory.length&&<button className="primary-btn restart" onClick={startLocalMemory}>PLAY AGAIN <RotateCcw size={16}/></button>}</div></section>}
      </main>
      {editing&&<div className="modal-backdrop" onClick={()=>setEditing(false)}><div className="profile-modal" onClick={e=>e.stopPropagation()}><button className="close-btn" onClick={()=>setEditing(false)}><X size={18}/></button><div className="eyebrow">PLAYER SETTINGS</div><h2>Your identity.</h2><label htmlFor="player-name">DISPLAY NAME</label><input id="player-name" maxLength={20} value={name} onChange={e=>setName(e.target.value)}/><button className="primary-btn" disabled={busy} onClick={saveProfile}>SAVE PROFILE <ArrowUpRight size={16}/></button></div></div>}
    </div>
  );
}

function makeMemory() {
  return [...symbols.slice(0,6), ...symbols.slice(0,6)].map((value,id)=>({id,value})).sort(()=>Math.random()-0.5);
}
function GameCard({ item, index, onPlay }) {
  return <article className={'game-card '+item.color}><div className="card-visual"><span className="card-number">0{index+1}</span><div className="game-glyph">{item.id==='tictactoe'?'✕ ◯':item.id==='memory'?'✦ ✧':'↗'}</div><span className="visual-label">{item.genre.toUpperCase()} / PIXORA ORIGINAL</span></div><div className="card-details"><div><h3>{item.name}</h3><p>{item.description}</p><small>{item.players}</small></div><button className="play-circle" onClick={onPlay} disabled={item.id==='coming'} aria-label={'Play '+item.name}><Play size={17} fill="currentColor"/></button></div></article>;
}
export default App;
