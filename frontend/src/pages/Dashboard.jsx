import { useEffect, useState } from 'react';
import { getMatches, getMe, sendChatRequest } from '../api/auth';
import { getToken } from '../utils/auth';

function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [matches, setMatches] = useState([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [requestTutor, setRequestTutor] = useState(null);
  const [requestForm, setRequestForm] = useState({ skill: '', message: '' });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = getToken();
        const [profileResponse, matchResponse] = await Promise.all([
          getMe(token),
          getMatches({ query: '', filter: 'all' }, token),
        ]);
        setProfile(profileResponse.data);
        setMatches(matchResponse.data);
      } catch (err) {
        setError('Unable to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  useEffect(() => {
    const token = getToken();
    const timeout = setTimeout(async () => {
      try {
        const response = await getMatches({ query, filter }, token);
        setMatches(response.data);
        setError('');
      } catch (err) {
        setError('Unable to load tutor matches');
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [query, filter]);

  const openRequestModal = (match) => {
    if ((profile?.credits ?? 0) < 100) {
      setError('You need at least 100 credits to request a taught session.');
      setMessage('');
      return;
    }

    const teachSkills = match.teachSkills?.length ? match.teachSkills : match.skills || [];
    setRequestTutor(match);
    setRequestForm({
      skill: teachSkills[0] || '',
      message: `Hi ${match.username}, I would like to learn with you.`,
    });
    setMessage('');
    setError('');
  };

  const submitRequest = async (event) => {
    event.preventDefault();
    if (!requestTutor) return;

    try {
      const token = getToken();
      await sendChatRequest({
        toUserId: requestTutor._id,
        skill: requestForm.skill,
        message: requestForm.message,
      }, token);
      setMessage(`Request sent to ${requestTutor.username}.`);
      setRequestTutor(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to send request');
    }
  };

  return (
    <div className='space-y-8'>
      <section className='panel'>
        <p className='section-label'>Skill discovery</p>
        <h1 className='mt-3 section-heading'>Find the right tutor for your next trade.</h1>
        <p className='mt-4 section-copy'>Search by intent, skill, or username. The matches below prioritize people who can teach what you want to learn.</p>
      </section>

      <div className='grid gap-6 lg:grid-cols-[1.4fr_.8fr]'>
        <div className='panel-compact'>
          <label className='section-label block' htmlFor='match-search'>Search matches</label>
          <div className='mt-3 flex flex-col gap-3 sm:flex-row'>
            <input
              id='match-search'
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder='Try "React tutor for portfolio projects"'
              className='input-field'
            />
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className='select-field'
            >
              <option value='all'>All matches</option>
              <option value='skill'>Skill</option>
              <option value='username'>Username</option>
            </select>
          </div>
        </div>

        <div className='grid grid-cols-3 gap-3'>
          <div className='panel-compact'>
            <p className='text-sm text-slate-400'>Credits</p>
            <p className='mt-2 text-2xl font-semibold text-white'>{profile?.credits ?? '...'}</p>
          </div>
          <div className='panel-compact'>
            <p className='text-sm text-slate-400'>Rating</p>
            <p className='mt-2 text-2xl font-semibold text-white'>{profile?.ratings ?? '...'}</p>
          </div>
          <div className='panel-compact'>
            <p className='text-sm text-slate-400'>Teaching</p>
            <p className='mt-2 text-2xl font-semibold text-white'>{(profile?.teachSkills?.length || profile?.skills?.length) ?? 0}</p>
          </div>
        </div>
      </div>

      {(profile?.credits ?? 0) < 100 && (
        <div className='rounded-3xl border border-amber-300/20 bg-amber-400/10 p-5 text-sm text-amber-100'>
          You need at least 100 credits to be taught by someone. Teach a session to earn 100 credits.
        </div>
      )}

      {error && <p className='rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-200'>{error}</p>}
      {message && <p className='rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200'>{message}</p>}

      <div className='grid gap-6 sm:grid-cols-2 xl:grid-cols-3'>
        {loading ? (
          <div className='panel-compact text-slate-300'>Loading tutors...</div>
        ) : matches.length ? matches.map((match) => {
          const teachSkills = match.teachSkills?.length ? match.teachSkills : match.skills || [];
          const initials = match.username?.slice(0, 2).toUpperCase() || 'SV';

          return (
            <article key={match._id} className='panel flex min-h-[20rem] flex-col'>
              <div className='flex items-start gap-4'>
                <div className='flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-fuchsia-400 text-xl font-bold text-slate-950'>
                  {initials}
                </div>
                <div className='min-w-0'>
                  <h2 className='truncate text-xl font-semibold text-white'>{match.username}</h2>
                  <p className='mt-1 text-sm text-slate-500'>{match.ratings || 0} rating | {match.credits || 0} credits</p>
                </div>
              </div>
              <p className='mt-5 line-clamp-4 flex-1 text-slate-300'>{match.bio || 'Ready to exchange focused lessons and practical feedback.'}</p>
              <div className='mt-5 flex flex-wrap gap-2'>
                {teachSkills.slice(0, 4).map((skill) => (
                  <span key={skill} className='rounded-full bg-cyan-400/10 px-3 py-1 text-sm text-cyan-100'>{skill}</span>
                ))}
                {!teachSkills.length && <span className='text-sm text-slate-500'>No teach skills listed</span>}
              </div>
              <button
                type='button'
                onClick={() => openRequestModal(match)}
                disabled={(profile?.credits ?? 0) < 100}
                className='mt-6 button-primary w-full disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400'
              >
                {(profile?.credits ?? 0) < 100 ? 'Need 100 credits' : 'Request session'}
              </button>
            </article>
          );
        }) : (
          <div className='panel-compact text-slate-300 sm:col-span-2 xl:col-span-3'>
            No tutors found. Try a broader skill or search all matches.
          </div>
        )}
      </div>

      {requestTutor && (
        <div className='dialog-overlay'>
          <form onSubmit={submitRequest} className='w-full max-w-lg panel'>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <p className='section-label text-cyan-200'>Learning request</p>
                <h2 className='mt-2 text-2xl font-semibold text-white'>Ask {requestTutor.username}</h2>
              </div>
              <button type='button' onClick={() => setRequestTutor(null)} className='rounded-full border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/5'>
                Close
              </button>
            </div>
            <label className='mt-5 block'>
              <span className='text-sm text-slate-300'>Skill</span>
              <input
                value={requestForm.skill}
                onChange={(event) => setRequestForm({ ...requestForm, skill: event.target.value })}
                placeholder='React, SQL, guitar'
                className='input-field mt-2'
              />
            </label>
            <label className='mt-4 block'>
              <span className='text-sm text-slate-300'>Message</span>
              <textarea
                value={requestForm.message}
                onChange={(event) => setRequestForm({ ...requestForm, message: event.target.value })}
                rows='4'
                className='textarea-field mt-2'
              />
            </label>
            <button className='button-primary w-full mt-5'>Send request</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
