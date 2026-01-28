import React from "react";
import { Link } from "react-router-dom";
import Slider from "react-slick";
import "../css/HomePage.css";   // 👈 Make sure this exists
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const Home = () => {

  // =================== HERO SLIDER SETTINGS ===================
  const sliderSettings = {
    dots: true,
    infinite: true,
    autoplay: true,
    autoplaySpeed: 2000,
    arrows: false,
    fade: true,
    speed: 600,
  };
  const campusImages = [
    "/images/campus1.webp",
    "/images/campus2.jpeg",
    "/images/campus3.jpeg",
    "/images/campus4.webp",
  ];

  const deptSliderSettings = {
    dots: false,
    infinite: true,
    speed: 600,
    slidesToShow: 4,
    slidesToScroll: 2,
    arrows: true,
    autoplay: false,
    responsive: [
      {
        breakpoint: 1024,
        settings: { slidesToShow: 3 }
      },
      {
        breakpoint: 768,
        settings: { slidesToShow: 2 }
      },
      {
        breakpoint: 480,
        settings: { slidesToShow: 1 }
      }
    ]
  };
  const departments = [
    { img: "/images/departments/IT_LOGO.png", title: "Babu Madhav Institute of Information Technology" },
    { img: "/images/departments/MPC_LOGO.png", title: "Maliba Pharmacy College" },
    { img: "/images/departments/agriculture.png", title: "Kishorbhai Institute of Agriculture Sciences and Research Centre" },

    { img: "/images/departments/nursing.png", title: "Maniba-Bhula Nursing College" },
    { img: "/images/departments/architecture.png", title: "Raman Bhakta School of Architecture" },
    { img: "/images/departments/mca_mba.png", title: "Shrimad Rajchandra Institute of Management & Computer Application" },
    { img: "/images/departments/management.png", title: "Bhulabhai Vanmalibhai Patel Institute of Management" },

    { img: "/images/departments/physiotherapy.png", title: "Shrimad Rajchandra College of Physiotherapy" },
    { img: "/images/departments/fashion.png", title: "Jaymin School of Fashion Design & Technology" },
    { img: "/images/departments/interior.png", title: "Godavariba School of Interior Design" },
    { img: "/images/departments/mca_mba.png", title: "Srmica – MBA" },
    { img: "/images/departments/humanities.png", title: "Department of Humanities" },

    { img: "/images/departments/biotech.png", title: "C. G. Bhakta Institute of Biotechnology" },
    { img: "/images/departments/cgpit.png", title: "Chhotubhai Gopalbhai Patel Institute of Technology" },
    { img: "/images/departments/polytechnic.png", title: "Diwaliba Polytechnic" },
    { img: "/images/departments/optometry.png", title: "Diwaliba College of Optometry" },
    { img: "/images/departments/maths.png", title: "Department of Mathematics" },
    { img: "/images/departments/physics.png", title: "Department of Physics" },
    { img: "/images/departments/chemical.png", title: "Tarsadia Institute of Chemical Science" },
    { img: "/images/departments/english.png", title: "Department of English" },
    { img: "/images/departments/commerce.png", title: "Bhulabhai Vanmalibhai Patel Institute of Commerce" },
    { img: "/images/departments/cs.png", title: "Bhulabhai Vanmalibhai Patel Institute of Computer Science" },
    { img: "/images/departments/hospital.png", title: "Matiya Patidar Ayurvedic Hospital" }
  ];



  const amenities = [
    { img: "/images/hostel.jpg", title: "Hostels" },
    { img: "/images/sports.jpg", title: "Sports" },
    { img: "/images/auditorium.jpg", title: "Auditorium" },
    { img: "/images/canteen.jpg", title: "Canteen" },
  ];

  return (
    <div className="homepage">



      {/* ===================================================
                        HERO SLIDER
      =================================================== */}
      <div className="hero-section">
        <Slider {...sliderSettings}>
          {campusImages.map((img, index) => (
            <div key={index}>
              <img src={img} alt="Campus" className="hero-img" />
            </div>
          ))}
        </Slider>
      </div>

      {/* ===================================================
                        DEPARTMENTS
      =================================================== */}
      <section className="dept-section">
        <h2 className="dept-title">Departments</h2>

        <Slider {...deptSliderSettings}>
          {departments.map((d, i) => (
            <div key={i} className="dept-simple-card">
              <img src={d.img} className="dept-simple-img" />

              <p className="dept-simple-title">{d.title}</p>
            </div>
          ))}
        </Slider>
      </section>

      {/* ===================================================
                Example of add student WITH LINK TO FORM
      =================================================== */}
      <div>
        <Link to="/StudentAdmission" className="text-blue-700 underline">
          Go to Student Admission Form
        </Link>
      </div>

      {/* ===================================================
                          FOOTER
      =================================================== */}
      <footer className="footer">
        <p>© 2025 Smart Campus Entry System | Designed for University</p>
      </footer>
    </div>
  );
};

export default Home;
