import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import type { CareTeamMember, CareTeamMemberType } from "~backend/care_team/types";
import { demoStorage } from "@/lib/demo-storage";
import {
  Users,
  Heart,
  Stethoscope,
  Activity,
  Dumbbell,
  Brain,
  Smile,
  Apple,
  Edit,
  Trash2,
  Mail,
  Phone,
  Building,
  AlertCircle,
  Check,
  X,
  Star,
} from "lucide-react";

interface CareTeamListProps {
  userId: string;
  members: CareTeamMember[];
  onUpdate: () => void;
}

const MEMBER_TYPE_CONFIG: Record<CareTeamMemberType, { label: string; icon: any; color: string }> = {
  family: { label: "Family", icon: Heart, color: "text-pink-600 bg-pink-100 dark:bg-pink-900" },
  caretaker: { label: "Caretaker", icon: Users, color: "text-purple-600 bg-purple-100 dark:bg-purple-900" },
  primary_care: { label: "Primary Care", icon: Stethoscope, color: "text-blue-600 bg-blue-100 dark:bg-blue-900" },
  specialist: { label: "Specialist", icon: Activity, color: "text-indigo-600 bg-indigo-100 dark:bg-indigo-900" },
  chiropractor: { label: "Chiropractor", icon: Activity, color: "text-teal-600 bg-teal-100 dark:bg-teal-900" },
  physical_therapist: { label: "Physical Therapist", icon: Dumbbell, color: "text-green-600 bg-green-100 dark:bg-green-900" },
  mental_health: { label: "Mental Health", icon: Brain, color: "text-violet-600 bg-violet-100 dark:bg-violet-900" },
  nutritionist: { label: "Nutritionist", icon: Apple, color: "text-lime-600 bg-lime-100 dark:bg-lime-900" },
  personal_trainer: { label: "Personal Trainer", icon: Dumbbell, color: "text-orange-600 bg-orange-100 dark:bg-orange-900" },
  dentist: { label: "Dentist", icon: Smile, color: "text-cyan-600 bg-cyan-100 dark:bg-cyan-900" },
  other: { label: "Other", icon: Users, color: "text-gray-600 bg-gray-100 dark:bg-gray-700" },
};

export function CareTeamList({ userId, members, onUpdate }: CareTeamListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<CareTeamMember>>({});
  const { toast } = useToast();

  const handleEdit = (member: CareTeamMember) => {
    setEditingId(member.id);
    setEditForm(member);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSaveEdit = async (id: string) => {
    try {
      demoStorage.updateMember(id, {
        name: editForm.name,
        relationship: editForm.relationship,
        phone: editForm.phone,
        email: editForm.email,
        fax: editForm.fax,
        specialty: editForm.specialty,
        organization: editForm.organization,
        address: editForm.address,
        notes: editForm.notes,
      });

      toast({
        title: "Updated successfully",
        description: `${editForm.name}'s information has been updated`,
      });

      setEditingId(null);
      setEditForm({});
      onUpdate();
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error updating member",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from your care team?`)) {
      return;
    }

    try {
      demoStorage.deleteMember(id);
      toast({
        title: "Member removed",
        description: `${name} has been removed from your care team`,
      });
      onUpdate();
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error removing member",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const groupedMembers = members.reduce((acc, member) => {
    if (!acc[member.memberType]) {
      acc[member.memberType] = [];
    }
    acc[member.memberType].push(member);
    return acc;
  }, {} as Record<CareTeamMemberType, CareTeamMember[]>);

  if (members.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-200 dark:border-gray-700">
        <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No team members yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Click "Start Building Team" above to add your first care team member
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedMembers).map(([type, typeMembers]) => {
        const config = MEMBER_TYPE_CONFIG[type as CareTeamMemberType];
        const Icon = config.icon;

        return (
          <div key={type} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <div className={`w-8 h-8 rounded-lg ${config.color} flex items-center justify-center mr-3`}>
                  <Icon className="w-4 h-4" />
                </div>
                {config.label}
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                  ({typeMembers.length})
                </span>
              </h3>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {typeMembers.map((member) => (
                <div key={member.id} className="p-6">
                  {editingId === member.id ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Name
                          </label>
                          <Input
                            value={editForm.name || ""}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          />
                        </div>
                        {member.memberType === "family" || member.memberType === "caretaker" ? (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Relationship
                            </label>
                            <Input
                              value={editForm.relationship || ""}
                              onChange={(e) => setEditForm({ ...editForm, relationship: e.target.value })}
                            />
                          </div>
                        ) : (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Specialty
                            </label>
                            <Input
                              value={editForm.specialty || ""}
                              onChange={(e) => setEditForm({ ...editForm, specialty: e.target.value })}
                            />
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Phone
                          </label>
                          <Input
                            value={editForm.phone || ""}
                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Email
                          </label>
                          <Input
                            type="email"
                            value={editForm.email || ""}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          />
                        </div>
                      </div>

                      {member.memberType !== "family" && member.memberType !== "caretaker" && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Organization
                            </label>
                            <Input
                              value={editForm.organization || ""}
                              onChange={(e) => setEditForm({ ...editForm, organization: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Fax
                            </label>
                            <Input
                              value={editForm.fax || ""}
                              onChange={(e) => setEditForm({ ...editForm, fax: e.target.value })}
                            />
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Notes
                        </label>
                        <textarea
                          value={editForm.notes || ""}
                          onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button onClick={() => handleSaveEdit(member.id)} className="bg-green-600 hover:bg-green-700">
                          <Check className="w-4 h-4 mr-2" />
                          Save Changes
                        </Button>
                        <Button onClick={handleCancelEdit} variant="outline">
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                            {member.name}
                            {member.isPrimary && (
                              <Star className="w-4 h-4 ml-2 text-yellow-500 fill-yellow-500" />
                            )}
                          </h4>
                          {(member.relationship || member.specialty) && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {member.relationship || member.specialty}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(member)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(member.id, member.name)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {member.phone && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Phone className="w-4 h-4 mr-2" />
                            <a href={`tel:${member.phone}`} className="hover:text-blue-600">
                              {member.phone}
                            </a>
                          </div>
                        )}
                        {member.email ? (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Mail className="w-4 h-4 mr-2" />
                            <a href={`mailto:${member.email}`} className="hover:text-blue-600">
                              {member.email}
                            </a>
                          </div>
                        ) : member.emailPending && (
                          <div className="flex items-center text-sm text-amber-600 dark:text-amber-400">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            <span>Email needed</span>
                          </div>
                        )}
                        {member.organization && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Building className="w-4 h-4 mr-2" />
                            <span>{member.organization}</span>
                          </div>
                        )}
                        {member.fax && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Phone className="w-4 h-4 mr-2" />
                            <span>Fax: {member.fax}</span>
                          </div>
                        )}
                      </div>

                      {member.notes && (
                        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {member.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
