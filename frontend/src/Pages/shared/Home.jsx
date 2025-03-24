import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

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
        <h1>
          Welcome to <span>Picton</span>
        </h1>
        <Button
          className="cta-button"
          onClick={() => navigate("/registration")}
        >
          Get Started
        </Button>
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
