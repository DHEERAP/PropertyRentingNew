"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { register } from "../../lib/api";
import { useRouter } from "next/navigation";

const REGISTER_IMAGE =
  "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=600&q=80";

export default function RegisterPage() {
  useEffect(() => { console.log('Register page rendered'); }, []);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await register(name, email, password);
      const data = res.data as { user: any; token: string };
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);
      window.dispatchEvent(new Event("authChanged"));
      router.push("/");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 py-12 px-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl flex overflow-hidden">
        {/* Left: Image */}
        <div className="hidden md:block md:w-1/2 bg-blue-100">
          <img src={REGISTER_IMAGE} alt="Register" className="object-cover w-full h-full" />
        </div>
        {/* Right: Form */}
        <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
          <h1 className="text-3xl font-extrabold mb-4 text-blue-900 flex items-center gap-2">
            <span>📝</span> Register
          </h1>
          {error && <div className="mb-4 text-red-600">{error}</div>}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Name"
              className="border rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Email"
              className="border rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="border rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <button type="submit" className="bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 transition text-lg shadow">Register</button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account? <Link href="/login" className="text-blue-600 hover:underline font-semibold">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
} 