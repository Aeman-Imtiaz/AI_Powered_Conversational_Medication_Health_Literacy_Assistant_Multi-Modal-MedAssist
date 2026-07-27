"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle,
  MessageSquare,
  Globe,
  Paperclip,
  X,
  FileText,
} from "lucide-react";
import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

import { db, storage } from "../lib/firebase";
import Footer from "../components/Footer";

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    // limit to 5MB
    if (selected.size > 5 * 1024 * 1024) {
      alert("File size should be under 5MB.");
      return;
    }

    setFile(selected);
  };

  const removeFile = () => {
    setFile(null);
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !form.name ||
      !form.email ||
      !form.subject ||
      !form.message
    ) {
      alert("Please fill all fields.");
      return;
    }

    try {
      setLoading(true);

      let attachmentUrl = "";
      let attachmentName = "";

      if (file) {
        const storageRef = ref(
          storage,
          `contactAttachments/${Date.now()}_${file.name}`
        );

        await uploadBytes(storageRef, file);
        attachmentUrl = await getDownloadURL(storageRef);
        attachmentName = file.name;
      }

      await addDoc(collection(db, "contactMessages"), {
        ...form,
        attachmentUrl,
        attachmentName,
        createdAt: serverTimestamp(),
      });

      setSuccess(true);

      setForm({
        name: "",
        email: "",
        subject: "",
        message: "",
      });

      setFile(null);

    } catch (err) {
      alert("Something went wrong.");
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-cyan-50 flex flex-col">

      <section className="max-w-7xl mx-auto px-6 py-16 flex-1">

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-14"
        >

          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 mx-auto flex items-center justify-center shadow-xl mb-8">

            <MessageSquare className="text-white" size={42} />

          </div>

          <h1 className="text-5xl md:text-6xl font-black text-slate-900">

              <span className="bg-gradient-to-r from-[#2563EB] to-[#06B6D4] bg-clip-text text-transparent">
              {" "}   Contact  MedAssist 
            </span>

          </h1>

          <p className="mt-6 text-slate-600 max-w-3xl mx-auto leading-8">

            Have questions, suggestions, feature requests or partnership opportunities?
            Our team is always happy to help. Send us a message and we&apos;ll get back to you as soon as possible.

          </p>

        </motion.div>

        <div className="grid lg:grid-cols-2 gap-10">

          {/* Left */}

          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >

            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-7 shadow-lg border border-slate-100 hover:shadow-xl transition">

              <div className="flex items-center gap-4">

                <Mail className="text-blue-600" />

                <div>

                  <h3 className="font-bold">
                    Email
                  </h3>

                  <p className="text-slate-500">
                    support@medassist.ai
                  </p>

                </div>

              </div>

            </div>

            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-7 shadow-lg border border-slate-100 hover:shadow-xl transition">

              <div className="flex items-center gap-4">

                <Phone className="text-green-600" />

                <div>

                  <h3 className="font-bold">
                    Phone
                  </h3>

                  <p className="text-slate-500">
                    +92 300 1234567
                  </p>

                </div>

              </div>

            </div>

            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-7 shadow-lg border border-slate-100 hover:shadow-xl transition">

              <div className="flex items-center gap-4">

                <MapPin className="text-red-500" />

                <div>

                  <h3 className="font-bold">
                    Location
                  </h3>

                  <p className="text-slate-500">
                    Islamabad, Pakistan
                  </p>

                </div>

              </div>

            </div>

            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-7 shadow-lg border border-slate-100 hover:shadow-xl transition">

              <div className="flex items-center gap-4">

                <Clock className="text-cyan-600" />

                <div>

                  <h3 className="font-bold">
                    Working Hours
                  </h3>

                  <p className="text-slate-500">
                    Monday - Saturday
                    <br />
                    9:00 AM - 6:00 PM
                  </p>

                </div>

              </div>

            </div>

            {/* Follow Us */}
            <div className="bg-white rounded-3xl p-7 shadow-lg">

              <h3 className="font-bold text-xl mb-5">
                Follow Us
              </h3>

              <div className="flex gap-4">

                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                  <Globe />
                </div>

                <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center text-white">
                  F
                </div>

                <div className="w-12 h-12 rounded-xl bg-cyan-600 flex items-center justify-center text-white">
                  in
                </div>

              </div>

            </div>

          </motion.div>

          {/* Right */}

          <motion.form
            onSubmit={submitForm}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-3xl shadow-xl p-8"
          >

            <h2 className="text-3xl font-bold mb-8">
              Send us a Message
            </h2>

            <div className="space-y-5">

              <input
                name="name"
                placeholder="Full Name"
                value={form.name}
                onChange={handleChange}
                className="w-full border rounded-xl p-4 outline-none focus:ring-2 focus:ring-blue-500"
              />

              <input
                name="email"
                type="email"
                placeholder="Email Address"
                value={form.email}
                onChange={handleChange}
                className="w-full border rounded-xl p-4 outline-none focus:ring-2 focus:ring-blue-500"
              />

              <input
                name="subject"
                placeholder="Subject"
                value={form.subject}
                onChange={handleChange}
                className="w-full border rounded-xl p-4 outline-none focus:ring-2 focus:ring-blue-500"
              />

              <textarea
                rows={6}
                name="message"
                placeholder="Write your message..."
                value={form.message}
                onChange={handleChange}
                className="w-full border rounded-xl p-4 outline-none resize-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Attachment */}

              {!file ? (

                <label className="flex items-center gap-3 border border-dashed border-slate-300 rounded-xl p-4 cursor-pointer hover:border-blue-500 transition text-slate-500">

                  <Paperclip size={18} className="text-blue-600" />

                  <span className="text-sm">
                    Attach a screenshot or PDF (optional)
                  </span>

                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                </label>

              ) : (

                <div className="flex items-center justify-between gap-3 border border-slate-200 rounded-xl p-4 bg-slate-50">

                  <div className="flex items-center gap-3 min-w-0">

                    <FileText size={18} className="text-blue-600 shrink-0" />

                    <span className="text-sm text-slate-700 truncate">
                      {file.name}
                    </span>

                  </div>

                  <button
                    type="button"
                    onClick={removeFile}
                    className="text-slate-400 hover:text-red-500 transition shrink-0"
                  >
                    <X size={18} />
                  </button>

                </div>

              )}

              <button
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-400 transition text-white py-4 rounded-xl font-bold flex justify-center items-center gap-3"
              >

                {loading ? "Sending..." : "Send Message"}

                <Send size={18} />

              </button>

              <p className="text-xs text-slate-500 text-center">
                We usually reply within 24 hours.
              </p>

              {success && (

                <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex items-center gap-4">

                  <CheckCircle className="text-green-600" />

                  <div>

                    <p className="font-semibold text-green-700">
                      Message Sent Successfully
                    </p>

                    <p className="text-sm text-green-600">
                      Thank you for contacting MedAssist AI.
                      Our team will reply shortly.
                    </p>

                  </div>

                </div>

              )}

            </div>

          </motion.form>

        </div>

        {/* FAQ */}
        <section className="mt-24">

          <h2 className="text-4xl font-black text-center mb-12">
            Frequently Asked Questions
          </h2>

          <div className="grid md:grid-cols-2 gap-8">

            <div className="bg-white rounded-3xl shadow-lg p-7">

              <h3 className="font-bold mb-3">
                How quickly will I receive a response?
              </h3>

              <p className="text-slate-600">
                Usually within 24 hours.
              </p>

            </div>

            <div className="bg-white rounded-3xl shadow-lg p-7">

              <h3 className="font-bold mb-3">
                Can I report a bug?
              </h3>

              <p className="text-slate-600">
                Yes. Please include screenshots and detailed information.
              </p>

            </div>

            <div className="bg-white rounded-3xl shadow-lg p-7">

              <h3 className="font-bold mb-3">
                Can I request a new feature?
              </h3>

              <p className="text-slate-600">
                Absolutely. We continuously improve MedAssist AI based on user feedback.
              </p>

            </div>

            <div className="bg-white rounded-3xl shadow-lg p-7">

              <h3 className="font-bold mb-3">
                Do you provide medical advice?
              </h3>

              <p className="text-slate-600">
                No. MedAssist AI only provides educational information and medication assistance.
              </p>

            </div>

          </div>

        </section>

        {/* Google Map */}
        <section className="mt-20">

          <h2 className="text-4xl font-black text-center mb-10">
            Find Us
          </h2>

          <div className="rounded-3xl overflow-hidden shadow-xl border border-slate-200">

            <iframe
              src="https://maps.google.com/maps?q=Islamabad&t=&z=13&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="400"
              loading="lazy"
            />

          </div>

        </section>

      </section>

      <Footer />

    </main>
  );
}