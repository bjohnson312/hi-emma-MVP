import { HelpCircle, Mail, MessageCircle, Book, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HelpView() {
  return (
    <div className="space-y-6">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4e8f71]/20 to-[#364d89]/20 flex items-center justify-center">
            <HelpCircle className="w-6 h-6 text-[#4e8f71]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#323e48]">Help / About Emma</h2>
            <p className="text-sm text-[#4e8f71]">Learn more & get support</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-r from-[#4e8f71]/10 to-[#364d89]/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <Heart className="w-6 h-6 text-[#4e8f71]" />
              <h3 className="text-lg font-semibold text-[#323e48]">About Emma</h3>
            </div>
            <p className="text-sm text-[#323e48]/70 leading-relaxed">
              Emma is your voice-first wellness companion, designed to help you build healthy habits, 
              track your wellness journey, and provide personalized support for your daily routines. 
              With Emma, you can manage your morning and evening routines, track medications, monitor 
              your mood, and maintain a healthy lifestyle with ease.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-[#323e48] mb-3">Contact Support</h3>
            <div className="space-y-3">
              <a 
                href="mailto:support@emmahealthapp.com"
                className="w-full bg-white/90 rounded-2xl p-4 border border-[#4e8f71]/20 hover:bg-white hover:shadow-lg transition-all text-left block"
              >
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-[#4e8f71]" />
                  <div>
                    <p className="font-medium text-[#323e48]">Email Support</p>
                    <p className="text-xs text-[#323e48]/60">support@emmahealthapp.com</p>
                  </div>
                </div>
              </a>

              <button className="w-full bg-white/90 rounded-2xl p-4 border border-[#364d89]/20 hover:bg-white hover:shadow-lg transition-all text-left">
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-5 h-5 text-[#364d89]" />
                  <div>
                    <p className="font-medium text-[#323e48]">Live Chat</p>
                    <p className="text-xs text-[#323e48]/60">Chat with our support team</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-[#323e48] mb-3">Resources</h3>
            <div className="space-y-2">
              <button className="w-full bg-white/90 rounded-2xl p-3 border border-[#4e8f71]/20 hover:bg-white hover:shadow-md transition-all text-left">
                <div className="flex items-center gap-3">
                  <Book className="w-4 h-4 text-[#4e8f71]" />
                  <p className="text-sm font-medium text-[#323e48]">User Guide</p>
                </div>
              </button>

              <button className="w-full bg-white/90 rounded-2xl p-3 border border-[#4e8f71]/20 hover:bg-white hover:shadow-md transition-all text-left">
                <div className="flex items-center gap-3">
                  <Book className="w-4 h-4 text-[#4e8f71]" />
                  <p className="text-sm font-medium text-[#323e48]">FAQs</p>
                </div>
              </button>

              <button className="w-full bg-white/90 rounded-2xl p-3 border border-[#4e8f71]/20 hover:bg-white hover:shadow-md transition-all text-left">
                <div className="flex items-center gap-3">
                  <Book className="w-4 h-4 text-[#4e8f71]" />
                  <p className="text-sm font-medium text-[#323e48]">Privacy Policy</p>
                </div>
              </button>

              <button className="w-full bg-white/90 rounded-2xl p-3 border border-[#4e8f71]/20 hover:bg-white hover:shadow-md transition-all text-left">
                <div className="flex items-center gap-3">
                  <Book className="w-4 h-4 text-[#4e8f71]" />
                  <p className="text-sm font-medium text-[#323e48]">Terms of Service</p>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#4e8f71]/5 to-[#364d89]/5 rounded-2xl p-4 text-center">
            <p className="text-sm text-[#323e48]/60">Version 1.0.0</p>
            <p className="text-xs text-[#323e48]/40 mt-1">© 2025 Hi, Emma. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
