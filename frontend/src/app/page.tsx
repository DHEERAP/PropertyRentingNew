"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getProperties } from "../lib/api";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80";
const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80";

export default function HomePage() {
  const [featured, setFeatured] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    getProperties()
      .then((res: any) => {
        setFeatured(res.data.properties?.slice(0, 3) || []);
        setLoading(false);
      })
      .catch(() => {
        setFeatured([]);
        setLoading(false);
      });
    setIsLoggedIn(!!localStorage.getItem("token"));
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative h-[400px] flex items-center justify-center mb-16">
        <img
          src={HERO_IMAGE}
          alt="Find your dream home"
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/30 z-10" />
        <div className="relative z-20 text-center text-white">
          <h1 className="text-5xl font-extrabold mb-4 drop-shadow-lg">Find Your Dream Home</h1>
          <p className="text-xl mb-6 font-medium drop-shadow">Browse, favorite, and get recommendations for the best properties in your city.</p>
          <Link href="/properties" className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition text-lg shadow-lg">Browse Properties</Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-5xl mx-auto mb-16 px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
            <span className="text-4xl mb-2">🏠</span>
            <h3 className="font-bold text-lg mb-1">Verified Listings</h3>
            <p className="text-gray-500">All properties are verified for authenticity and quality.</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
            <span className="text-4xl mb-2">🔍</span>
            <h3 className="font-bold text-lg mb-1">Easy Search</h3>
            <p className="text-gray-500">Find your perfect home with powerful search and filters.</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
            <span className="text-4xl mb-2">🤝</span>
            <h3 className="font-bold text-lg mb-1">Trusted Agents</h3>
            <p className="text-gray-500">Connect with experienced and trusted real estate agents.</p>
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="max-w-6xl mx-auto px-4 mb-20">
        <h2 className="text-3xl font-bold mb-8 text-center text-blue-900">Featured Properties</h2>
        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : featured.length === 0 ? (
          <div className="text-center text-gray-500">No featured properties available.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">
            {featured.map((property) => (
              <div key={property._id} className="bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col hover:shadow-2xl transition-all duration-200 group overflow-hidden relative min-h-[380px]">
                <div className="h-40 w-full bg-gray-100 flex items-center justify-center overflow-hidden">
                  <img
                    src={property.imageUrl || PLACEHOLDER_IMAGE}
                    alt={property.title || property.name}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-xl font-bold mb-1 text-blue-800 truncate">{property.title || property.name}</h3>
                  <p className="text-gray-600 mb-1 text-sm">{property.city || property.location}, {property.state || ""}</p>
                  <p className="text-blue-700 font-semibold mb-2 text-lg">
                    ₹{property.price?.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">{property.type}</p>
                  <Link href={`/properties/${property._id}`} className="mt-auto text-blue-600 hover:underline font-semibold text-right block">View Details</Link>
                </div>
                <div className="absolute top-3 right-3 bg-white/80 rounded-full px-3 py-1 text-xs font-semibold text-gray-700 shadow">
                  {property.rating ? `★ ${property.rating}` : ""}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
