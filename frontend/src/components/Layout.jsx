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
  const [darkTheme, setDarkTheme] = useState(() => {
    const savedTheme = localStorage.getItem('skillbarter-theme');
    return savedTheme ? savedTheme === 'dark' : false;
  });
  const location = useLocation();
  const { isAuthenticated, logout, token, user } = useAuth();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkTheme ? 'dark' : 'light');
    localStorage.setItem('skillbarter-theme', darkTheme ? 'dark' : 'light');
  }, [darkTheme]);

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
    <div className='min-h-screen bg-[#f5f1eb] text-[#17352f]'>
      <header className='sticky top-0 z-40 border-b border-[#dfe7e2] bg-white/85 backdrop-blur-xl'>
        <div className='mx-auto flex max-w-[1280px] items-center justify-between px-4 py-4 sm:px-6 lg:px-8'>
          <Link to='/' className='flex items-center gap-3 text-lg font-semibold tracking-tight text-[#18362f]'>
            <span className='flex h-8 w-8 items-center justify-center rounded-md bg-[#1c4d43] text-sm text-white shadow-sm'>S</span>
            <span>SkillBarter</span>
          </Link>

          <div className='hidden items-center gap-2 md:flex'>
            {isAuthenticated ? (
              navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative rounded-full px-4 py-2 text-sm font-medium transition ${location.pathname === item.path ? 'bg-[#1f4d43] text-white' : 'text-[#35564f] hover:bg-[#edf3f1] hover:text-[#18362f]'}`}
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
                <Link to='/' className='rounded-full px-4 py-2 text-sm font-medium text-[#35564f] hover:bg-[#eef4f2]'>How it works</Link>
                <Link to='/community' className='rounded-full px-4 py-2 text-sm font-medium text-[#35564f] hover:bg-[#eef4f2]'>Explore skills</Link>
                <Link to='/community' className='rounded-full px-4 py-2 text-sm font-medium text-[#35564f] hover:bg-[#eef4f2]'>Community</Link>
              </>
            )}
          </div>

          <div className='flex items-center gap-3'>
            <button
              type='button'
              onClick={() => setDarkTheme((current) => !current)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition ${darkTheme ? 'border-[#365e56] bg-[#17352f] text-white hover:bg-[#122c28]' : 'border-[#dfe7e2] bg-white text-[#35564f] hover:bg-[#eef4f2]'}`}
              aria-label='Toggle dark mode'
            >
              <span>{darkTheme ? '☀️' : '🌙'}</span>
              <span>{darkTheme ? 'Light' : 'Dark'}</span>
            </button>

            {!isAuthenticated ? (
              <>
                <Link to='/signin' className='hidden rounded-full px-4 py-2 text-sm font-medium text-[#35564f] hover:bg-[#eef4f2] sm:inline-flex'>Log in</Link>
                <Link to='/signup' className='inline-flex rounded-full bg-[#1e4d43] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#173b36]'>Get started</Link>
              </>
            ) : (
              <button onClick={handleLogout} className='rounded-full border border-[#dfe7e2] bg-white px-4 py-2 text-sm font-medium text-[#35564f] hover:bg-[#eef4f2]'>
                {user?.username ? `Sign out ${user.username}` : 'Sign out'}
              </button>
            )}

            <div className='flex items-center gap-3 md:hidden'>
              <button onClick={() => setOpen(!open)} className='rounded-full border border-[#dfe7e2] bg-white px-4 py-2 text-sm font-medium text-[#35564f]'>Menu</button>
            </div>
          </div>
        </div>

        {open && (
          <div className='border-t border-[#dfe7e2] bg-white/95 md:hidden'>
            <div className='space-y-2 px-4 py-4'>
              {isAuthenticated ? (
                <>
                  {navItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setOpen(false)}
                      className='flex items-center justify-between rounded-2xl px-4 py-3 text-sm text-[#35564f] hover:bg-[#eef4f2]'
                    >
                      <span>{item.label}</span>
                      {item.path === '/chat' && pendingRequests > 0 && (
                        <span className='flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-semibold text-white'>
                          {pendingRequests}
                        </span>
                      )}
                    </Link>
                  ))}
                  <button onClick={handleLogout} className='w-full rounded-2xl bg-[#1e4d43] px-4 py-3 text-sm font-semibold text-white'>Sign out</button>
                </>
              ) : (
                <>
                  <Link to='/' onClick={() => setOpen(false)} className='block rounded-2xl px-4 py-3 text-sm text-[#35564f] hover:bg-[#eef4f2]'>How it works</Link>
                  <Link to='/community' onClick={() => setOpen(false)} className='block rounded-2xl px-4 py-3 text-sm text-[#35564f] hover:bg-[#eef4f2]'>Explore skills</Link>
                  <Link to='/signin' onClick={() => setOpen(false)} className='block rounded-2xl px-4 py-3 text-sm text-[#35564f] hover:bg-[#eef4f2]'>Log in</Link>
                  <Link to='/signup' onClick={() => setOpen(false)} className='block rounded-2xl bg-[#1e4d43] px-4 py-3 text-sm font-semibold text-white'>Get started</Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className='mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8'>
        <Outlet />
      </main>

      <footer className='border-t border-[#dfe7e2] bg-[#f7f3ee] py-5'>
        <div className='mx-auto max-w-[1280px] px-4 text-sm text-[#55726c] sm:px-6 lg:px-8'>
          
        </div>
      </footer>
    </div>
  );
}

export default Layout;
