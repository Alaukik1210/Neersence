import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
const About = () => {
  return (
    <div className="bg-[#0F1727] width-full pt-30 h-full text-white">
      {/* NAVBAR */}
      <Navbar />
      
      <div className="bg-[#0F1727] w-[70%] h-16 flex items-center justify-center m-auto">
        <h1 className="h-full w-full text-[#F3F3F3] text-[55px] leading-none text-center py-1 font-[Unbounded]">
          About <span className="text-[#E7A31E]">ARGO </span>Explorer
        </h1>
      </div>

      <div className="w-[55%] m-auto bg-[#0F1727] mt-[10px]">
        <p className="text-center text-[#F3F3F3] text-sm">
          ARGO Explorer is a platform that brings the hidden world of the
          oceans to your screen. By combining ARGO float observations with
          AI-driven tools, we make oceanographic data more accessible,
          interactive, and insightful.
        </p>
      </div>

      {/* FEATURES */}
      <div className="w-[90%] mt-[45px] flex m-auto justify-evenly items-center">
        <div className="w-[20%] h-full flex justify-center flex-col items-center">
          <Image src="/img1.svg" width={4} height={4} alt="Ocean Science" className="w-[50px] h-[50px]" />
          <p className="mt-[18px] text-center font-[Plus Jakarta Sans] text-[#90C2E7] text-[16px]">
            Ocean Science
          </p>
          <p className="mt-[12px] text-center font-[Plus Jakarta Sans] text-[12px]">
            Dive into real measurements of temperature, salinity, and pressure
            collected by thousands of ARGO floats worldwide.
          </p>
        </div>

        <div className="w-[20%] h-full flex justify-center flex-col items-center">
          <Image src="/img2.svg" width={4} height={4} alt="Data Meets AI" className="w-[50px] h-[50px]" />
          <p className="mt-[18px] text-center font-[Plus Jakarta Sans] text-[#90C2E7] text-[16px]">
            Data Meets AI
          </p>
          <p className="mt-[12px] text-center font-[Plus Jakarta Sans] text-[12px]">
            Harness the power of natural language queries and advanced filtering
            to extract knowledge from complex ocean datasets.
          </p>
        </div>

        <div className="w-[20%] h-full flex justify-center flex-col items-center">
          <Image src="/img3.svg" width={4} height={4} alt="Global Impact" className="w-[50px] h-[50px]" />
          <p className="mt-[18px] text-center font-[Plus Jakarta Sans] text-[#90C2E7] text-[16px]">
            Global Impact
          </p>
          <p className="mt-[12px] text-center font-[Plus Jakarta Sans] text-[12px]">
            From climate research to marine navigation, ARGO Explorer empowers
            experts and non-experts alike with accessible insights.
          </p>
        </div>
      </div>

      {/* ARGO FLOATS INFO */}
      <div className="bg-[#0F1727] w-[60%] h-16 flex items-center justify-center m-auto mt-[190px] ">
        <h1 className="h-full w-full text-[#F3F3F3] text-[35px] leading-none text-center py-1 font-[Unbounded]">
          Understanding ARGO Floats
        </h1>
      </div>

      <div className="w-[55%] m-auto bg-[#0F1727]">
        <p className="text-center text-[#F3F3F3] font-[Plus Jakarta Sans] text-sm">
          ARGO floats are autonomous instruments that drift with ocean currents,
          dive to great depths, and surface to transmit data. They form the
          backbone of global ocean monitoring systems.
        </p>
      </div>

      {/* HOW IT WORKS */}
      <div className="mt-[60px]">
        <div className="bg-[#0F1727] w-[30%] h-16 flex items-center justify-center m-auto">
          <h1 className="h-full font-[Plus Jakarta Sans] w-full text-[#E7A31E] text-[20px] leading-none text-center py-1 font-[Unbounded]">
            How ARGO Floats Work
          </h1>
        </div>

        <div className="flex justify-evenly items-center w-[100%] p-8 gap-4">
          {/* Card #1 */}
          <div className="bg-white text-black p-6 rounded-3xl w-[22%] min-h-[300px]">
            <div className="mb-4">
              <p className="text-[30px] font-[Unbounded] font-medium text-black">
                #1
              </p>
              <h1 className="text-black text-[18px] font-[Plus Jakarta Sans] font-semibold">
                Deployment
              </h1>
            </div>
            <p className="text-[14px] font-[Plus Jakarta Sans] leading-relaxed">
              Floats are deployed from ships across the world’s oceans. Once
              released, they automatically begin their cycle of diving,
              drifting, and surfacing.
            </p>
          </div>

          {/* Card #2 */}
          <div className="bg-white text-black p-6 rounded-3xl w-[22%] min-h-[300px]">
            <div className="mb-4">
              <p className="text-[30px] font-[Unbounded] font-medium text-black">
                #2
              </p>
              <h1 className="text-black text-[18px] font-[Plus Jakarta Sans] font-semibold">
                Descent
              </h1>
            </div>
            <p className="text-[14px] font-[Plus Jakarta Sans] leading-relaxed">
              After deployment, floats sink to depths of up to 2000 meters,
              collecting measurements of pressure, temperature, and salinity as
              they go.
            </p>
          </div>

          {/* Card #3 */}
          <div className="bg-white text-black p-6 rounded-3xl w-[22%] min-h-[300px]">
            <div className="mb-4">
              <p className="text-[30px] font-[Unbounded] font-medium text-black">
                #3
              </p>
              <h1 className="text-black text-[18px] font-[Plus Jakarta Sans] font-semibold">
                Surface Communication
              </h1>
            </div>
            <p className="text-[14px] font-[Plus Jakarta Sans] leading-relaxed">
              Upon resurfacing, floats send collected data to satellites, which
              relay the information to global data centers for researchers
              worldwide.
            </p>
          </div>

          {/* Card #4 */}
          <div className="bg-white text-black p-6 rounded-3xl w-[22%] min-h-[300px]">
            <div className="mb-4">
              <p className="text-[30px] font-[Unbounded] font-medium text-black">
                #4
              </p>
              <h1 className="text-black text-[18px] font-[Plus Jakarta Sans] font-semibold">
                Cycle Repeat
              </h1>
            </div>
            <p className="text-[14px] font-[Plus Jakarta Sans] leading-relaxed">
              This cycle repeats approximately every 10 days, creating a
              continuous stream of data that maps the changing state of the
              world’s oceans.
            </p>
          </div>
        </div>
      </div>
        <Footer />
    </div>
  );
};

export default About;
