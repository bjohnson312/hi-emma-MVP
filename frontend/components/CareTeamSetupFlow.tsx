import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import type { CareTeamSetupProgress, CareTeamMemberType } from "~backend/care_team/types";
import { demoStorage } from "@/lib/demo-storage";
import {
  Users,
  Heart,
  Stethoscope,
  Activity,
  Sparkles,
  Check,
  ArrowLeft,
  ArrowRight,
  X,
} from "lucide-react";

interface CareTeamSetupFlowProps {
  userId: string;
  existingProgress: CareTeamSetupProgress | null;
  onComplete: () => void;
  onExit: () => void;
}

interface StepConfig {
  id: string;
  title: string;
  description: string;
  icon: any;
  memberType: CareTeamMemberType;
  examples: string;
  relationshipLabel?: string;
  optional?: boolean;
}

const SETUP_STEPS: StepConfig[] = [
  {
    id: "family",
    title: "Family & Loved Ones",
    description: "Who are the family members or loved ones involved in your care?",
    icon: Heart,
    memberType: "family",
    examples: "Spouse, parent, sibling, adult child",
    relationshipLabel: "Relationship",
  },
  {
    id: "caretaker",
    title: "Caretakers & Helpers",
    description: "Do you have anyone who helps with daily care or activities?",
    icon: Users,
    memberType: "caretaker",
    examples: "Home health aide, companion, personal assistant",
    relationshipLabel: "Role",
    optional: true,
  },
  {
    id: "primary_care",
    title: "Primary Care Physician",
    description: "Who is your main doctor for general health concerns?",
    icon: Stethoscope,
    memberType: "primary_care",
    examples: "Family doctor, general practitioner",
  },
  {
    id: "specialists",
    title: "Specialists",
    description: "Do you see any specialist doctors?",
    icon: Activity,
    memberType: "specialist",
    examples: "Cardiologist, endocrinologist, dermatologist",
    optional: true,
  },
  {
    id: "allied_health",
    title: "Allied Health Providers",
    description: "Are there other healthcare providers on your team?",
    icon: Sparkles,
    memberType: "chiropractor",
    examples: "Chiropractor, physical therapist, mental health provider",
    optional: true,
  },
  {
    id: "wellness",
    title: "Wellness Support",
    description: "Who helps with nutrition, fitness, or overall wellness?",
    icon: Activity,
    memberType: "nutritionist",
    examples: "Nutritionist, personal trainer, wellness coach",
    optional: true,
  },
  {
    id: "review",
    title: "Review Your Team",
    description: "Let's review everyone you've added so far",
    icon: Check,
    memberType: "family",
    examples: "",
  },
];

export function CareTeamSetupFlow({ userId, existingProgress, onComplete, onExit }: CareTeamSetupFlowProps) {
  const [currentStep, setCurrentStep] = useState(existingProgress?.currentStep || 0);
  const [stepsCompleted, setStepsCompleted] = useState<string[]>(
    existingProgress?.stepsCompleted || []
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [addedThisStep, setAddedThisStep] = useState(false);

  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [fax, setFax] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [organization, setOrganization] = useState("");
  const [notes, setNotes] = useState("");

  const { toast } = useToast();

  const step = SETUP_STEPS[currentStep];
  const isReviewStep = step.id === "review";
  const totalSteps = SETUP_STEPS.length;
  const progressPercent = Math.round(((currentStep + 1) / totalSteps) * 100);

  useEffect(() => {
    saveProgress();
  }, [currentStep, stepsCompleted]);

  const saveProgress = async () => {
    if (!userId) return;
    
    try {
      const updatedSteps = addedThisStep && !stepsCompleted.includes(SETUP_STEPS[currentStep].id)
        ? [...stepsCompleted, SETUP_STEPS[currentStep].id]
        : stepsCompleted;
      
      demoStorage.updateProgress(
        userId,
        currentStep,
        updatedSteps,
        currentStep >= totalSteps - 1
      );
    } catch (error) {
      console.error("Failed to save progress:", error);
    }
  };

  const resetForm = () => {
    setName("");
    setRelationship("");
    setPhone("");
    setEmail("");
    setFax("");
    setSpecialty("");
    setOrganization("");
    setNotes("");
  };

  const handleAddMember = async () => {
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for this care team member",
        variant: "destructive",
      });
      return;
    }

    try {
      demoStorage.addMember(userId, {
        memberType: step.memberType,
        name: name.trim(),
        relationship: relationship.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        fax: fax.trim() || undefined,
        specialty: specialty.trim() || undefined,
        organization: organization.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      toast({
        title: "Team member added! ✓",
        description: `${name} has been added to your care team`,
      });

      setAddedThisStep(true);
      setShowAddForm(false);
      resetForm();

      if (!stepsCompleted.includes(step.id)) {
        setStepsCompleted([...stepsCompleted, step.id]);
      }
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error adding member",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
      setAddedThisStep(false);
      setShowAddForm(false);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setAddedThisStep(false);
      setShowAddForm(false);
    }
  };

  const handleSkip = () => {
    if (!stepsCompleted.includes(step.id)) {
      setStepsCompleted([...stepsCompleted, step.id]);
    }
    handleNext();
  };

  const handleComplete = async () => {
    try {
      demoStorage.updateProgress(
        userId,
        totalSteps - 1,
        [...new Set([...stepsCompleted, "review"])],
        true
      );
      onComplete();
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error completing setup",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const StepIcon = step.icon;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-blue-500 to-purple-600">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">
              Building Your Care Team
            </h2>
            <button
              onClick={onExit}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="bg-white/20 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-white/90 text-sm mt-2">
            Step {currentStep + 1} of {totalSteps} • {progressPercent}% Complete
          </p>
        </div>

        <div className="p-8">
          {!isReviewStep ? (
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <StepIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    {step.description}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Examples: {step.examples}
                  </p>
                </div>
              </div>

              {!showAddForm ? (
                <div className="space-y-4">
                  <Button
                    onClick={() => setShowAddForm(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    size="lg"
                  >
                    <Users className="w-5 h-5 mr-2" />
                    Add {step.title.split(" ")[0]} Member
                  </Button>

                  <div className="flex items-center space-x-4">
                    {currentStep > 0 && (
                      <Button onClick={handleBack} variant="outline" className="flex-1">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                      </Button>
                    )}
                    {step.optional && (
                      <Button onClick={handleSkip} variant="outline" className="flex-1">
                        Skip for Now
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                    {!step.optional && addedThisStep && (
                      <Button onClick={handleNext} className="flex-1 bg-green-600 hover:bg-green-700">
                        Continue
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Name *
                    </label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full name"
                    />
                  </div>

                  {step.relationshipLabel && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {step.relationshipLabel}
                      </label>
                      <Input
                        value={relationship}
                        onChange={(e) => setRelationship(e.target.value)}
                        placeholder={`e.g., ${step.examples.split(",")[0]}`}
                      />
                    </div>
                  )}

                  {(step.memberType === "specialist" || step.memberType === "chiropractor") && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Specialty
                      </label>
                      <Input
                        value={specialty}
                        onChange={(e) => setSpecialty(e.target.value)}
                        placeholder="What is their specialty?"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone
                    </label>
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email {!email && "(we'll remind you to add this later)"}
                    </label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                    />
                  </div>

                  {step.memberType !== "family" && step.memberType !== "caretaker" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Organization/Practice
                        </label>
                        <Input
                          value={organization}
                          onChange={(e) => setOrganization(e.target.value)}
                          placeholder="Hospital, clinic, or practice name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Fax
                        </label>
                        <Input
                          type="tel"
                          value={fax}
                          onChange={(e) => setFax(e.target.value)}
                          placeholder="(555) 123-4568"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any additional information..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="flex items-center space-x-4">
                    <Button
                      onClick={() => {
                        setShowAddForm(false);
                        resetForm();
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleAddMember} className="flex-1 bg-green-600 hover:bg-green-700">
                      <Check className="w-4 h-4 mr-2" />
                      Add to Team
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Great Work!
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  You've made excellent progress building your care team. You can always add more members later from the Care Team page.
                </p>
              </div>

              <div className="flex items-center space-x-4">
                <Button onClick={handleBack} variant="outline" className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button onClick={handleComplete} className="flex-1 bg-green-600 hover:bg-green-700">
                  Complete Setup
                  <Check className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
