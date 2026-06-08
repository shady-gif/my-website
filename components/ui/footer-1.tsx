import {
  FaLinkedin,
  FaInstagram,
  FaYoutube,
  FaReddit,
  FaFacebook,
} from "react-icons/fa";

export default function Footer1() {
  return (
    <footer className="w-full bg-[#EEEEEE] text-black">
      <div className="max-w-7xl mx-auto px-6 py-16 flex flex-col items-center">

        {/* Logo */}
        

        {/* Description */}
        <p className="text-center max-w-xl text-sm leading-relaxed">
          Building AI products, automations, websites and digital experiences
          that help businesses scale faster.
        </p>

        {/* Social Icons */}
        <div className="flex items-center gap-6 mt-8 text-2xl">
          <a href="https://linkedin.com" target="_blank" rel="noreferrer">
            <FaLinkedin />
          </a>

          <a href="https://instagram.com" target="_blank" rel="noreferrer">
            <FaInstagram />
          </a>

          <a href="https://youtube.com" target="_blank" rel="noreferrer">
            <FaYoutube />
          </a>

          <a href="https://reddit.com" target="_blank" rel="noreferrer">
            <FaReddit />
          </a>

          <a href="https://facebook.com" target="_blank" rel="noreferrer">
            <FaFacebook />
          </a>
        </div>

      </div>

      <div className="border-t border-[#3B1A7A]">
        <div className="max-w-7xl mx-auto px-6 py-6 text-center text-sm">
          Shadyy ©2025. All rights reserved.
        </div>
      </div>
    </footer>
  );
}