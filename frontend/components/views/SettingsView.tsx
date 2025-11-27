import { Settings, User, Mail, Link, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { useToast } from "@/components/ui/use-toast";
import VoiceSelector from "@/components/VoiceSelector";
import Tooltip from "@/components/Tooltip";

export default function SettingsView({ onOpenMicSetup }: { onOpenMicSetup?: () => void }) {
  const { 
    voices, 
    selectedVoice, 
    setSelectedVoice, 
    isSupported,
    elevenLabsVoices,
    selectedElevenLabsVoice,
    setSelectedElevenLabsVoice
  } = useTextToSpeech();
  
  const { toast } = useToast();

  const handleSaveSettings = () => {
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated successfully.",
      duration: 3000,
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4e8f71]/20 to-[#364d89]/20 flex items-center justify-center">
            <Settings className="w-6 h-6 text-[#4e8f71]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#323e48]">Settings</h2>
            <p className="text-sm text-[#4e8f71]">Customize your experience</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-[#323e48] mb-3">Personal Information</h3>
            <div className="space-y-3">
              <div className="bg-gradient-to-r from-[#4e8f71]/10 to-[#364d89]/10 rounded-2xl p-4">
                <label className="flex items-center gap-2 text-sm font-medium text-[#323e48] mb-2">
                  <User className="w-4 h-4" />
                  Name
                </label>
                <Input 
                  type="text" 
                  defaultValue="Brian"
                  className="bg-white/90 border-white/40"
                />
              </div>

              <div className="bg-white/90 rounded-2xl p-4 border border-[#4e8f71]/20">
                <label className="flex items-center gap-2 text-sm font-medium text-[#323e48] mb-2">
                  <Mic className="w-4 h-4" />
                  Name pronunciation (for Emma's voice only)
                </label>
                <Input 
                  type="text" 
                  placeholder="e.g., Bree-in"
                  className="bg-white border-white/40"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Emma will use this for her voice. Your name will still show the way you spelled it.
                </p>
              </div>

              <div className="bg-white/90 rounded-2xl p-4 border border-[#4e8f71]/20">
                <label className="flex items-center gap-2 text-sm font-medium text-[#323e48] mb-2">
                  <Mail className="w-4 h-4" />
                  Email
                </label>
                <Input 
                  type="email" 
                  placeholder="brian@example.com"
                  className="bg-white border-white/40"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-[#323e48] mb-3">Voice Preferences</h3>
            <p className="text-xs text-[#323e48]/60 mb-3">Choose how Emma sounds when she speaks to you. ElevenLabs voices are higher quality!</p>
            <div className="space-y-3">
              <div className="bg-white/90 rounded-2xl p-4 border border-[#364d89]/20">
                {isSupported ? (
                  <VoiceSelector 
                    voices={voices}
                    selectedVoice={selectedVoice}
                    onVoiceChange={setSelectedVoice}
                    elevenLabsVoices={elevenLabsVoices}
                    selectedElevenLabsVoice={selectedElevenLabsVoice}
                    onElevenLabsVoiceChange={setSelectedElevenLabsVoice}
                  />
                ) : (
                  <p className="text-sm text-[#323e48]/60">Voice synthesis not supported in this browser</p>
                )}
              </div>
              
              {onOpenMicSetup && (
                <div className="bg-gradient-to-r from-[#4e8f71]/10 to-[#364d89]/10 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mic className="w-5 h-5 text-[#4e8f71]" />
                      <div>
                        <p className="font-medium text-[#323e48]">Microphone Setup</p>
                        <p className="text-xs text-[#323e48]/60">Test and configure your microphone</p>
                      </div>
                    </div>
                    <Tooltip content="Test your microphone" side="left">
                      <Button 
                        onClick={onOpenMicSetup}
                        variant="outline"
                        size="sm"
                        className="bg-white/90 border-[#4e8f71]/30 text-[#4e8f71] hover:bg-white"
                      >
                        Setup
                      </Button>
                    </Tooltip>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-[#323e48] mb-3">Integrations</h3>
            <div className="space-y-3">
              <div className="bg-gradient-to-r from-[#4e8f71]/10 to-[#364d89]/10 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Link className="w-5 h-5 text-[#4e8f71]" />
                    <div>
                      <p className="font-medium text-[#323e48]">Health App</p>
                      <p className="text-xs text-[#323e48]/60">Sync activity and sleep data</p>
                    </div>
                  </div>
                  <Tooltip content="Connect to Health app" side="left">
                    <Button 
                      variant="outline"
                      size="sm"
                      className="bg-white/90 border-[#4e8f71]/30 text-[#4e8f71] hover:bg-white"
                    >
                      Connect
                    </Button>
                  </Tooltip>
                </div>
              </div>

              <div className="bg-white/90 rounded-2xl p-4 border border-[#364d89]/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Link className="w-5 h-5 text-[#364d89]" />
                    <div>
                      <p className="font-medium text-[#323e48]">Calendar</p>
                      <p className="text-xs text-[#323e48]/60">Schedule wellness activities</p>
                    </div>
                  </div>
                  <Tooltip content="Connect to Calendar" side="left">
                    <Button 
                      variant="outline"
                      size="sm"
                      className="bg-white/90 border-[#364d89]/30 text-[#364d89] hover:bg-white"
                    >
                      Connect
                    </Button>
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleSaveSettings}
            className="w-full bg-gradient-to-r from-[#4e8f71] to-[#364d89] hover:from-[#3d7259] hover:to-[#2a3d6f] text-white shadow-xl"
          >
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
