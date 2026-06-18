import React, { createContext, useState, useContext, useEffect } from 'react';

export interface User {
  username: string;
  email: string;
  avatar: string;
  provider: 'local' | 'google';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (username: string, email: string, password: string) => Promise<boolean>;
  googleLogin: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Restore session on mount
    const savedUser = localStorage.getItem('stadium_stream_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Login failed');
      }
      setUser(data.user);
      localStorage.setItem('stadium_stream_user', JSON.stringify(data.user));
      setIsLoading(false);
      return true;
    } catch (err: any) {
      setIsLoading(false);
      throw err;
    }
  };

  const signup = async (username: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Signup failed');
      }
      setUser(data.user);
      localStorage.setItem('stadium_stream_user', JSON.stringify(data.user));
      setIsLoading(false);
      return true;
    } catch (err: any) {
      setIsLoading(false);
      throw err;
    }
  };

  const googleLogin = () => {
    setIsLoading(true);
    const width = 480;
    const height = 580;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const popup = window.open(
      '',
      'StadiumStreamGoogleAuth',
      `width=${width},height=${height},top=${top},left=${left},scrollbars=no,resizable=no`
    );

    if (!popup) {
      alert("Popup blocker enabled! Please allow popups for StadiumStream.");
      setIsLoading(false);
      return;
    }

    // Write a beautiful Google Auth layout to the popup window
    popup.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sign in - Google Accounts</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              background-color: #ffffff;
              color: #202124;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              padding: 24px;
              box-sizing: border-box;
            }
            .card {
              border: 1px solid #dadce0;
              border-radius: 8px;
              padding: 40px 30px;
              width: 100%;
              max-width: 380px;
              text-align: center;
              box-sizing: border-box;
            }
            .google-logo {
              width: 74px;
              height: 24px;
              margin-bottom: 16px;
            }
            .title {
              font-size: 24px;
              font-weight: 400;
              line-height: 1.33;
              margin: 0 0 8px 0;
            }
            .subtitle {
              font-size: 16px;
              color: #5f6368;
              margin: 0 0 24px 0;
            }
            .account-list {
              display: flex;
              flex-direction: column;
              gap: 12px;
              margin-bottom: 24px;
            }
            .account-item {
              display: flex;
              align-items: center;
              padding: 12px;
              border: 1px solid #dadce0;
              border-radius: 8px;
              cursor: pointer;
              transition: background 0.2s;
              text-align: left;
            }
            .account-item:hover {
              background-color: #f7f8f9;
            }
            .avatar {
              width: 36px;
              height: 36px;
              border-radius: 50%;
              background: #3f51b5;
              color: white;
              font-size: 18px;
              font-weight: bold;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-right: 12px;
            }
            .details {
              display: flex;
              flex-direction: column;
            }
            .name {
              font-size: 14px;
              font-weight: 500;
            }
            .email {
              font-size: 12px;
              color: #5f6368;
            }
            .footer-links {
              margin-top: 32px;
              display: flex;
              justify-content: space-between;
              font-size: 12px;
              color: #757575;
              width: 100%;
              max-width: 380px;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <!-- SVG Google Logo -->
            <svg class="google-logo" viewBox="0 0 74 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M7.7 20.3c-1.1 0-2.1-.2-3-.7-.9-.5-1.6-1.2-2.1-2.1-.5-1-.7-2.1-.7-3.3s.2-2.3.7-3.3c.5-.9 1.2-1.6 2.1-2.1.9-.5 1.9-.7 3-.7 1.4 0 2.6.4 3.6 1.2s1.7 1.9 2 3.2H13c-.3-.8-.8-1.5-1.5-1.9-.6-.4-1.4-.7-2.3-.7-.9 0-1.8.2-2.5.7-.7.5-1.2 1.1-1.6 2-.4.8-.6 1.8-.6 2.8 0 1 .2 2 .6 2.8.4.8.9 1.5 1.6 2 .7.4 1.5.7 2.5.7.9 0 1.7-.2 2.3-.6.6-.4 1.1-1 1.4-1.8h-3.7V11h7.3v10.9h-1.5v-2.3c-.4.7-1 1.3-1.8 1.8-.8.6-1.8.9-3.2.9zm13.8-.3c-1 0-1.9-.2-2.8-.7-.9-.5-1.5-1.2-2-2.1-.5-1-.7-2.1-.7-3.3s.2-2.3.7-3.3c.5-.9 1.1-1.6 2-2.1.9-.5 1.8-.7 2.8-.7s1.9.2 2.8.7c.9.5 1.5 1.2 2 2.1.5 1 .7 2.1.7 3.3s-.2 2.3-.7 3.3c-.5.9-1.1 1.6-2 2.1-.9.5-1.8.7-2.8.7zm0-1.4c.7 0 1.4-.2 2-.5.6-.4 1.1-9 1.4-1.7.3-.8.5-1.6.5-2.6 0-1-.2-1.8-.5-2.6-.3-.8-.8-1.3-1.4-1.7-.6-.3-1.3-.5-2-.5s-1.4.2-2 .5c-.6.4-1.1.9-1.4 1.7-.3.8-.5 1.6-.5 2.6 0 1 .2 1.8.5 2.6.3.8.8 1.3 1.4 1.7.6.3 1.3.5 2 .5zm12.3 1.4c-1 0-1.9-.2-2.8-.7-.9-.5-1.5-1.2-2-2.1-.5-1-.7-2.1-.7-3.3s.2-2.3.7-3.3c.5-.9 1.1-1.6 2-2.1.9-.5 1.8-.7 2.8-.7s1.9.2 2.8.7c.9.5 1.5 1.2 2 2.1.5 1 .7 2.1.7 3.3s-.2 2.3-.7 3.3c-.5.9-1.1 1.6-2 2.1-.9.5-1.8.7-2.8.7zm0-1.4c.7 0 1.4-.2 2-.5.6-.4 1.1-.9 1.4-1.7.3-.8.5-1.6.5-2.6 0-1-.2-1.8-.5-2.6-.3-.8-.8-1.3-1.4-1.7-.6-.3-1.3-.5-2-.5s-1.4.2-2 .5c-.6.4-1.1.9-1.4 1.7-.3.8-.5 1.6-.5 2.6 0 1 .2 1.8.5 2.6.3.8.8 1.3 1.4 1.7.6.3 1.3.5 2 .5zm12.9 4.3c-1.1 0-2.1-.2-2.9-.7-.8-.5-1.4-1.1-1.8-2h1.5c.3.5.7.9 1.3 1.2.6.3 1.2.4 1.9.4.9 0 1.7-.3 2.3-.8.6-.5.9-1.3.9-2.3v-1.3c-.4.6-.9 1.1-1.6 1.4-.7.3-1.4.5-2.3.5-1 0-1.9-.2-2.8-.7-.9-.5-1.5-1.2-2-2.1-.5-1-.7-2.1-.7-3.3s.2-2.3.7-3.3c.5-.9 1.2-1.6 2-2.1.9-.5 1.8-.7 2.8-.7 1 0 1.8.2 2.5.6.7.4 1.2.9 1.5 1.6V8.2h1.4v12.2c0 1.5-.4 2.6-1.2 3.4-.8.7-1.9 1.1-3.2 1.1zm-.4-5.7c.7 0 1.4-.2 2-.5.6-.4 1.1-.9 1.4-1.7.3-.8.5-1.6.5-2.6 0-1-.2-1.8-.5-2.6-.3-.8-.8-1.3-1.4-1.7-.6-.3-1.3-.5-2-.5s-1.4.2-2 .5c-.6.4-1.1.9-1.4 1.7-.3.8-.5 1.6-.5 2.6 0 1 .2 1.8.5 2.6.3.8.8 1.3 1.4 1.7.6.3 1.3.5 2 .5zm7.3-13h1.5v15.7h-1.5V4.2zm7.4 11.5c.7 0 1.3-.2 1.9-.5.6-.3 1-.8 1.3-1.4h-6.7c.1.7.4 1.3.8 1.7.6.4 1.4.6 2.2.6v-1.7zm3.1-6.1c.5-.9.7-1.9.7-3s-.2-2-.7-2.9c-.5-.9-1.1-1.6-1.9-2.1s-1.8-.7-2.8-.7c-1 0-1.9.2-2.8.7s-1.5 1.2-2 2.1c-.5 1-.7 2.1-.7 3.3s.2 2.3.7 3.3c.5.9 1.2 1.6 2 2.1.9.5 1.9.7 2.9.7 1.5 0 2.7-.4 3.7-1.1l-1-1c-.8.5-1.7.7-2.7.7-.8 0-1.5-.2-2.1-.5-.6-.3-1.1-.8-1.4-1.5h10.4zm-4.3 0c-.8 0-1.5-.2-2.1-.5-.6-.3-1-.8-1.3-1.4h6.7c-.1-.7-.4-1.2-.8-1.7-.6-.4-1.4-.6-2.2-.6z" fill="#4285F4"/>
            </svg>
            <h2 class="title">Choose an account</h2>
            <p class="subtitle">to continue to StadiumStream</p>
            
            <div class="account-list">
              <div class="account-item" onclick="selectAccount('Kylian Mbappé', 'k.mbappe@stadiumstream.com', 'KM')">
                <div class="avatar" style="background-color: #1a73e8;">KM</div>
                <div class="details">
                  <span class="name">Kylian Mbappé</span>
                  <span class="email">k.mbappe@stadiumstream.com</span>
                </div>
              </div>
              <div class="account-item" onclick="selectAccount('Alex Morgan', 'a.morgan@stadiumstream.com', 'AM')">
                <div class="avatar" style="background-color: #e91e63;">AM</div>
                <div class="details">
                  <span class="name">Alex Morgan</span>
                  <span class="email">a.morgan@stadiumstream.com</span>
                </div>
              </div>
              <div class="account-item" onclick="selectAccount('Marcus Rashford', 'm.rashford@stadiumstream.com', 'MR')">
                <div class="avatar" style="background-color: #ff9800;">MR</div>
                <div class="details">
                  <span class="name">Marcus Rashford</span>
                  <span class="email">m.rashford@stadiumstream.com</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="footer-links">
            <span>English (United States)</span>
            <div>
              <span style="margin-right: 12px;">Help</span>
              <span style="margin-right: 12px;">Privacy</span>
              <span>Terms</span>
            </div>
          </div>

          <script>
            function selectAccount(name, email, initials) {
              // Send message back to parent window
              window.opener.postMessage({
                type: 'GOOGLE_AUTH_SUCCESS',
                payload: {
                  username: name,
                  email: email,
                  avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=' + initials + '&backgroundColor=00e676,00f0ff'
                }
              }, '*');
              window.close();
            }
          </script>
        </body>
      </html>
    `);

    popup.document.close();
  };

  useEffect(() => {
    const handleAuthMessage = async (event: MessageEvent) => {
      // Validate event type
      if (event.data && event.data.type === 'GOOGLE_AUTH_SUCCESS') {
        const payload = event.data.payload;
        setIsLoading(true);
        try {
          const response = await fetch('http://localhost:5000/api/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: payload.username,
              email: payload.email,
              avatar: payload.avatar
            })
          });
          const data = await response.json();
          if (!response.ok || data.error) {
            throw new Error(data.error || 'Google login failed');
          }
          setUser(data.user);
          localStorage.setItem('stadium_stream_user', JSON.stringify(data.user));
        } catch (err) {
          console.error("Google database sync error:", err);
          // Fallback to local session if database offline
          const googleUser: User = {
            username: payload.username,
            email: payload.email,
            avatar: payload.avatar,
            provider: 'google'
          };
          setUser(googleUser);
          localStorage.setItem('stadium_stream_user', JSON.stringify(googleUser));
        } finally {
          setIsLoading(false);
        }
      }
    };

    window.addEventListener('message', handleAuthMessage);
    return () => window.removeEventListener('message', handleAuthMessage);
  }, []);

  const logout = () => {
    setUser(null);
    localStorage.removeItem('stadium_stream_user');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, signup, googleLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
