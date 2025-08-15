import React, { useRef, useState } from 'react';

interface LoginFormProps {
  onFlip: () => void;
}

function EyeIcon({ open = false }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5S2.25 12 2.25 12z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 002.25 12s3.75 7.5 9.75 7.5c2.042 0 3.82-.393 5.282-1.02M6.223 6.223A10.477 10.477 0 0112 4.5c6 0 9.75 7.5 9.75 7.5a17.978 17.978 0 01-2.307 3.592M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
    </svg>
  );
}

const LoginForm: React.FC<LoginFormProps> = ({ onFlip }) => {
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    setError(null);
    const email = emailRef.current?.value || "";
    const password = passwordRef.current?.value || "";
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.user && data.user.username) {
          localStorage.setItem("username", data.user.username);
        }
        window.location.href = "/Vecole";
      } else {
        setError(data.error || "Login failed");
      }
    } catch (e) {
      setError("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full bg-white p-8 rounded-lg shadow-lg flex flex-col items-center justify-center [backface-visibility:hidden] absolute top-0 left-0">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Login</h2>
      <form className="w-full max-w-sm" onSubmit={e => { e.preventDefault(); handleLogin(); }}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
            Email
          </label>
          <input
            ref={emailRef}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="email"
            type="email"
            placeholder="Email"
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <input
              ref={passwordRef}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline pr-10"
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="********"
            />
            <button
              type="button"
              className="absolute right-2 top-[42%] -translate-y-1/2 flex items-center text-gray-500"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>
        </div>
        {error && <div className="text-red-500 mb-2 text-sm">{error}</div>}
        <div className="flex items-center justify-between">
          <button
            className="bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
          <a
            className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800 cursor-pointer"
            onClick={onFlip}
          >
            Don't have an account? Register
          </a>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
