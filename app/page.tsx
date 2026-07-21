"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MessageCircle, Camera, Bell, Sparkles } from "lucide-react";
import Navbar from "./components/Navbar";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.12, ease: "easeOut" as const },
  }),
};

export default function WelcomePage() {
  return (
    <main className="relative min-h-screen bg-gradient-to-b from-[#EFF6FF] via-white to-white overflow-hidden">
      <Navbar />

      {/* Background blobs */}
      <div className="absolute top-[-120px] left-[-100px] w-[420px] h-[420px] bg-[#2563EB]/10 rounded-full blur-3xl" />
      <div className="absolute top-[200px] right-[-150px] w-[480px] h-[480px] bg-[#06B6D4]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-[-100px] left-1/3 w-[360px] h-[360px] bg-[#10B981]/10 rounded-full blur-3xl" />

      <section
        id="hero"
        className="relative max-w-6xl mx-auto px-6 pt-36 pb-24 grid md:grid-cols-2 gap-12 items-center"
      >
        {/* Left: Copy */}
        <div>
          <motion.div
            initial="hidden"
            animate="visible"
            custom={0}
            variants={fadeUp}
            className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-1.5 text-xs font-medium text-slate-600 shadow-sm mb-6"
          >
            <Sparkles size={13} className="text-[#2563EB]" />
            AI-powered medication companion
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            custom={1}
            variants={fadeUp}
            className="text-5xl md:text-6xl font-extrabold text-slate-900 leading-[1.05] tracking-tight"
          >
            Understand your
 
m
            <br />
            medicines,
            <br />
            <span className="bg-gradient-to-r from-[#2563EB] to-[#06B6D4] bg-clip-text text-transparent">
              never miss a 
            </span>
            <br />
            Dose.
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            custom={2}
            variants={fadeUp}
            className="mt-6 text-lg text-slate-500 max-w-md leading-relaxed"
          >
            Upload your prescription. Chat with AI. Understand medicines.
            Track doses. Get reminders. Sab kuch Urdu aur English mein.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            custom={3}
            variants={fadeUp}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <Link href="/login">
              <motion.span
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="inline-block bg-[#2563EB] text-white font-semibold px-7 py-3.5 rounded-full shadow-md hover:shadow-lg transition-shadow"
              >
                Start Free
              </motion.span>
            </Link>
            <Link href="/login">
              <motion.span
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="inline-block bg-white border border-slate-200 text-slate-700 font-semibold px-7 py-3.5 rounded-full hover:border-[#2563EB]/40 transition-colors"
              >
                Try AI Chat
              </motion.span>
            </Link>
          </motion.div>

          <motion.p
            initial="hidden"
            animate="visible"
            custom={4}
            variants={fadeUp}
            className="mt-4 text-xs text-slate-400"
          >
            ⚠ Educational information only — not a substitute for
            professional medical advice.
          </motion.p>
        </div>

        {/* Right: Phone mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative flex justify-center"
        >
          {/* Phone frame */}
          <div className="relative w-[280px] h-[560px] bg-slate-900 rounded-[2.5rem] p-3 shadow-2xl">
            <div className="w-full h-full bg-white rounded-[2rem] overflow-hidden flex flex-col">
              <div className="bg-gradient-to-r from-[#2563EB] to-[#06B6D4] px-4 pt-8 pb-4 text-white">
                <p className="text-xs opacity-80">MedAssist</p>
                <p className="text-sm font-semibold mt-1">
                  Kaise madad kar sakta hoon?
                </p>
              </div>
              <div className="flex-1 p-3 flex flex-col gap-2 bg-slate-50">
                <div className="self-start bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-3 py-2 text-xs text-slate-700 max-w-[80%] shadow-sm">
                  Panadol kis liye hai?
                </div>
                <div className="self-end bg-[#2563EB] text-white rounded-2xl rounded-br-sm px-3 py-2 text-xs max-w-[80%] shadow-sm">
                  Yeh bukhar aur dard ke liye istemal hoti hai...
                </div>
                <div className="mt-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-400 shadow-sm">
                  Message likhein...
                </div>
              </div>
            </div>
          </div>

          {/* Floating cards */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-6 top-16 bg-white rounded-2xl shadow-lg border border-slate-100 p-3 flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-lg bg-[#10B981]/10 flex items-center justify-center">
              <Camera size={16} className="text-[#10B981]" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400">Scanned</p>
              <p className="text-xs font-semibold text-slate-800">Panadol 500mg</p>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute -right-8 bottom-28 bg-white rounded-2xl shadow-lg border border-slate-100 p-3 flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-lg bg-[#2563EB]/10 flex items-center justify-center">
              <Bell size={16} className="text-[#2563EB]" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400">Reminder</p>
              <p className="text-xs font-semibold text-slate-800">9:30 AM</p>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -left-4 bottom-8 bg-white rounded-2xl shadow-lg border border-slate-100 p-3 flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-lg bg-[#06B6D4]/10 flex items-center justify-center">
              <MessageCircle size={16} className="text-[#06B6D4]" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400">Care Chat</p>
              <p className="text-xs font-semibold text-slate-800">Urdu + English</p>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Why MedAssist — Feature Cards */}
      <section id="features" className="relative max-w-6xl mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <span className="text-sm font-semibold text-[#2563EB] uppercase tracking-wide">
            Why MedAssist
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-3 tracking-tight">
            Ek app, jo sach mein samajhti hai
          </h2>
          <p className="text-slate-500 mt-3 text-lg">
            Not just reminders — real understanding, in the language you
            actually think in.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            {
              icon: MessageCircle,
              title: "AI Chat",
              desc: "Apni dawaon ke bare mein kabhi bhi poochein — jaisa kisi jaanley se baat kar rahe hon",
              gradient: "from-[#2563EB]/10 to-[#2563EB]/5",
              iconColor: "text-[#2563EB]",
            },
            {
              icon: Camera,
              title: "Prescription Scanner",
              desc: "Photo lein, AI khud dawa ka naam, dosage, aur frequency nikaal deta hai",
              gradient: "from-[#06B6D4]/10 to-[#06B6D4]/5",
              iconColor: "text-[#06B6D4]",
            },
            {
              icon: Bell,
              title: "Medication Reminder",
              desc: "Waqt par yaad dahani, taake koi dose miss na ho",
              gradient: "from-[#10B981]/10 to-[#10B981]/5",
              iconColor: "text-[#10B981]",
            },
            {
              icon: Sparkles,
              title: "Reports",
              desc: "Weekly adherence summary, plain language mein — caregivers ke liye bhi asaan",
              gradient: "from-[#2563EB]/10 to-[#2563EB]/5",
              iconColor: "text-[#2563EB]",
            },
            {
              icon: MessageCircle,
              title: "Urdu + English + Roman Urdu",
              desc: "Jis zaban mein aap sochte hain, usi mein baat karein — koi barrier nahi",
              gradient: "from-[#06B6D4]/10 to-[#06B6D4]/5",
              iconColor: "text-[#06B6D4]",
            },
            {
              icon: Bell,
              title: "Safe AI",
              desc: "Har jawab ke sath disclaimer, aur emergency mein turant sahi rehnumai",
              gradient: "from-[#10B981]/10 to-[#10B981]/5",
              iconColor: "text-[#10B981]",
            },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.1 }}
              whileHover={{ y: -6 }}
              className={`bg-gradient-to-br ${feature.gradient} border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-lg transition-shadow duration-300`}
            >
              <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4">
                <feature.icon size={22} className={feature.iconColor} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {feature.title}
              </h3>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works — Timeline */}
      <section className="relative max-w-4xl mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="text-sm font-semibold text-[#06B6D4] uppercase tracking-wide">
            How It Works
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-3 tracking-tight">
            Panch aasan steps
          </h2>
        </motion.div>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-slate-200 hidden sm:block" />

          <div className="flex flex-col gap-10">
            {[
              {
                step: "1",
                title: "Upload Prescription",
                desc: "Apni dawa ya prescription ki photo click karein",
                color: "bg-[#2563EB]",
              },
              {
                step: "2",
                title: "AI Extracts Medicines",
                desc: "AI khud naam, dosage, aur frequency nikaal leta hai",
                color: "bg-[#06B6D4]",
              },
              {
                step: "3",
                title: "Chat With AI",
                desc: "Kisi bhi sawal ka jawab, Urdu ya English mein",
                color: "bg-[#10B981]",
              },
              {
                step: "4",
                title: "Get Reminders",
                desc: "Waqt par yaad dahani, koi dose miss na ho",
                color: "bg-[#2563EB]",
              },
              {
                step: "5",
                title: "Weekly Reports",
                desc: "Apni progress ka plain-language summary dekhein",
                color: "bg-[#06B6D4]",
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative flex items-start gap-5"
              >
                <div
                  className={`relative z-10 w-10 h-10 rounded-full ${item.color} text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-md`}
                >
                  {item.step}
                </div>
                <div className="pt-1.5">
                  <h3 className="text-lg font-bold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="relative max-w-4xl mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <span className="text-sm font-semibold text-[#10B981] uppercase tracking-wide">
            Why Choose MedAssist
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-3 tracking-tight">
            Ordinary reminder apps se alag
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden"
        >
          <div className="grid grid-cols-3 text-center border-b border-slate-100 bg-slate-50">
            <div className="p-4 text-left text-sm font-semibold text-slate-500 pl-6">
              Feature
            </div>
            <div className="p-4 text-sm font-semibold text-slate-500">
              Ordinary Apps
            </div>
            <div className="p-4 text-sm font-bold text-[#2563EB]">
              MedAssist
            </div>
          </div>

          {[
            "AI Conversation",
            "Prescription Scanner",
            "Urdu Support",
            "English Support",
            "Weekly Reports",
            "Safe AI Guardrails",
          ].map((feature, i) => (
            <div
              key={feature}
              className={`grid grid-cols-3 text-center items-center ${
                i % 2 === 0 ? "bg-white" : "bg-slate-50/50"
              }`}
            >
              <div className="p-4 text-left text-sm font-medium text-slate-700 pl-6">
                {feature}
              </div>
              <div className="p-4 text-red-300 text-lg">✕</div>
              <div className="p-4 text-[#10B981] text-lg font-bold">✓</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Testimonials */}
      <section className="relative max-w-6xl mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <span className="text-sm font-semibold text-[#2563EB] uppercase tracking-wide">
            Built For Families Like Yours
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-3 tracking-tight">
            Kis tarah madad karta hai
          </h2>
          <p className="text-slate-400 text-sm mt-3">
            Illustrative examples of how different users might use MedAssist
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5">
          {[
            {
              role: "Caregiver for a parent",
              quote:
                "Mere abbu ki multiple dawaein hain — ab main asaani se track kar sakti hoon ke kaunsi kab leni hai, aur unke sawalon ke jawab bhi mil jate hain.",
              initial: "F",
            },
            {
              role: "Student helping at home",
              quote:
                "Prescription ki photo lekar seedha samajh aa jata hai ke dawa kis liye hai — ammi ko explain karna ab bohat asaan hai.",
              initial: "S",
            },
            {
              role: "Managing own medications",
              quote:
                "Apni zaban (Urdu) mein poochna aur samajhna — yeh sabse acha hissa hai. Koi complicated English terms nahi.",
              initial: "A",
            },
          ].map((item, i) => (
            <motion.div
              key={item.role}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2563EB] to-[#06B6D4] text-white flex items-center justify-center font-bold text-sm">
                  {item.initial}
                </div>
                <p className="text-xs text-slate-400">{item.role}</p>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed italic">
                &ldquo;{item.quote}&rdquo;
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="relative max-w-5xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-br from-[#2563EB] to-[#06B6D4] rounded-3xl px-8 py-14 text-center"
        >
          <p className="text-white/70 text-xs mb-8">
            What MedAssist is designed to handle
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { label: "Bilingual Support", value: "Urdu + English" },
              { label: "Prescription Reading", value: "AI Vision Scan" },
              { label: "Availability", value: "24/7 AI Chat" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl md:text-3xl font-extrabold text-white">
                  {stat.value}
                </p>
                <p className="text-white/70 text-sm mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Final CTA */}
      <section className="relative max-w-4xl mx-auto px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            Ready to Take Better Care?
          </h2>
          <p className="text-slate-500 text-lg mt-4">
            Start Your Journey Today — bilkul free, sirf ek click mein.
          </p>
          <Link href="/login">
            <motion.span
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-block mt-8 bg-[#2563EB] text-white font-semibold px-9 py-4 rounded-full shadow-lg hover:shadow-xl transition-shadow text-lg"
            >
              Start Free
            </motion.span>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-slate-100 bg-white/60 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#06B6D4] flex items-center justify-center text-white text-xs font-bold">
                  M
                </div>
                <span className="font-bold text-slate-900">MedAssist</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                AI-powered medication companion for families in Pakistan.
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-700 mb-3">
                Product
              </p>
              <div className="flex flex-col gap-2 text-xs text-slate-500">
                <Link href="#features" className="hover:text-[#2563EB]">
                  Features
                </Link>
                <Link href="/login" className="hover:text-[#2563EB]">
                  AI Chat
                </Link>
                <Link href="/medications" className="hover:text-[#2563EB]">
                  Medications
                </Link>
                <Link href="/reports" className="hover:text-[#2563EB]">
                  Reports
                </Link>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-700 mb-3">
                Company
              </p>
              <div className="flex flex-col gap-2 text-xs text-slate-500">
                <span className="hover:text-[#2563EB] cursor-pointer">
                  About
                </span>
                <span className="hover:text-[#2563EB] cursor-pointer">
                  Privacy Policy
                </span>
                <span className="hover:text-[#2563EB] cursor-pointer">
                  Terms
                </span>
                <span className="hover:text-[#2563EB] cursor-pointer">
                  Contact
                </span>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-700 mb-3">
                Connect
              </p>
              <div className="flex flex-col gap-2 text-xs text-slate-500">
                <span className="hover:text-[#2563EB] cursor-pointer">
                  Email
                </span>
                <span className="hover:text-[#2563EB] cursor-pointer">
                  LinkedIn
                </span>
                <span className="hover:text-[#2563EB] cursor-pointer">
                  GitHub
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-400">
              © {new Date().getFullYear()} MedAssist. All rights reserved.
            </p>
            <p className="text-xs text-slate-400 text-center sm:text-right max-w-md">
              ⚠ MedAssist provides educational information only and is not a
              substitute for professional medical advice.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}