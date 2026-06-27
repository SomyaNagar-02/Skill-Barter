import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signup } from '../api/auth';
import { useAuth } from '../context/AuthContext';

function SignUp() {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      const response = await signup(form);
      login(response.data.token, response.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to sign up');
    }
  };

  return (
    <section className='panel max-w-xl mx-auto'>
      <div className='mb-6'>
        <h2 className='text-3xl font-semibold text-white'>Create your account</h2>
        <p className='mt-2 section-copy'>Join the skill marketplace and start swapping experience with others.</p>
      </div>
      <form className='space-y-5' onSubmit={handleSubmit}>
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
          <span className='text-sm text-slate-300'>Email</span>
          <input
            name='email'
            type='email'
            value={form.email}
            onChange={handleChange}
            required
            className='input-field mt-2'
          />
        </label>
        <label className='block'>
          <span className='text-sm text-slate-300'>Password</span>
          <input
            name='password'
            type='password'
            value={form.password}
            onChange={handleChange}
            required
            className='input-field mt-2'
          />
        </label>
        {error && <p className='rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-200'>{error}</p>}
        <button className='button-primary w-full'>Sign up</button>
      </form>
      <p className='mt-6 text-center text-sm text-slate-400'>Already registered? <Link to='/signin' className='text-white underline'>Sign in</Link></p>
    </section>
  );
}

export default SignUp;
