"use client";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { motion, useScroll } from "framer-motion";
import { BarChart2, Download, Filter, Layout, Map, MessageSquare } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link"

import { ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation";

export default function Home() {
  const [backgroundColor, setBackgroundColor] = useState("bg-primary1");
  const router = useRouter();

  const { scrollY } = useScroll();

  useEffect(() => {
    const updateBackgroundColor = () => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      
      // Get the positions of the trigger elements by ID
      const secondElement = document.getElementById("second");
      const thirdElement = document.getElementById("third");
      const forthElement = document.getElementById("forth");
      const offset = 500;
      if (secondElement && thirdElement && forthElement) {
        const secondTop = secondElement.offsetTop - windowHeight / 2 + offset;
        const thirdTop = thirdElement.offsetTop - windowHeight / 2 + offset;
        const forthTop = forthElement.offsetTop - windowHeight / 2 + offset;
        
        if (scrollPosition >= forthTop) {
          setBackgroundColor("bg-primary4");
        } else if (scrollPosition >= thirdTop) {
          setBackgroundColor("bg-primary3");
        } else if (scrollPosition >= secondTop) {
          setBackgroundColor("bg-primary2");
        } else {
          setBackgroundColor("bg-primary1");
        }
      }
    };

    // Initial call
    updateBackgroundColor();
    
    // Add scroll listener
    window.addEventListener("scroll", updateBackgroundColor);
    
    // Cleanup
    return () => window.removeEventListener("scroll", updateBackgroundColor);
  }, []);

  const features = [
    {
  icon: <MessageSquare className="w-6 h-6 text-yellow-400" />,
  title: "AI Chatbot",
  desc: "Ask questions in plain language and get instant, reliable answers powered by real-time ocean data. The chatbot eliminates technical barriers, helping researchers, students, and enthusiasts explore complex datasets with ease. No coding skills or prior expertise required. It continuously learns from user interactions to improve accuracy. Designed to save time while making complex information more approachable.",
},
{
  icon: <Map className="w-6 h-6 text-yellow-400" />,
  title: "Interactive Maps",
  desc: "Explore dynamic maps that bring ocean data to life. Visualize float locations, track their movement over time, and uncover geospatial patterns across global waters. Navigate seamlessly between zoomed-in local areas and a comprehensive world view for better insights. Interactive overlays provide context like temperature gradients and salinity levels. This makes it easy to spot trends and anomalies at a glance.",
},
{
  icon: <Layout className="w-6 h-6 text-yellow-400" />,
  title: "Dual Mode Interface",
  desc: "Easily switch between simplified and expert modes depending on your needs. Beginners can use a clean, guided interface for quick results, while advanced users gain access to detailed analytics, customization options, and advanced scientific tools. The flexibility ensures inclusivity across all experience levels. Each mode is optimized for clarity, efficiency, and ease of use. It adapts seamlessly to support evolving research goals.",
},
{
  icon: <BarChart2 className="w-6 h-6 text-yellow-400" />,
  title: "Data Visualization",
  desc: "Transform raw data into easy-to-understand visuals. Access interactive charts and graphs that display temperature, salinity, and pressure profiles, enabling deeper understanding of ocean conditions. Compare datasets side-by-side for advanced scientific analysis. Visual tools are optimized for clarity, even with large datasets. This makes sharing insights with peers and stakeholders simple and impactful.",
},
{
  icon: <Filter className="w-6 h-6 text-yellow-400" />,
  title: "Advanced Filtering",
  desc: "Quickly refine large datasets to focus only on the information that matters. Filter data by time, depth, geographic region, or float ID. This precision saves time and ensures you can extract the most relevant insights for your research or projects. Filters can be combined for powerful, layered exploration. The system is built to handle complexity without overwhelming the user.",
},
{
  icon: <Download className="w-6 h-6 text-yellow-400" />,
  title: "Data Export",
  desc: "Export oceanographic datasets in ready-to-use formats for further research, analysis, or teaching. Whether you’re preparing a scientific paper, classroom presentation, or project report, the export feature ensures you always have access to clean, structured data. Multiple formats like CSV and JSON are supported for maximum flexibility. The process is quick and reliable, even with large datasets. Sharing data with colleagues or integrating into workflows is seamless.",
},

  ];

  return (
    <motion.div 
      className={`${backgroundColor} transition-colors duration-1000 ease-in-out overflow-hidden`}
      initial={{ backgroundColor: "var(--primary1)" }}
      animate={{ 
        backgroundColor: backgroundColor === "bg-primary1" ? "var(--primary1)" : 
                        backgroundColor === "bg-primary2" ? "var(--primary2)" :
                        backgroundColor === "bg-primary3" ? "var(--primary3)" : "var(--primary4)"
      }}
      transition={{ duration: 1, ease: "easeInOut" }}
    >
      <Navbar />
      
      <Image
        src="/svg-border-1.svg"
        alt="Hero Image"
        objectFit="cover"
        className="right-1 absolute top-0 md:block hidden "
        width={500}
        height={500}
      />
      <div className="flex justify-center pt-40 md:pt-60 lg:pt-96">
        <Image
          src="/name.svg"
          alt="Hero Image"
          className="object-cover w-[80%] md:w-[60%] lg:w-[700px] h-auto"
          width={700}
          height={700}
          priority
        />
      </div>

      <div id="first" className="flex justify-center items-center px-4 pb-8 md:pb-0">
        <h2 className="text-base md:text-lg lg:text-xl w-full md:w-3/4 lg:w-1/2 text-primary2 pt-6 md:pt-8 lg:pt-12 text-center">
          Explore oceanographic data from thousands of autonomous ARGO floats
          worldwide. Discover temperature, salinity, and pressure{" "}
         
            profiles with AI-powered natural language queries.
          
        </h2>
      </div>
<div className="font-unbounded relative w-full overflow-x-visible">
  {/* Decorative rotated background */}
  <div className="hidden lg:block bg-[url('/bgx.png')]  transform rotate-8 bg-no-repeat scale-115 h-[100vh] w-[500px] absolute top-[80px] -left-10"></div>
  

   <div
    id="second"
    className="h-auto md:h-screen w-full flex justify-center items-center px-4 md:px-8 lg:px-20 mt-8 md:mt-0"
  >
    <motion.div
      className="flex flex-col justify-center items-center w-full max-w-[1200px] bg-primary2 rounded-[2rem] sm:rounded-[5rem] overflow-visible"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: false, amount: 0.3 }}
    >
      {/* Globe Image */}
      <Image
        src="/globe_frame.svg"
        alt="Globe Frame"
        width={1800}
        height={1000}
        className="rounded-[2rem] z-2 sm:rounded-[5rem] object-contain w-full h-auto"
        priority
      />

      {/* Text + Button overlay naturally below image */}
      <div className="flex flex-col z-4 sm:flex-row justify-center items-center text-center sm:text-left mt-[-30%] sm:mt-[-15%] px-4 sm:px-8">
        <h1 className="text-primary3 text-3xl sm:text-4xl lg:text-[70px] font-bold">
          Geospatial Analysis
        </h1>
        <Link href="/map">
          
            <ArrowRight className="h-10 w-10 sm:h-20 sm:w-20 lg:h-40 lg:w-20 cursor-pointer hover:bg-primary2 mt-6 sm:mt-0 sm:ml-6 bg-primary2 transition-transform duration-300 transform hover:scale-110" />
         
        </Link>
      </div>
    </motion.div>
  </div>
</div>





      <div className="w-full flex flex-col lg:flex-row justify-center items-start gap-12 px-4 lg:px-20">
  {/* Blue Frame Section */}
  <motion.div
    className="relative w-full lg:w-4/12 flex flex-col items-center rounded-[3rem] lg:rounded-[5rem] mt-8 md:mt-0"
    initial={{ opacity: 0, x: -100 }}
    whileInView={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.8 }}
    viewport={{ once: false, amount: 0.3 }}
  >
    <div className="w-full h-[30rem] sm:h-[36rem] md:h-[40rem] lg:h-[48rem] flex flex-col justify-start items-center text-center px-4 sm:px-6 md:px-8 pt-6 sm:pt-8 md:pt-10 lg:pt-12">
      {/* Frame Image */}
      <Image
        src="/blue_frame.svg"
        alt="Blue Frame"
        fill
        className="object-cover rounded-[3rem] lg:rounded-[5rem]"
        priority
      />

      {/* Text on Top */}
      <div className="z-10 w-full flex flex-col items-center text-center">
        <p className="text-primary3 text-sm sm:text-base md:text-lg lg:text-xl lg:pt-12">
          Dive deep into oceanographic insights with AI. Our platform cleans and processes millions of float observations, transforming raw measurements into meaningful knowledge. Track temperature and salinity changes, compare cycles, and uncover hidden trends beneath the surface.
        </p>

        {/* Decorative Image */}
        <div className="mt-auto -mb-16 lg:-mb-24">
          <Image
            src="/wave.png"
            alt="Wave"
            width={350}
            height={150}
            className="scale-x-[-1] absolute -bottom-28 -left-32 hidden md:block"
            priority
          />
        </div>
      </div>
    </div>
  </motion.div>

  {/* Yellow Frame Section */}
  <motion.div
  id="third"
    className="relative w-full lg:w-4/12 flex flex-col items-center rounded-[3rem] lg:rounded-[5rem]"
    initial={{ opacity: 0, x: 100 }}
    whileInView={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.8 }}
    viewport={{ once: false, amount: 0.3 }}
  >
    <div className="w-full h-[30rem] sm:h-[36rem] md:h-[40rem] lg:h-[48rem] flex flex-col justify-end items-center text-center px-4 sm:px-6 md:px-8 pb-6 sm:pb-8 md:pb-10 lg:pb-12">
      {/* Frame Image */}
      <Image
        src="/yellow_frame.svg"
        alt="Yellow Frame"
        fill
        className="object-cover rounded-[3rem] lg:rounded-[5rem]"
        priority
      />

      {/* Text on Bottom */}
      <div className="z-10 w-full flex flex-col items-center text-center">
        <p className="text-primary3 text-sm sm:text-base md:text-lg lg:text-xl">
          From researchers to students, anyone can explore ocean data seamlessly. Switch between expert-friendly parameters or simplified summaries, and let AI explain complex datasets in clear language with context-rich visuals.
        </p>

        {/* Decorative Image */}
        <div className="-mt-16 lg:-mt-24 hidden md:block absolute lg:top-0 -right-32">
          <Image
            src="/y-ship.png"
            alt="Submarine"
            width={320}
            height={120}
            priority
          />
        </div>
      </div>
    </div>
  </motion.div>
</div>



      <div className="">
  {/* Top Section with Satellite */}
  <motion.div 
    className="h-auto w-full lg:h-2/3 lg:w-2/3 bg-primary3 mx-4 lg:mx-80 mt-12 rounded-3xl lg:rounded-[5rem] flex flex-col items-center justify-center"
    initial={{ opacity: 0, scale: 0.8 }}
    whileInView={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.8 }}
    viewport={{ once: false, amount: 0.3 }}
  >
    <div className="flex justify-center lg:justify-end items-start p-4 w-full">
      <Image
        src="/sattelite.png"
        alt="Satellite"
        width={320}
        height={180}
        className="w-48 sm:w-72 md:w-96 lg:w-[420px] h-auto"
        priority
      />
    </div>
    <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-[80px] font-unbounded mx-4 lg:mx-12 text-center pb-6 lg:pb-12 text-primary2 w-full">
      Get Started with AI powered ocean data
    </h1>
  </motion.div>


  {/* Features Section (forth) */}
  <div  className="mx-4 lg:mx-80 mt-20 lg:mt-40">
    {/* Card 1 */}
    <motion.div 
     id="forth"
      className="bg-[url('/1.svg')] bg-white bg-no-repeat bg-right bg-contain p-4 m-4 my-8 rounded-2xl lg:rounded-[3rem] px-6 sm:px-10 lg:px-16 text-black h-auto lg:h-[200px]"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      viewport={{ once: false, amount: 0.3 }}
    >
      <div className="flex gap-4 sm:gap-8 lg:gap-12 items-center">
        <Image src="/box.svg" alt="Natural Language Queries" width={30} height={30} className="sm:w-10 sm:h-10" />
        <div className="text-lg sm:text-2xl lg:text-3xl text-[#093C63] font-bold">
          Natural Language Queries
        </div>
      </div>
      <div className="mt-4 sm:mt-6 lg:mt-8 w-full lg:w-2/3 text-sm sm:text-lg lg:text-2xl ml-0 lg:ml-20 font-medium text-[#093C63]">
        Type a question like “Show me salinity near the Indian coastline in 2020” and get instant, accurate results—no SQL or coding required.
      </div>
    </motion.div>

    {/* Card 2 */}
    <motion.div 
      className="bg-[url('/2.png')] bg-white bg-no-repeat bg-right bg-contain p-4 m-4 my-8 rounded-2xl lg:rounded-[3rem] px-6 sm:px-10 lg:px-16 text-black h-auto lg:h-[200px]"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      viewport={{ once: false, amount: 0.3 }}
    >
      <div className="flex gap-4 sm:gap-8 lg:gap-12 items-center">
        <Image src="/ai-model.svg" alt="Expert Modes" width={30} height={30} className="sm:w-10 sm:h-10" />
        <div className="text-lg sm:text-2xl lg:text-3xl text-[#093C63] font-bold">
          Expert & Non-Expert Modes
        </div>
      </div>
      <div className="mt-4 sm:mt-6 lg:mt-8 w-full lg:w-2/3 text-sm sm:text-lg lg:text-2xl ml-0 lg:ml-20 font-medium text-[#093C63]">
        Advanced users can access core parameters, BGC data, and detailed profiles, while non-experts receive simplified summaries for easy understanding.
      </div>
    </motion.div>

    {/* Card 3 */}
    <motion.div 
      className="bg-[url('/3.png')] bg-white bg-no-repeat bg-right bg-contain p-4 m-4 my-8 rounded-2xl lg:rounded-[3rem] px-6 sm:px-10 lg:px-16 text-black h-auto lg:h-[200px]"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      viewport={{ once: false, amount: 0.3 }}
    >
      <div className="flex gap-4 sm:gap-8 lg:gap-12 items-center">
        <Image src="/search.png" alt="Visual Insights" width={30} height={30} className="sm:w-10 sm:h-10" />
        <div className="text-lg sm:text-2xl lg:text-3xl text-[#093C63] font-bold">
          Visual Insights
        </div>
      </div>
      <div className="mt-4 sm:mt-6 lg:mt-8 w-full lg:w-2/3 text-sm sm:text-lg lg:text-2xl ml-0 lg:ml-20 font-medium text-[#093C63]">
        Explore interactive graphs, profiles, and geospatial maps that bring the hidden layers of the ocean to life.
      </div>
    </motion.div>

    {/* Button */}
    <div className="flex justify-center">
      <motion.button 
        className="font-bold text-lg sm:text-xl lg:text-2xl cursor-pointer bg-white rounded-full text-primary3 hover:bg-primary3 hover:text-primary2 transition duration-300 m-4 px-6 sm:px-8 py-3"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => router.push("/floatchat")}
      >
        Try the FloatChat
      </motion.button>
    </div>
  </div>

  {/* Platform Features */}
  <div  className="mx-4 lg:mx-80 mt-20 lg:mt-40 h-auto lg:h-[180vh]">
    <motion.div 
   
      className="h-auto lg:h-[60vh] bg-primary4 rounded-3xl lg:rounded-[5rem] flex flex-col items-center justify-center p-6 lg:p-10"
      initial={{ opacity: 0, y: 100 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: false, amount: 0.3 }}
    >
      <Image
        src="/platform.png"
        alt="Platform"
        width={280}
        height={150}
        className="w-48 sm:w-72 md:w-96 lg:w-[420px] h-auto"
        priority
      />
      <div className="pb-6 lg:pb-12 text-center text-white">
        <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-[80px] text-primary3 font-unbounded">
          Platform Features
        </h2>
      </div>
    </motion.div>

    {/* Grid Features */}
    <div className="py-8 lg:py-12">
      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 w-full">
        {features.map((f, i) => (
          <motion.div
            key={i}
            className="bg-[#093C63] p-4 sm:p-6 rounded-2xl lg:rounded-4xl w-full lg:w-[600px] shadow-lg h-auto lg:h-[300px]"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            viewport={{ once: false, amount: 0.3 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-3">
              {f.icon}
              <h3 className="text-white font-semibold text-base sm:text-lg">{f.title}</h3>
            </div>
            <p className="text-gray-300 text-sm sm:text-md mt-4 sm:mt-6 leading-relaxed">
              {f.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  </div>

  <Footer />
</div>
    </motion.div>
  );
}