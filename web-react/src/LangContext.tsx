import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';

// ── Language type ──────────────────────────────────────────────────────────
type Lang = 'ru' | 'en';

// ── Translation dictionaries ───────────────────────────────────────────────

interface CommonStrings {
  login: string;
  logout: string;
  username: string;
  password: string;
  submit: string;
  cancel: string;
  save: string;
  delete: string;
  edit: string;
  create: string;
  back: string;
  search: string;
  loading: string;
  error: string;
  success: string;
  confirm: string;
  yes: string;
  no: string;
  name: string;
  status: string;
  actions: string;
  date: string;
  amount: string;
  category: string;
  description: string;
  room: string;
  floor: string;
  type: string;
  capacity: string;
  notes: string;
  guests: string;
  checkIn: string;
  checkOut: string;
  passport: string;
  phone: string;
  email: string;
  active: string;
  inactive: string;
  free: string;
  occupied: string;
  cleaning: string;
  repair: string;
  pending: string;
  inProgress: string;
  done: string;
  cancelled: string;
  low: string;
  medium: string;
  high: string;
  urgent: string;
  income: string;
  expense: string;
  medication: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate: string;
  loginFailed: string;
  sessionExpired: string;
  welcomeBack: string;
  welcome: string;
  profile: string;
  settings: string;
  dashboard: string;
  noData: string;
  filter: string;
  all: string;
  assignedTo: string;
  dueDate: string;
  priority: string;
  title: string;
  resolved: string;
  unresolved: string;
}

interface TabStrings {
  dashboard: string;
  chessboard: string;
  tasks: string;
  guests: string;
  finance: string;
  medical: string;
  sos: string;
  users: string;
}

const COMMON_RU: CommonStrings = {
  login: 'Войти',
  logout: 'Выйти',
  username: 'Логин',
  password: 'Пароль',
  submit: 'Отправить',
  cancel: 'Отмена',
  save: 'Сохранить',
  delete: 'Удалить',
  edit: 'Редактировать',
  create: 'Создать',
  back: 'Назад',
  search: 'Поиск',
  loading: 'Загрузка…',
  error: 'Ошибка',
  success: 'Успешно',
  confirm: 'Подтвердить',
  yes: 'Да',
  no: 'Нет',
  name: 'Имя',
  status: 'Статус',
  actions: 'Действия',
  date: 'Дата',
  amount: 'Сумма',
  category: 'Категория',
  description: 'Описание',
  room: 'Номер',
  floor: 'Этаж',
  type: 'Тип',
  capacity: 'Вместимость',
  notes: 'Заметки',
  guests: 'Гости',
  checkIn: 'Заселение',
  checkOut: 'Выселение',
  passport: 'Паспорт',
  phone: 'Телефон',
  email: 'Email',
  active: 'Активен',
  inactive: 'Неактивен',
  free: 'Свободен',
  occupied: 'Занят',
  cleaning: 'Уборка',
  repair: 'Ремонт',
  pending: 'Ожидает',
  inProgress: 'В процессе',
  done: 'Готово',
  cancelled: 'Отменено',
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
  urgent: 'Срочный',
  income: 'Доход',
  expense: 'Расход',
  medication: 'Препарат',
  dosage: 'Дозировка',
  frequency: 'Частота',
  startDate: 'Дата начала',
  endDate: 'Дата окончания',
  loginFailed: 'Неверный логин или пароль',
  sessionExpired: 'Сессия истекла, войдите снова',
  welcomeBack: 'С возвращением',
  welcome: 'Добро пожаловать',
  profile: 'Профиль',
  settings: 'Настройки',
  dashboard: 'Панель управления',
  noData: 'Нет данных',
  filter: 'Фильтр',
  all: 'Все',
  assignedTo: 'Исполнитель',
  dueDate: 'Срок',
  priority: 'Приоритет',
  title: 'Название',
  resolved: 'Решено',
  unresolved: 'Не решено',
};

const COMMON_EN: CommonStrings = {
  login: 'Log in',
  logout: 'Log out',
  username: 'Username',
  password: 'Password',
  submit: 'Submit',
  cancel: 'Cancel',
  save: 'Save',
  delete: 'Delete',
  edit: 'Edit',
  create: 'Create',
  back: 'Back',
  search: 'Search',
  loading: 'Loading…',
  error: 'Error',
  success: 'Success',
  confirm: 'Confirm',
  yes: 'Yes',
  no: 'No',
  name: 'Name',
  status: 'Status',
  actions: 'Actions',
  date: 'Date',
  amount: 'Amount',
  category: 'Category',
  description: 'Description',
  room: 'Room',
  floor: 'Floor',
  type: 'Type',
  capacity: 'Capacity',
  notes: 'Notes',
  guests: 'Guests',
  checkIn: 'Check-in',
  checkOut: 'Check-out',
  passport: 'Passport',
  phone: 'Phone',
  email: 'Email',
  active: 'Active',
  inactive: 'Inactive',
  free: 'Free',
  occupied: 'Occupied',
  cleaning: 'Cleaning',
  repair: 'Repair',
  pending: 'Pending',
  inProgress: 'In Progress',
  done: 'Done',
  cancelled: 'Cancelled',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
  income: 'Income',
  expense: 'Expense',
  medication: 'Medication',
  dosage: 'Dosage',
  frequency: 'Frequency',
  startDate: 'Start Date',
  endDate: 'End Date',
  loginFailed: 'Invalid username or password',
  sessionExpired: 'Session expired, please log in again',
  welcomeBack: 'Welcome back',
  welcome: 'Welcome',
  profile: 'Profile',
  settings: 'Settings',
  dashboard: 'Dashboard',
  noData: 'No data',
  filter: 'Filter',
  all: 'All',
  assignedTo: 'Assignee',
  dueDate: 'Due Date',
  priority: 'Priority',
  title: 'Title',
  resolved: 'Resolved',
  unresolved: 'Unresolved',
};

export const TL_RU: TabStrings = {
  dashboard: 'Панель управления',
  chessboard: 'Номерной фонд',
  tasks: 'Задачи',
  guests: 'Постояльцы',
  finance: 'Финансы',
  medical: 'Медицина',
  sos: 'SOS',
  users: 'Сотрудники',
};

export const TL_EN: TabStrings = {
  dashboard: 'Dashboard',
  chessboard: 'Rooms',
  tasks: 'Tasks',
  guests: 'Guests',
  finance: 'Finance',
  medical: 'Medical',
  sos: 'SOS',
  users: 'Staff',
};

export const ROLE_NAMES_RU: Record<string, string> = {
  owner: 'Владелец',
  manager: 'Управляющий',
  administrator: 'Администратор',
  doctor: 'Врач',
  maid: 'Горничная',
};

export const ROLE_NAMES_EN: Record<string, string> = {
  owner: 'Owner',
  manager: 'Manager',
  administrator: 'Administrator',
  doctor: 'Doctor',
  maid: 'Maid',
};

// ── Context shape ──────────────────────────────────────────────────────────
interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  /** Translate a common UI key */
  RL: (key: keyof CommonStrings) => string;
  /** Translate a navigation tab key */
  TL: (key: keyof TabStrings) => string;
  /** Translate a role name */
  roleName: (role: string) => string;
}

const LangContext = createContext<LangContextValue | null>(null);

// ── Provider ───────────────────────────────────────────────────────────────
export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem('pansion_lang') as Lang) || 'ru';
  });

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem('pansion_lang', l);
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((prev) => {
      const next = prev === 'ru' ? 'en' : 'ru';
      localStorage.setItem('pansion_lang', next);
      return next;
    });
  }, []);

  const RL = useCallback(
    (key: keyof CommonStrings): string => {
      return lang === 'ru' ? COMMON_RU[key] : COMMON_EN[key];
    },
    [lang],
  );

  const TL = useCallback(
    (key: keyof TabStrings): string => {
      return lang === 'ru' ? TL_RU[key] : TL_EN[key];
    },
    [lang],
  );

  const roleName = useCallback(
    (role: string): string => {
      const dict = lang === 'ru' ? ROLE_NAMES_RU : ROLE_NAMES_EN;
      return dict[role] ?? role;
    },
    [lang],
  );

  const value = useMemo<LangContextValue>(
    () => ({ lang, setLang, toggleLang, RL, TL, roleName }),
    [lang, setLang, toggleLang, RL, TL, roleName],
  );

  return (
    <LangContext.Provider value={value}>
      {children}
    </LangContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────
export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) {
    throw new Error('useLang must be used within a <LangProvider>');
  }
  return ctx;
}

export default LangContext;
