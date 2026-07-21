import Link from "next/link";
import { Heart, Mail, ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full mt-auto border-t border-white/20 bg-gradient-to-r from-blue-50 via-white to-cyan-50 backdrop-blur-xl">

      <div className="max-w-7xl mx-auto px-8 py-14">

        <div className="grid md:grid-cols-4 gap-12">

          {/* Logo */}

          <div>

            <div className="flex items-center gap-3 mb-5">

              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg">

                <Heart className="text-white" size={20}/>

              </div>

              <div>

                <h2 className="font-black text-2xl text-slate-800">

                  MedAssist

                  <span className="text-blue-600"> AI</span>

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

            <h3 className="font-bold text-slate-800 mb-5">

              Product

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

            <h3 className="font-bold text-slate-800 mb-5">

              Company

            </h3>

            <div className="space-y-3">

              <Link href="/settings" className="block text-slate-500 hover:text-blue-600 transition">

                Settings

              </Link>

              <Link href="/settings" className="block text-slate-500 hover:text-blue-600 transition">

                Privacy

              </Link>

              <Link href="/settings" className="block text-slate-500 hover:text-blue-600 transition">

                About

              </Link>

            </div>

          </div>

          {/* Contact */}

          <div>

            <h3 className="font-bold text-slate-800 mb-5">

              Contact

            </h3>

            <div className="space-y-4">

              <div className="flex items-center gap-3">

                <Mail className="text-blue-600" size={18}/>

                <span className="text-slate-600">

                  support@medassist.ai

                </span>

              </div>

            </div>

          </div>

        </div>

        {/* Bottom */}

        <div className="border-t border-slate-200 mt-10 pt-6">

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