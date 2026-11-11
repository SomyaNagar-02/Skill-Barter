import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signin } from '../api/auth';
import { useAuth } from '../context/AuthContext';

function SignIn() {
  const [form, setForm] = useState({ email: '', password: '' });
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
      const response = await signin(form);
      login(response.data.token, response.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to sign in');
    }
  };

  return (
    <section className='panel max-w-xl mx-auto'>
      <div className='mb-6'>
        <h2 className='text-3xl font-semibold text-[#17352f]'>Welcome back</h2>
        <p className='mt-2 section-copy'>Sign in to continue trading skills and messaging your network.</p>
      </div>
      <form className='space-y-5' onSubmit={handleSubmit}>
        <label className='block'>
          <span className='text-sm text-[#456d67]'>Email</span>
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
          <span className='text-sm text-[#456d67]'>Password</span>
          <input
            name='password'
            type='password'
            value={form.password}
            onChange={handleChange}
            required
            className='input-field mt-2'
          />
        </label>
        {error && <p className='rounded-2xl bg-red-100 px-4 py-3 text-sm text-red-700'>{error}</p>}
        <button className='button-primary w-full'>Sign in</button>
      </form>
      <p className='mt-6 text-center text-sm text-[#456d67]'>New to SkillBarter? <Link to='/signup' className='text-[#1d4d43] underline'>Create an account</Link></p>
    </section>
  );
}

export default SignIn;
