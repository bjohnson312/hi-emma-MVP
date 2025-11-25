import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import backend from "@/lib/backend-client";
import { Sparkles, Heart, Coffee, Moon, Bell, MessageSquare, Loader2, Volume2, VolumeX } from "lucide-react";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";

interface OnboardingFlowProps {
  userId: string;
  onComplete: (firstName: string, welcomeMessage?: string) => void;
}

interface Question {
  id: number;
  question: string;
  options: { value: string; label: string; icon?: any }[];
  type: "choice" | "text";
  placeholder?: string;
}

export default function OnboardingFlow({ userId, onComplete }: OnboardingFlowProps) {
  const { speak, stop, isSpeaking } = useTextToSpeech();
  const hasSpokenCurrentMessage = useRef(false);
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem("emma-voice-muted") === "true";
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [reasonForJoining, setReasonForJoining] = useState("");
  const [currentFeeling, setCurrentFeeling] = useState("");
  const [preferredCheckIn, setPreferredCheckIn] = useState("");
  const [reminderPreference, setReminderPreference] = useState("");
  const [emmaMessage, setEmmaMessage] = useState("Hi there! I'm Emma, your personal wellness companion. Let's get to know each other. What's your name?");
  const [isLoading, setIsLoading] = useState(false);
  const [textInput, setTextInput] = useState("");

  useEffect(() => {
    loadOnboardingStatus();
  }, [userId]);

  useEffect(() => {
    if (!isMuted && emmaMessage && !hasSpokenCurrentMessage.current) {
      hasSpokenCurrentMessage.current = true;
      const timer = setTimeout(() => {
        speak(emmaMessage);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [emmaMessage, isMuted, speak]);

  useEffect(() => {
    hasSpokenCurrentMessage.current = false;
  }, [emmaMessage]);

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    localStorage.setItem("emma-voice-muted", newMutedState.toString());
    if (newMutedState) {
      stop();
    } else {
      speak(emmaMessage);
    }
  };

  const loadOnboardingStatus = async () => {
    try {
      const status = await backend.onboarding.getStatus({ user_id: userId });
      if (status.onboarding_completed) {
        onComplete(status.preferences?.first_name || "");
      } else {
        setCurrentStep(status.onboarding_step);
        if (status.preferences) {
          setFirstName(status.preferences.first_name || "");
          setReasonForJoining(status.preferences.reason_for_joining || "");
          setCurrentFeeling(status.preferences.current_feeling || "");
          setPreferredCheckIn(status.preferences.preferred_check_in_time || "");
          setReminderPreference(status.preferences.reminder_preference || "");
        }
      }
    } catch (error) {
      console.error("Failed to load onboarding status:", error);
    }
  };

  const questions: Question[] = [
    {
      id: 0,
      question: "What's your first name?",
      options: [],
      type: "text",
      placeholder: "Enter your first name"
    },
    {
      id: 1,
      question: `Nice to meet you${firstName ? `, ${firstName}` : ''}! What brought you to Hi, Emma today?`,
      options: [
        { value: "routine", label: "Getting back into a healthy routine", icon: Coffee },
        { value: "stress", label: "Managing stress better", icon: Heart },
        { value: "nutrition", label: "Eating better", icon: Sparkles },
        { value: "consistency", label: "Managing my care routine or chronic condition", icon: Bell },
        { value: "other", label: "Something else", icon: MessageSquare }
      ],
      type: "choice"
    },
    {
      id: 2,
      question: "How have you been feeling lately?",
      options: [
        { value: "pretty_good", label: "Pretty good, just want to keep it up", icon: Heart },
        { value: "up_and_down", label: "Up and down, some good days and some tough ones", icon: Sparkles },
        { value: "low_energy", label: "Low energy or stressed", icon: Moon },
        { value: "need_support", label: "I could use some extra support", icon: MessageSquare }
      ],
      type: "choice"
    },
    {
      id: 3,
      question: "When would you like me to check in with you?",
      options: [
        { value: "morning", label: "Morning – help me start my day", icon: Coffee },
        { value: "evening", label: "Evening – help me wind down", icon: Moon },
        { value: "both", label: "Both morning and evening", icon: Heart }
      ],
      type: "choice"
    },
    {
      id: 4,
      question: "How would you like to receive reminders?",
      options: [
        { value: "voice", label: "Voice (through this app)", icon: MessageSquare },
        { value: "sms", label: "SMS text messages", icon: Bell },
        { value: "both", label: "Both Voice and SMS", icon: Heart }
      ],
      type: "choice"
    }
  ];

  const handleAnswer = async (answer: string) => {
    stop();
    setIsLoading(true);
    
    try {
      const updateData: any = {
        user_id: userId,
        step: currentStep + 1
      };

      switch (currentStep) {
        case 0:
          updateData.first_name = answer;
          setFirstName(answer);
          break;
        case 1:
          updateData.reason_for_joining = answer;
          setReasonForJoining(answer);
          break;
        case 2:
          updateData.current_feeling = answer;
          setCurrentFeeling(answer);
          break;
        case 3:
          updateData.preferred_check_in_time = answer;
          setPreferredCheckIn(answer);
          break;
        case 4:
          updateData.reminder_preference = answer;
          setReminderPreference(answer);
          break;
      }

      const response = await backend.onboarding.updateStep(updateData);
      
      if (response.onboarding_completed) {
        try {
          const completionResponse = await backend.onboarding.complete({ user_id: userId });
          setIsLoading(false);
          onComplete(firstName || "User", completionResponse.welcome_message);
        } catch (completeError) {
          console.error("Failed to complete onboarding:", completeError);
          setIsLoading(false);
          // Fallback: Complete without calling the API
          onComplete(firstName || "User", "Welcome! Let's get started with your wellness journey.");
        }
      } else {
        setIsLoading(false);
        setCurrentStep(response.current_step);
        
        const nextQuestion = questions[response.current_step];
        if (nextQuestion) {
          setEmmaMessage(nextQuestion.question);
        }
        
        setTextInput("");
      }
    } catch (error) {
      console.error("Failed to update onboarding step:", error);
      setEmmaMessage("Oops! Something went wrong. Let's try that again.");
      setIsLoading(false);
    }
  };

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      handleAnswer(textInput.trim());
    }
  };

  const currentQuestion = questions[currentStep];

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6">
          <div className="inline-block bg-white/20 backdrop-blur-sm rounded-2xl px-8 py-4">
            <h1 className="text-4xl font-bold text-[#6656cb] mb-1">Hi, Emma</h1>
            <p className="text-lg text-[#4e8f71]">Wellness That Listens. Support That Lasts.</p>
          </div>
        </div>
        
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden border border-white/40">
          <div className="bg-gradient-to-r from-[#4e8f71] via-[#364d89] to-[#6656cb] p-6">
            <div className="flex items-center gap-3 text-white mb-4">
              <div className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center shadow-lg">
                <img src="/logo.png" alt="Emma" className="w-8 h-8 object-contain" />
              </div>
              <div className="flex-1">
                <h2 className="font-medium text-xl tracking-wide">Welcome to Hi, Emma</h2>
                <p className="text-xs text-white/90">Let's get to know each other</p>
              </div>
              <button
                onClick={toggleMute}
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center transition-all"
                aria-label={isMuted ? "Unmute Emma" : "Mute Emma"}
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5 text-white" />
                ) : isSpeaking ? (
                  <Volume2 className="w-5 h-5 text-white animate-pulse" />
                ) : (
                  <Volume2 className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
          </div>

          <div className="p-8 md:p-10">
            <div className="mb-8">
              <div className="bg-gradient-to-b from-white/60 to-[#f8fdf9]/80 rounded-2xl p-6 border border-[#8BC34A]/10">
                <p className="text-lg text-gray-700 leading-relaxed">
                  {emmaMessage}
                </p>
              </div>
            </div>

            {currentStep < questions.length && (
              <div className="space-y-6">
                <div className="flex justify-center mb-6">
                  <div className="flex gap-2">
                    {questions.map((_, index) => (
                      <div
                        key={index}
                        className={`h-2 rounded-full transition-all ${
                          index === currentStep
                            ? "w-8 bg-gradient-to-r from-[#4e8f71] to-[#6656cb]"
                            : index < currentStep
                            ? "w-2 bg-[#4e8f71]/50"
                            : "w-2 bg-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {currentQuestion.type === "text" && (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleTextSubmit()}
                      placeholder={currentQuestion.placeholder}
                      className="w-full px-6 py-4 text-lg border-2 border-[#4e8f71]/30 rounded-2xl focus:outline-none focus:border-[#6656cb] transition-colors bg-white/50"
                      disabled={isLoading}
                      autoFocus
                    />
                    <Button
                      onClick={handleTextSubmit}
                      disabled={!textInput.trim() || isLoading}
                      className="w-full py-6 text-lg bg-gradient-to-r from-[#4e8f71] via-[#364d89] to-[#6656cb] hover:opacity-90 text-white rounded-2xl shadow-lg disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Continue"
                      )}
                    </Button>
                  </div>
                )}

                {currentQuestion.type === "choice" && (
                  <div className="grid gap-4">
                    {currentQuestion.options.map((option) => {
                      const Icon = option.icon;
                      const isSmsOption = option.value === "sms";
                      return (
                        <button
                          key={option.value}
                          onClick={() => handleAnswer(option.value)}
                          disabled={isLoading}
                          className="flex items-center gap-4 p-6 bg-white/80 hover:bg-gradient-to-r hover:from-[#4e8f71]/5 hover:to-[#6656cb]/5 border-2 border-[#4e8f71]/20 hover:border-[#6656cb] rounded-2xl transition-all text-left group disabled:opacity-50 relative"
                        >
                          {Icon && (
                            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#4e8f71]/20 to-[#6656cb]/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Icon className="w-6 h-6 text-[#364d89]" />
                            </div>
                          )}
                          <span className="text-lg text-gray-700 font-medium flex-1">
                            {option.label}
                          </span>
                          {isSmsOption && (
                            <span className="px-3 py-1 text-xs font-semibold bg-gradient-to-r from-[#4e8f71] to-[#6656cb] text-white rounded-full">
                              Coming Soon
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
