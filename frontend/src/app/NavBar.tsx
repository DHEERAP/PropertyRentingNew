"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function NavBar() {
  const [isMounted, setIsMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
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
    <nav className="w-full bg-white shadow-md py-4 px-8 flex justify-between items-center mb-8">
      <div className="font-extrabold text-2xl text-blue-800 drop-shadow-lg">
        <Link href="/">Property Renting</Link>
      </div>
      <div className="flex gap-6 text-base">
        <Link href="/properties" className="font-bold text-blue-800  hover:bg-blue-50 px-2 py-1 rounded transition">Properties</Link>
        {isLoggedIn ? (
          <>
            <Link href="/favorites" className="font-bold text-blue-800  hover:bg-blue-50 px-2 py-1 rounded transition">Favorites</Link>
            <Link href="/recommendations" className="font-bold text-blue-800  hover:bg-blue-50 px-2 py-1 rounded transition">Recommendations</Link>
            <Link href="/create-property" className="font-bold text-blue-800  hover:bg-blue-50 px-2 py-1 rounded transition">Create Property</Link>
            <Link href="/current-user-properties" className="font-bold text-blue-800  hover:bg-blue-50
             px-2 py-1 rounded transition">Your Properties</Link>
            <button onClick={handleLogout} className="font-bold text-red-700  hover:bg-red-50 px-2 py-1 rounded transition">Logout</button>
          </>
        ) : (
          <>
            <Link href="/login" className="font-bold text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition">Login</Link>
            <Link href="/register" className="font-bold text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
} 