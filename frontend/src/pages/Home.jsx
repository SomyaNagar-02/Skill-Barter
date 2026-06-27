import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className='panel'>
      <div className='grid gap-10 lg:grid-cols-[1.35fr_0.9fr] lg:items-center'>
        <div>
          <p className='section-label'>Skill barter made simple</p>
          <h1 className='mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl'>Build connections, trade skills, and grow together.</h1>
          <p className='mt-6 max-w-xl section-copy'>Create offers, chat with collaborators, and manage your profile from one polished dashboard. Easy signup, secure auth, and clean navigation help you move faster.</p>
          <div className='mt-8 flex flex-wrap gap-3'>
            <Link to='/signup' className='button-primary'>Get started</Link>
            <Link to='/signin' className='button-secondary'>Sign in</Link>
          </div>
        </div>
        <div className='card-muted'>
          <p className='section-label text-cyan-200'>Key benefits</p>
          <ul className='mt-5 space-y-3 text-slate-300'>
            <li>• Responsive workspace with secure auth and role-aware routing.</li>
            <li>• Modern chat, community Q&A, and profile control.</li>
            <li>• Consistent spacing, typography, and minimal visual noise.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Home;
