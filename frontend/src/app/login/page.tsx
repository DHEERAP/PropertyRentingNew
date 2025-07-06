"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { login } from "../../lib/api";
import { useRouter } from "next/navigation";

const LOGIN_IMAGE =
  "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=600&q=80";

export default function LoginPage() {
  useEffect(() => { console.log('Login page rendered'); }, []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await login(email, password);
      const data = res.data as { user: any; token: string };
      // Save user info/token
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);
      window.dispatchEvent(new Event("authChanged"));
      router.push("/");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 py-12 px-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl flex overflow-hidden">
        {/* Left: Image */}
        <div className="hidden md:block md:w-1/2 bg-blue-100">
          <img src={LOGIN_IMAGE} alt="Welcome" className="object-cover w-full h-full" />
        </div>
        {/* Right: Form */}
        <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
          <h1 className="text-3xl font-extrabold mb-4 text-blue-900 flex items-center gap-2">
            <span>🔑</span> Login
          </h1>
          {error && <div className="mb-4 text-red-600">{error}</div>}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            <button type="submit" className="bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 transition text-lg shadow">Login</button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-600">
            Don&apos;t have an account? <Link href="/register" className="text-blue-600 hover:underline font-semibold">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
} 