import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import type { CareTeamMember } from "~backend/care_team/types";
import type { CareTeamSetupProgress } from "~backend/care_team/types";
import { CareTeamSetupFlow } from "../CareTeamSetupFlow";
import { CareTeamList } from "../CareTeamList";
import { Users, UserPlus, CheckCircle, AlertCircle, ArrowRight, Info } from "lucide-react";
import { demoStorage } from "@/lib/demo-storage";

interface CareTeamViewProps {
  userId?: string;
}

export function CareTeamView({ userId }: CareTeamViewProps) {
  const [members, setMembers] = useState<CareTeamMember[]>([]);
  const [progress, setProgress] = useState<CareTeamSetupProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSetupFlow, setShowSetupFlow] = useState(false);
  const { toast } = useToast();

  const currentUserId = userId || localStorage.getItem("emma_user_id") || "";

  useEffect(() => {
    if (currentUserId) {
      loadData();
    }
  }, [currentUserId]);

  const loadData = async () => {
    if (!currentUserId) return;
    
    setLoading(true);
    try {
      const membersData = demoStorage.listMembers(currentUserId, true);
      const progressData = demoStorage.getProgress(currentUserId);
      
      setMembers(membersData);
      setProgress(progressData);

      if (!progressData.isCompleted && membersData.length === 0) {
        setShowSetupFlow(true);
      }
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error loading care team",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetupComplete = () => {
    setShowSetupFlow(false);
    loadData();
    toast({
      title: "Care Team Setup Complete! 🎉",
      description: "You've assembled your care team. This milestone has been added to your achievements!",
    });
  };

  const handleContinueSetup = () => {
    setShowSetupFlow(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 dark:text-gray-400">Loading your care team...</div>
      </div>
    );
  }

  if (showSetupFlow) {
    return (
      <CareTeamSetupFlow
        userId={currentUserId}
        existingProgress={progress}
        onComplete={handleSetupComplete}
        onExit={() => setShowSetupFlow(false)}
      />
    );
  }

  const membersNeedingEmail = members.filter(m => m.emailPending);
  const progressPercent = progress ? Math.round((progress.currentStep / progress.totalSteps) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Demo Mode Active
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              You're using demo data stored in your browser. All changes work fully but will reset when you refresh the page. Backend integration will sync this data when connected.
            </p>
          </div>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center mb-2">
              <Users className="w-8 h-8 mr-3 text-blue-600" />
              Your Care Team
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Build and manage your personal support network
            </p>
          </div>
          <Button onClick={handleContinueSetup} className="bg-blue-600 hover:bg-blue-700">
            {members.length === 0 ? (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Start Building Team
              </>
            ) : progress?.isCompleted ? (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Team Member
              </>
            ) : (
              <>
                <ArrowRight className="w-4 h-4 mr-2" />
                Continue Setup ({progressPercent}%)
              </>
            )}
          </Button>
        </div>

        {!progress?.isCompleted && members.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Setup In Progress
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  You're {progressPercent}% done! Continue building your care team to unlock the completion milestone.
                </p>
                <div className="mt-3 bg-white dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {progress?.isCompleted && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  Care Team Complete! 🎉
                </p>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  You've built a strong support network. You can continue adding more team members anytime.
                </p>
              </div>
            </div>
          </div>
        )}

        {membersNeedingEmail.length > 0 && (
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  Missing Email Addresses
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  {membersNeedingEmail.length} team member{membersNeedingEmail.length !== 1 ? 's' : ''} need email addresses added.
                  Click on their card below to update.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <CareTeamList
        userId={currentUserId}
        members={members}
        onUpdate={loadData}
      />
    </div>
  );
}
