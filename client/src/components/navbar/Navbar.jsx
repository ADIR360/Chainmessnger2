import React from 'react';
import { NavLink } from 'react-router-dom';
import "./Navbar.css";
import brandlogo from './brandlogo.png';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="logo-container">
        <div className="logo">
          <img src={brandlogo} alt="BlockChat Logo" className="logos" />
          {/* <div className="logo-icon">CM</div> */}
          {/* <div className="logo-text">BlockChat</div> */}
        </div>
      </div>

      <div className="navbar-links">
        <NavLink to="/" exact activeClassName="active">Home</NavLink>
        <NavLink to="/about" activeClassName="active">About</NavLink>
        <NavLink to="/legal" activeClassName="active">Legal</NavLink>
        <NavLink to="/contact" activeClassName="active">Contact</NavLink>
      </div>

    </nav>
  );
};
// I have got my eyes on you , you are everything that I see , I want your heart , love and emotion endlessly.
// I can't get over you , you left your mark on me , I want your heart , love and emotion endlessly.
// Cause you are a good girl and you know it 
// You act so different around me
// Cause you are a good girl and you know it 
// I know exactly who you could be
// Just hold on we are going home 
export default Navbar;

function showSidebar() {
  const sidebar = document.querySelector('.sidebar');
  sidebar.style.display = 'flex';
}
