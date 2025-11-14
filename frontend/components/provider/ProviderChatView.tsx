import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, History, RefreshCw, Mic, MicOff, Volume2, VolumeX, Clock, Settings } from "lucide-react";
import backend from "~backend/client";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import VoiceSelector from "@/components/VoiceSelector";
import Tooltip from "@/components/Tooltip";

interface Message {
  sender: "user" | "emma";
  text: string;
}

export default function ProviderChatView() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [conversationComplete, setConversationComplete] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [showVoiceSelector, setShowVoiceSelector] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastMessageCountRef = useRef(0);

  const {
    transcript,
    isListening,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    error: speechError
  } = useSpeechRecognition();

  const {
    speak,
    stop: stopSpeaking,
    isSpeaking,
    isSupported: isTTSSupported,
    voices,
    selectedVoice,
    setSelectedVoice,
    elevenLabsVoices,
    selectedElevenLabsVoice,
    setSelectedElevenLabsVoice
  } = useTextToSpeech();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();

    if (voiceEnabled && isTTSSupported && messages.length > lastMessageCountRef.current) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.sender === "emma") {
        speak(lastMessage.text);
      }
    }
    lastMessageCountRef.current = messages.length;
  }, [messages, voiceEnabled, isTTSSupported]);

  useEffect(() => {
    if (transcript) {
      setCurrentInput(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    startConversation();
  }, []);

  const startConversation = async () => {
    setLoading(true);
    try {
      let providerId = "demo-provider";
      
      try {
        const providerDataStr = localStorage.getItem("provider_data");
        if (providerDataStr) {
          const providerData = JSON.parse(providerDataStr);
          providerId = providerData.id || providerData.email || "demo-provider";
        }
      } catch (e) {
        console.log("Using default provider ID");
      }

      const response = await backend.provider_chat.chat({
        provider_id: providerId,
        user_message: "Hello"
      });

      setSessionId(response.session_id);
      setMessages([
        {
          sender: "emma",
          text: response.emma_reply
        }
      ]);
      setConversationComplete(response.conversation_complete);
    } catch (error) {
      console.error("Failed to start conversation:", error);
      setMessages([
        {
          sender: "emma",
          text: "Good morning! How are you doing today? Would you like me to give you a summary of your appointments today or do you have questions about a specific patient?"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!currentInput.trim() || loading) return;

    const userMessage = currentInput.trim();
    setCurrentInput("");
    resetTranscript();

    setMessages(prev => [...prev, { sender: "user", text: userMessage }]);
    setLoading(true);

    try {
      let providerId = "demo-provider";
      
      try {
        const providerDataStr = localStorage.getItem("provider_data");
        if (providerDataStr) {
          const providerData = JSON.parse(providerDataStr);
          providerId = providerData.id || providerData.email || "demo-provider";
        }
      } catch (e) {
        console.log("Using default provider ID");
      }

      const response = await backend.provider_chat.chat({
        provider_id: providerId,
        user_message: userMessage,
        session_id: sessionId || undefined
      });

      setSessionId(response.session_id);
      setMessages(prev => [...prev, { sender: "emma", text: response.emma_reply }]);
      setConversationComplete(response.conversation_complete);
    } catch (error: any) {
      console.error("Failed to send message:", error);
      const errorMessage = error?.message || error?.toString() || "Unknown error";
      console.error("Error details:", errorMessage);
      setMessages(prev => [...prev, { 
        sender: "emma", 
        text: `I apologize, but I'm having trouble processing that right now. Error: ${errorMessage}. Please try again.` 
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      setCurrentInput("");
      startListening();
    }
  };

  const toggleVoice = () => {
    if (voiceEnabled) {
      stopSpeaking();
    }
    setVoiceEnabled(!voiceEnabled);
  };

  const handleVoiceChange = (voice: SpeechSynthesisVoice) => {
    setSelectedVoice(voice);
    setShowVoiceSelector(false);
  };

  const handleElevenLabsVoiceChange = (voice: any) => {
    setSelectedElevenLabsVoice(voice);
    setShowVoiceSelector(false);
  };

  const handleResetRequest = () => {
    if (messages.length > 2 && !conversationComplete) {
      setShowResetConfirm(true);
    } else {
      confirmReset();
    }
  };

  const confirmReset = () => {
    setMessages([]);
    setCurrentInput("");
    setSessionId(null);
    setConversationComplete(false);
    setShowResetConfirm(false);
    startConversation();
  };

  const handleEndConversation = async () => {
    if (loading) return;
    
    setMessages(prev => [...prev, { sender: "user", text: "I need to go now, let's talk later" }]);
    setLoading(true);

    try {
      let providerId = "demo-provider";
      
      try {
        const providerDataStr = localStorage.getItem("provider_data");
        if (providerDataStr) {
          const providerData = JSON.parse(providerDataStr);
          providerId = providerData.id || providerData.email || "demo-provider";
        }
      } catch (e) {
        console.log("Using default provider ID");
      }

      const response = await backend.provider_chat.chat({
        provider_id: providerId,
        user_message: "I need to go now, let's talk later",
        session_id: sessionId || undefined
      });

      setMessages(prev => [...prev, { sender: "emma", text: response.emma_reply }]);
      setConversationComplete(true);
    } catch (error) {
      console.error("Failed to end conversation:", error);
    } finally {
      setLoading(false);
    }
  };

  const cancelReset = () => {
    setShowResetConfirm(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <div className="inline-block bg-white/20 backdrop-blur-sm rounded-2xl px-8 py-4">
          <h1 className="text-4xl font-bold text-[#6656cb] mb-1">Provider Assistant</h1>
          <p className="text-lg text-[#323e48]/70">Your AI-powered practice companion</p>
        </div>
      </div>
      
      <div className="h-[600px] bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-white/40">
        <div className="bg-gradient-to-r from-[#4e8f71] via-[#364d89] to-[#6656cb] p-5 flex items-center gap-3 text-white">
          <div className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center shadow-lg">
            <img src="/logo.png" alt="Emma" className="w-8 h-8 object-contain" />
          </div>
          <div className="flex-1">
            <h2 className="font-medium text-xl tracking-wide">Chat with Emma</h2>
            <p className="text-xs text-white/90">Your AI assistant</p>
          </div>
          {isTTSSupported && (
            <>
              <Tooltip content="Choose a different voice for Emma" side="bottom">
                <Button
                  onClick={() => setShowVoiceSelector(!showVoiceSelector)}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 rounded-xl flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </Tooltip>
              <Tooltip content={voiceEnabled ? "Mute Emma's voice" : "Enable Emma's voice"} side="bottom">
                <Button
                  onClick={toggleVoice}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 rounded-xl flex items-center gap-2"
                >
                  {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </Button>
              </Tooltip>
            </>
          )}
          {messages.length > 0 && !showResetConfirm && (
            <Tooltip content="Start a fresh conversation" side="bottom">
              <Button
                onClick={handleResetRequest}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 rounded-xl flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="text-sm">New</span>
              </Button>
            </Tooltip>
          )}
          {showResetConfirm && (
            <div className="flex items-center gap-2 bg-white/20 rounded-xl px-3 py-2">
              <span className="text-sm">Start new?</span>
              <Button
                onClick={confirmReset}
                size="sm"
                className="bg-white/30 hover:bg-white/40 text-white h-7 px-3 rounded-lg"
              >
                Yes
              </Button>
              <Button
                onClick={cancelReset}
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/10 h-7 px-3 rounded-lg"
              >
                No
              </Button>
            </div>
          )}
        </div>

        {showVoiceSelector && (
          <div className="p-4 bg-white/95 backdrop-blur-md border-b border-white/40">
            <VoiceSelector
              voices={voices}
              selectedVoice={selectedVoice}
              onVoiceChange={handleVoiceChange}
              elevenLabsVoices={elevenLabsVoices}
              selectedElevenLabsVoice={selectedElevenLabsVoice}
              onElevenLabsVoiceChange={handleElevenLabsVoiceChange}
            />
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-white/60 to-[#f8fdf9]/80">
          {messages.length === 0 && (
            <div className="flex justify-center items-center h-full">
              <div className="text-center text-[#4e8f71]/50">
                <div className="w-20 h-20 mx-auto mb-4 opacity-40">
                  <img src="/logo.png" alt="Emma" className="w-full h-full object-contain" />
                </div>
                <p className="text-lg">Starting conversation...</p>
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
              <div className={`max-w-[80%] ${message.sender === "user" ? "order-2" : "order-1"}`}>
                {message.sender === "emma" && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#4e8f71] to-[#364d89] flex items-center justify-center shadow-md">
                      <img src="/logo.png" alt="Emma" className="w-4 h-4 object-contain opacity-90" />
                    </div>
                    <span className="text-xs text-[#4e8f71] font-medium">Emma</span>
                  </div>
                )}
                
                <div className="flex items-start gap-2">
                  <div className={`rounded-3xl px-5 py-3 ${
                    message.sender === "user" 
                      ? "bg-gradient-to-br from-[#4e8f71] to-[#364d89] text-white rounded-tr-md shadow-xl" 
                      : "bg-white/95 text-[#323e48] shadow-xl rounded-tl-md border border-white/60 backdrop-blur-sm"
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                  </div>
                  
                  {message.sender === "emma" && index === messages.length - 1 && !loading && isTTSSupported && (
                    <Tooltip content="Replay message" side="right">
                      <Button
                        onClick={() => speak(message.text)}
                        size="sm"
                        variant="ghost"
                        className="text-[#4e8f71] hover:bg-[#4e8f71]/10 rounded-full w-8 h-8 p-0 flex items-center justify-center"
                      >
                        <Volume2 className="w-4 h-4" />
                      </Button>
                    </Tooltip>
                  )}
                </div>

                {message.sender === "user" && (
                  <div className="flex justify-end mt-1">
                    <span className="text-xs text-[#4e8f71]/60">You</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start animate-in fade-in duration-300">
              <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md rounded-3xl px-5 py-3 shadow-xl border border-white/60">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-[#4e8f71] rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-2 h-2 bg-[#364d89] rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                  <div className="w-2 h-2 bg-[#6656cb] rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-white/95 backdrop-blur-md border-t border-white/40">
          {conversationComplete ? (
            <div className="space-y-2">
              <Button 
                onClick={confirmReset}
                className="w-full bg-gradient-to-r from-[#4e8f71] to-[#364d89] hover:from-[#3d7259] hover:to-[#2a3d6f] text-white shadow-xl border-0 py-6 rounded-2xl"
              >
                Start New Conversation
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {speechError && (
                <div className="text-xs text-red-500 px-2">
                  {speechError}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  type="text"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  placeholder={isListening ? "Listening..." : "Type or speak your message..."}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  disabled={loading || isListening}
                  className="flex-1 border-white/40 focus:border-[#4e8f71] focus:ring-[#4e8f71]/20 rounded-2xl px-4 py-6 bg-white/90 backdrop-blur-sm shadow-lg"
                />
                {isSupported && (
                  <Tooltip content={isListening ? "Stop listening" : "Speak your message"} side="top">
                    <Button 
                      onClick={toggleListening}
                      disabled={loading}
                      size="icon"
                      className={`${isListening ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-gradient-to-r from-[#6656cb] to-[#364d89] hover:from-[#5545ba] hover:to-[#2a3d6f]'} text-white shadow-xl border-0 w-14 h-14 rounded-2xl transition-all`}
                    >
                      {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </Button>
                  </Tooltip>
                )}
                <Tooltip content="Send message to Emma" side="top">
                  <Button 
                    onClick={handleSendMessage}
                    disabled={loading || !currentInput.trim()}
                    size="icon"
                    className="bg-gradient-to-r from-[#4e8f71] to-[#364d89] hover:from-[#3d7259] hover:to-[#2a3d6f] text-white shadow-xl border-0 w-14 h-14 rounded-2xl"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </Tooltip>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleEndConversation}
                  variant="outline"
                  disabled={loading}
                  className="flex-1 border-[#323e48]/30 hover:bg-[#323e48]/10 py-3 rounded-2xl flex items-center justify-center gap-2 text-sm"
                >
                  <Clock className="w-4 h-4" />
                  Talk Later
                </Button>
                <Button
                  onClick={() => setShowHistory(!showHistory)}
                  variant="outline"
                  className="flex-1 border-[#4e8f71]/30 hover:bg-[#4e8f71]/10 py-3 rounded-2xl flex items-center justify-center gap-2 text-sm"
                >
                  <History className="w-4 h-4" />
                  {showHistory ? "Hide" : "View"} History
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showHistory && (
        <div className="mt-6 bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-6 border border-white/40">
          <h3 className="text-xl font-semibold text-[#4e8f71] mb-4">Conversation History</h3>
          <p className="text-[#323e48]/60 text-center py-8">History feature coming soon</p>
        </div>
      )}
    </div>
  );
}
