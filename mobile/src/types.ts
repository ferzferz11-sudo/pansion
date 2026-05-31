export type RoomStatus = 'vacant' | 'booked' | 'occupied' | 'checking_out_today';
export type GuestStatus = 'queue' | 'active' | 'archived';
export type TransactionType = 'income' | 'expense';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type TaskType = 'linen_change' | 'wet_cleaning' | 'watering_flowers';
export type UserStatus = 'active' | 'inactive';
export type TransactionCategory = 'rent' | 'food' | 'chemicals' | 'salary' | 'maintenance' | 'utilities' | 'other';

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
  capacity?: number;
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
  phone?: string;
  check_in?: string;
  check_out?: string;
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

export interface FinanceCategory {
  category: string;
  total: number;
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

export interface MaidTask {
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

export interface DashboardStats {
  Table: string;
  Count: number;
}

export interface RoomStats {
  Status: string;
  Count: number;
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
}

export interface TabVisibilityItem {
  role: string;
  tab_key: string;
  visible: boolean;
}

export const ROLE_NAMES: Record<string, string> = {
  owner: 'Владелец',
  manager: 'Управляющий',
  administrator: 'Администратор',
  doctor: 'Врач',
  maid: 'Горничная',
  receptionist: 'Регистратор',
};
