import React,{ useEffect } from "react";
import "./homeContent.css";
import "../fonts/fonts.css";

import arrow from '../../img/arrow_upward.svg';

import Aos from "aos";
import 'aos/dist/aos.css'

//Smooth Scroll
import LocomotiveScroll from 'locomotive-scroll';
const locomotiveScroll = new LocomotiveScroll();
import "../../assets/animations/locomotive-scroll.css";

// import { Helmet } from "react-helmet";
import { Helmet, HelmetProvider } from 'react-helmet-async';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { preLoaderAnim } from "../../assets/animations";


const PreLoader = () => {
  useEffect(() => {
    preLoaderAnim();
      }, []);
  return (
    <div className="preloader">
      <div className="texts-container">
        <span>| CHAT </span>
        <span>&nbsp; MESSENGER &nbsp; </span>
        <span> WEB |</span>
      </div>
    </div>
  );
};

const AOSs = () =>{
  useEffect(() => {
    Aos.init({ duration: 1000 });
  }, []);
}

// ------------------------BACK TO TOP------------------------
const ScrollToTop = () => {
  useEffect(() => {
    const backToTopButton = document.querySelector('.backtotop');

    const handleScroll = () => {
      if (window.scrollY > 300) {
        backToTopButton.style.display = 'block';
      } else {
        backToTopButton.style.display = 'none';
      }
    };

    const handleClick = () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    };

    backToTopButton.addEventListener('click', handleClick);
    window.addEventListener('scroll', handleScroll);

    return () => {
      backToTopButton.removeEventListener('click', handleClick);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  return (
    <div className="backtotop"><img className="arrow" src={arrow} alt="" /></div>
  );
};
// ------------------------BACK TO TOP------------------------

const HomeContent = () => {
  
  useEffect(() => {
    const scroll = new LocomotiveScroll({
      el: document.querySelector('.main'),
      smooth: true,
      multiplier: 0.5,
      lerp: 0.1,
    });
  }, []);

  return (
    <>
    <ScrollToTop></ScrollToTop>
      <PreLoader/>
      <AOSs/>

        <HelmetProvider>
        <Helmet>
          {/* <script src="./script.js"></script> */}
          <link href="https://unpkg.com/aos@2.3.1/dist/aos.css" rel="stylesheet"></link>
          <script src="https://cdn.jsdelivr.net/npm/locomotive-scroll@3.5.4/dist/locomotive-scroll.js"></script>
          <link href="https://cdn.jsdelivr.net/npm/locomotive-scroll@3.5.4/dist/locomotive-scroll.css" rel="stylesheet" />
          <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js" integrity="sha512-7eHRwcbYkK4d9g/6tD/mhkf++eoTHwpNM9woBxtPUBWm67zeAfFC+HrdoE2GanKeocly/VxeLvIqwvCdk7qScg==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js" integrity="sha512-onMTRKJBKz8M1TnqqDuGBlowlH0ohFzMXYRNebz+yOcc5TQr/zAKsthzhuv0hiyUKEiQEQXEynnXCvNTOk50dg==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
        </Helmet>
        </HelmetProvider>

    

      <div className="main">

        {/*-------------Page-1------------- */}
        <div className="page1">
        <div className="box1">
          <div className="inner-box">

            <div className="imgg">
            {/* <img className="himage" src={imgpg34} alt="" /> */}
            </div>

            <div className="contentz">
              <h1>Hi, I’m Akshat — an CyberSecurity Analyst, Web Dev and Graphic Designer Athlete with a passion for creativity.</h1>
              <a href="https://github.com/Akshat-NegI27?tab=repositories" target="_blank" rel="noopener noreferrer">
              <h4> View Projects </h4> </a>
            </div>
            </div>
        </div>
        </div>
        



//---------------------------------Page-2---------------------------------





      </div>
    </>
  );
};

export default HomeContent;




// .image {
//   filter: grayscale();
//   transition: all ease-in-out;
//   transition-duration: 500ms;

// }

// .image-container:hover .image {
//   filter: none;
// }