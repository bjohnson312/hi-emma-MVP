import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import backend from "~backend/client";
import { Sparkles, Heart, Coffee, Moon, Bell, MessageSquare, Loader2 } from "lucide-react";

interface OnboardingFlowProps {
  userId: string;
  onComplete: (firstName: string) => void;
}

interface Question {
  id: number;
  question: string;
  options: { value: string; label: string; icon?: any }[];
  type: "choice" | "text";
  placeholder?: string;
}

export default function OnboardingFlow({ userId, onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [reasonForJoining, setReasonForJoining] = useState("");
  const [currentFeeling, setCurrentFeeling] = useState("");
  const [preferredCheckIn, setPreferredCheckIn] = useState("");
  const [reminderPreference, setReminderPreference] = useState("");
  const [emmaMessage, setEmmaMessage] = useState("Hi there! I'm Emma, your personal wellness companion. Let's get to know each other.");
  const [isLoading, setIsLoading] = useState(false);
  const [textInput, setTextInput] = useState("");

  useEffect(() => {
    loadOnboardingStatus();
  }, [userId]);

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
        { value: "consistency", label: "Staying consistent with medications", icon: Bell },
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
        { value: "none", label: "No reminders for now", icon: Sparkles }
      ],
      type: "choice"
    }
  ];

  const handleAnswer = async (answer: string) => {
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
        const completionResponse = await backend.onboarding.complete({ user_id: userId });
        setEmmaMessage(completionResponse.welcome_message);
        
        setTimeout(() => {
          onComplete(firstName);
        }, 3000);
      } else {
        if (response.next_question) {
          setEmmaMessage(response.next_question);
        }
        setCurrentStep(response.current_step);
        setTextInput("");
      }
    } catch (error) {
      console.error("Failed to update onboarding step:", error);
      setEmmaMessage("Oops! Something went wrong. Let's try that again.");
    } finally {
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
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-12 border border-[#8BC34A]/20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#8BC34A] to-[#689F38] rounded-full mb-6 shadow-lg">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#2E7D32] mb-4">
              Welcome to Hi, Emma
            </h1>
          </div>

          <div className="mb-8">
            <div className="bg-gradient-to-r from-[#8BC34A]/10 to-[#AED581]/10 rounded-2xl p-6 border border-[#8BC34A]/20">
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
                          ? "w-8 bg-[#8BC34A]"
                          : index < currentStep
                          ? "w-2 bg-[#8BC34A]/50"
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
                    className="w-full px-6 py-4 text-lg border-2 border-[#8BC34A]/30 rounded-2xl focus:outline-none focus:border-[#8BC34A] transition-colors bg-white/50"
                    disabled={isLoading}
                    autoFocus
                  />
                  <Button
                    onClick={handleTextSubmit}
                    disabled={!textInput.trim() || isLoading}
                    className="w-full py-6 text-lg bg-gradient-to-r from-[#8BC34A] to-[#689F38] hover:from-[#7CB342] hover:to-[#558B2F] text-white rounded-2xl shadow-lg disabled:opacity-50"
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
                    return (
                      <button
                        key={option.value}
                        onClick={() => handleAnswer(option.value)}
                        disabled={isLoading}
                        className="flex items-center gap-4 p-6 bg-white/80 hover:bg-[#8BC34A]/10 border-2 border-[#8BC34A]/20 hover:border-[#8BC34A] rounded-2xl transition-all text-left group disabled:opacity-50"
                      >
                        {Icon && (
                          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#8BC34A]/20 to-[#AED581]/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Icon className="w-6 h-6 text-[#2E7D32]" />
                          </div>
                        )}
                        <span className="text-lg text-gray-700 font-medium flex-1">
                          {option.label}
                        </span>
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
  );
}
