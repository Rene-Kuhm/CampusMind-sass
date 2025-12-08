// Study Groups Library - localStorage-based for demo
// In production, this would connect to the backend API

export interface GroupMember {
  id: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'moderator' | 'member';
  joinedAt: Date;
  online?: boolean;
}

export interface GroupMessage {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: Date;
  type: 'text' | 'resource' | 'announcement';
  resourceLink?: string;
}

export interface SharedResource {
  id: string;
  title: string;
  type: 'note' | 'flashcard' | 'quiz' | 'link' | 'file';
  sharedBy: string;
  sharedAt: Date;
  link?: string;
  description?: string;
}

export interface StudyGroup {
  id: string;
  name: string;
  description: string;
  subject?: string;
  coverImage?: string;
  coverGradient: string;
  createdAt: Date;
  updatedAt: Date;
  members: GroupMember[];
  messages: GroupMessage[];
  resources: SharedResource[];
  isPublic: boolean;
  maxMembers: number;
  tags: string[];
  inviteCode: string;
}

const STORAGE_KEY = 'campusmind-study-groups';

// Generate invite code
function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Default user for demo
export const DEMO_USER: GroupMember = {
  id: 'user-1',
  name: 'Tú',
  role: 'admin',
  joinedAt: new Date(),
  online: true,
};

// Sample groups for demo
const SAMPLE_GROUPS: StudyGroup[] = [
  {
    id: 'group-1',
    name: 'Cálculo Avanzado',
    description: 'Grupo para estudiar cálculo diferencial e integral. Compartimos ejercicios y resolvemos dudas.',
    subject: 'Matemáticas',
    coverGradient: 'from-blue-500 to-indigo-600',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    members: [
      DEMO_USER,
      { id: 'member-2', name: 'María García', role: 'moderator', joinedAt: new Date(), online: true },
      { id: 'member-3', name: 'Carlos López', role: 'member', joinedAt: new Date(), online: false },
      { id: 'member-4', name: 'Ana Martínez', role: 'member', joinedAt: new Date(), online: true },
    ],
    messages: [
      {
        id: 'msg-1',
        authorId: 'member-2',
        authorName: 'María García',
        content: '¿Alguien puede ayudarme con las integrales por partes?',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        type: 'text',
      },
      {
        id: 'msg-2',
        authorId: 'member-3',
        authorName: 'Carlos López',
        content: 'Claro, te comparto mis apuntes sobre el tema',
        createdAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
        type: 'text',
      },
    ],
    resources: [
      {
        id: 'res-1',
        title: 'Fórmulas de integración',
        type: 'note',
        sharedBy: 'María García',
        sharedAt: new Date(),
        description: 'Resumen de todas las fórmulas de integración básicas',
      },
    ],
    isPublic: true,
    maxMembers: 20,
    tags: ['cálculo', 'matemáticas', 'universidad'],
    inviteCode: 'CALC01',
  },
  {
    id: 'group-2',
    name: 'Programación Web',
    description: 'Aprendemos desarrollo web juntos: HTML, CSS, JavaScript, React y más.',
    subject: 'Informática',
    coverGradient: 'from-emerald-500 to-teal-600',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    members: [
      DEMO_USER,
      { id: 'member-5', name: 'Pedro Sánchez', role: 'admin', joinedAt: new Date(), online: false },
      { id: 'member-6', name: 'Laura Fernández', role: 'member', joinedAt: new Date(), online: true },
    ],
    messages: [],
    resources: [],
    isPublic: true,
    maxMembers: 15,
    tags: ['programación', 'web', 'react'],
    inviteCode: 'WEB123',
  },
];

// Get all groups
export function getStudyGroups(): StudyGroup[] {
  if (typeof window === 'undefined') return [];

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    // Initialize with sample groups
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_GROUPS));
    return SAMPLE_GROUPS;
  }

  try {
    const groups = JSON.parse(stored);
    return groups.map((g: StudyGroup) => ({
      ...g,
      createdAt: new Date(g.createdAt),
      updatedAt: new Date(g.updatedAt),
      members: g.members.map(m => ({ ...m, joinedAt: new Date(m.joinedAt) })),
      messages: g.messages.map(m => ({ ...m, createdAt: new Date(m.createdAt) })),
      resources: g.resources.map(r => ({ ...r, sharedAt: new Date(r.sharedAt) })),
    }));
  } catch {
    return SAMPLE_GROUPS;
  }
}

// Get single group by ID
export function getStudyGroup(id: string): StudyGroup | null {
  const groups = getStudyGroups();
  return groups.find(g => g.id === id) || null;
}

// Get group by invite code
export function getGroupByInviteCode(code: string): StudyGroup | null {
  const groups = getStudyGroups();
  return groups.find(g => g.inviteCode === code) || null;
}

// Create new group
export function createStudyGroup(
  data: Omit<StudyGroup, 'id' | 'createdAt' | 'updatedAt' | 'members' | 'messages' | 'resources' | 'inviteCode'>
): StudyGroup {
  const groups = getStudyGroups();

  const newGroup: StudyGroup = {
    ...data,
    id: generateId(),
    createdAt: new Date(),
    updatedAt: new Date(),
    members: [{ ...DEMO_USER, role: 'admin', joinedAt: new Date() }],
    messages: [],
    resources: [],
    inviteCode: generateInviteCode(),
  };

  groups.push(newGroup);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));

  return newGroup;
}

// Update group
export function updateStudyGroup(
  id: string,
  updates: Partial<Omit<StudyGroup, 'id' | 'createdAt' | 'inviteCode'>>
): StudyGroup | null {
  const groups = getStudyGroups();
  const index = groups.findIndex(g => g.id === id);

  if (index === -1) return null;

  groups[index] = {
    ...groups[index],
    ...updates,
    updatedAt: new Date(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
  return groups[index];
}

// Delete group
export function deleteStudyGroup(id: string): boolean {
  const groups = getStudyGroups();
  const index = groups.findIndex(g => g.id === id);

  if (index === -1) return false;

  groups.splice(index, 1);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));

  return true;
}

// Join group
export function joinStudyGroup(groupId: string, member: GroupMember = DEMO_USER): StudyGroup | null {
  const groups = getStudyGroups();
  const group = groups.find(g => g.id === groupId);

  if (!group) return null;
  if (group.members.length >= group.maxMembers) return null;
  if (group.members.some(m => m.id === member.id)) return group;

  group.members.push({ ...member, role: 'member', joinedAt: new Date() });
  group.updatedAt = new Date();

  localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
  return group;
}

// Leave group
export function leaveStudyGroup(groupId: string, memberId: string = DEMO_USER.id): boolean {
  const groups = getStudyGroups();
  const group = groups.find(g => g.id === groupId);

  if (!group) return false;

  const memberIndex = group.members.findIndex(m => m.id === memberId);
  if (memberIndex === -1) return false;

  group.members.splice(memberIndex, 1);
  group.updatedAt = new Date();

  localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
  return true;
}

// Add message to group
export function addGroupMessage(
  groupId: string,
  message: Omit<GroupMessage, 'id' | 'createdAt'>
): GroupMessage | null {
  const groups = getStudyGroups();
  const group = groups.find(g => g.id === groupId);

  if (!group) return null;

  const newMessage: GroupMessage = {
    ...message,
    id: generateId(),
    createdAt: new Date(),
  };

  group.messages.push(newMessage);
  group.updatedAt = new Date();

  localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
  return newMessage;
}

// Add resource to group
export function addGroupResource(
  groupId: string,
  resource: Omit<SharedResource, 'id' | 'sharedAt'>
): SharedResource | null {
  const groups = getStudyGroups();
  const group = groups.find(g => g.id === groupId);

  if (!group) return null;

  const newResource: SharedResource = {
    ...resource,
    id: generateId(),
    sharedAt: new Date(),
  };

  group.resources.push(newResource);
  group.updatedAt = new Date();

  localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
  return newResource;
}

// Get public groups for discovery
export function getPublicGroups(): StudyGroup[] {
  const groups = getStudyGroups();
  return groups.filter(g => g.isPublic);
}

// Search groups
export function searchStudyGroups(query: string): StudyGroup[] {
  const groups = getStudyGroups();
  const lowerQuery = query.toLowerCase();

  return groups.filter(g =>
    g.name.toLowerCase().includes(lowerQuery) ||
    g.description.toLowerCase().includes(lowerQuery) ||
    g.tags.some(t => t.toLowerCase().includes(lowerQuery)) ||
    g.subject?.toLowerCase().includes(lowerQuery)
  );
}

// Available gradients
export const GROUP_GRADIENTS = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-violet-500 to-purple-600',
  'from-pink-500 to-rose-600',
  'from-orange-500 to-red-600',
  'from-cyan-500 to-blue-600',
  'from-amber-500 to-orange-600',
  'from-lime-500 to-green-600',
];
