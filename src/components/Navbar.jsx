import { NavLink, Link } from "react-router-dom";
import "../css/Navbar.css"

const Navbar = ({ isLoggedIn }) => {
  return (
    <nav
      className="navbar navbar-dark px-3"
      style={{
        background: "#0b0d10",
        borderBottom: "1px solid #1b1f25",
      }}
    >
      <div className="container-fluid d-flex justify-content-between align-items-center">
        <Link className="navbar-brand neon-title" to="/">
          {/* LEFT SIDE - LOGO */}
          <img
            src="/logo/Logo.png"
            alt="Entry Vision Logo"
            style={{
              width: "70px",
              height: "70px",
              borderRadius: "6px",
              objectFit: "cover",
            }}
          />
          Entry Vision
        </Link>

        {/* RIGHT SIDE - LINKS */}
        <div className="d-flex align-items-center gap-4">
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive ? "nav-link active-nav" : "nav-link text-light"
            }
          >
            Home
          </NavLink>

          <NavLink
            to="/about"
            className={({ isActive }) =>
              isActive ? "nav-link active-nav" : "nav-link text-light"
            }
          >
            About
          </NavLink>

          <form className="d-flex" role="search">
            {isLoggedIn ? (
              <Link className="btn btn-outline-danger btn-sm" to="/logout">
                Logout
              </Link>
            ) : (
              <Link className="btn btn-outline-primary mx-1" to="/login">
                Login
              </Link>
            )}
          </form>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
