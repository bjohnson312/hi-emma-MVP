import { Settings, User, Mail, Link, Mic, Smartphone, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { useToast } from "@/components/ui/use-toast";
import VoiceSelector from "@/components/VoiceSelector";
import Tooltip from "@/components/Tooltip";
import { useState, useEffect, useRef } from "react";
import backend from "~backend/client";
import { clerkClient } from "@/lib/clerk-client";
import { logErrorSilently } from '@/lib/silent-error-handler';

interface SettingsViewProps {
  userId: string;
  designVersion: 'classic' | 'gradient-top';
  onDesignChange: (design: 'classic' | 'gradient-top') => void;
  onOpenMicSetup?: () => void;
}

export default function SettingsView({ userId, designVersion, onDesignChange, onOpenMicSetup }: SettingsViewProps) {
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

  const [name, setName] = useState("");
  const [namePronunciation, setNamePronunciation] = useState("");
  const [email, setEmail] = useState("");
  const [wellnessGoals, setWellnessGoals] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const nameDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const pronunciationDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const isUrlOverride = (() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlDesign = urlParams.get('design');
    if (!urlDesign) return false;
    const savedDesign = localStorage.getItem('emma_design_version');
    return urlDesign !== savedDesign;
  })();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await backend.profile.get({ user_id: userId });
        if (response.profile) {
          setName(response.profile.name || "");
          setNamePronunciation(response.profile.name_pronunciation || "");
          setWellnessGoals(response.profile.wellness_goals || []);
        }
        
        const user = await clerkClient.getCurrentUser();
        if (user?.email_addresses?.[0]?.email_address) {
          setEmail(user.email_addresses[0].email_address);
        }
      } catch (error) {
        await logErrorSilently(error, {
          componentName: 'SettingsView',
          errorType: 'api_failure',
          apiEndpoint: '/profile/get',
          severity: 'low',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProfile();
  }, [userId]);

  const handleNameChange = (newName: string) => {
    setName(newName);
    
    if (nameDebounceRef.current) {
      clearTimeout(nameDebounceRef.current);
    }
    
    nameDebounceRef.current = setTimeout(async () => {
      try {
        await backend.profile.update({ 
          user_id: userId, 
          name: newName 
        });
        toast({
          title: "Name updated",
          duration: 2000,
        });
      } catch (error) {
        console.error("Failed to update name:", error);
        toast({
          title: "Failed to update name",
          description: "Please try again",
          duration: 3000,
        });
      }
    }, 600);
  };

  const handlePronunciationChange = (newPronunciation: string) => {
    setNamePronunciation(newPronunciation);
    
    if (pronunciationDebounceRef.current) {
      clearTimeout(pronunciationDebounceRef.current);
    }
    
    pronunciationDebounceRef.current = setTimeout(async () => {
      try {
        await backend.profile.update({ 
          user_id: userId, 
          name_pronunciation: newPronunciation.trim() || undefined
        });
        toast({
          title: "Pronunciation updated",
          duration: 2000,
        });
      } catch (error) {
        console.error("Failed to update pronunciation:", error);
        toast({
          title: "Failed to update pronunciation",
          description: "Please try again",
          duration: 3000,
        });
      }
    }, 600);
  };

  useEffect(() => {
    return () => {
      if (nameDebounceRef.current) clearTimeout(nameDebounceRef.current);
      if (pronunciationDebounceRef.current) clearTimeout(pronunciationDebounceRef.current);
    };
  }, []);

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
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  disabled={isLoading}
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
                  value={namePronunciation}
                  onChange={(e) => handlePronunciationChange(e.target.value)}
                  disabled={isLoading}
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
                  value={email}
                  readOnly
                  disabled
                  className="bg-gray-50 border-white/40 text-gray-600 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Email cannot be changed here. Managed by your account.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-[#323e48] mb-3">Wellness Goals</h3>
            <div className="bg-gradient-to-r from-[#4e8f71]/10 to-[#364d89]/10 rounded-2xl p-4">
              <label className="flex items-center gap-2 text-sm font-medium text-[#323e48] mb-2">
                <Target className="w-4 h-4" />
                What brought you to Hi, Emma
              </label>
              {wellnessGoals.length > 0 ? (
                <div className="space-y-2">
                  {wellnessGoals.map((goal, index) => (
                    <div key={index} className="bg-white/90 rounded-xl p-3 border border-[#4e8f71]/20">
                      <p className="text-sm text-[#323e48]">{goal}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No wellness goals set yet</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-[#323e48] mb-3">Navigation Style (Mobile)</h3>
            <p className="text-xs text-[#323e48]/60 mb-3">Choose your preferred mobile navigation layout</p>
            
            {isUrlOverride && (
              <div className="mb-3 text-sm text-orange-600 bg-orange-50 p-3 rounded-xl border border-orange-200">
                <p className="font-medium">Preview mode active</p>
                <p className="text-xs mt-1">Design set by URL parameter. Your saved preference will apply when the URL parameter is removed.</p>
              </div>
            )}
            
            <div className="space-y-2 bg-white/90 rounded-2xl p-4 border border-[#4e8f71]/20">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="design"
                  value="classic"
                  checked={designVersion === 'classic'}
                  onChange={() => onDesignChange('classic')}
                  className="w-4 h-4 text-[#4e8f71] focus:ring-[#4e8f71]"
                />
                <div className="flex-1">
                  <span className="font-medium text-[#323e48] group-hover:text-[#4e8f71] transition-colors">Classic bottom navigation</span>
                  <p className="text-xs text-[#323e48]/60 mt-0.5">Traditional bottom bar with labeled icons</p>
                </div>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="design"
                  value="gradient-top"
                  checked={designVersion === 'gradient-top'}
                  onChange={() => onDesignChange('gradient-top')}
                  className="w-4 h-4 text-[#4e8f71] focus:ring-[#4e8f71]"
                />
                <div className="flex-1">
                  <span className="font-medium text-[#323e48] group-hover:text-[#4e8f71] transition-colors">Top gradient navigation</span>
                  <p className="text-xs text-[#323e48]/60 mt-0.5">Modern top bar with gradient background</p>
                </div>
              </label>
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

          <div className="text-center text-sm text-[#323e48]/60 bg-[#4e8f71]/5 rounded-2xl p-4">
            <p className="font-medium">✓ Your changes are saved automatically</p>
            <p className="text-xs mt-1">No need to click a save button — all settings update instantly.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
