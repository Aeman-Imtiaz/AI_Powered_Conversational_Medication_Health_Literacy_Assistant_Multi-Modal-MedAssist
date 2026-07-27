"use client";

import { motion } from "framer-motion";
import {
  ShieldCheck,
  Lock,
  Database,
  Eye,
  Bot,
  Globe,
  UserCheck,
  Mail,
  FileText,
} from "lucide-react";
import Footer from "../components/Footer";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-cyan-50 px-6 py-12">
      <div className="max-w-6xl mx-auto">

        {/* Header */}

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-14"
        >
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center mx-auto shadow-xl mb-6">
            <ShieldCheck className="text-white" size={34}/>
          </div>

          <h1 className="text-5xl font-black text-slate-900">
            
              <span className="bg-gradient-to-r from-[#2563EB] to-[#06B6D4] bg-clip-text text-transparent"> Privacy  Policy</span>
          </h1>

          <p className="text-slate-600 mt-6 max-w-3xl mx-auto leading-8">
            Your privacy is important to us. This page explains how
            MedAssist AI collects, stores, and protects your personal
            information.
          </p>

        </motion.div>

        <div className="grid gap-8">

          {/* Information */}

          <section className="bg-white rounded-3xl shadow-lg p-8">

            <div className="flex items-center gap-3 mb-5">

              <Database className="text-blue-600"/>

              <h2 className="text-2xl font-bold">
                Information We Collect
              </h2>

            </div>

            <ul className="space-y-3 text-slate-600">

              <li>• Name</li>
              <li>• Email Address</li>
              <li>• Medication List</li>
              <li>• Reminder Preferences</li>
              <li>• Weekly Reports</li>
              <li>• Language Preferences</li>

            </ul>

          </section>

          {/* Security */}

          <section className="bg-white rounded-3xl shadow-lg p-8">

            <div className="flex items-center gap-3 mb-5">

              <Lock className="text-green-600"/>

              <h2 className="text-2xl font-bold">
                Data Security
              </h2>

            </div>

            <p className="text-slate-600 leading-8">

              All user accounts are secured using Firebase Authentication.
              Your medication data is stored securely in Firebase Firestore.
              Communication with our servers is encrypted using HTTPS.

            </p>

          </section>

          {/* AI */}

          <section className="bg-white rounded-3xl shadow-lg p-8">

            <div className="flex items-center gap-3 mb-5">

              <Bot className="text-purple-600"/>

              <h2 className="text-2xl font-bold">
                AI Usage
              </h2>

            </div>

            <p className="text-slate-600 leading-8">

              AI responses are generated to provide educational guidance.
              They should never replace professional medical advice,
              diagnosis, or treatment.

            </p>

          </section>

          {/* Sharing */}

          <section className="bg-white rounded-3xl shadow-lg p-8">

            <div className="flex items-center gap-3 mb-5">

              <Eye className="text-cyan-600"/>

              <h2 className="text-2xl font-bold">
                Data Sharing
              </h2>

            </div>

            <p className="text-slate-600 leading-8">

              We do not sell your personal information. Your information
              is only used to improve your MedAssist AI experience.

            </p>

          </section>

          {/* Rights */}

          <section className="bg-white rounded-3xl shadow-lg p-8">

            <div className="flex items-center gap-3 mb-5">

              <UserCheck className="text-orange-500"/>

              <h2 className="text-2xl font-bold">
                Your Rights
              </h2>

            </div>

            <ul className="space-y-3 text-slate-600">

              <li>• Access your data</li>
              <li>• Update your profile</li>
              <li>• Delete your account</li>
              <li>• Delete medication history</li>

            </ul>

          </section>

          {/* Languages */}

          <section className="bg-white rounded-3xl shadow-lg p-8">

            <div className="flex items-center gap-3 mb-5">

              <Globe className="text-blue-600"/>

              <h2 className="text-2xl font-bold">
                Supported Languages
              </h2>

            </div>

            <p className="text-slate-600">

              English • اردو • Roman Urdu

            </p>

          </section>

          {/* Contact */}

          <section className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-3xl p-10 text-white">

            <div className="flex items-center gap-3 mb-5">

              <Mail/>

              <h2 className="text-3xl font-bold">
                Questions?
              </h2>

            </div>

            <p className="leading-8">

              Contact us at

              <br/>

              <strong>support@medassist.ai</strong>

            </p>

          </section>

        </div>

      </div>
      <Footer/>
    </main>
  );
}