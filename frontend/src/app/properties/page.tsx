"use client";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { getProperties, getFavorites, addFavorite, removeFavorite } from "../../lib/api";
import { useRouter } from "next/navigation";

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80";

export default function PropertiesPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 12;
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [favLoading, setFavLoading] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    if (typeof window !== "undefined") {
      setIsLoggedIn(!!localStorage.getItem("token"));
      const handleAuthChange = () => setIsLoggedIn(!!localStorage.getItem("token"));
      window.addEventListener("authChanged", handleAuthChange);
      return () => window.removeEventListener("authChanged", handleAuthChange);
    }
  }, [isMounted]);

  // Debounced search function
  const debouncedSearch = useCallback((searchTerm: string) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    // If search term is empty, clear results immediately
    if (!searchTerm.trim()) {
      setProperties([]);
      setTotalPages(1);
      setTotal(0);
      setLoading(false);
      return;
    }
    const timeout = setTimeout(() => {
      setPage(1); // Reset to first page when searching
      fetchProperties(searchTerm, 1);
    }, 200); // Reduced to 200ms for faster response
    setSearchTimeout(timeout);
  }, [searchTimeout]);

  // Fetch properties with search
  const fetchProperties = async (searchTerm: string = "", currentPage: number = 1) => {
    setLoading(true);
    try {
      const params: any = { 
        page: currentPage, 
        limit, 
        sortBy: "createdAt", 
        sortOrder: "desc" 
      };
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
        console.log('Searching for:', searchTerm.trim());
      }
      const res: any = await getProperties(params);
      const data = Array.isArray(res.data?.properties) ? res.data.properties : [];
      console.log(`Found ${data.length} properties for search: "${searchTerm}"`);
      setProperties(data);
      setTotalPages(res.data.pages || 1);
      setTotal(res.data.total || 0);
    } catch (error) {
      console.error('Error fetching properties:', error);
      setProperties([]);
      setTotalPages(1);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // Fetch favorites
  const fetchFavorites = async () => {
    if (!isLoggedIn) {
      setFavoriteIds([]);
      return;
    }
    try {
      const res: any = await getFavorites();
      const ids = Array.isArray(res.data)
        ? res.data.map((fav: any) => typeof fav.property === "string" ? fav.property : fav.property?._id)
        : [];
      setFavoriteIds(ids.filter(Boolean));
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setFavoriteIds([]);
    }
  };

  // Initial load and whenever search or page changes
  useEffect(() => {
    if (!isMounted) return;
    fetchProperties(search, page);
  }, [page, search, isMounted]);

  // Fetch favorites when login status changes
  useEffect(() => {
    if (!isMounted) return;
    fetchFavorites();
  }, [isLoggedIn, isMounted]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    // Only search if there are at least 2 characters, otherwise fetch all
    if (value.trim().length >= 2) {
      debouncedSearch(value);
    } else if (value.trim().length === 0) {
      // Fetch all properties if search is cleared
      fetchProperties('', 1);
    }
  };

  // Handle page changes
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchProperties(search, newPage);
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

  if (!isMounted) return null;

  return (
    <div className="mt-12 px-4 max-w-7xl mx-auto">
      <h1 className="text-4xl font-extrabold mb-8 text-center text-blue-900 tracking-tight drop-shadow-lg">
        Explore Properties
      </h1>
      <div className="mb-10 flex justify-center">
        <div className="relative w-full max-w-lg">
          <input
            type="text"
            placeholder="Search by title, state, or city (min 2 characters)..."
            className="border border-blue-200 px-5 py-3 pr-12 rounded-lg w-full shadow focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            value={search}
            onChange={handleSearchChange}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && search.trim().length >= 2) {
                fetchProperties(search.trim(), 1);
              }
            }}
          />
          {search && (
            <button
              onClick={() => {
                setSearch('');
                setProperties([]);
                setTotalPages(1);
                setTotal(0);
                setLoading(false);
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      {loading ? (
        <div className="text-center text-gray-500 text-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          Searching properties...
        </div>
      ) : search.trim().length === 1 ? (
        <div className="text-center text-gray-500 text-lg">
          <p>Type at least 2 characters to search</p>
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center text-gray-500 text-lg">
          {search ? (
            <div>
              <p className="mb-2">No properties found for "{search}".</p>
              <p className="text-sm text-gray-400">Try searching with different keywords like:</p>
              <p className="text-sm text-gray-400">• Property title (e.g., "Luxury Apartment")</p>
              <p className="text-sm text-gray-400">• City name (e.g., "Mumbai", "Delhi")</p>
              <p className="text-sm text-gray-400">• State name (e.g., "Maharashtra", "Karnataka")</p>
            </div>
          ) : (
            <div>
              <p className="mb-2">Start searching for properties above</p>
              <p className="text-sm text-gray-400">Type at least 2 characters to search by title, city, or state</p>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="mb-6 text-center">
            <p className="text-gray-600">
              Found <span className="font-semibold text-blue-600">{total}</span> property{total !== 1 ? 'ies' : ''} for "{search}"
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {properties.map((property: any) => {
              const isFav = favoriteIds.includes(property._id);
              return (
                <div
                  key={property._id}
                  className="bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col hover:shadow-2xl transition-all duration-200 group overflow-hidden relative min-h-[420px]"
                >
                  {/* Favorite Icon: Only show if logged in */}
                  {isLoggedIn && (
                    <>
                      <button
                        className={`absolute top-3 left-3 z-10 rounded-full border-2 border-red-500 bg-white p-1 w-8 h-8 flex items-center justify-center text-lg font-bold ${isFav ? "text-white bg-red-500" : "text-red-500"} transition-colors duration-200`}
                        title={isFav ? "Remove from favorites" : "Add to favorites"}
                        disabled={favLoading === property._id}
                        onClick={() => handleToggleFavorite(property._id, isFav)}
                      >
                        {isFav ? "-" : "+"}
                      </button>
                      <button
                        className="absolute top-14 left-3 z-10 rounded-full border-2 border-blue-500 bg-white p-1 w-8 h-8 flex items-center justify-center text-xs font-bold text-blue-500 transition-colors duration-200 hover:bg-blue-100"
                        title="Recommend this property"
                        onClick={() => router.push(`/recommend-property/${property._id}`)}
                      >
                        REC
                      </button>
                    </>
                  )}
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
                      href={`/properties/${property._id}`}
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
          {/* Pagination Controls */}
          <div className="flex justify-center items-center gap-4 mt-10">
            <button
              onClick={() => handlePageChange(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded bg-blue-600 text-white font-semibold disabled:bg-gray-300 disabled:text-gray-500"
            >
              Previous
            </button>
            <span className="text-lg font-semibold">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded bg-blue-600 text-white font-semibold disabled:bg-gray-300 disabled:text-gray-500"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
} 