import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import backend from "@/lib/backend-client";
import { Sparkles, Heart, Coffee, Moon, Bell, MessageSquare, Loader2, Volume2, VolumeX, ChevronDown, ChevronRight, Mic, Phone } from "lucide-react";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { logErrorSilently } from "@/lib/silent-error-handler";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

interface OnboardingFlowProps {
  userId: string;
  isMobilePhone?: boolean;
  onComplete: (firstName: string, welcomeMessage?: string) => void;
}

interface Question {
  id: number;
  question: string;
  options: { value: string; label: string; icon?: any }[];
  type: "choice" | "text" | "mobile_voice_nudge";
  placeholder?: string;
}

export default function OnboardingFlow({ userId, isMobilePhone, onComplete }: OnboardingFlowProps) {
  const [firstName, setFirstName] = useState("");
  const [namePronunciation, setNamePronunciation] = useState("");
  
  const { speak, stop, isSpeaking } = useTextToSpeech({
    userProfile: firstName ? {
      name: firstName,
      name_pronunciation: namePronunciation || null
    } : undefined,
    forceVoice: 'trinity'
  });
  const hasSpokenCurrentMessage = useRef(false);
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem("emma-voice-muted") === "true";
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [showPronunciation, setShowPronunciation] = useState(false);
  const [reasonForJoining, setReasonForJoining] = useState("");
  const [currentFeeling, setCurrentFeeling] = useState("");
  const [preferredCheckIn, setPreferredCheckIn] = useState("");
  const [reminderPreference, setReminderPreference] = useState("");
  const [emmaMessage, setEmmaMessage] = useState("Hi there! I'm Emma, your personal wellness companion. Let's get to know each other. What's your name?");
  const [isLoading, setIsLoading] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [isTestingPronunciation, setIsTestingPronunciation] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showPhonePrompt, setShowPhonePrompt] = useState(false);

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

  useEffect(() => {
    // Reset spoken flag when step changes
    hasSpokenCurrentMessage.current = false;
    // Stop any ongoing speech when step changes
    stop();
  }, [currentStep, stop]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, [currentStep]);

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
      setHasError(false);
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
      await logErrorSilently(error, {
        componentName: 'OnboardingFlow',
        errorType: 'api_failure',
        apiEndpoint: '/onboarding/status',
        severity: 'medium',
      });
      setHasError(true);
    }
  };

  const questions: Question[] = useMemo(() => {
    const baseQuestions: Question[] = [
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
    
    if (isMobilePhone) {
      baseQuestions.push({
        id: 5,
        question: "Talking to Emma on Your Phone",
        options: [],
        type: "mobile_voice_nudge"
      });
    }
    
    return baseQuestions;
  }, [firstName, isMobilePhone]);

  useEffect(() => {
    const currentQuestion = questions[currentStep];
    if (!currentQuestion) return;
    
    // Step 0 is handled by initial state, skip it
    if (currentStep === 0) return;
    
    // Small delay to let UI settle before speaking
    const timer = setTimeout(() => {
      // Handle mobile voice nudge step specially
      if (currentQuestion.type === "mobile_voice_nudge") {
        setEmmaMessage(
          "Great! On your phone, you can use the keyboard microphone to talk to me. " +
          "Just tap the mic icon on your keyboard and say what's on your mind."
        );
        return;
      }
      
      // For all other steps, use the question text
      setEmmaMessage(currentQuestion.question);
    }, 200);
    
    return () => clearTimeout(timer);
  }, [questions, currentStep]);

  const handleAnswer = async (answer: string) => {
    stop();
    setIsLoading(true);
    
    try {
      if (isMobilePhone && currentStep === 5 && questions[currentStep]?.type === "mobile_voice_nudge") {
        try {
          const completionResponse = await backend.onboarding.complete({ user_id: userId });
          setIsLoading(false);
          onComplete(firstName || "User", completionResponse.welcome_message);
        } catch (completeError) {
          console.error("Failed to complete onboarding:", completeError);
          setIsLoading(false);
          onComplete(firstName || "User", "Welcome! Let's get started with your wellness journey.");
        }
        return;
      }
      
      const updateData: any = {
        user_id: userId,
        step: currentStep + 1
      };

      switch (currentStep) {
        case 0:
          updateData.first_name = answer;
          updateData.name_pronunciation = namePronunciation || undefined;
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
          
          if (answer === 'sms' || answer === 'both') {
            try {
              await backend.onboarding.updateStep(updateData);
              setIsLoading(false);
              setShowPhonePrompt(true);
            } catch (error) {
              await logErrorSilently(error, {
                componentName: 'OnboardingFlow',
                errorType: 'api_failure',
                apiEndpoint: '/onboarding/update-step',
                severity: 'medium',
              });
              setEmmaMessage("Let's try that again.");
              setIsLoading(false);
            }
            return;
          }
          break;
      }

      const response = await backend.onboarding.updateStep(updateData);
      
      if (response.onboarding_completed) {
        if (isMobilePhone) {
          setIsLoading(false);
          setCurrentStep(5);
        } else {
          try {
            const completionResponse = await backend.onboarding.complete({ user_id: userId });
            setIsLoading(false);
            onComplete(firstName || "User", completionResponse.welcome_message);
          } catch (completeError) {
            console.error("Failed to complete onboarding:", completeError);
            setIsLoading(false);
            onComplete(firstName || "User", "Welcome! Let's get started with your wellness journey.");
          }
        }
      } else {
        setIsLoading(false);
        setCurrentStep(response.current_step);
        setTextInput("");
      }
    } catch (error) {
      await logErrorSilently(error, {
        componentName: 'OnboardingFlow',
        errorType: 'api_failure',
        apiEndpoint: '/onboarding/update-step',
        severity: 'medium',
      });
      setEmmaMessage("Let's try that again.");
      setIsLoading(false);
    }
  };

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      handleAnswer(textInput.trim());
    }
  };

  const currentQuestion = questions[currentStep];

  if (hasError) {
    return (
      <div className="w-full flex items-start justify-center p-4 pt-8 md:pt-16">
        <div className="w-full max-w-2xl">
          <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden border border-white/40">
            <div className="p-8">
              <EmptyState
                title="Unable to load onboarding"
                description="We're having trouble loading your onboarding progress"
                onRetry={loadOnboardingStatus}
                icon={<Sparkles className="h-16 w-16" />}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex items-start justify-center p-4 pt-8 md:pt-16">
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

                    <div className="border-t border-gray-200 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowPronunciation(!showPronunciation)}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#6656cb] transition-colors"
                      >
                        {showPronunciation ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                        <span>Help Emma say your name</span>
                      </button>

                      {showPronunciation && (
                        <div className="mt-4 space-y-3">
                          <label className="block text-sm font-medium text-gray-700">
                            How does your name sound? <span className="text-gray-500 font-normal">(optional)</span>
                          </label>
                          <input
                            type="text"
                            value={namePronunciation}
                            onChange={(e) => setNamePronunciation(e.target.value)}
                            placeholder="e.g., Rah-nah-duh"
                            className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#6656cb] transition-colors bg-white"
                            disabled={isLoading}
                          />
                          <p className="text-xs text-gray-500">
                            Emma will use this for her voice. Your name will still show the way you spelled it.
                          </p>
                          
                          {isMuted && (
                            <p className="text-xs text-amber-600 flex items-center gap-1">
                              <VolumeX className="w-3 h-3" />
                              Turn Emma's voice on to test pronunciation.
                            </p>
                          )}
                          
                          <Button
                            type="button"
                            onClick={async () => {
                              if (isTestingPronunciation || !textInput.trim()) return;
                              
                              setIsTestingPronunciation(true);
                              stop();
                              
                              await new Promise(resolve => setTimeout(resolve, 150));
                              
                              const spokenName = namePronunciation || textInput.trim();
                              await speak(`Hi, ${spokenName}. Hope I said that right. If not, please update the pronunciation and test again.`);
                              
                              setIsTestingPronunciation(false);
                            }}
                            disabled={!textInput.trim() || isLoading || isMuted || isTestingPronunciation}
                            variant="outline"
                            className="w-full py-2.5 text-sm border-2 border-[#4e8f71]/30 hover:border-[#6656cb] hover:bg-[#6656cb]/5 transition-colors"
                          >
                            {isTestingPronunciation ? (
                              <>
                                <Volume2 className="w-4 h-4 mr-2 animate-pulse" />
                                Playing...
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-4 h-4 mr-2" />
                                Test how Emma says it
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>

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
                        </button>
                      );
                    })}
                  </div>
                )}

                {currentQuestion.type === "mobile_voice_nudge" && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#4e8f71]/20 to-[#364d89]/20 flex items-center justify-center">
                        <Mic className="w-10 h-10 text-[#4e8f71]" />
                      </div>
                      <h3 className="text-2xl font-bold text-[#323e48] mb-3">
                        Talking to Emma on Your Phone
                      </h3>
                    </div>
                    
                    <div className="bg-gradient-to-b from-white/60 to-[#f8fdf9]/80 rounded-2xl p-6 border border-[#8BC34A]/10 space-y-4">
                      <p className="text-base text-gray-700 leading-relaxed">
                        On your iPhone or Android, you can tap the microphone icon 🎤 on your 
                        keyboard and just say what you want Emma to hear.
                      </p>
                      
                      <div className="bg-white/80 rounded-xl p-4 border-2 border-[#4e8f71]/20">
                        <p className="text-sm font-semibold text-[#323e48] mb-2">Try saying:</p>
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <span className="text-[#6656cb]">•</span>
                            <p className="text-base font-medium text-[#6656cb]">"Hi, Emma"</p>
                          </div>
                          <p className="text-sm text-gray-600 text-center">or</p>
                          <div className="flex items-start gap-2">
                            <span className="text-[#6656cb]">•</span>
                            <p className="text-base font-medium text-[#6656cb]">
                              "Hi, Emma, help me with my morning routine."
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                        <p className="text-sm text-gray-700 flex items-start gap-2">
                          <span>💡</span>
                          <span>
                            This uses your phone's built-in dictation. You don't need to 
                            change browser settings.
                          </span>
                        </p>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => handleAnswer("acknowledged")}
                      disabled={isLoading}
                      className="w-full py-6 text-lg bg-gradient-to-r from-[#4e8f71] via-[#364d89] to-[#6656cb] hover:opacity-90 text-white rounded-2xl shadow-lg disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Starting...
                        </>
                      ) : (
                        "Got it, let's start!"
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {showPhonePrompt && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-white/40">
              <div className="mb-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#4e8f71]/20 to-[#364d89]/20 flex items-center justify-center">
                  <Phone className="w-8 h-8 text-[#4e8f71]" />
                </div>
                <h3 className="text-xl font-bold text-[#323e48] text-center mb-2">
                  What's your phone number?
                </h3>
                <p className="text-sm text-gray-600 text-center">
                  We'll use this to send you {reminderPreference === 'sms' ? 'SMS' : 'voice and SMS'} reminders
                </p>
              </div>

              <div className="space-y-4">
                <Input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1234567890"
                  className="w-full px-4 py-3 text-lg border-2 border-[#4e8f71]/30 rounded-2xl focus:outline-none focus:border-[#6656cb] transition-colors bg-white"
                  autoFocus
                />
                <p className="text-xs text-gray-500">
                  Include country code (e.g., +1 for US)
                </p>

                <div className="flex gap-3">
                  <Button
                    onClick={async () => {
                      setShowPhonePrompt(false);
                      setPhoneNumber("");
                      setIsLoading(true);
                      
                      try {
                        const response = await backend.onboarding.updateStep({
                          user_id: userId,
                          step: 5
                        });
                        
                        if (response.onboarding_completed) {
                          if (isMobilePhone) {
                            setIsLoading(false);
                            setCurrentStep(5);
                          } else {
                            try {
                              const completionResponse = await backend.onboarding.complete({ user_id: userId });
                              setIsLoading(false);
                              onComplete(firstName || "User", completionResponse.welcome_message);
                            } catch (completeError) {
                              console.error("Failed to complete onboarding:", completeError);
                              setIsLoading(false);
                              onComplete(firstName || "User", "Welcome! Let's get started with your wellness journey.");
                            }
                          }
                        } else {
                          setIsLoading(false);
                          setCurrentStep(response.current_step);
                        }
                      } catch (error) {
                        await logErrorSilently(error, {
                          componentName: 'OnboardingFlow',
                          errorType: 'api_failure',
                          apiEndpoint: '/onboarding/update-step',
                          severity: 'medium',
                        });
                        setEmmaMessage("Let's try that again.");
                        setIsLoading(false);
                      }
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Skip
                  </Button>
                  <Button
                    onClick={async () => {
                      setShowPhonePrompt(false);
                      setIsLoading(true);
                      
                      const updateData: any = {
                        user_id: userId,
                        step: 5,
                        phone_number: phoneNumber || undefined
                      };

                      try {
                        const response = await backend.onboarding.updateStep(updateData);
                        
                        if (response.onboarding_completed) {
                          if (isMobilePhone) {
                            setIsLoading(false);
                            setCurrentStep(5);
                          } else {
                            try {
                              const completionResponse = await backend.onboarding.complete({ user_id: userId });
                              setIsLoading(false);
                              onComplete(firstName || "User", completionResponse.welcome_message);
                            } catch (completeError) {
                              console.error("Failed to complete onboarding:", completeError);
                              setIsLoading(false);
                              onComplete(firstName || "User", "Welcome! Let's get started with your wellness journey.");
                            }
                          }
                        } else {
                          setIsLoading(false);
                          setCurrentStep(response.current_step);
                        }
                      } catch (error) {
                        await logErrorSilently(error, {
                          componentName: 'OnboardingFlow',
                          errorType: 'api_failure',
                          apiEndpoint: '/onboarding/update-step',
                          severity: 'medium',
                        });
                        setEmmaMessage("Let's try that again.");
                        setIsLoading(false);
                      }
                    }}
                    disabled={!phoneNumber.trim()}
                    className="flex-1 bg-gradient-to-r from-[#4e8f71] via-[#364d89] to-[#6656cb] hover:opacity-90 text-white"
                  >
                    {isLoading ? "Saving..." : "Continue"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
