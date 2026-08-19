"use client";

import { motion } from "framer-motion";
import {
  Heart,
  ShieldCheck,
  Globe,
  Languages,
  Bot,
  Pill,
  Users,
  Stethoscope,
  Sparkles,
  CheckCircle2,
  Mic,
  MapPin,
} from "lucide-react";


export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-cyan-50 px-6 py-12">
      <div className="max-w-6xl mx-auto">

        {/* Hero */}

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-14"
        >
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-xl mb-6">
            <Heart className="text-white" size={34} />
          </div>

          <h1 className="text-5xl font-black text-slate-900">
            
              <span className="bg-gradient-to-r from-[#2563EB] to-[#06B6D4] bg-clip-text text-transparent">  About    MedAssist </span>
          </h1>

          <p className="text-slate-600 mt-6 max-w-3xl mx-auto leading-8">
            MedAssist AI is an AI-powered medication assistant developed to
            improve medication adherence, health literacy, and patient safety.
            The platform combines conversational AI, medication tracking,
            prescription scanning, and personalized health guidance in one
            simple application.
          </p>
        </motion.div>

        {/* Mission */}

        <div className="grid md:grid-cols-2 gap-8 mb-10">

          <div className="bg-white rounded-3xl shadow-lg p-8">

            <Sparkles className="text-blue-600 mb-5" size={34} />

            <h2 className="text-2xl font-bold mb-4">
              Our Mission
            </h2>

            <p className="text-slate-600 leading-8">
              Millions of patients miss medicines because instructions are
              difficult to understand or easy to forget. MedAssist AI helps
              people understand medications in simple language and stay
              consistent with their treatment.
            </p>

          </div>

          <div className="bg-white rounded-3xl shadow-lg p-8">

            <ShieldCheck
              className="text-green-600 mb-5"
              size={34}
            />

            <h2 className="text-2xl font-bold mb-4">
              Safe AI
            </h2>

            <p className="text-slate-600 leading-8">
              Our AI is designed to educate—not diagnose diseases or replace
              healthcare professionals. Every response encourages users to
              consult qualified medical professionals whenever necessary.
            </p>

          </div>

        </div>

        {/* Features */}

        <div className="bg-white rounded-3xl shadow-lg p-8 mb-10">

          <h2 className="text-3xl font-bold mb-8">
            What MedAssist AI Offers
          </h2>

          <div className="grid md:grid-cols-2 gap-6">

            {[
              "AI Medication Chat Assistant",
              "Voice Input & Spoken Replies",
              "Prescription Scanner (OCR)",
              "Medication Reminder & Tracking",
              "Weekly Adherence Reports",
              "Smart AI Nudges",
              "Nearby Pharmacy Finder",
              "Medicine Information",
              "Simple Language Responses",
              "Health Literacy Support",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3"
              >
                <CheckCircle2
                  className="text-green-500"
                  size={22}
                />
                <span>{item}</span>
              </div>
            ))}

          </div>

        </div>

        {/* New Features Spotlight */}

        <div className="grid md:grid-cols-2 gap-8 mb-10">

          <div className="bg-white rounded-3xl shadow-lg p-8">

            <Mic className="text-blue-600 mb-5" size={34} />

            <h2 className="text-2xl font-bold mb-4">
              Voice Medicine Assistant
            </h2>

            <p className="text-slate-600 leading-8">
              Don&apos;t feel like typing? Just speak your question — in
              English, Urdu, or Roman Urdu — and MedAssist replies out loud,
              right from the Chat page.
            </p>

          </div>

          <div className="bg-white rounded-3xl shadow-lg p-8">

            <MapPin className="text-red-500 mb-5" size={34} />

            <h2 className="text-2xl font-bold mb-4">
              Nearby Pharmacies
            </h2>

            <p className="text-slate-600 leading-8">
              Running low on a medicine? Find nearby pharmacies with
              directions and a call button in one tap. We&apos;re upfront that
              no service can show live stock — always call ahead to confirm.
            </p>

          </div>

        </div>

        {/* Languages */}

        <div className="bg-white rounded-3xl shadow-lg p-8 mb-10">

          <div className="flex items-center gap-3 mb-6">

            <Languages
              className="text-blue-600"
              size={32}
            />

            <h2 className="text-3xl font-bold">
              Multi-Language Support
            </h2>

          </div>

          <div className="grid md:grid-cols-3 gap-6">

            <div className="border rounded-2xl p-6">

              <Globe className="text-blue-600 mb-4"/>

              <h3 className="font-bold text-xl mb-2">
                English
              </h3>

              <p className="text-slate-600">
                Complete support for international medical terminology and
                medication information.
              </p>

            </div>

            <div className="border rounded-2xl p-6">

              <Languages className="text-green-600 mb-4"/>

              <h3 className="font-bold text-xl mb-2">
                اردو
              </h3>

              <p className="text-slate-600">
                مکمل اردو سپورٹ تاکہ ہر مریض اپنی دواؤں کو آسانی سے سمجھ سکے۔
              </p>

            </div>

            <div className="border rounded-2xl p-6">

              <Users className="text-cyan-600 mb-4"/>

              <h3 className="font-bold text-xl mb-2">
                Roman Urdu
              </h3>

              <p className="text-slate-600">
                Aasan Roman Urdu responses for users who prefer reading Urdu in
                English letters.
              </p>

            </div>

          </div>

        </div>

        {/* Technology */}

        <div className="bg-white rounded-3xl shadow-lg p-8 mb-10">

          <div className="flex items-center gap-3 mb-6">

            <Bot className="text-purple-600" size={32}/>

            <h2 className="text-3xl font-bold">
              Technology
            </h2>

          </div>

          <div className="grid md:grid-cols-4 gap-6">

            <div className="text-center">
              <Bot className="mx-auto text-blue-600 mb-3"/>
              <h3 className="font-bold">Gemini AI</h3>
            </div>

            <div className="text-center">
              <Pill className="mx-auto text-green-600 mb-3"/>
              <h3 className="font-bold">Medication Database</h3>
            </div>

            <div className="text-center">
              <Globe className="mx-auto text-cyan-600 mb-3"/>
              <h3 className="font-bold">Cloud Firebase</h3>
            </div>

            <div className="text-center">
              <Stethoscope className="mx-auto text-red-500 mb-3"/>
              <h3 className="font-bold">Health Guidance</h3>
            </div>

          </div>

        </div>

        {/* Disclaimer */}

        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-3xl p-10 text-white text-center">

          <ShieldCheck
            size={40}
            className="mx-auto mb-5"
          />

          <h2 className="text-3xl font-bold mb-4">
            Medical Disclaimer
          </h2>

          <p className="max-w-3xl mx-auto leading-8 text-blue-50">
            MedAssist AI provides educational and informational assistance only.
            It does not diagnose diseases, prescribe medicines, or replace
            licensed healthcare professionals. Always consult your doctor or
            pharmacist before making any medical decisions.
          </p>

        </div>

      </div>
      
    </main>
  );
}