import { useState } from "react";
import { Volume2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VoiceOption } from "~backend/voice/types";

interface VoiceSelectorProps {
  voices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  onVoiceChange: (voice: SpeechSynthesisVoice) => void;
  elevenLabsVoices: VoiceOption[];
  selectedElevenLabsVoice: VoiceOption | null;
  onElevenLabsVoiceChange: (voice: VoiceOption) => void;
}

export default function VoiceSelector({ 
  voices, 
  selectedVoice, 
  onVoiceChange,
  elevenLabsVoices,
  selectedElevenLabsVoice,
  onElevenLabsVoiceChange 
}: VoiceSelectorProps) {
  const [testText] = useState("Hi, this is how I sound!");
  const [activeTab, setActiveTab] = useState<'browser' | 'elevenlabs'>('elevenlabs');
  const [testingVoiceId, setTestingVoiceId] = useState<string | null>(null);

  const handleTestElevenLabs = async (voice: VoiceOption) => {
    try {
      setTestingVoiceId(voice.id);
      const backend = (await import('~backend/client')).default;
      const { audioUrl } = await backend.voice.generateSpeech({
        text: testText,
        voiceId: voice.id,
      });
      
      const audio = new Audio(audioUrl);
      audio.onended = () => setTestingVoiceId(null);
      audio.onerror = () => setTestingVoiceId(null);
      await audio.play();
    } catch (error) {
      console.error('Failed to test ElevenLabs voice:', error);
      setTestingVoiceId(null);
    }
  };

  const englishVoices = voices.filter(voice => 
    voice.lang.startsWith('en') &&
    (voice.name.toLowerCase().includes('female') ||
     voice.name.toLowerCase().includes('woman') ||
     voice.name.includes('Samantha') ||
     voice.name.includes('Ava') ||
     voice.name.includes('Allison') ||
     voice.name.includes('Karen') ||
     voice.name.includes('Moira') ||
     voice.name.includes('Tessa') ||
     voice.name.includes('Fiona') ||
     voice.name.includes('Victoria') ||
     voice.name.includes('Veena') ||
     voice.name.includes('Nicky') ||
     voice.name.includes('Aria') ||
     voice.name.includes('Jenny') ||
     voice.name.includes('Zira') ||
     voice.name.includes('Michelle') ||
     voice.name.includes('Linda') ||
     voice.name.includes('Heather') ||
     voice.name.includes('Sara') ||
     voice.name.includes('Laura') ||
     (!voice.name.toLowerCase().includes('male') && !voice.name.toLowerCase().includes('man'))
    )
  ).sort((a, b) => {
    const aIsUS = a.lang.includes('en-US');
    const bIsUS = b.lang.includes('en-US');
    if (aIsUS && !bIsUS) return -1;
    if (!aIsUS && bIsUS) return 1;
    return a.name.localeCompare(b.name);
  });

  const handleTest = (voice: SpeechSynthesisVoice) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(testText);
    utterance.voice = voice;
    utterance.rate = 0.92;
    utterance.pitch = 1.08;
    utterance.volume = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  const getVoiceLabel = (voice: SpeechSynthesisVoice) => {
    const name = voice.name.replace(/^(Google|Microsoft|Apple)\s+/i, '');
    const lang = voice.lang.includes('US') ? '🇺🇸' : 
                 voice.lang.includes('GB') || voice.lang.includes('UK') ? '🇬🇧' : 
                 voice.lang.includes('AU') ? '🇦🇺' : 
                 voice.lang.includes('IN') ? '🇮🇳' : '';
    return `${name} ${lang}`;
  };

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm font-medium text-[#323e48]">
        <Volume2 className="w-4 h-4" />
        Emma's Voice
      </label>
      
      <div className="flex gap-2 mb-3">
        <Button
          onClick={() => setActiveTab('elevenlabs')}
          variant={activeTab === 'elevenlabs' ? 'default' : 'ghost'}
          className={`flex-1 ${
            activeTab === 'elevenlabs'
              ? 'bg-gradient-to-r from-[#4e8f71] to-[#364d89] text-white'
              : 'text-[#323e48]'
          }`}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          ElevenLabs
        </Button>
        <Button
          onClick={() => setActiveTab('browser')}
          variant={activeTab === 'browser' ? 'default' : 'ghost'}
          className={`flex-1 ${
            activeTab === 'browser'
              ? 'bg-gradient-to-r from-[#4e8f71] to-[#364d89] text-white'
              : 'text-[#323e48]'
          }`}
        >
          <Volume2 className="w-4 h-4 mr-2" />
          Browser
        </Button>
      </div>

      {activeTab === 'elevenlabs' && (
        <div className="max-h-64 overflow-y-auto space-y-2 bg-white/50 rounded-xl p-3">
          {elevenLabsVoices.length === 0 ? (
            <p className="text-sm text-[#323e48]/60 text-center py-4">
              Loading ElevenLabs voices...
            </p>
          ) : (
            elevenLabsVoices.map((voice) => (
              <div
                key={voice.id}
                className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                  selectedElevenLabsVoice?.id === voice.id
                    ? 'bg-gradient-to-r from-[#4e8f71]/20 to-[#364d89]/20 border-2 border-[#4e8f71]/40'
                    : 'bg-white/80 border border-[#323e48]/10 hover:bg-white'
                }`}
              >
                <button
                  onClick={() => onElevenLabsVoiceChange(voice)}
                  className="flex-1 text-left"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3 h-3 text-[#4e8f71]" />
                    <p className="text-sm font-medium text-[#323e48]">
                      {voice.name}
                    </p>
                  </div>
                  {voice.description && (
                    <p className="text-xs text-[#323e48]/50 ml-5">
                      {voice.description}
                    </p>
                  )}
                </button>
                
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTestElevenLabs(voice);
                  }}
                  size="sm"
                  variant="ghost"
                  className="text-[#4e8f71] hover:bg-[#4e8f71]/10 ml-2"
                  disabled={testingVoiceId === voice.id}
                >
                  {testingVoiceId === voice.id ? 'Playing...' : 'Test'}
                </Button>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'browser' && (
        <div className="max-h-64 overflow-y-auto space-y-2 bg-white/50 rounded-xl p-3">
          {englishVoices.length === 0 ? (
            <p className="text-sm text-[#323e48]/60 text-center py-4">
              No voices available
            </p>
          ) : (
            englishVoices.map((voice, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                  selectedVoice?.name === voice.name
                    ? 'bg-gradient-to-r from-[#4e8f71]/20 to-[#364d89]/20 border-2 border-[#4e8f71]/40'
                    : 'bg-white/80 border border-[#323e48]/10 hover:bg-white'
                }`}
              >
                <button
                  onClick={() => {
                    onVoiceChange(voice);
                  }}
                  className="flex-1 text-left"
                >
                  <p className="text-sm font-medium text-[#323e48]">
                    {getVoiceLabel(voice)}
                  </p>
                  <p className="text-xs text-[#323e48]/50">
                    {voice.localService ? 'Local' : 'Network'}
                  </p>
                </button>
                
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTest(voice);
                  }}
                  size="sm"
                  variant="ghost"
                  className="text-[#4e8f71] hover:bg-[#4e8f71]/10 ml-2"
                >
                  Test
                </Button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
