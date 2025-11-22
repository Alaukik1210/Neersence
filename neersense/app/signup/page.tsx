// app/signup/page.tsx
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth_context';
import GlassyNavbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'RESEARCHER' | 'NON_TECHNICAL'>('NON_TECHNICAL');
  const [error, setError] = useState('');
  const { signup, loading } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    const success = await signup(email, password, name, role);
    if (success) {
      router.push('/dashboard');
    } else {
      setError('Failed to create account. Please try again.');
    }
  };

  return (
    <div className="font-bounded">
      <GlassyNavbar/>
      <div className="min-h-screen w-full flex items-center justify-center bg-primary3 py-12 px-4 sm:px-6 lg:px-8">
        <div className=" w-1/3 space-y-8">
          <div>
            <h2 className="text-center text-5xl font-unbounded font-bold text-white mb-12">
              Sign Up
            </h2>
          </div>
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-full text-sm text-center">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="w-full px-6 py-4 rounded-full bg-white text-gray-800 placeholder-gray-500 border-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              
              <div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full px-6 py-4 rounded-full bg-white text-gray-800 placeholder-gray-500 border-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              
              <div className="flex space-x-3">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="flex-1 px-6 py-4 rounded-full bg-white text-gray-800 placeholder-gray-500 border-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                
                <select
                  id="role"
                  name="role"
                  className="px-6 py-4 rounded-full bg-white text-gray-800 border-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-w-[100px]"
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'RESEARCHER' | 'NON_TECHNICAL')}
                >
                  
                  <option value="NON_TECHNICAL">Non-Technical</option>
                  <option value="RESEARCHER">Researcher</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex justify-center">
              <button
                type="submit"
                disabled={loading}
                className="w-1/2 flex justify-center cursor-pointer py-4 px-6 rounded-full bg-white text-gray-800 font-semibold text-sm hover:bg-primary3 hover:text-white hover:border-2 hover:border-white border-2 border-primary3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'CREATING ACCOUNT...' : 'SIGN UP'}
              </button>
            </div>

            <div className="text-center pt-4">
              <div className="text-white text-sm hover:text-gray-300 transition-colors">
                  Already an existing user? <span><Link 
                href="/login" 
                className="text-primary2 text-sm hover:text-gray-300 transition-colors"
              >
                Login
              </Link></span>
              </div>
              
            </div>
          </form>
        </div>
      </div>
      <Footer/>
    </div>
  );
}