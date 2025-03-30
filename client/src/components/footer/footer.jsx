import React from 'react';
import "./footer.css";
import 'boxicons';
import logo from './logo.png';

const Footer = () => {
  return (
    <footer>
      <div className="containerx">
        <div className="content_footer">
          <div className="profil">
            <div className="logo_area">
              <img src={logo} alt="Chain Messenger Logo" />
              {/* <span className="logo_name">Chain Messenger</span> */}
            </div>
            <div className="desc_area">
              <p>Chain Messenger is a secure, decentralized messaging platform built on blockchain technology. Experience end-to-end encryption, fast and reliable communication, and full decentralization. Connect with your friends and colleagues securely and privately.</p>
            </div>
            <div className="social_media">
              <a href='https://steamcommunity.com/id/akyboy27/'><box-icon type='logo' name='steam' size='md' ></box-icon></a>
              <a href='https://open.spotify.com/user/5fwdg0bu7pj929ortdsmo0qea'><box-icon type='logo' name='spotify' size='md'></box-icon></a>
              <a href='https://discord.com/users/628138793458860033'><box-icon type='logo' name='discord-alt' size='md'></box-icon></a>
              <a href='https://www.linkedin.com/in/me-akshat-negi/'><box-icon type='logo' name='linkedin-square' size='md'></box-icon></a>
              <a href='https://github.com/Akshat-NegI27'><box-icon type='logo' name='github' size='md'></box-icon></a>
            </div>
          </div>
          <div className="service_area">
            <ul className="service_header">
              <li className="service_name">Features</li>
              <li><a href='#'>End-to-End Encryption</a></li>
              <li><a href='#'>Fast & Reliable</a></li>
              <li><a href='#'>Gas-Optimized</a></li>
              <li><a href='#'>Fully Decentralized</a></li>
            </ul>
            <ul className="service_header">
              <li className="service_name">Resources</li>
              <li><a href='#'>Documentation</a></li>
              <li><a href='#'>API Reference</a></li>
              <li><a href='#'>Community</a></li>
              <li><a href='#'>Support</a></li>
            </ul>
            <ul className="service_header">
              <li className="service_name">Company</li>
              <li><a href='#'>About Us</a></li>
              <li><a href='#'>Careers</a></li>
              <li><a href='#'>Contact</a></li>
              <li><a href='#'>Legal</a></li>
            </ul>
          </div>
        </div>
        <hr></hr>

        <div className="footer_bottom">
          <div className="copy_right">
            <box-icon name='copyright' ></box-icon>
            <span>2025 Chain Messenger</span>
          </div>
          <div className="tou">
            <a href='#'>Terms of Use</a>
            <a href='#'>Privacy Policy</a>
            <a href='#'>Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer;