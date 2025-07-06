"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function NavBar() {
  const [isMounted, setIsMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
    setIsLoggedIn(!!localStorage.getItem("token"));
    const handleAuthChange = () => setIsLoggedIn(!!localStorage.getItem("token"));
    window.addEventListener("authChanged", handleAuthChange);
    return () => window.removeEventListener("authChanged", handleAuthChange);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    window.dispatchEvent(new Event("authChanged"));
    router.push("/");
  };

  if (!isMounted) {
    // Avoid hydration mismatch by rendering nothing until mounted
    return null;
  }

  return (
    <nav className="w-full bg-white shadow-md py-4 px-4 md:px-8 flex justify-between items-center mb-8 sticky top-0 z-50">
      <div className="font-extrabold text-2xl text-blue-800 drop-shadow-lg">
        <Link href="/">Property Renting</Link>
      </div>
      {/* Hamburger for mobile */}
      <button
        className="md:hidden flex flex-col justify-center items-center w-10 h-10 focus:outline-none"
        onClick={() => setMenuOpen((open) => !open)}
        aria-label="Toggle menu"
      >
        <span className={`block w-6 h-0.5 bg-blue-800 mb-1 transition-transform ${menuOpen ? "rotate-45 translate-y-2" : ""}`}></span>
        <span className={`block w-6 h-0.5 bg-blue-800 mb-1 transition-opacity ${menuOpen ? "opacity-0" : ""}`}></span>
        <span className={`block w-6 h-0.5 bg-blue-800 transition-transform ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`}></span>
      </button>
      {/* Desktop menu */}
      <div className="hidden md:flex gap-6 text-base">
        <Link href="/properties" className="font-bold text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition">Properties</Link>
        {isLoggedIn ? (
          <>
            <Link href="/favorites" className="font-bold text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition">Favorites</Link>
            <Link href="/recommendations" className="font-bold text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition">Recommendations</Link>
            <Link href="/create-property" className="font-bold text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition">Create Property</Link>
            <Link href="/current-user-properties" className="font-bold text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition">Your Properties</Link>
            <button onClick={handleLogout} className="font-bold text-red-700 hover:bg-red-50 px-2 py-1 rounded transition">Logout</button>
          </>
        ) : (
          <>
            <Link href="/login" className="font-bold text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition">Login</Link>
            <Link href="/register" className="font-bold text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition">Register</Link>
          </>
        )}
      </div>
      {/* Mobile menu */}
      {menuOpen && (
        <div className="absolute top-16 left-0 w-full bg-white shadow-lg flex flex-col items-center gap-4 py-6 md:hidden animate-fade-in z-50">
          <Link href="/properties" className="font-bold text-blue-800 hover:bg-blue-50 px-4 py-2 rounded transition w-full text-center" onClick={() => setMenuOpen(false)}>Properties</Link>
          {isLoggedIn ? (
            <>
              <Link href="/favorites" className="font-bold text-blue-800 hover:bg-blue-50 px-4 py-2 rounded transition w-full text-center" onClick={() => setMenuOpen(false)}>Favorites</Link>
              <Link href="/recommendations" className="font-bold text-blue-800 hover:bg-blue-50 px-4 py-2 rounded transition w-full text-center" onClick={() => setMenuOpen(false)}>Recommendations</Link>
              <Link href="/create-property" className="font-bold text-blue-800 hover:bg-blue-50 px-4 py-2 rounded transition w-full text-center" onClick={() => setMenuOpen(false)}>Create Property</Link>
              <Link href="/current-user-properties" className="font-bold text-blue-800 hover:bg-blue-50 px-4 py-2 rounded transition w-full text-center" onClick={() => setMenuOpen(false)}>Your Properties</Link>
              <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="font-bold text-red-700 hover:bg-red-50 px-4 py-2 rounded transition w-full text-center">Logout</button>
            </>
          ) : (
            <>
              <Link href="/login" className="font-bold text-blue-800 hover:bg-blue-50 px-4 py-2 rounded transition w-full text-center" onClick={() => setMenuOpen(false)}>Login</Link>
              <Link href="/register" className="font-bold text-blue-800 hover:bg-blue-50 px-4 py-2 rounded transition w-full text-center" onClick={() => setMenuOpen(false)}>Register</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
} 