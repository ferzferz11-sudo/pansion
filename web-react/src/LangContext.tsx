import React, { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';

type Lang = 'ru' | 'en';

interface CommonStrings {
  // Auth
  login: string; logout: string; username: string; password: string;
  submit: string; loginFailed: string; sessionExpired: string;
  // Actions
  cancel: string; save: string; delete: string; edit: string; create: string;
  back: string; search: string; confirm: string; yes: string; no: string;
  // Status
  loading: string; error: string; success: string; active: string; inactive: string;
  // Data
  name: string; status: string; actions: string; date: string; amount: string;
  category: string; description: string; type: string;
  // Rooms
  rooms: string; room: string; floor: string;
  vacant: string; booked: string; occupied: string; checkout: string; free: string;
  // Guests
  guests: string; guestsCount: string; queue: string; archived: string;
  checkIn: string; checkOut: string; passport: string;
  // Finance
  // Room status
  roomStatus: string; totalRooms: string; expensesByCategory: string;
  // Finance
  financeSummary: string;
  // Medical
  medical: string; medication: string; dosage: string; frequency: string;
  startDate: string; endDate: string; assignedTo: string; prescriptions: string; todayLog: string;
  // Tasks
  tasks: string; pending: string; inProgress: string; done: string; cancelled: string;
  priority: string; low: string; medium: string; high: string; urgent: string;
  // Users
  users: string; user: string;
  firstName: string; lastName: string; phone: string; email: string;
  role: string; roles: string;
  // Settings
  settings: string; tabSettings: string; tabSettingsDesc: string;
  // Dashboard
  dashboard: string; sos: string; sosDesc: string; sosSuccess: string; alert: string;
  // Misc
  noData: string; filter: string; all: string; capacity: string; notes: string;
  deleteConfirm: string; add: string; dietType: string; newRoleName: string; language: string;
  welcome: string; welcomeBack: string; profile: string;
  // Rooms
  rooms: string;
}

interface TabStrings {
  dashboard: string; chessboard: string; tasks: string; guests: string;
  finance: string; medical: string; sos: string; users: string;
}

const COMMON_RU: CommonStrings = {
  login: 'Войти', logout: 'Выйти', username: 'Логин', password: 'Пароль',
  submit: 'Отправить', loginFailed: 'Неверный логин или пароль', sessionExpired: 'Сессия истекла',
  cancel: 'Отмена', save: 'Сохранить', delete: 'Удалить', edit: 'Редактировать', create: 'Создать',
  back: 'Назад', search: 'Поиск', confirm: 'Подтвердить', yes: 'Да', no: 'Нет',
  loading: 'Загрузка…', error: 'Ошибка', success: 'Успешно', active: 'Активен', inactive: 'Неактивен',
  name: 'Имя', status: 'Статус', actions: 'Действия', date: 'Дата', amount: 'Сумма',
  category: 'Категория', description: 'Описание', type: 'Тип',
  rooms: 'Номера', room: 'Номер', floor: 'Этаж',
  vacant: 'Свободен', booked: 'Бронь', occupied: 'Занят', checkout: 'Выезд', free: 'Свободен',
  guests: 'Постояльцы', guestsCount: 'Постояльцев', queue: 'Ожидает', archived: 'Архив',
  checkIn: 'Заселение', checkOut: 'Выселение', passport: 'Паспорт',
  finance: 'Финансы', transactions: 'Транзакции', income: 'Доход', expense: 'Расход', balance: 'Баланс',
  roomStatus: 'Статус номеров', totalRooms: 'Всего номеров', expensesByCategory: 'Расходы по категориям', financeSummary: 'Финансовый итог',
  medical: 'Медицина', medication: 'Препарат', dosage: 'Дозировка', frequency: 'Частота',
  startDate: 'Дата начала', endDate: 'Дата окончания', assignedTo: 'Назначено',
  prescriptions: 'Назначения', todayLog: 'Журнал на сегодня',
  tasks: 'Задачи', pending: 'Ожидает', inProgress: 'В процессе', done: 'Готово', cancelled: 'Отменено',
  priority: 'Приоритет', low: 'Низкий', medium: 'Средний', high: 'Высокий', urgent: 'Срочный',
  users: 'Сотрудники', user: 'Сотрудник',
  firstName: 'Имя', lastName: 'Фамилия', phone: 'Телефон', email: 'Email',
  role: 'Роль', roles: 'Роли',
  settings: 'Настройки', tabSettings: 'Настройки вкладок', tabSettingsDesc: 'Управляйте тем, какие разделы видны каждой роли сотрудников.',
  dashboard: 'Панель управления', sos: 'SOS', alert: 'Тревога',
  noData: 'Нет данных', filter: 'Фильтр', all: 'Все', capacity: 'Вместимость', notes: 'Заметки',
  deleteConfirm: 'Удалить запись?', add: 'Добавить', dietType: 'Диета', newRoleName: 'Название новой роли', language: 'Язык',
  welcome: 'Добро пожаловать', welcomeBack: 'С возвращением', profile: 'Профиль',
};

const COMMON_EN: CommonStrings = {
  login: 'Log in', logout: 'Log out', username: 'Username', password: 'Password',
  submit: 'Submit', loginFailed: 'Invalid username or password', sessionExpired: 'Session expired',
  cancel: 'Cancel', save: 'Save', delete: 'Delete', edit: 'Edit', create: 'Create',
  back: 'Back', search: 'Search', confirm: 'Confirm', yes: 'Yes', no: 'No',
  loading: 'Loading…', error: 'Error', success: 'Success', active: 'Active', inactive: 'Inactive',
  name: 'Name', status: 'Status', actions: 'Actions', date: 'Date', amount: 'Amount',
  category: 'Category', description: 'Description', type: 'Type',
  rooms: 'Rooms', room: 'Room', floor: 'Floor',
  vacant: 'Vacant', booked: 'Booked', occupied: 'Occupied', checkout: 'Checkout', free: 'Free',
  guests: 'Guests', guestsCount: 'Guests', queue: 'Queue', archived: 'Archived',
  checkIn: 'Check-in', checkOut: 'Check-out', passport: 'Passport',
  finance: 'Finance', transactions: 'Transactions', income: 'Income', expense: 'Expense', balance: 'Balance',
  roomStatus: 'Room Status', totalRooms: 'Total rooms', expensesByCategory: 'Expenses by Category', financeSummary: 'Finance Summary',
  medical: 'Medical', medication: 'Medication', dosage: 'Dosage', frequency: 'Frequency',
  startDate: 'Start Date', endDate: 'End Date', assignedTo: 'Assigned To',
  prescriptions: 'Prescriptions', todayLog: "Today's Log",
  tasks: 'Tasks', pending: 'Pending', inProgress: 'In Progress', done: 'Done', cancelled: 'Cancelled',
  priority: 'Priority', low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent',
  users: 'Staff', user: 'User',
  firstName: 'First Name', lastName: 'Last Name', phone: 'Phone', email: 'Email',
  role: 'Role', roles: 'Roles',
  settings: 'Settings', tabSettings: 'Tab Settings', tabSettingsDesc: 'Manage which sections are visible to each staff role.',
  dashboard: 'Dashboard', sos: 'SOS', alert: 'Alert',
  noData: 'No data', filter: 'Filter', all: 'All', capacity: 'Capacity', notes: 'Notes',
  deleteConfirm: 'Delete this record?', add: 'Add', dietType: 'Diet Type', newRoleName: 'New role name', language: 'Language',
  welcome: 'Welcome', welcomeBack: 'Welcome back', profile: 'Profile',
};

const TL_RU: TabStrings = {
  dashboard: 'Панель управления', chessboard: 'Номерной фонд', tasks: 'Задачи',
  guests: 'Постояльцы', finance: 'Финансы', medical: 'Медицина', sos: 'SOS', users: 'Сотрудники',
};

const TL_EN: TabStrings = {
  dashboard: 'Dashboard', chessboard: 'Rooms', tasks: 'Tasks',
  guests: 'Guests', finance: 'Finance', medical: 'Medical', sos: 'SOS', users: 'Staff',
};

const ROLE_NAMES_RU: Record<string, string> = {
  owner: 'Владелец', manager: 'Управляющий', administrator: 'Администратор',
  doctor: 'Врач', maid: 'Горничная', receptionist: 'Регистратор',
};

const ROLE_NAMES_EN: Record<string, string> = {
  owner: 'Owner', manager: 'Manager', administrator: 'Administrator',
  doctor: 'Doctor', maid: 'Maid', receptionist: 'Receptionist',
};

interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  RL: (key: keyof CommonStrings) => string;
  TL: (key: keyof TabStrings) => string;
  roleName: (role: string) => string;
}

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem('pansion_lang') as Lang) || 'ru';
  });

  const setLang = useCallback((newLang: Lang) => {
    localStorage.setItem('pansion_lang', newLang);
    setLangState(newLang);
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === 'ru' ? 'en' : 'ru');
  }, [lang, setLang]);

  const RL = useCallback((key: keyof CommonStrings): string => {
    return lang === 'ru' ? COMMON_RU[key] : COMMON_EN[key];
  }, [lang]);

  const TL = useCallback((key: keyof TabStrings): string => {
    return lang === 'ru' ? TL_RU[key] : TL_EN[key];
  }, [lang]);

  const roleName = useCallback((role: string): string => {
    const dict = lang === 'ru' ? ROLE_NAMES_RU : ROLE_NAMES_EN;
    return dict[role] || role;
  }, [lang]);

  const value = useMemo(() => ({
    lang, setLang, toggleLang, RL, TL, roleName,
  }), [lang, setLang, toggleLang, RL, TL, roleName]);

  return (
    <LangContext.Provider value={value}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within LangProvider');
  return ctx;
}
