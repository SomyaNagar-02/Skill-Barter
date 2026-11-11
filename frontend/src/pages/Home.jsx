import { Link } from 'react-router-dom';

const features = ['Learn without limits', 'Teach with purpose', 'Build real connections', 'Grow together'];

function Home() {
  return (
    <div className='home-shell'>
      <section className='hero-section'>
        <div className='hero-copy'>
          <span className='eyebrow'>Learn together, grow together</span>

          <h1 className='hero-title'>Your knowledge has value. Exchange it.</h1>

          <p className='hero-subtitle'>
            Connect with talented people nearby, share what you know, and learn what you don&apos;t — powered by smarter, human-centered matching.
          </p>

          <div className='hero-actions'>
            <Link to='/signup' className='button-primary'>Explore skills</Link>
            <Link to='/signin' className='button-secondary'>Join SkillBarter</Link>
          </div>

          <div className='social-proof'>
            <div className='avatar-stack' aria-label='Community members'>
              <span className='avatar-1' />
              <span className='avatar-2' />
              <span className='avatar-3' />
              <span className='avatar-4' />
            </div>
            <div className='trust-copy'>
              Trusted by <strong>2,000+</strong> people worldwide
            </div>
          </div>
        </div>

        <div className='hero-visual'>
          <div className='hero-image-wrap'>
            <div className='match-card'>
              <div className='match-badge'>✓</div>
              <div className='match-text'>
                <strong>96%</strong>
                <span>Great match!</span>
              </div>
            </div>

            <div className='metrics-card'>
              <div className='metrics-icon'>✦</div>
              <div className='metrics-text'>
                <strong>2,400+</strong>
                <span>skills exchanged</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className='feature-bar' aria-label='Key strengths'>
        {features.map((feature) => (
          <span key={feature}>{feature}</span>
        ))}
      </div>

      <div className='simple-design'>
        <p>SIMPLE BY DESIGN</p>
      </div>
    </div>
  );
}

export default Home;
