import type { CareTeamMember, CareTeamSetupProgress } from "~backend/care_team/types";

let memberIdCounter = 1;
const demoMembers: CareTeamMember[] = [];
const demoProgress: Map<string, CareTeamSetupProgress> = new Map();

export const demoStorage = {
  addMember: (userId: string, memberData: any): CareTeamMember => {
    const member: CareTeamMember = {
      id: `demo_${memberIdCounter++}`,
      userId,
      memberType: memberData.memberType,
      relationship: memberData.relationship,
      name: memberData.name,
      phone: memberData.phone,
      email: memberData.email,
      fax: memberData.fax,
      specialty: memberData.specialty,
      organization: memberData.organization,
      address: memberData.address,
      notes: memberData.notes,
      isPrimary: memberData.isPrimary || false,
      emailPending: !!memberData.email,
      isActive: true,
      addedAt: new Date(),
      updatedAt: new Date(),
    };
    demoMembers.push(member);
    return member;
  },

  listMembers: (userId: string, activeOnly: boolean = true) => {
    return demoMembers.filter(m => 
      m.userId === userId && (!activeOnly || m.isActive)
    );
  },

  getMember: (id: string) => {
    return demoMembers.find(m => m.id === id) || null;
  },

  updateMember: (id: string, updates: any): CareTeamMember | null => {
    const index = demoMembers.findIndex(m => m.id === id);
    if (index === -1) return null;
    
    demoMembers[index] = {
      ...demoMembers[index],
      ...updates,
      id: demoMembers[index].id,
      userId: demoMembers[index].userId,
      updatedAt: new Date(),
    };
    return demoMembers[index];
  },

  deleteMember: (id: string): boolean => {
    const member = demoMembers.find(m => m.id === id);
    if (!member) return false;
    member.isActive = false;
    member.updatedAt = new Date();
    return true;
  },

  getProgress: (userId: string): CareTeamSetupProgress => {
    let progress = demoProgress.get(userId);
    if (!progress) {
      progress = {
        userId,
        currentStep: 0,
        totalSteps: 7,
        stepsCompleted: [],
        isCompleted: false,
        startedAt: new Date(),
        lastUpdated: new Date(),
      };
      demoProgress.set(userId, progress);
    }
    return progress;
  },

  updateProgress: (userId: string, currentStep: number, stepsCompleted: string[], isCompleted: boolean): CareTeamSetupProgress => {
    const existing = demoStorage.getProgress(userId);
    const progress: CareTeamSetupProgress = {
      ...existing,
      currentStep,
      stepsCompleted,
      isCompleted,
      completedAt: isCompleted && !existing.completedAt ? new Date() : existing.completedAt,
      lastUpdated: new Date(),
    };
    demoProgress.set(userId, progress);
    return progress;
  }
};
