import { Button } from "@/components/ui/button";
import { Sun, Edit, CheckCircle2, Clock } from "lucide-react";

export default function MorningRoutineView() {
  return (
    <div className="space-y-6">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4e8f71]/20 to-[#364d89]/20 flex items-center justify-center">
              <Sun className="w-6 h-6 text-[#4e8f71]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#323e48]">Morning Routine</h2>
              <p className="text-sm text-[#4e8f71]">Your daily wellness start</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="bg-white/90 border-[#4e8f71]/30 text-[#4e8f71] hover:bg-white shadow-lg"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>

        <div className="space-y-4">
          <div className="bg-gradient-to-r from-[#4e8f71]/10 to-[#364d89]/10 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle2 className="w-5 h-5 text-[#4e8f71]" />
              <h3 className="font-semibold text-[#323e48]">Today's Routine</h3>
            </div>
            <ul className="space-y-2 text-sm text-[#323e48]">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#4e8f71]"></div>
                Wake up check-in with Emma
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#4e8f71]"></div>
                Morning stretches (5 minutes)
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#4e8f71]"></div>
                Gratitude practice
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#4e8f71]"></div>
                Healthy breakfast
              </li>
            </ul>
          </div>

          <div className="bg-white/90 rounded-2xl p-4 border border-[#4e8f71]/20">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-[#364d89]" />
              <h3 className="font-semibold text-[#323e48]">Preferred Wake Time</h3>
            </div>
            <p className="text-lg font-medium text-[#4e8f71]">7:00 AM</p>
          </div>
        </div>
      </div>
    </div>
  );
}
