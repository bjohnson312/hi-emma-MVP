import { useState } from "react";
import { BookOpen, Target, Heart, Lightbulb, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import backend from "@/lib/backend-client";
import { useToast } from "@/components/ui/use-toast";
import { logErrorSilently } from "@/lib/silent-error-handler";

interface WellnessJournalOnboardingProps {
  userId: string;
  onComplete: () => void;
}

const GOAL_TEMPLATES = [
  {
    title: "Improve Sleep Quality",
    description: "Build better sleep habits and wake up feeling refreshed",
    icon: "🌙",
    sections: [
      { title: "Evening Routine", description: "Wind down activities before bed", frequency: "daily" as const, target: 30 },
      { title: "Caffeine Cutoff", description: "No caffeine after 2 PM", frequency: "daily" as const, target: 30 },
      { title: "Gratitude Reflection", description: "3 things you're grateful for", frequency: "daily" as const, target: 30 }
    ]
  },
  {
    title: "Lower Stress and Anxiety",
    description: "Develop coping strategies and find moments of calm",
    icon: "🧘",
    sections: [
      { title: "Morning Breathing", description: "5 minutes of deep breathing", frequency: "daily" as const, target: 30 },
      { title: "Mood Check-in", description: "Track your emotional state", frequency: "daily" as const, target: 30 },
      { title: "Midday Pause", description: "Brief mental reset during the day", frequency: "daily" as const, target: 21 }
    ]
  },
  {
    title: "Increase Energy Through Movement",
    description: "Build consistent physical activity into your routine",
    icon: "⚡",
    sections: [
      { title: "Morning Stretch", description: "Gentle stretching to wake up", frequency: "daily" as const, target: 30 },
      { title: "Daily Walk", description: "Get outside for 15+ minutes", frequency: "daily" as const, target: 21 },
      { title: "Movement Break", description: "Stand and move every hour", frequency: "daily" as const, target: 21 }
    ]
  },
  {
    title: "Eat Healthier",
    description: "Make mindful food choices and build better eating habits",
    icon: "🥗",
    sections: [
      { title: "Breakfast Log", description: "Track your morning meal", frequency: "daily" as const, target: 30 },
      { title: "Hydration Check", description: "Drink 8 glasses of water", frequency: "daily" as const, target: 30 },
      { title: "Meal Reflection", description: "Notice how food makes you feel", frequency: "daily" as const, target: 21 }
    ]
  },
  {
    title: "Stay Consistent with Medications",
    description: "Never miss a dose and track how you're feeling",
    icon: "💊",
    sections: [
      { title: "Morning Medications", description: "Take medications on schedule", frequency: "daily" as const, target: 30 },
      { title: "Side Effect Tracking", description: "Note any changes or reactions", frequency: "as_needed" as const },
      { title: "Progress Notes", description: "How are you feeling overall?", frequency: "weekly" as const, target: 4 }
    ]
  }
];

export default function WellnessJournalOnboarding({ userId, onComplete }: WellnessJournalOnboardingProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [customGoal, setCustomGoal] = useState({ title: "", motivation: "", vision: "" });
  const [creating, setCreating] = useState(false);

  async function handleCreateFromTemplate() {
    if (selectedTemplate === null) {
      toast({
        title: "Please select a goal",
        description: "Choose one of the wellness goals to get started.",
        variant: "default"
      });
      return;
    }

    setCreating(true);
    try {
      const template = GOAL_TEMPLATES[selectedTemplate];
      
      const chapter = await backend.wellness_journal.createChapter({
        user_id: userId,
        title: template.title,
        description: template.description,
        motivation: `I want to ${template.description.toLowerCase()}`,
        target_outcome: `Successfully complete daily habits for 30 days`,
        completion_vision: `I will feel more balanced and in control of my ${template.title.toLowerCase()}`
      });

      for (const sectionTemplate of template.sections) {
        await backend.wellness_journal.createSection({
          chapter_id: chapter.id,
          user_id: userId,
          title: sectionTemplate.title,
          description: sectionTemplate.description,
          habit_type: sectionTemplate.title.toLowerCase().replace(/\s+/g, '_'),
          tracking_frequency: sectionTemplate.frequency,
          target_count: sectionTemplate.target
        });
      }

      toast({
        title: "Chapter Created!",
        description: `Your "${template.title}" chapter is ready. Let's start building your story!`,
      });

      onComplete();
    } catch (error) {
      await logErrorSilently(error, {
        componentName: 'WellnessJournalOnboarding',
        errorType: 'api_failure',
        apiEndpoint: '/wellness_journal/create-chapter',
        severity: 'low',
      });
      toast({
        title: "Unable to create chapter",
        description: "Please try again in a moment",
        variant: "default"
      });
    } finally {
      setCreating(false);
    }
  }

  async function handleCreateCustomGoal() {
    if (!customGoal.title.trim() || !customGoal.motivation.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a title and motivation for your goal.",
        variant: "default"
      });
      return;
    }

    setCreating(true);
    try {
      await backend.wellness_journal.createChapter({
        user_id: userId,
        title: customGoal.title,
        description: customGoal.motivation,
        motivation: customGoal.motivation,
        completion_vision: customGoal.vision || undefined
      });

      toast({
        title: "Chapter Created!",
        description: `Your "${customGoal.title}" chapter is ready!`,
      });

      onComplete();
    } catch (error) {
      await logErrorSilently(error, {
        componentName: 'WellnessJournalOnboarding',
        errorType: 'api_failure',
        apiEndpoint: '/wellness_journal/create-chapter',
        severity: 'low',
      });
      toast({
        title: "Unable to create chapter",
        description: "Please try again in a moment",
        variant: "default"
      });
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {step === 0 && (
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-white/40">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#4e8f71]/20 to-[#364d89]/20 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-10 h-10 text-[#4e8f71]" />
            </div>
            <h2 className="text-3xl font-bold text-[#323e48] mb-2">Welcome to Your Wellness Journal</h2>
            <p className="text-lg text-[#323e48]/70">Let's start writing your health transformation story</p>
          </div>

          <div className="bg-gradient-to-r from-[#4e8f71]/10 to-[#364d89]/10 rounded-2xl p-6 mb-8">
            <h3 className="font-bold text-[#323e48] text-lg mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#4e8f71]" />
              How It Works
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white/90 rounded-xl p-4">
                <div className="text-2xl mb-2">📖</div>
                <h4 className="font-bold text-[#323e48] mb-1">Your Book</h4>
                <p className="text-sm text-[#323e48]/70">Your ongoing health story, always growing</p>
              </div>
              <div className="bg-white/90 rounded-xl p-4">
                <div className="text-2xl mb-2">📚</div>
                <h4 className="font-bold text-[#323e48] mb-1">Chapters</h4>
                <p className="text-sm text-[#323e48]/70">Major wellness goals you're working toward</p>
              </div>
              <div className="bg-white/90 rounded-xl p-4">
                <div className="text-2xl mb-2">✍️</div>
                <h4 className="font-bold text-[#323e48] mb-1">Pages</h4>
                <p className="text-sm text-[#323e48]/70">Daily habits and reflections that build progress</p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Button
              onClick={() => setStep(1)}
              className="bg-gradient-to-r from-[#4e8f71] to-[#364d89] hover:from-[#3d7259] hover:to-[#2a3d6f] text-white shadow-xl px-8"
            >
              Start Your First Chapter
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-white/40">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#323e48] mb-2">Choose Your First Chapter</h2>
            <p className="text-[#323e48]/70">Pick a wellness goal that resonates with you</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {GOAL_TEMPLATES.map((template, index) => (
              <button
                key={index}
                onClick={() => setSelectedTemplate(index)}
                className={`text-left p-6 rounded-2xl border-2 transition-all ${
                  selectedTemplate === index
                    ? "border-[#4e8f71] bg-gradient-to-r from-[#4e8f71]/10 to-[#364d89]/10 shadow-lg"
                    : "border-[#323e48]/10 bg-white/90 hover:border-[#4e8f71]/50"
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-3xl">{template.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-bold text-[#323e48] mb-1">{template.title}</h3>
                    <p className="text-sm text-[#323e48]/70">{template.description}</p>
                  </div>
                </div>
                <div className="text-xs text-[#323e48]/60">
                  {template.sections.length} habits included
                </div>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={() => setStep(0)}
              variant="outline"
              className="border-[#323e48]/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={handleCreateFromTemplate}
              disabled={selectedTemplate === null || creating}
              className="flex-1 bg-gradient-to-r from-[#4e8f71] to-[#364d89] hover:from-[#3d7259] hover:to-[#2a3d6f] text-white shadow-xl"
            >
              {creating ? "Creating Your Chapter..." : "Create Chapter"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              onClick={() => setStep(2)}
              variant="outline"
              className="border-[#4e8f71]"
            >
              Create Custom Goal
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-white/40">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#323e48] mb-2">Create Your Custom Chapter</h2>
            <p className="text-[#323e48]/70">Design a wellness goal that's uniquely yours</p>
          </div>

          <div className="space-y-6 mb-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-[#323e48] mb-2">
                <Target className="w-4 h-4 text-[#4e8f71]" />
                What's your wellness goal?
              </label>
              <Input
                value={customGoal.title}
                onChange={(e) => setCustomGoal({ ...customGoal, title: e.target.value })}
                placeholder="e.g., Build a Consistent Morning Routine"
                className="bg-white/90 border-[#4e8f71]/20"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-[#323e48] mb-2">
                <Heart className="w-4 h-4 text-[#4e8f71]" />
                Why does this matter to you?
              </label>
              <textarea
                value={customGoal.motivation}
                onChange={(e) => setCustomGoal({ ...customGoal, motivation: e.target.value })}
                placeholder="Share your motivation..."
                rows={3}
                className="w-full px-3 py-2 bg-white/90 border border-[#4e8f71]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4e8f71] resize-none"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-[#323e48] mb-2">
                <Lightbulb className="w-4 h-4 text-[#4e8f71]" />
                How will you feel when you achieve this? (optional)
              </label>
              <textarea
                value={customGoal.vision}
                onChange={(e) => setCustomGoal({ ...customGoal, vision: e.target.value })}
                placeholder="Imagine your future self..."
                rows={3}
                className="w-full px-3 py-2 bg-white/90 border border-[#4e8f71]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4e8f71] resize-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={() => setStep(1)}
              variant="outline"
              className="border-[#323e48]/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={handleCreateCustomGoal}
              disabled={creating}
              className="flex-1 bg-gradient-to-r from-[#4e8f71] to-[#364d89] hover:from-[#3d7259] hover:to-[#2a3d6f] text-white shadow-xl"
            >
              {creating ? "Creating Your Chapter..." : "Create Chapter"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
