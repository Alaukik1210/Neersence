"use client";

import { div } from 'framer-motion/client';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/lib/auth_context';
import { useRouter } from 'next/navigation';

const GlassyNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleAuthClick = () => {
    if (user) {
      setIsProfileMenuOpen(!isProfileMenuOpen);
    } else {
      router.push('/signup');
    }
  };

  const handleLogout = async () => {
    await logout();
    setIsProfileMenuOpen(false);
    router.push('/');
  };

  return (
    <div className='fixed top-4 w-full z-50'>
      {/* Auth/Profile Button */}
      <div className="fixed top-12 right-12 z-50">
        {user ? (
          <div className="relative">
            <div 
              className="hover:scale-105 cursor-pointer bg-white/10 backdrop-blur-sm border border-white/20 rounded-full p-3 transition-all duration-300"
              onClick={handleAuthClick}
            >
              <div className="flex items-center space-x-2">
                <Image
                  src="/auth.svg"
                  alt="Profile"
                  width={30}
                  height={30}
                  className="object-cover"
                />
                <span className="text-white text-sm font-medium">
                  {user.role === 'RESEARCHER' ? 'Researcher' : 'Non-Technical'}
                </span>
              </div>
            </div>
            
            {/* Profile Dropdown Menu */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-xl">
                <div className="py-2">
                  <div className="px-4 py-2 border-b border-white/20">
                    <p className="text-white font-medium">{user.name}</p>
                    <p className="text-white/70 text-sm">{user.email}</p>
                    <p className="text-white/60 text-xs mt-1">
                      {user.role === 'RESEARCHER' ? 'Researcher' : 'Non-Technical User'}
                    </p>
                  </div>
                  <Link 
                    href="/profile" 
                    className="block px-4 py-2 text-white hover:bg-white/10 transition-colors duration-200"
                    onClick={() => setIsProfileMenuOpen(false)}
                  >
                    Profile Settings
                  </Link>
                  <Link 
                    href="/dashboard" 
                    className="block px-4 py-2 text-white hover:bg-white/10 transition-colors duration-200"
                    onClick={() => setIsProfileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-white hover:bg-red-500/20 transition-colors duration-200"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div 
            className="hover:scale-105 cursor-pointer transition-all duration-300"
            onClick={handleAuthClick}
          >
            <Image
              src="/auth.svg"
              alt="Sign Up"
              width={50}
              height={50}
              className="object-cover"
            />
          </div>
        )}
      </div>

      <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-11/12 max-w-3xl mt-4">
        <div className="backdrop-blur-2xl bg-white/5 border border-white/20 rounded-full px-6 py-3 sm:px-8 sm:py-4 shadow-xl">
          <div className="flex items-center justify-between">
            {/* Logo - Mobile */}
            <div className="md:hidden">
              <Image
                src="/logo.png"
                alt="Logo"
                width={40}
                height={40}
                className="rounded-full"
              />
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-4 lg:space-x-8 w-full justify-between">
              <Image
                src="/logo.png"
                alt="Logo"
                width={50}
                height={50}
                className="rounded-full"
              />
              <div className="flex items-center space-x-6 lg:space-x-8">
                <Link 
                  href="/" 
                  className="text-white hover:text-white/80 transition-all duration-300 font-medium text-base lg:text-lg hover:scale-105 px-4 py-2 rounded-full hover:bg-white/10"
                >
                  Home
                </Link>
                <Link 
                  href="/floatchat" 
                  className="text-white hover:text-white/80 transition-all duration-300 font-medium text-base lg:text-lg hover:scale-105 px-4 py-2 rounded-full hover:bg-white/10"
                >
                  FloatChat
                </Link>
                <Link 
                  href="/dashboard" 
                  className="text-white hover:text-white/80 transition-all duration-300 font-medium text-base lg:text-lg hover:scale-105 px-4 py-2 rounded-full hover:bg-white/10"
                >
                  Dashboard
                </Link>
                
                <Link 
                  href="/map" 
                  className="text-white hover:text-white/80 transition-all duration-300 font-medium text-base lg:text-lg hover:scale-105 px-4 py-2 rounded-full hover:bg-white/10"
                >
                  Map
                </Link>
                <Link 
                  href="/about" 
                  className="text-white hover:text-white/80 transition-all duration-300 font-medium text-base lg:text-lg hover:scale-105 px-4 py-2 rounded-full hover:bg-white/10"
                >
                  About
                </Link>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-white hover:text-white/80 transition-colors duration-300 p-2 rounded-full hover:bg-white/10"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Navigation Menu */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 pt-4 border-t border-white/20">
              <div className="flex flex-col space-y-2">
                <Link 
                  href="/" 
                  className="text-white hover:text-white/80 transition-all duration-300 font-medium text-lg px-4 py-3 rounded-full hover:bg-white/10"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Home
                </Link>
                <Link 
                  href="/floatchat" 
                  className="text-white hover:text-white/80 transition-all duration-300 font-medium text-lg px-4 py-3 rounded-full hover:bg-white/10"
                  onClick={() => setIsMenuOpen(false)}
                >
                  FloatChat
                </Link>
                <Link 
                  href="/dashboard" 
                  className="text-white hover:text-white/80 transition-all duration-300 font-medium text-lg px-4 py-3 rounded-full hover:bg-white/10"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link 
                  href="/map" 
                  className="text-white hover:text-white/80 transition-all duration-300 font-medium text-lg px-4 py-3 rounded-full hover:bg-white/10"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Map
                </Link>
                <Link 
                  href="/about" 
                  className="text-white hover:text-white/80 transition-all duration-300 font-medium text-lg px-4 py-3 rounded-full hover:bg-white/10"
                  onClick={() => setIsMenuOpen(false)}
                >
                  About
                </Link>
                
                
                {/* Mobile Auth Section */}
                <div className="border-t border-white/20 pt-2">
                  {user ? (
                    <div className="px-4 py-2">
                      <p className="text-white font-medium">{user.name}</p>
                      <p className="text-white/70 text-sm">{user.role === 'RESEARCHER' ? 'Researcher' : 'Non-Technical'}</p>
                      <button 
                        onClick={handleLogout}
                        className="mt-2 text-white/80 hover:text-white text-sm"
                      >
                        Logout
                      </button>
                    </div>
                  ) : (
                    <Link 
                      href="/signup" 
                      className="text-white hover:text-white/80 transition-all duration-300 font-medium text-lg px-4 py-3 rounded-full hover:bg-white/10"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Sign Up
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
    </div>
  );
};

export default GlassyNavbar;