import React, { useState } from 'react';
import '../styles/output.css';

const Home = () => {
  // Create showDetails using React state for allowing to toggle content
  const [showDetails, setShowDetails] = useState(false);
  const creators =[
    { name: 'Denis Fuentes', email: 'denisfuentes@gmail.com' },
    { name: 'Diego Coronado', email: 'diegoa2992@gmail.com' },
    { name: 'Billy Ngo', email: 'billykngo@gmail.com' },
    { name: 'Jihao Ye', email: 'jihaoyb@gmail.com' }
  ];

  return (
    <div className="home-page">
      <header className="home-header">
        <h1>Welcome to Picton</h1>
        <p>Your user management system secure authentication</p>
      </header>
      
      <section className="home_contact">
        <h2>Contact the Creators</h2>
        <button className="home_toggle-btn" onClick={() => setShowDetails(!showDetails)}>
          {showDetails ? "Hide Details" : "Show Details"}
        </button>

        {showDetails && (
          <ul className="home_creators-list"> 
            {creators.map((creator, index) => (
              <li key={index} className="home_creator">
                <strong>{creator.name}</strong> - <a href={'mailto:${creator.email}'}>Email</a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default Home;
