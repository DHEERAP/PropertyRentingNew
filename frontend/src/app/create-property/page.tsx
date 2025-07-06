"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { addProperty, getUserProperties, editProperty, deleteProperty } from "../../lib/api";

export default function CreatePropertyPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    id: "",
    title: "",
    type: "",
    price: "",
    state: "",
    city: "",
    areaSqFt: "",
    bedrooms: "",
    bathrooms: "",
    amenities: "",
    furnished: "",
    availableFrom: "",
    listedBy: "",
    tags: "",
    colorTheme: "",
    rating: "",
    isVerified: false,
    listingType: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [userProperties, setUserProperties] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      router.replace("/login");
    }
  }, [router]);

  // Fetch current user's properties
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
  }, [success]);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const token = localStorage.getItem("token") || undefined;
      if (editingId) {
        await editProperty(editingId, form, token);
        setSuccess("Property updated successfully!");
        setEditingId(null);
      } else {
        await addProperty(form, token);
        setSuccess("Property created successfully!");
      }
      setForm({
        id: "",
        title: "",
        type: "",
        price: "",
        state: "",
        city: "",
        areaSqFt: "",
        bedrooms: "",
        bathrooms: "",
        amenities: "",
        furnished: "",
        availableFrom: "",
        listedBy: "",
        tags: "",
        colorTheme: "",
        rating: "",
        isVerified: false,
        listingType: "",
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to create/update property");
    }
  };

  const handleEdit = (property: any) => {
    setForm({ ...property });
    setEditingId(property._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem("token") || undefined;
      await deleteProperty(id, token);
      setUserProperties((prev) => prev.filter((p) => p._id !== id));
      setSuccess("Property deleted successfully!");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to delete property");
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-12 bg-white rounded-2xl shadow-xl p-10">
      <h1 className="text-3xl font-bold mb-8 text-center text-blue-900">Create Property</h1>
      {error && <div className="mb-4 text-red-600">{error}</div>}
      {success && <div className="mb-4 text-green-600">{success}</div>}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Property Details Section */}
        <div className="bg-blue-50 rounded-lg p-6 mb-2 border border-blue-100">
          <h2 className="text-xl font-semibold mb-6 text-blue-800 border-b border-blue-200 pb-2">Property Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { name: "id", label: "Property ID", required: true },
              { name: "title", label: "Title", required: true },
              { name: "type", label: "Type", required: true },
              { name: "price", label: "Price", required: true },
              { name: "state", label: "State", required: true },
              { name: "city", label: "City", required: true },
              { name: "areaSqFt", label: "Area SqFt", required: true },
              { name: "bedrooms", label: "Bedrooms", required: true },
              { name: "bathrooms", label: "Bathrooms", required: true },
            ].map((field) => (
              <div key={field.name} className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-blue-900 mb-1" htmlFor={field.name}>{field.label}</label>
                <input
                  id={field.name}
                  name={field.name}
                  value={form[field.name as keyof typeof form] as string}
                  onChange={handleChange}
                  className="border border-gray-300 rounded px-3 py-2 w-full text-base focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition bg-white text-gray-900 placeholder-gray-400"
                  placeholder={field.label}
                  required={field.required}
                  autoComplete="off"
                />
              </div>
            ))}
          </div>
        </div>
        {/* Features Section */}
        <div className="bg-green-50 rounded-lg p-6 mb-2 border border-green-100">
          <h2 className="text-xl font-semibold mb-6 text-green-800 border-b border-green-200 pb-2">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { name: "amenities", label: "Amenities (pipe-separated)" },
              { name: "furnished", label: "Furnished" },
              { name: "availableFrom", label: "Available From (YYYY-MM-DD)" },
              { name: "listedBy", label: "Listed By" },
              { name: "tags", label: "Tags (pipe-separated)" },
              { name: "colorTheme", label: "Color Theme" },
              { name: "rating", label: "Rating" },
            ].map((field) => (
              <div key={field.name} className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-green-900 mb-1" htmlFor={field.name}>{field.label}</label>
                <input
                  id={field.name}
                  name={field.name}
                  value={form[field.name as keyof typeof form] as string}
                  onChange={handleChange}
                  className="border border-gray-300 rounded px-3 py-2 w-full text-base focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition bg-white text-gray-900 placeholder-gray-400"
                  placeholder={field.label}
                  autoComplete="off"
                />
              </div>
            ))}
            <div className="flex items-center gap-2 mt-2">
              <input type="checkbox" name="isVerified" checked={form.isVerified} onChange={handleChange} className="w-5 h-5" id="isVerified" />
              <label htmlFor="isVerified" className="font-medium text-base text-green-900">Verified</label>
            </div>
          </div>
        </div>
        {/* Listing Info Section */}
        <div className="bg-purple-50 rounded-lg p-6 border border-purple-100">
          <h2 className="text-xl font-semibold mb-6 text-purple-800 border-b border-purple-200 pb-2">Listing Info</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-purple-900 mb-1" htmlFor="listingType">Listing Type</label>
              <input
                id="listingType"
                name="listingType"
                value={form.listingType}
                onChange={handleChange}
                className="border border-gray-300 rounded px-3 py-2 w-full text-base focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition bg-white text-gray-900 placeholder-gray-400"
                placeholder="Listing Type"
                autoComplete="off"
              />
            </div>
          </div>
        </div>
        <button type="submit" className="bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 transition text-lg shadow w-full mt-4">
          {editingId ? "Update Property" : "Create Property"}
        </button>
      </form>
    </div>
  );
} 