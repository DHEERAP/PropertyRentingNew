"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { recommendProperty } from "../../../lib/api";
import Link from "next/link";

export default function RecommendPropertyPage() {
  const router = useRouter();
  const { propertyId } = useParams();
  const [recipientEmail, setRecipientEmail] = useState("");
  const [message, setMessage] = useState("");
  const [propertyUrl, setPropertyUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Fetch property link on mount
  useEffect(() => {
    if (typeof propertyId === "string") {
      setPropertyUrl(`${window.location.origin}/properties/${propertyId}`);
      setMessage(`Check out this property: ${window.location.origin}/properties/${propertyId}\n`);
    }
  }, []);

  // Check login status on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsLoggedIn(!!localStorage.getItem("token"));
    }
  }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      if (typeof propertyId === "string") {
        await recommendProperty(propertyId, recipientEmail, message);
        setSuccess("Recommendation sent successfully!");
        setTimeout(() => router.push("/recommendations"), 1200);
      } else {
        setError("Invalid property ID");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to send recommendation");
    } finally {
      setLoading(false);
    }
  };

  // Gmail mailto link
  const gmailSubject = encodeURIComponent("Check out this property!");
  const gmailBody = encodeURIComponent(message || `Check out this property: ${propertyUrl}`);
  const gmailLink = `https://mail.google.com/mail/?view=cm&fs=1&to=&su=${gmailSubject}&body=${gmailBody}`;

  return (
    <div className="max-w-lg mx-auto mt-16 p-0 rounded-2xl shadow-2xl border border-blue-300 bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <div className="rounded-t-2xl bg-blue-700 py-6 px-8 text-center">
        <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow">Recommend Property</h1>
      </div>
      <div className="p-8">
        {!isLoggedIn ? (
          <>
            <div className="mb-8 text-center">
              <div className="mb-4 text-blue-900 font-semibold text-lg">You are not logged in.</div>
              <div className="mb-6 text-gray-700">You can recommend this property via Gmail:</div>
              <a
                href={gmailLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold text-lg px-6 py-3 rounded-lg shadow-lg transition mb-6"
              >
                Send via Gmail
              </a>
            </div>
            <div className="text-center text-gray-500 text-sm">
              <span>Already have an account? </span>
              <Link href="/login" className="text-blue-700 underline font-semibold hover:text-blue-900 transition">Login here</Link>
            </div>
          </>
        ) : (
          <>
            {error && <div className="mb-4 text-red-700 bg-red-100 border border-red-300 rounded px-4 py-2 text-center font-semibold animate-pulse">{error}</div>}
            {success && <div className="mb-4 text-green-700 bg-green-100 border border-green-300 rounded px-4 py-2 text-center font-semibold animate-pulse">{success}</div>}
            <form onSubmit={handleSubmit} className="space-y-7">
              <div>
                <label className="block font-bold text-blue-900 mb-2 text-lg">Recipient Email</label>
                <input
                  type="email"
                  className="w-full border-2 border-blue-300 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition shadow-sm hover:border-blue-500 text-black"
                  value={recipientEmail}
                  onChange={e => setRecipientEmail(e.target.value)}
                  required
                  placeholder="Enter recipient's email address"
                />
              </div>
              <div>
                <label className="block font-bold text-blue-900 mb-2 text-lg">Message</label>
                <textarea
                  className="w-full border-2 border-blue-300 rounded-lg px-4 py-3 text-lg min-h-[110px] focus:outline-none focus:ring-2 focus:ring-blue-400 transition shadow-sm hover:border-blue-500 text-black"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  required
                  placeholder="Write a message to the recipient..."
                />
              </div>
              <div>
                <label className="block font-bold text-blue-900 mb-2 text-lg">Property Link</label>
                <input
                  type="text"
                  className="w-full border-2 border-blue-200 rounded-lg px-4 py-3 text-lg bg-gray-100 text-black cursor-not-allowed"
                  value={propertyUrl}
                  readOnly
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white py-3 rounded-lg font-extrabold text-xl shadow-lg hover:from-blue-700 hover:to-blue-900 transition disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Recommendation"}
              </button>
            </form>
            {/* Gmail functionality below the form */}
            <div className="mt-10 text-center">
              <div className="mb-3 text-gray-700 font-semibold">Or send this property via Gmail to anyone (including non-registered users):</div>
              <a
                href={gmailLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold text-lg px-6 py-3 rounded-lg shadow-lg transition"
              >
                Send via Gmail
              </a>
            </div>
            <div className="mt-8 text-center">
              <Link href="/properties" className="text-blue-700 underline font-semibold text-lg hover:text-blue-900 transition">Back to Properties</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 