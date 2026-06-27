import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe, updateProfile } from '../api/auth';
import { getToken } from '../utils/auth';

function EditProfile() {
  const [form, setForm] = useState({
    username: '',
    bio: '',
    phone: '',
    gender: '',
    teachSkills: [],
    learnSkills: [],
  });
  const [skillDrafts, setSkillDrafts] = useState({ teachSkills: '', learnSkills: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = getToken();
        const response = await getMe(token);
        setForm({
          username: response.data.username || '',
          bio: response.data.bio || '',
          phone: response.data.phone || '',
          gender: response.data.gender || '',
          teachSkills: response.data.teachSkills?.length ? response.data.teachSkills : response.data.skills || [],
          learnSkills: response.data.learnSkills || [],
        });
      } catch (err) {
        setError('Unable to load profile');
      }
    };
    loadProfile();
  }, []);

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const addSkill = (field) => {
    const value = skillDrafts[field].trim();
    if (!value || form[field].some((skill) => skill.toLowerCase() === value.toLowerCase())) return;
    setForm({ ...form, [field]: [...form[field], value] });
    setSkillDrafts({ ...skillDrafts, [field]: '' });
  };

  const removeSkill = (field, skill) => {
    setForm({ ...form, [field]: form[field].filter((item) => item !== skill) });
  };

  const handleSkillKeyDown = (event, field) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addSkill(field);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      const token = getToken();
      await updateProfile({ ...form, skills: form.teachSkills }, token);
      setMessage('Profile updated successfully');
      setTimeout(() => navigate('/profile'), 900);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save profile');
    }
  };

  return (
    <div className='panel max-w-4xl mx-auto'>
      <div className='mb-6'>
        <h2 className='text-3xl font-semibold text-white'>Edit profile</h2>
        <p className='mt-2 section-copy'>Update your public details and keep your teach and learn skills discoverable.</p>
      </div>
      <form className='space-y-5' onSubmit={handleSubmit}>
        <div className='grid gap-5 md:grid-cols-2'>
          <label className='block'>
            <span className='text-sm text-slate-300'>Username</span>
            <input
              name='username'
              value={form.username}
              onChange={handleChange}
              required
              className='input-field mt-2'
            />
          </label>
          <label className='block'>
            <span className='text-sm text-slate-300'>Phone</span>
            <input
              name='phone'
              value={form.phone}
              onChange={handleChange}
              placeholder='+1 555 0142'
              className='input-field mt-2'
            />
          </label>
        </div>
        <label className='block'>
          <span className='text-sm text-slate-300'>Gender</span>
          <select
            name='gender'
            value={form.gender}
            onChange={handleChange}
            className='select-field mt-2'
          >
            <option value=''>Prefer not to say</option>
            <option value='Female'>Female</option>
            <option value='Male'>Male</option>
            <option value='Non-binary'>Non-binary</option>
            <option value='Other'>Other</option>
          </select>
        </label>
        <label className='block'>
          <span className='text-sm text-slate-300'>Bio</span>
          <textarea
            name='bio'
            value={form.bio}
            onChange={handleChange}
            rows='4'
            className='textarea-field mt-2'
          />
        </label>
        <div className='grid gap-5 md:grid-cols-2'>
          {[
            ['teachSkills', 'Skills you teach', 'React, Python, Guitar'],
            ['learnSkills', 'Skills you want to learn', 'Public speaking, SQL'],
          ].map(([field, label, placeholder]) => (
            <div key={field} className='card-muted'>
              <span className='text-sm text-slate-300'>{label}</span>
              <div className='mt-3 flex gap-2'>
                <input
                  value={skillDrafts[field]}
                  onChange={(event) => setSkillDrafts({ ...skillDrafts, [field]: event.target.value })}
                  onKeyDown={(event) => handleSkillKeyDown(event, field)}
                  placeholder={placeholder}
                  className='input-field'
                />
                <button type='button' onClick={() => addSkill(field)} className='button-primary'>Add</button>
              </div>
              <div className='mt-3 flex min-h-10 flex-wrap gap-2'>
                {form[field].length ? form[field].map((skill) => (
                  <button
                    key={skill}
                    type='button'
                    onClick={() => removeSkill(field, skill)}
                    className='rounded-full bg-white/10 px-3 py-1 text-sm text-slate-100 hover:bg-red-500/20 hover:text-red-100'
                    title={`Remove ${skill}`}
                  >
                    {skill} x
                  </button>
                )) : <span className='text-sm text-slate-500'>No skills added</span>}
              </div>
            </div>
          ))}
        </div>
        {error && <p className='rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-200'>{error}</p>}
        {message && <p className='rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200'>{message}</p>}
        <button className='button-primary w-full'>Save changes</button>
      </form>
    </div>
  );
}

export default EditProfile;
