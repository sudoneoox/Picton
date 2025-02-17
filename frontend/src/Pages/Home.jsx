import React from "react";
import "../styles/modules/_home.scss";
import { Button } from "@/Components/ui/shadcn/button";

const Home = () => {
  const creators = [
    { name: "Denis Fuentes", email: "denisfuentes@gmail.com" },
    { name: "Diego Coronado", email: "diegoa2992@gmail.com" },
    { name: "Jihao Ye", email: "jihaoyb@gmail.com" },
    { name: "Billy Ngo", email: "billykngo@gmail.com" },
  ];

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero">
        <h1>Welcome to <span>Team Picton</span></h1>
        <Button className="cta-button">Get Started</Button>
      </section>

      {/* Creator Panel */}
      <section className="creators">
        <h2>Meet the Builders</h2>
        <div className="creators-list">
          {creators.map((creator, index) => (
            <div key={index} className="creator-card">
              <h3>{creator.name}</h3>
              <p>{creator.email}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
