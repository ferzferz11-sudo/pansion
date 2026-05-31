// Pansion CRM TypeScript types

export type Role = 'owner' | 'manager' | 'administrator' | 'doctor' | 'maid';

export type RoomStatus = 'vacant' | 'booked' | 'occupied' | 'checking_out_today';
export type GuestStatus = 'queue' | 'active' | 'archived';
export type TransactionType = 'income' | 'expense';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type TransactionCategory = 'rent' | 'food' | 'chemicals' | 'salary' | 'maintenance' | 'utilities' | 'other';
export type TaskType = 'linen_change' | 'wet_cleaning' | 'watering_flowers';
export type UserStatus = 'active' | 'inactive';

export interface User {
  id: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  role: string;
  status: string;
}

export interface Room {
  id: string;
  number: string;
  floor: number;
  status: RoomStatus;
  last_cleaned_at?: string;
}

export interface Guest {
  id: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  birth_date?: string;
  diet_type: string;
  character_notes?: string;
  status: GuestStatus;
  room_number?: string;
  room_id?: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: TransactionCategory;
  description: string;
  created_at: string;
}

export interface FinanceSummary {
  income: number;
  expense: number;
  balance: number;
}

export interface Prescription {
  id: string;
  guest_name: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  start_date: string;
  end_date: string;
}

export interface MedLog {
  id: string;
  guest_name: string;
  medication_name: string;
  scheduled_time: string;
  status: string;
  nurse_name?: string;
}

export interface Task {
  id: string;
  room_number: string;
  task_type: TaskType;
  status: TaskStatus;
  maid_id?: string;
  created_at: string;
  completed_at?: string;
}

export interface SosAlert {
  id: number;
  room_id?: string;
  sender_id: string;
  message: string;
  status: string;
  created_at: string;
}

export interface RoleInfo {
  name: string;
  user_count: number;
}

export type TabKey = 'dashboard' | 'chessboard' | 'tasks' | 'guests' | 'finance' | 'medical' | 'sos' | 'users';

export interface TabVisibility {
  role: string;
  tab_key: string;
  visible: boolean;
}

export interface DashboardStats {
  table: string;
  count: number;
}

export interface RoomStats {
  status: string;
  count: number;
}

export interface DashboardData {
  stats: DashboardStats[];
  room_stats: RoomStats[];
  finance: FinanceSummary;
  sos_active: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  tab_visibility?: TabVisibility[];
}

export const ROLE_NAMES_RU: Record<string, string> = {
  owner: 'Владелец',
  manager: 'Управляющий',
  administrator: 'Администратор',
  doctor: 'Врач',
  maid: 'Горничная',
  receptionist: 'Регистратор',
};

export const ROLE_NAMES_EN: Record<string, string> = {
  owner: 'Owner',
  manager: 'Manager',
  administrator: 'Administrator',
  doctor: 'Doctor',
  maid: 'Maid',
  receptionist: 'Receptionist',
};

export const TL_RU: Record<string, string> = {
  dashboard: 'Панель управления',
  chessboard: 'Номерной фонд',
  tasks: 'Задачи',
  guests: 'Постояльцы',
  finance: 'Финансы',
  medical: 'Медицина',
  sos: 'SOS',
  users: 'Сотрудники',
};

export const TL_EN: Record<string, string> = {
  dashboard: 'Dashboard',
  chessboard: 'Rooms',
  tasks: 'Tasks',
  guests: 'Guests',
  finance: 'Finance',
  medical: 'Medical',
  sos: 'SOS',
  users: 'Staff',
};

export interface TabVisibility {
  role: string;
  tab_key: string;
  visible: boolean;
}

export const DEFAULT_TAB_VISIBILITY: TabVisibility[] = [
  { role: 'owner', tab_key: 'chessboard', visible: true },
  { role: 'owner', tab_key: 'tasks', visible: true },
  { role: 'owner', tab_key: 'guests', visible: true },
  { role: 'owner', tab_key: 'finance', visible: true },
  { role: 'owner', tab_key: 'medical', visible: true },
  { role: 'owner', tab_key: 'sos', visible: true },
  { role: 'owner', tab_key: 'users', visible: true },
  { role: 'manager', tab_key: 'chessboard', visible: true },
  { role: 'manager', tab_key: 'tasks', visible: true },
  { role: 'manager', tab_key: 'guests', visible: true },
  { role: 'manager', tab_key: 'finance', visible: true },
  { role: 'manager', tab_key: 'medical', visible: true },
  { role: 'manager', tab_key: 'sos', visible: true },
  { role: 'manager', tab_key: 'users', visible: true },
  { role: 'doctor', tab_key: 'guests', visible: true },
  { role: 'doctor', tab_key: 'medical', visible: true },
  { role: 'doctor', tab_key: 'sos', visible: true },
  { role: 'maid', tab_key: 'tasks', visible: true },
  { role: 'maid', tab_key: 'sos', visible: true },
];
