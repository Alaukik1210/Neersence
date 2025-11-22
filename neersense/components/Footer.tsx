import Image from "next/image";
import React from "react";

const Footer = () => {
  return (
    <footer className="bg-white w-full py-12 px-6 md:px-12 lg:px-20 flex flex-col md:flex-row justify-between items-center gap-8 md:gap-0">
      {/* Left Side */}
      <div className="flex flex-col items-center md:items-start gap-6">
        <Image
          src="/logo_black.svg"
          alt="Platform"
          width={140}
          height={40}
          priority
        />

        <Image
          src="/NeerSense.svg"
          alt="Platform"
          width={280} // smaller on mobile
          height={150}
          priority
        />
      </div>

      {/* Right Side */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-12 text-black font-light">
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
          <a href="#" className="hover:text-gray-700 transition-colors">FloatChat</a>
          <a href="#" className="hover:text-gray-700 transition-colors">Dashboard</a>
          <a href="#" className="hover:text-gray-700 transition-colors">About</a>
        </div>

        {/* Circle Group */}
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <span className="w-3 h-3 rounded-full bg-[#0D1B2A]"></span>
          <span className="w-3 h-3 rounded-full bg-[#000000]"></span>
          <span className="w-3 h-3 rounded-full bg-[#415A77]"></span>
          <span className="w-3 h-3 rounded-full bg-[#1B9AAA]"></span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
