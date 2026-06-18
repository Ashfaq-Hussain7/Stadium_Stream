import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Trophy, Mail, User, Lock, Activity } from 'lucide-react';
import confetti from 'canvas-confetti';

export const Login: React.FC = () => {
  const { login, signup, googleLogin } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Form state
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [goalsScored, setGoalsScored] = useState(0);

  // Canvas Refs for ball-kicking game
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ballPosRef = useRef({ x: 160, y: 130, vx: 0, vy: 0 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const ballRadius = 8;
  const goalWidth = 110;
  const goalX = 160 - goalWidth / 2;
  const goalY = 25;

  // Key press bounce animation
  const bounceBall = () => {
    const ball = ballPosRef.current;
    // Only bounce if the ball is relatively static
    if (Math.abs(ball.vx) < 0.1 && Math.abs(ball.vy) < 0.1) {
      ball.vy = -1.5 - Math.random() * 2; // Jump up on canvas y-axis (towards goal)
      ball.vx = (Math.random() - 0.5) * 2;
    }
  };

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    bounceBall();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || (isSignUp && !username) || !password) {
      setErr('Please fill in all fields');
      return;
    }
    setErr('');
    setLoading(true);
    try {
      if (isSignUp) {
        await signup(username, email, password);
      } else {
        await login(email, password);
      }
    } catch (error: any) {
      setErr(error.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Ball Physics and Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const ball = ballPosRef.current;
    let goalScoredActive = false;
    let goalTextOpacity = 0;

    const render = () => {
      // Clear Canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Draw Field Markings (Classic green grass background handled in CSS)
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 2;
      
      // Penalty area box
      ctx.strokeRect(60, 0, 200, 45);
      
      // Center circle
      ctx.beginPath();
      ctx.arc(160, 160, 40, Math.PI, 0, false);
      ctx.stroke();

      // Goal Line
      ctx.beginPath();
      ctx.moveTo(0, 10);
      ctx.lineTo(canvas.width, 10);
      ctx.stroke();

      // 2. Draw Goal Post (Net)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(goalX, 0, goalWidth, goalY);
      
      // Draw Goal Net Lines
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      for (let offset = goalX; offset <= goalX + goalWidth; offset += 10) {
        ctx.beginPath();
        ctx.moveTo(offset, 0);
        ctx.lineTo(offset, goalY);
        ctx.stroke();
      }
      for (let offset = 0; offset <= goalY; offset += 5) {
        ctx.beginPath();
        ctx.moveTo(goalX, offset);
        ctx.lineTo(goalX + goalWidth, offset);
        ctx.stroke();
      }

      // Draw goalposts outline
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(goalX, 0);
      ctx.lineTo(goalX, goalY);
      ctx.lineTo(goalX + goalWidth, goalY);
      ctx.lineTo(goalX + goalWidth, 0);
      ctx.stroke();

      // 3. Draw dragging vector indicator
      if (isDraggingRef.current) {
        const mouseDistX = dragStartRef.current.x - ball.x;
        const mouseDistY = dragStartRef.current.y - ball.y;

        ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 3]);
        
        ctx.beginPath();
        ctx.moveTo(ball.x, ball.y);
        ctx.lineTo(ball.x - mouseDistX, ball.y - mouseDistY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw helper dot
        ctx.fillStyle = 'rgba(0, 240, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(ball.x - mouseDistX, ball.y - mouseDistY, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Update Ball physics
      if (!isDraggingRef.current) {
        // Friction
        ball.vx *= 0.98;
        ball.vy *= 0.98;

        // Position update
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Boundaries checks (Left / Right bounce)
        if (ball.x - ballRadius <= 0) {
          ball.x = ballRadius;
          ball.vx = -ball.vx * 0.7;
        } else if (ball.x + ballRadius >= canvas.width) {
          ball.x = canvas.width - ballRadius;
          ball.vx = -ball.vx * 0.7;
        }

        // Top edge collision (excluding goal net)
        if (ball.y - ballRadius <= goalY) {
          // If in goal range:
          if (ball.x >= goalX && ball.x <= goalX + goalWidth) {
            if (ball.y <= 12) { // Scored inside net!
              ball.vx = 0;
              ball.vy = 0;
              if (!goalScoredActive) {
                goalScoredActive = true;
                setGoalsScored(prev => prev + 1);
                confetti({
                  particleCount: 80,
                  spread: 60,
                  origin: { y: 0.65 },
                  colors: ['#00e676', '#ffd700', '#ffffff']
                });
                
                // Reset ball after short delay
                setTimeout(() => {
                  ball.x = 160;
                  ball.y = 130;
                  ball.vx = 0;
                  ball.vy = 0;
                  goalScoredActive = false;
                }, 1600);
              }
            }
          } else {
            // Bounce off top wall
            ball.y = goalY + ballRadius;
            ball.vy = -ball.vy * 0.7;
          }
        }

        // Bottom boundaries check
        if (ball.y + ballRadius >= canvas.height) {
          ball.y = canvas.height - ballRadius;
          ball.vy = -ball.vy * 0.7;
        }
      }

      // 5. Draw Football
      // Ball Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.arc(ball.x + 2, ball.y + 2, ballRadius, 0, Math.PI * 2);
      ctx.fill();

      // Ball base white
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
      ctx.fill();

      // Draw football pentagons (classic look)
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      
      // Center patch
      ctx.fillStyle = '#111111';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ballRadius * 0.35, 0, Math.PI * 2);
      ctx.fill();

      // Lines outward
      for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5;
        ctx.beginPath();
        ctx.moveTo(ball.x, ball.y);
        ctx.lineTo(
          ball.x + Math.cos(angle) * ballRadius,
          ball.y + Math.sin(angle) * ballRadius
        );
        ctx.stroke();
      }

      // 6. Draw Goal Text
      if (goalScoredActive) {
        if (goalTextOpacity < 1) goalTextOpacity += 0.1;
        ctx.fillStyle = `rgba(0, 230, 118, ${goalTextOpacity})`;
        ctx.font = 'bold 24px Montserrat';
        ctx.textAlign = 'center';
        ctx.fillText('GOAL!!!', 160, 85);
      } else {
        goalTextOpacity = 0;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Event handlers for dragging the ball
    const getMousePos = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    const handleMouseDown = (e: MouseEvent) => {
      const pos = getMousePos(e);
      const dist = Math.hypot(pos.x - ball.x, pos.y - ball.y);
      if (dist < 20) { // Clicked close enough to ball
        isDraggingRef.current = true;
        dragStartRef.current = { x: ball.x, y: ball.y };
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const pos = getMousePos(e);
      
      // Let user stretch the kick direction line
      const dx = pos.x - dragStartRef.current.x;
      const dy = pos.y - dragStartRef.current.y;
      
      // Cap drag distance
      const maxDrag = 60;
      const dist = Math.hypot(dx, dy);
      if (dist > maxDrag) {
        const angle = Math.atan2(dy, dx);
        ball.x = dragStartRef.current.x + Math.cos(angle) * maxDrag;
        ball.y = dragStartRef.current.y + Math.sin(angle) * maxDrag;
      } else {
        ball.x = pos.x;
        ball.y = pos.y;
      }
    };

    const handleMouseUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;

      // Kick ball in opposite direction of pull
      const dx = dragStartRef.current.x - ball.x;
      const dy = dragStartRef.current.y - ball.y;

      ball.vx = dx * 0.18;
      ball.vy = dy * 0.18;
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Quick guest-log in code using Goals count
  const handleScorePlay = () => {
    login("Striker Guest", "guest@stadiumstream.com");
  };

  return (
    <div className="auth-page-container">
      <div className="auth-wrapper">
        <div className={`auth-card-flipper ${isSignUp ? 'flipped' : ''}`}>
          
          {/* LOGIN CARD */}
          <div className="auth-card-face glass-panel">
            <div>
              <div className="auth-header-container">
                <Trophy className="logo-icon spin-slow" size={32} style={{ display: 'inline-block' }} />
                <h2 className="auth-title">Welcome Back</h2>
                <p className="auth-subtitle">Login to access live streams and scores</p>
              </div>

              {err && <div style={{ color: 'var(--accent-red)', fontSize: '0.8rem', marginBottom: '12px', textAlign: 'center' }}>{err}</div>}

              <button className="btn-google-auth" onClick={googleLogin}>
                {/* Custom Google Logo SVG */}
                <svg className="google-icon-svg" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.62-2.14-.62-4.14 0-6.28z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Sign in with Google
              </button>

              <div className="auth-divider">or use credentials</div>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} size={16} />
                    <input 
                      type="email" 
                      className="form-input" 
                      placeholder="e.g. striker@goal.com"
                      value={email}
                      onChange={handleInputChange(setEmail)}
                      style={{ paddingLeft: '40px' }} 
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} size={16} />
                    <input 
                      type="password" 
                      className="form-input" 
                      placeholder="••••••••"
                      value={password}
                      onChange={handleInputChange(setPassword)}
                      style={{ paddingLeft: '40px' }} 
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn-auth-submit" disabled={loading}>
                  {loading ? 'Authenticating...' : 'Enter the Stadium'}
                </button>
              </form>
            </div>

            <div>
              {/* Interactive game element inside login */}
              <div className="kick-game-container">
                <div className="kick-game-title">
                  <Activity size={12} />
                  Flick Kick Sandbox
                  {goalsScored > 0 && <span style={{ marginLeft: 'auto', background: 'var(--accent-green-glow)', color: 'var(--accent-green)', padding: '2px 6px', borderRadius: '8px', fontSize: '0.65rem' }}>Goals: {goalsScored}</span>}
                </div>
                <canvas ref={canvasRef} className="kick-canvas" width={320} height={160} />
                <p className="kick-game-desc">Drag the ball backward and release to kick! Typing bounces the ball.</p>
                {goalsScored >= 3 && (
                  <button 
                    onClick={handleScorePlay} 
                    style={{ marginTop: '8px', width: '100%', fontSize: '0.75rem', padding: '6px' }}
                    className="glass-button active"
                  >
                    Unlock Guest Access (3+ Goals scored!)
                  </button>
                )}
              </div>

              <p className="auth-switch-text">
                New enthusiast? 
                <a href="#signup" className="auth-switch-link" onClick={(e) => { e.preventDefault(); setIsSignUp(true); }}>
                  Create Account
                </a>
              </p>
            </div>
          </div>

          {/* SIGN UP CARD (Flipped side) */}
          <div className="auth-card-face back glass-panel">
            <div>
              <div className="auth-header-container">
                <Trophy className="logo-icon spin-slow" size={32} style={{ display: 'inline-block' }} />
                <h2 className="auth-title">Create Account</h2>
                <p className="auth-subtitle">Join the StadiumStream network</p>
              </div>

              {err && <div style={{ color: 'var(--accent-red)', fontSize: '0.8rem', marginBottom: '12px', textAlign: 'center' }}>{err}</div>}

              <button className="btn-google-auth" onClick={googleLogin}>
                <svg className="google-icon-svg" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.62-2.14-.62-4.14 0-6.28z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Sign up with Google
              </button>

              <div className="auth-divider">or use credentials</div>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Username</label>
                  <div style={{ position: 'relative' }}>
                    <User style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} size={16} />
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. golazo_striker"
                      value={username}
                      onChange={handleInputChange(setUsername)}
                      style={{ paddingLeft: '40px' }} 
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} size={16} />
                    <input 
                      type="email" 
                      className="form-input" 
                      placeholder="e.g. striker@goal.com"
                      value={email}
                      onChange={handleInputChange(setEmail)}
                      style={{ paddingLeft: '40px' }} 
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} size={16} />
                    <input 
                      type="password" 
                      className="form-input" 
                      placeholder="••••••••"
                      value={password}
                      onChange={handleInputChange(setPassword)}
                      style={{ paddingLeft: '40px' }} 
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn-auth-submit" disabled={loading}>
                  {loading ? 'Creating Account...' : 'Register Profile'}
                </button>
              </form>
            </div>

            <p className="auth-switch-text" style={{ marginTop: '24px' }}>
              Already registered? 
              <a href="#login" className="auth-switch-link" onClick={(e) => { e.preventDefault(); setIsSignUp(false); }}>
                Login Here
              </a>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
