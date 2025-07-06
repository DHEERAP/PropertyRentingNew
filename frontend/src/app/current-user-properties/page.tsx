"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserProperties, editProperty, deleteProperty, getFavorites, addFavorite, removeFavorite } from "../../lib/api";
import Link from "next/link";

export default function CurrentUserPropertiesPage() {
  const router = useRouter();
  const [userProperties, setUserProperties] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [favLoading, setFavLoading] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setIsLoggedIn(!!localStorage.getItem("token"));
    const handleAuthChange = () => setIsLoggedIn(!!localStorage.getItem("token"));
    window.addEventListener("authChanged", handleAuthChange);
    return () => window.removeEventListener("authChanged", handleAuthChange);
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      router.replace("/login");
      return;
    }
    const user = localStorage.getItem("user");
    if (user) {
      const userId = JSON.parse(user).id;
      const token = localStorage.getItem("token") || undefined;
      getUserProperties(userId, token).then(res => {
        const data = res.data as { properties: any[] };
        setUserProperties(data.properties || []);
      });
    }
    // Fetch favorites only if logged in
    if (isLoggedIn) {
      getFavorites()
        .then((res: any) => {
          const ids = Array.isArray(res.data)
            ? res.data.map((fav: any) => typeof fav.property === "string" ? fav.property : fav.property?._id)
            : [];
          setFavoriteIds(ids.filter(Boolean));
        })
        .catch(() => setFavoriteIds([]));
    } else {
      setFavoriteIds([]);
    }
  }, [success, router, isLoggedIn]);

  const handleEdit = (property: any) => {
    setForm({ ...property });
    setEditingId(property._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem("token") || undefined;
      await deleteProperty(id, token);
      // Always fetch the latest list from backend after delete
      const user = localStorage.getItem("user");
      if (user) {
        const userId = JSON.parse(user).id;
        const res = await getUserProperties(userId);
        const data = res.data as { properties: any[] };
        setUserProperties(data.properties || []);
      }
      setSuccess("Property deleted successfully!");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to delete property");
    }
  };

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setForm((prev: any) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleUpdate = async (e: any) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const token = localStorage.getItem("token") || undefined;
      if (editingId) {
        await editProperty(editingId, form, token);
        setSuccess("Property updated successfully!");
        setEditingId(null);
        setForm(null);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update property");
    }
  };

  const handleToggleFavorite = async (propertyId: string, isFav: boolean) => {
    setFavLoading(propertyId);
    try {
      if (isFav) {
        await removeFavorite(propertyId);
        setFavoriteIds((ids) => ids.filter((id) => id !== propertyId));
      } else {
        await addFavorite(propertyId);
        setFavoriteIds((ids) => [...ids, propertyId]);
      }
    } catch (e) {
      // Optionally show error
    } finally {
      setFavLoading(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto mt-12 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center text-blue-900">Current User's Properties</h1>
      {error && <div className="mb-4 text-red-600">{error}</div>}
      {success && <div className="mb-4 text-green-600">{success}</div>}
      {editingId && form && (
        <form onSubmit={handleUpdate} className="mb-10 space-y-6 bg-blue-100 rounded-xl p-8 border-2 border-blue-300 shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-blue-900 text-center">Edit Property</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(form).map(([key, value]) =>
              key !== "_id" && key !== "createdBy" && key !== "__v" ? (
                <div key={key} className="flex flex-col mb-2">
                  <label className="font-semibold mb-2 text-blue-800 capitalize text-lg">{key.replace(/([A-Z])/g, ' $1')}</label>
                  {typeof value === "boolean" ? (
                    <input type="checkbox" name={key} checked={value} onChange={handleChange} className="w-6 h-6" />
                  ) : (
                    <input name={key} value={String(value)} onChange={handleChange} className="border-2 border-blue-400 rounded px-4 py-3 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-blue-900" />
                  )}
                </div>
              ) : null
            )}
          </div>
          <div className="flex gap-4 justify-center mt-4">
            <button type="submit" className="bg-blue-700 text-white py-3 px-8 rounded font-bold text-lg hover:bg-blue-900 transition">Update Property</button>
            <button type="button" onClick={() => { setEditingId(null); setForm(null); }} className="text-gray-700 underline text-lg">Cancel</button>
          </div>
        </form>
      )}
      {userProperties.length === 0 ? (
        <div className="text-gray-500 text-center">
          You have not created any property yet.<br />
          <span>
            You can create one via the{' '}
            <a href="/create-property" className="text-blue-700 underline font-semibold">Create Property</a> page.
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-center">
          {userProperties.map((property) => {
            const isFav = favoriteIds.includes(property._id);
            return (
              <div
                key={property._id}
                className="bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col hover:shadow-2xl transition-all duration-200 group overflow-hidden relative min-h-[420px] w-full max-w-sm mx-auto"
              >
                {/* Favorite Icon: Only show if logged in */}
                {isLoggedIn && isMounted && (
                  <button
                    className={`absolute top-3 left-3 z-10 rounded-full border-2 border-red-500 bg-white p-1 w-8 h-8 flex items-center justify-center text-lg font-bold ${isFav ? "text-white bg-red-500" : "text-red-500"} transition-colors duration-200`}
                    title={isFav ? "Remove from favorites" : "Add to favorites"}
                    disabled={favLoading === property._id}
                    onClick={() => handleToggleFavorite(property._id, isFav)}
                  >
                    {isFav ? "-" : "+"}
                  </button>
                )}
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
                  <Link
                    href={`/properties/${property._id}`}
                    className="mt-auto text-blue-600 hover:underline font-semibold text-right block"
                  >
                    View Details
                  </Link>
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => handleEdit(property)} className="bg-yellow-400 text-white px-4 py-2 rounded font-semibold hover:bg-yellow-500 transition w-full">Edit</button>
                    <button onClick={() => handleDelete(property._id)} className="bg-red-600 text-white px-4 py-2 rounded font-semibold hover:bg-red-700 transition w-full">Delete</button>
                  </div>
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