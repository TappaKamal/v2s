"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity,
  Stethoscope, 
  CalendarDays,
  ChevronDown,
  Clock,
  HeartPulse,
  ListTodo,
  MessageCircle,
  ShieldCheck,
  TrendingUp,
  ArrowRight
} from "lucide-react";

export default function Home() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const features = [
    { icon: Activity, title: "Proactive Triage", desc: "Unlike passive lists, LifeSaver AI actively triages your incoming tasks, automatically diagnosing urgency and prioritizing what needs immediate attention." },
    { icon: CalendarDays, title: "Clinical Scheduling", desc: "Receive a precise daily prescription of time-blocks. We optimize your calendar around your natural energy levels to prevent burnout." },
    { icon: HeartPulse, title: "Stress Diagnostics", desc: "If deadlines pile up dangerously, the AI intervenes. It recommends breathing room and recovery schedules to keep your productivity healthy." },
    { icon: TrendingUp, title: "Habit Rehab", desc: "Heal your procrastination. Build consistency with visual streak tracking and daily check-ins on your long-term goals." },
  ];

  const steps = [
    { title: "Initial Consultation", desc: "Input your backlog of tasks, projects, and deadlines. Tell the AI your working hours and energy peaks." },
    { title: "AI Diagnosis", desc: "The engine analyzes the effort required versus the time remaining, mathematically scoring task urgency." },
    { title: "Daily Prescription", desc: "Wake up to a perfectly structured schedule that protects your focus and ensures zero missed deadlines." },
  ];

  const faqs = [
    { q: "Is LifeSaver AI completely free?", a: "Yes, you can download and start using the core triage and scheduling engine completely free of charge. Premium plans are available for advanced analytics." },
    { q: "Is my data kept confidential?", a: "We treat your task data with strict clinical confidentiality. Your information is encrypted and never shared or sold." },
    { q: "Can it replace my normal calendar?", a: "LifeSaver AI integrates directly with Google and Apple Calendar. It acts as an intelligent layer on top of your existing schedule." },
    { q: "Is this a real AI or just a rule-based app?", a: "LifeSaver utilizes advanced LLMs to parse context, understand natural language voice inputs, and adapt to your unique working style over time." },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAF8] text-slate-800 font-sans selection:bg-teal-200 overflow-x-hidden">
      
      {/* Navigation */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-green-500/20">
              <Stethoscope className="w-6 h-6" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-slate-900">LifeSaver AI</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/auth/signin" className="hidden sm:block text-[15px] font-semibold text-slate-500 hover:text-green-600 transition-colors">
              Patient Portal (Log in)
            </Link>
            <Link href="/auth/signup">
              <button className="bg-gradient-to-r from-green-600 to-teal-500 hover:from-green-700 hover:to-teal-600 text-white px-6 py-2.5 rounded-full text-[15px] font-bold shadow-lg shadow-green-600/25 transition-all hover:-translate-y-0.5">
                Get Started
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-36 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-[#F8FAF8]">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-green-200/40 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-teal-200/30 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col lg:flex-row items-center gap-16">
          
          <div className="w-full lg:w-1/2 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 border border-orange-200 text-orange-600 text-base font-bold mb-8 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              India's #1 Productivity Engine
            </div>
            
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.05] mb-6">
              Emergency Care <br className="hidden lg:block"/>
              for your <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 via-teal-500 to-cyan-500">schedule.</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-500 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
              Personalized task triage, fitness coaching for your habits, and proactive deadline management — available 24/7. Trusted by 300,000+ professionals.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link href="/auth/signup" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-teal-500 hover:from-green-700 hover:to-teal-600 text-white px-8 py-4 rounded-full text-xl font-bold shadow-xl shadow-green-600/25 transition-all hover:-translate-y-1 flex items-center justify-center gap-2">
                  Start your recovery
                  <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
            </div>
            
            <div className="mt-12 pt-8 border-t border-slate-200 flex flex-wrap items-center justify-center lg:justify-start gap-8">
              <div className="text-left">
                <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-teal-500">2M+</div>
                <div className="text-base font-semibold text-slate-500 mt-1 uppercase tracking-wide">Tasks Triaged</div>
              </div>
              <div className="w-px h-10 bg-slate-200 hidden sm:block"></div>
              <div className="text-left">
                <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-teal-500">4.9/5</div>
                <div className="text-base font-semibold text-slate-500 mt-1 uppercase tracking-wide">Patient Rating</div>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-1/2 relative h-[500px] flex justify-center items-center">
            {mounted && (
              <div className="relative w-full max-w-[340px] aspect-[9/19] bg-white border-[8px] border-slate-900 rounded-[3rem] shadow-2xl flex flex-col overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-6 bg-slate-900 rounded-b-3xl w-40 mx-auto z-20"></div>
                
                <div className="flex-1 bg-[#F8FAF8] p-6 pt-12 relative">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h3 className="text-3xl font-extrabold text-slate-900">Your Plan</h3>
                      <p className="text-base text-slate-500 font-medium">Optimal health detected.</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <motion.div 
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-3"
                    >
                      <div className="mt-0.5"><Clock className="text-slate-300 w-5 h-5" /></div>
                      <div>
                        <div className="font-bold text-slate-900">Client Strategy Doc</div>
                        <div className="text-base font-semibold text-rose-500 mt-1 flex items-center gap-1">
                          <Activity className="w-3.5 h-3.5" /> High Urgency
                        </div>
                      </div>
                    </motion.div>

                    <motion.div 
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                      className="bg-gradient-to-r from-green-50 to-teal-50 p-4 rounded-2xl shadow-sm border border-green-100 flex items-start gap-3"
                    >
                      <div className="mt-0.5"><MessageCircle className="text-green-500 w-5 h-5" /></div>
                      <div>
                        <div className="font-bold text-slate-900">Check-in with Disha</div>
                        <div className="text-base font-medium text-slate-500 mt-1">Mental health break</div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
        </div>
      </section>

      {/* Conditions (Features) Grid */}
      <section className="bg-white py-24 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-block px-4 py-1.5 rounded-full bg-green-50 text-green-700 text-base font-bold tracking-widest uppercase mb-4">
            Capabilities
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6">Proactive Treatments</h2>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-16">
            Unlike traditional planners, LifeSaver doesn't just record tasks. It actively intervenes to ensure your long-term success.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feat, idx) => (
              <div key={idx} className="bg-[#F8FAF8] border border-slate-100 rounded-3xl p-8 hover:-translate-y-2 transition-transform duration-300 hover:shadow-xl hover:shadow-slate-200/50 text-left">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-green-600 shadow-sm mb-6">
                  <feat.icon className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">{feat.title}</h3>
                <p className="text-slate-500 text-[15px] leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works - Vertical Timeline */}
      <section className="bg-[#F8FAF8] py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-1.5 rounded-full bg-teal-50 text-teal-700 text-base font-bold tracking-widest uppercase mb-4">
              How it Works
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6">The Road to Recovery</h2>
          </div>

          <div className="relative border-l-2 border-green-200 ml-6 md:ml-12 pl-10 md:pl-16 space-y-16">
            {steps.map((step, idx) => (
              <div key={idx} className="relative">
                <div className="absolute -left-[58px] md:-left-[82px] w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-extrabold text-2xl md:text-3xl shadow-lg shadow-green-500/30">
                  {idx + 1}
                </div>
                <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{step.title}</h3>
                <p className="text-xl text-slate-500 leading-relaxed max-w-lg">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-24 border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-6">Patient FAQ</h2>
            <p className="text-xl text-slate-500">Everything you need to know about our practice.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border border-slate-200 rounded-2xl overflow-hidden bg-white hover:border-green-300 transition-colors">
                <button 
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full px-6 py-6 text-left flex justify-between items-center focus:outline-none"
                >
                  <span className="font-bold text-[17px] text-slate-900">{faq.q}</span>
                  <motion.div animate={{ rotate: activeFaq === idx ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {activeFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 text-slate-600 leading-relaxed text-[15px]">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="bg-gradient-to-br from-green-800 to-slate-900 py-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-green-500/20 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-8 tracking-tight">
            Ready for a healthy schedule?
          </h2>
          <p className="text-2xl text-green-100/80 mb-12 max-w-2xl mx-auto font-medium">
            Join 300,000+ professionals who stopped planning and started executing perfectly.
          </p>
          <Link href="/auth/signup">
            <button className="bg-white hover:bg-slate-50 text-green-700 px-10 py-5 rounded-full text-xl font-bold shadow-xl transition-all hover:scale-105 flex items-center gap-2 mx-auto">
              Download the AI Coach (Free)
              <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-white/10 py-12 px-6 text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500/20 rounded flex items-center justify-center text-green-500">
              <Stethoscope className="w-5 h-5" />
            </div>
            <span className="font-bold text-white text-xl">LifeSaver AI</span>
          </div>
          <p className="text-[13px] font-medium">© 2026 LifeSaver Health Technologies. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}



