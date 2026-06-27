import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import { apiBaseUrl, getChatRequests } from '../api/auth';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Chat', path: '/chat' },
  { label: 'Community', path: '/community' },
  { label: 'Profile', path: '/profile' },
];

function Layout() {
  const [open, setOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState(0);
  const location = useLocation();
  const { isAuthenticated, logout, token, user } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setPendingRequests(0);
      return undefined;
    }

    const refreshPendingRequests = async () => {
      try {
        const response = await getChatRequests(token);
        setPendingRequests(response.data.incoming.filter((request) => request.status === 'pending').length);
      } catch (error) {
        setPendingRequests(0);
      }
    };

    refreshPendingRequests();
    const socket = io(apiBaseUrl, { auth: { token } });
    socket.on('chat:request', refreshPendingRequests);
    socket.on('chat:request-updated', refreshPendingRequests);

    return () => socket.disconnect();
  }, [isAuthenticated, token]);

  const handleLogout = () => {
    logout();
    window.location.href = '/signin';
  };

  return (
    <div className='min-h-screen bg-surface text-slate-100'>
      <header className='sticky top-0 z-40 border-b border-white/10 bg-slate-950/95'>
        <div className='mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8'>
          <Link to='/' className='text-lg font-semibold tracking-tight text-white'>
            SkillBarter
          </Link>
          <div className='hidden items-center gap-3 md:flex'>
            {isAuthenticated ? (
              navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative rounded-full px-4 py-2 text-sm font-medium transition ${location.pathname === item.path ? 'bg-cyan-400 text-slate-950' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
                >
                  {item.label}
                  {item.path === '/chat' && pendingRequests > 0 && (
                    <span className='absolute -right-2 -top-2 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-semibold text-white'>
                      {pendingRequests}
                    </span>
                  )}
                </Link>
              ))
            ) : (
              <>
                <Link to='/signin' className='rounded-full bg-cyan-400 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300'>Sign in</Link>
                <Link to='/signup' className='rounded-full border border-white/10 px-5 py-2 text-sm text-slate-200 hover:bg-white/5'>Sign up</Link>
              </>
            )}
            {isAuthenticated && (
              <button onClick={handleLogout} className='rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/5'>
                {user?.username ? `Sign out ${user.username}` : 'Sign out'}
              </button>
            )}
          </div>
          <div className='flex items-center gap-3 md:hidden'>
            <button onClick={() => setOpen(!open)} className='rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/5 transition'>
              Menu
            </button>
          </div>
        </div>
        {open && (
          <div className='border-t border-white/10 bg-slate-950/95 md:hidden'>
            <div className='space-y-2 px-4 py-4'>
              {isAuthenticated ? (
                <>
                  {navItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setOpen(false)}
                      className='flex items-center justify-between rounded-2xl px-4 py-3 text-sm text-slate-200 hover:bg-white/5'
                    >
                      <span>{item.label}</span>
                      {item.path === '/chat' && pendingRequests > 0 && (
                        <span className='flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-semibold text-white'>
                          {pendingRequests}
                        </span>
                      )}
                    </Link>
                  ))}
                  <button onClick={handleLogout} className='w-full rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950'>Sign out</button>
                </>
              ) : (
                <>
                  <Link to='/signin' onClick={() => setOpen(false)} className='block rounded-2xl px-4 py-3 text-sm text-slate-200 hover:bg-white/5'>Sign in</Link>
                  <Link to='/signup' onClick={() => setOpen(false)} className='block rounded-2xl px-4 py-3 text-sm text-slate-200 hover:bg-white/5'>Sign up</Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className='mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8'>
        <Outlet />
      </main>

      <footer className='border-t border-white/10 bg-slate-950/80 py-5'>
        <div className='mx-auto max-w-7xl px-4 text-sm text-slate-500 sm:px-6 lg:px-8'>
          Built for skill sharing with clean UX and easy navigation.
        </div>
      </footer>
    </div>
  );
}

export default Layout;
