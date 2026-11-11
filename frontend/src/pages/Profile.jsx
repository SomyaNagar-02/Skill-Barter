import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMe } from '../api/auth';
import { getToken } from '../utils/auth';

function Profile() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = getToken();
        const response = await getMe(token);
        setProfile(response.data);
      } catch (err) {
        setError('Unable to load profile');
      }
    };
    loadProfile();
  }, []);

  const teachSkills = profile?.teachSkills?.length ? profile.teachSkills : profile?.skills || [];
  const learnSkills = profile?.learnSkills || [];
  const initials = profile?.username?.slice(0, 2).toUpperCase() || 'SV';

  return (
    <div className='space-y-8'>
      <div className='panel'>
        <div className='flex flex-col gap-6 md:flex-row md:items-center md:justify-between'>
          <div className='flex flex-col gap-5 sm:flex-row sm:items-center'>
            <div className='flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 to-cyan-400 text-3xl font-bold text-white'>
              {initials}
            </div>
            <div>
              <p className='section-label'>Profile</p>
              <h1 className='mt-3 text-3xl font-semibold text-[#17352f]'>{profile?.username || 'Your profile'}</h1>
              <p className='mt-2 max-w-2xl section-copy'>{profile?.bio || 'Add a bio so learners know how you teach and what you want to learn next.'}</p>
            </div>
          </div>
          <Link to='/profile/edit' className='button-primary'>Edit profile</Link>
        </div>
      </div>

      {error && <p className='rounded-2xl bg-red-100 px-4 py-3 text-sm text-red-700'>{error}</p>}

      <div className='grid gap-6 sm:grid-cols-2 xl:grid-cols-4'>
        <div className='panel-compact'>
          <p className='text-sm text-[#5d706b]'>Credits</p>
          <p className='mt-3 text-4xl font-semibold text-[#17352f]'>{profile?.credits ?? '...'}</p>
        </div>
        <div className='panel-compact'>
          <p className='text-sm text-[#5d706b]'>Rating</p>
          <p className='mt-3 text-4xl font-semibold text-[#17352f]'>{profile?.ratings ?? '...'}</p>
        </div>
        <div className='panel-compact'>
          <p className='text-sm text-[#5d706b]'>Email</p>
          <p className='mt-3 break-words text-lg font-semibold text-[#17352f]'>{profile?.email || '...'}</p>
        </div>
        <div className='panel-compact'>
          <p className='text-sm text-[#5d706b]'>Phone</p>
          <p className='mt-3 text-lg font-semibold text-[#17352f]'>{profile?.phone || 'Not added'}</p>
          <p className='mt-2 text-sm text-[#5d706b]'>{profile?.gender || 'Gender not set'}</p>
        </div>
      </div>

      <div className='grid gap-6 lg:grid-cols-2'>
        <div className='panel-compact'>
          <p className='section-label'>Teach</p>
          <div className='mt-3 flex flex-wrap gap-2'>
            {teachSkills.length ? teachSkills.map((skill) => (
              <span key={skill} className='chip'>{skill}</span>
            )) : <span className='text-[#5d706b]'>No skills yet</span>}
          </div>
        </div>
        <div className='panel-compact'>
          <p className='section-label'>Learn</p>
          <div className='mt-3 flex flex-wrap gap-2'>
            {learnSkills.length ? learnSkills.map((skill) => (
              <span key={skill} className='rounded-full bg-[#f1e9ff] px-3 py-1 text-sm text-[#5c3a76]'>{skill}</span>
            )) : <span className='text-[#5d706b]'>No learning goals yet</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
