import Link from "next/link";
import { Heart, Mail, ShieldCheck } from "lucide-react";
import { FaGithub, FaLinkedin } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="w-full border-t border-white/20 bg-gradient-to-r from-blue-50 via-white to-cyan-50 backdrop-blur-xl mt-16">

      <div className="max-w-7xl mx-auto px-8 pt-14 pb-28">

        <div className="grid md:grid-cols-4 gap-12">

          {/* Logo */}

          <div>

            <div className="flex items-center gap-3 mb-5">

              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg">

                <Heart className="text-white" size={20}/>

              </div>

              <div>

              <h2 className="font-black text-2xl">
  <span className="bg-gradient-to-r from-[#2563EB] to-[#06B6D4] bg-clip-text text-transparent">
    MedAssist
  </span>
</h2>

                <p className="text-xs text-slate-500">

                  AI Medication Assistant

                </p>

              </div>

            </div>

            <p className="text-sm text-slate-600 leading-7">

              Your AI-powered conversational medication & health literacy assistant.
              Scan prescriptions, understand medicines and never miss a dose.

            </p>

          </div>

          {/* Product */}

          <div>

            <h3 className="font-bold mb-5">
  <span className="bg-gradient-to-r from-[#2563EB] to-[#06B6D4] bg-clip-text text-transparent">
              Product
           </span>
            </h3>

            <div className="space-y-3">

              <Link href="/chat" className="block text-slate-500 hover:text-blue-600 transition">

                AI Chat

              </Link>

              <Link href="/prescription" className="block text-slate-500 hover:text-blue-600 transition">

                Prescription Scanner

              </Link>

              <Link href="/medications" className="block text-slate-500 hover:text-blue-600 transition">

                My Medications

              </Link>

              <Link href="/reports" className="block text-slate-500 hover:text-blue-600 transition">

                Reports

              </Link>

            </div>

          </div>

          {/* Company */}

          <div>

            <h3 className="font-bold mb-5">
            <span className="bg-gradient-to-r from-[#2563EB] to-[#06B6D4] bg-clip-text text-transparent">
          
              Company
             </span>
            </h3>

            <div className="space-y-3">

              <Link href="/settings" className="block text-slate-500 hover:text-blue-600 transition">

                Settings

              </Link>

              <Link href="/privacy" className="block text-slate-500 hover:text-blue-600 transition">

                Privacy

              </Link>

              <Link href="/about" className="block text-slate-500 hover:text-blue-600 transition">

                About

              </Link>

            </div>

          </div>

          {/* Contact */}

          <div>

            <h3 className="font-bold mb-5">
                <span className="bg-gradient-to-r from-[#2563EB] to-[#06B6D4] bg-clip-text text-transparent">
              Contact
             </span>
            </h3>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="text-blue-600" size={18}/>
                <Link href="/contact" className="block text-slate-500 hover:text-blue-600 transition">
                support@medassist.ai
              </Link>
              </div>
            </div>

  {/* GitHub */}
<div className="flex items-center gap-3">
  <FaGithub className="text-slate-800 text-lg" />
  <Link
    href="https://github.com/yourusername"
    target="_blank"
    className="text-slate-500 hover:text-blue-600 transition"
  >
    GitHub
  </Link>
</div>

{/* LinkedIn */}
<div className="flex items-center gap-3">
  <FaLinkedin className="text-blue-700 text-lg" />
  <Link
    href="https://www.linkedin.com/in/aeman-imtiaz02"
    target="_blank"
    className="text-slate-500 hover:text-blue-600 transition"
  >
    LinkedIn
  </Link>
</div>

  </div>
</div>

        {/* Bottom */}

        <div className="border-t border-slate-200 mt-16 pt-8">

          <div className="flex flex-col md:flex-row justify-between items-center gap-4">

            <div className="flex items-center gap-2 text-sm text-slate-500">

              <ShieldCheck
                size={18}
                className="text-green-500"
              />

              <span>

                This AI provides educational guidance only and is not a substitute
                for professional medical advice.

              </span>

            </div>

            <div className="text-sm text-slate-500">

              © 2026 MedAssist AI • Built with ❤️ using AI

            </div>

          </div>

        </div>

      </div>

    </footer>
  );
}