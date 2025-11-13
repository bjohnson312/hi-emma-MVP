import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, Users, Shield, Mail, Phone, MoreVertical } from "lucide-react";

const DEMO_TEAM_MEMBERS = [
  {
    id: "1",
    name: "Dr. Robert Smith",
    role: "Admin",
    specialty: "Primary Care",
    email: "dr.smith@hospital.com",
    phone: "(555) 123-4567",
    patients: 24,
    status: "active",
  },
  {
    id: "2",
    name: "Nurse Emma Johnson",
    role: "Provider",
    specialty: "Nursing",
    email: "emma.j@hospital.com",
    phone: "(555) 234-5678",
    patients: 18,
    status: "active",
  },
  {
    id: "3",
    name: "Dr. Sarah Williams",
    role: "Provider",
    specialty: "Endocrinology",
    email: "s.williams@hospital.com",
    phone: "(555) 345-6789",
    patients: 12,
    status: "active",
  },
  {
    id: "4",
    name: "Maria Rodriguez",
    role: "Care Coordinator",
    specialty: "Social Work",
    email: "m.rodriguez@hospital.com",
    phone: "(555) 456-7890",
    patients: 24,
    status: "active",
  },
  {
    id: "5",
    name: "John Davis (Family)",
    role: "Family Member",
    specialty: "N/A",
    email: "john.d@email.com",
    phone: "(555) 567-8901",
    patients: 1,
    status: "active",
  },
];

const ROLES = [
  { value: "admin", label: "Admin", description: "Full access to all features" },
  { value: "provider", label: "Provider", description: "Clinical access to assigned patients" },
  { value: "coordinator", label: "Care Coordinator", description: "Team management and scheduling" },
  { value: "family", label: "Family Member", description: "Read-only access to specific patient" },
];

export default function CareTeamView() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    role: "provider",
    specialty: "",
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin": return "bg-purple-100 text-purple-800 border-purple-300";
      case "provider": return "bg-blue-100 text-blue-800 border-blue-300";
      case "care coordinator": return "bg-green-100 text-green-800 border-green-300";
      case "family member": return "bg-gray-100 text-gray-800 border-gray-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Care Team Management</h2>
          <p className="text-gray-600">Manage providers, nurses, caregivers, and family members</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Add Team Member
        </Button>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Team Member</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <Input
                value={newMember.name}
                onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                placeholder="Dr. Jane Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <Input
                type="email"
                value={newMember.email}
                onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                placeholder="jane.doe@hospital.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <select
                value={newMember.role}
                onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
              >
                {ROLES.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label} - {role.description}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Specialty</label>
              <Input
                value={newMember.specialty}
                onChange={(e) => setNewMember({ ...newMember, specialty: e.target.value })}
                placeholder="Cardiology"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={() => {
              setShowAddForm(false);
              setNewMember({ name: "", email: "", role: "provider", specialty: "" });
            }}>
              Add Member
            </Button>
            <Button variant="outline" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Team Members</p>
              <p className="text-3xl font-bold text-gray-900">{DEMO_TEAM_MEMBERS.length}</p>
            </div>
            <div className="bg-blue-100 text-blue-600 p-3 rounded-lg">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active Providers</p>
              <p className="text-3xl font-bold text-green-600">
                {DEMO_TEAM_MEMBERS.filter(m => m.role.includes("Provider") || m.role.includes("Admin")).length}
              </p>
            </div>
            <div className="bg-green-100 text-green-600 p-3 rounded-lg">
              <Shield className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Care Coordinators</p>
              <p className="text-3xl font-bold text-purple-600">
                {DEMO_TEAM_MEMBERS.filter(m => m.role.includes("Coordinator")).length}
              </p>
            </div>
            <div className="bg-purple-100 text-purple-600 p-3 rounded-lg">
              <UserPlus className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Family Members</p>
              <p className="text-3xl font-bold text-orange-600">
                {DEMO_TEAM_MEMBERS.filter(m => m.role.includes("Family")).length}
              </p>
            </div>
            <div className="bg-orange-100 text-orange-600 p-3 rounded-lg">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Team Members</h3>
          <p className="text-sm text-gray-600 mt-1">View and manage your care team</p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {DEMO_TEAM_MEMBERS.map((member) => (
              <div
                key={member.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-[#6656cb] transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-full bg-[#6656cb] text-white flex items-center justify-center font-bold">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-lg font-semibold text-gray-900">{member.name}</h4>
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getRoleBadgeColor(member.role)}`}>
                          {member.role}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{member.specialty}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {member.email}
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {member.phone}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {member.patients} patients
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <MoreVertical className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Roles & Permissions</h3>
          <p className="text-sm text-gray-600 mt-1">Understanding team member access levels</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ROLES.map((role) => (
              <div key={role.value} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">{role.label}</h4>
                <p className="text-sm text-gray-600">{role.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
