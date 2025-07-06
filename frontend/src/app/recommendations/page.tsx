"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getRecommendations } from "../../lib/api";
import Link from "next/link";

export default function RecommendationsPage() {
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [debug, setDebug] = useState<any>(null);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      setDebug({ reason: "No token in localStorage" });
      router.replace("/login");
      return;
    }
    setLoading(true);
    setError("");
    setDebug(null);
    getRecommendations()
      .then((res: any) => {
        setRecommendations(Array.isArray(res.data) ? res.data : []);
        setDebug({ apiResponse: res.data });
        setLoading(false);
      })
      .catch((err) => {
        setRecommendations([]);
        setError(err?.response?.data?.message || "Failed to fetch recommendations");
        setDebug({ apiError: err?.response?.data || err?.message || err });
        setLoading(false);
      });
  }, [router]);

  // Get user info for debug
  let userInfo = null;
  if (typeof window !== "undefined") {
    try {
      userInfo = JSON.parse(localStorage.getItem("user") || "null");
    } catch {}
  }
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  return (
    <div className="mt-12 px-4 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center text-blue-900">Recommendations</h1>
      {loading ? (
        <div className="text-center text-gray-500 text-lg">Loading...</div>
      ) : error ? (
        <div className="text-center text-red-600 text-lg">{error}</div>
      ) : recommendations.length === 0 ? (
        <div className="text-center text-gray-500 text-lg">currently there is not any recommendation</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {recommendations.map((rec) => {
            const property = rec.property || {};
            const propertyId = typeof property === "string" ? property : property._id;
            return (
              <div
                key={rec._id}
                className="bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col hover:shadow-2xl transition-all duration-200 group overflow-hidden relative min-h-[420px]"
              >
                <div className="h-48 w-full bg-gray-100 flex items-center justify-center overflow-hidden">
                  <img
                    src={property.imageUrl || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80'}
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
                  <div className="mt-2 mb-2 p-2 bg-blue-50 rounded">
                    <span className="block text-blue-900 font-semibold">Message:</span>
                    <span className="block text-gray-800 whitespace-pre-line">{rec.message}</span>
                  </div>
                  <div className="mb-2">
                    <span className="block text-gray-700 text-sm">Recommended by: <b>{rec.sender?.name || rec.sender?.email || "Unknown"}</b></span>
                  </div>
                  <Link
                    href={`/properties/${propertyId}`}
                    className="mt-auto text-blue-600 hover:underline font-semibold text-right block"
                  >
                    View Property
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 