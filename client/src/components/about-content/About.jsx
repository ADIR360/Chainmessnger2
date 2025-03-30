import React from 'react';
import './About.css';  // Page-specific styles for the About page
import aru from '../../img/aru.png';
import aky from '../../img/aky.png';
import ame from '../../img/ame.png';


function scrollToProfile(index) {
  document.getElementById(`profile-${index}`).scrollIntoView({ behavior: 'smooth', block: 'center'  });
}

function Content() {
  const profiles = [
    { name: 'Akshat Negi', role: 'FrontEndDeveloper', img: aky, email: 'akshatnegiarchit272003@gmail.com', linkedin: 'https://www.linkedin.com/in/me-akshat-negi/', projects: 'https://github.com/Akshat-NegI27', data: 'My role is to bring designs to life and ensure a seamless, user-friendly interface for our IP vulnerability tracker. By leveraging modern web technologies, I aim to create an intuitive experience that empowers users to navigate and utilize our platform effectively. I focus on responsive design, accessibility, and performance to ensure the application works flawlessly.' },
    { name: 'Ameya Taneja', role: 'Developer & Co-Lead', img: ame, email: 'ameyataneja1302@gmail.com', linkedin: 'https://www.linkedin.com/in/ameyataneja/', projects: 'https://github.com/realTNEU', data: 'I am a Full-Stack Developer with a passion for building robust, scalable applications. My role is to design and implement the backend architecture, APIs, and data models that power our IP vulnerability tracker. I focus on performance, security, and maintainability to ensure our platform meets the needs of our users.' },
    { name: 'Arush Dubey', role: 'FullStack Developer & Co-Lead', img: aru, email: 'arushdubey360@gmail.com', linkedin: 'https://www.linkedin.com/in/arush-dubey-358840244/', projects: 'http://github.com/ADIR360?tab=repositories', data: 'My role is to bring designs to life and ensure a seamless, user-friendly interface for our IP vulnerability tracker. By leveraging modern web technologies, I aim to create an intuitive experience that empowers users to navigate and utilize our platform effectively. I focus on responsive design, accessibility, and performance to ensure the application works flawlessly.' },
   /*  { name: 'Krishna Gaur', role: 'FrontEnd Developer', img: shr, email: 'shreyanshidobhal.sd@gmail.com', linkedin: 'https://www.linkedin.com/in/shreyanshi-dobhal23/', projects: 'https://github.com/Shreyanshi23', data: 'As the Database Manager, I oversee the design, implementation, and maintenance of our database systems. My role is to ensure data integrity, optimize performance, and enable seamless access to critical information. By managing secure storage and efficient retrieval of vulnerability data, I support our mission to help users identify and address risks effectively.' }*/

  ];
// I don't wanna ruin this one , this type of love don't always come and go,
//  I don't wanna ruin this one , this type of love don't always come and go,
//  I don't wanna ruin this one , this type of love don't always come and go 
  return (
    <div className="about-page-container">
      <div className="about-container">
        <h3 id='back' >ABOUT</h3>
        <div className='bxx'>
        </div>
        <div className='bx'>
        </div>
        <h3 id='back2' >DEVELOPERS</h3>
        <div className="content">
          <h1 className="top-heading">ABOUT TEAM</h1>
        </div>
      </div>

      {/* Cards at the top */}
      <div className="about-cards-row">
        {profiles.map((profile, index) => (
          <div className="about-column" key={index}>
            <div className="about-card">
              <img 
                src={profile.img} 
                alt={profile.name} 
                className="about-card-img" 
                onClick={() => scrollToProfile(index)} 
              />
              <div className="about-card-container">
                <h2>{profile.name}</h2>
                <p className="about-card-title">{profile.role}</p>
                <p>{profile.email}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Profile containers */}
      <div className='about-content'>
        {profiles.map((profile, index) => (
          <div className='about-profile' id={`profile-${index}`} key={index}>
            <main className="about-main">
              <div className="about-top">
                <h1>This is</h1>
                <h3>{profile.name}</h3>
                <h4>{profile.role}</h4>
                <p> {profile.data} Served as a {profile.role} for this project.</p>
              </div>
              <div className='about-buttons'>
                <a href={profile.linkedin} className="about-cta about-hire">LinkedIn</a>
                <a href={profile.projects} className="about-cta about-project">SEE MY PROJECTS</a>
              </div>
            </main>
            <figure className="about-figure">
              <img src={profile.img} alt={profile.name} className='about-img' width={350} />
              <div className='about-img-bg'></div>
            </figure>
          </div>
        ))}
      </div>


    </div>
  );
}

export default Content;
