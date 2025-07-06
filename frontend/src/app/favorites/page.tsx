"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getFavorites, removeFavorite } from "../../lib/api";
import Link from "next/link";

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80";

export default function FavoritesPage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      router.replace("/login");
      return;
    }
    setLoading(true);
    getFavorites()
      .then((res: any) => {
        setFavorites(Array.isArray(res.data) ? res.data : []);
        setLoading(false);
      })
      .catch(() => {
        setFavorites([]);
        setLoading(false);
      });
  }, [router]);

  const handleRemoveFavorite = async (propertyId: string) => {
    setRemovingId(propertyId);
    try {
      await removeFavorite(propertyId);
      setFavorites((favs) => favs.filter((fav) => {
        const id = typeof fav.property === "string" ? fav.property : fav.property?._id;
        return id !== propertyId;
      }));
    } catch (e) {
      // Optionally show error
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="mt-12 px-4 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-center">Favorites</h1>
      {loading ? (
        <div className="text-center text-gray-500 text-lg">Loading...</div>
      ) : favorites.length === 0 ? (
        <div className="text-center text-gray-500 text-lg">No favorite properties found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {favorites.map((fav) => {
            const property = fav.property || {};
            const propertyId = typeof property === "string" ? property : property._id;
            return (
              <div
                key={propertyId}
                className="bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col hover:shadow-2xl transition-all duration-200 group overflow-hidden relative min-h-[420px]"
              >
                {/* Remove Favorite Icon */}
                <button
                  className="absolute top-3 left-3 z-10 rounded-full border-2 border-red-500 bg-red-500 p-1 w-8 h-8 flex items-center justify-center text-lg font-bold text-white transition-colors duration-200"
                  title="Remove from favorites"
                  disabled={removingId === propertyId}
                  onClick={() => handleRemoveFavorite(propertyId)}
                >
                  -
                </button>
                <div className="h-48 w-full bg-gray-100 flex items-center justify-center overflow-hidden">
                  <img
                    src={property.imageUrl || PLACEHOLDER_IMAGE}
                    alt={property.title || property.name}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-xl font-bold mb-1 text-blue-800 truncate">
                    {property.title || property.name}
                  </h3>
                  <p className="text-gray-600 mb-1 text-sm">
                    {property.city || property.location}, {property.state || ""}
                  </p>
                  <p className="text-blue-700 font-semibold mb-2 text-lg">
                    ₹{property.price?.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
                    {property.type}
                  </p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {(Array.isArray(property.amenities) ? property.amenities.join("|") : property.amenities || "")
                      .split("|")
                      .filter(Boolean)
                      .map((a: string, i: number) => (
                        <span
                          key={i}
                          className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs"
                        >
                          {a}
                        </span>
                      ))}
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {(Array.isArray(property.tags) ? property.tags.join("|") : property.tags || "")
                      .split("|")
                      .filter(Boolean)
                      .map((t: string, i: number) => (
                        <span
                          key={i}
                          className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs"
                        >
                          {t}
                        </span>
                      ))}
                  </div>
                  <div className="flex gap-2 mb-2">
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs">
                      {property.bedrooms} Bed
                    </span>
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs">
                      {property.bathrooms} Bath
                    </span>
                    <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded text-xs">
                      {property.areaSqFt || property.area} sqft
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    {property.isVerified && (
                      <span className="bg-green-200 text-green-900 px-2 py-0.5 rounded text-xs">
                        Verified
                      </span>
                    )}
                    <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs">
                      {property.listingType}
                    </span>
                  </div>
                  <Link
                    href={`/properties/${propertyId}`}
                    className="mt-auto text-blue-600 hover:underline font-semibold text-right block"
                  >
                    View Details
                  </Link>
                </div>
                <div className="absolute top-3 right-3 bg-white/80 rounded-full px-3 py-1 text-xs font-semibold text-gray-700 shadow">
                  {property.rating ? `★ ${property.rating}` : ""}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 