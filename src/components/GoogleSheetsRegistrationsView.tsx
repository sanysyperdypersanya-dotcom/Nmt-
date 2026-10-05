import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  SiteRegistration,
  ConnectedSheetConfig,
  UserStats,
} from '../types/nmt';
import {
  googleSignIn,
  logout,
  listUserSpreadsheets,
  getSpreadsheetMetadata,
  readSheetRows,
  createRegistrationsSpreadsheet,
  appendRegistrationsToSheet,
  DriveSpreadsheetItem,
} from '../utils/googleWorkspace';
import {
  FileSpreadsheet,
  UserPlus,
  CheckCircle2,
  RefreshCw,
  Plus,
  Link2,
  ExternalLink,
  AlertCircle,
  ShieldCheck,
  LogOut,
  Table,
  Send,
  X,
  FolderOpen,
  Sparkles,
} from 'lucide-react';

interface GoogleSheetsRegistrationsViewProps {
  user: User | null;
  accessToken: string | null;
  needsAuth: boolean;
  onAuthChange: (user: User | null, token: string | null) => void;
  registrations: SiteRegistration[];
  onAddRegistration: (reg: SiteRegistration, promptSheetWrite?: boolean) => void;
  onMarkRegistrationsSynced: (ids: string[], spreadsheetId: string) => void;
  sheetConfig: ConnectedSheetConfig | null;
  onUpdateSheetConfig: (config: ConnectedSheetConfig | null) => void;
  userStats: UserStats;
  onUpdateUserStats: (stats: UserStats) => void;
  pendingWriteRegistrations: SiteRegistration[] | null;
  onClearPendingWrite: () => void;
}

type PendingModalAction =
  | {
      type: 'append_rows';
      registrations: SiteRegistration[];
      spreadsheetTitle: string;
      spreadsheetId: string;
      sheetTabTitle: string;
    }
  | {
      type: 'create_spreadsheet';
      newTitle: string;
      registrationsToInclude: SiteRegistration[];
    };

export const GoogleSignInButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  label?: string;
  compact?: boolean;
}> = ({ onClick, disabled, label = 'Sign in with Google', compact = false }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`gsi-material-button inline-flex items-center justify-center gap-2.5 bg-white hover:bg-zinc-50 active:bg-zinc-100 text-zinc-800 border border-zinc-300 rounded-lg font-medium transition-all shadow-xs cursor-pointer disabled:opacity-50 ${
        compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm'
      }`}
    >
      <div className="gsi-material-button-state" />
      <div className="gsi-material-button-content-wrapper flex items-center gap-2.5">
        <div
          className="gsi-material-button-icon shrink-0"
          style={{ width: compact ? 16 : 18, height: compact ? 16 : 18 }}
        >
          <svg
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            style={{ display: 'block', width: '100%', height: '100%' }}
          >
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            />
            <path
              fill="#FBBC05"
              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
            <path fill="none" d="M0 0h48v48H0z" />
          </svg>
        </div>
        <span className="gsi-material-button-contents font-semibold">{label}</span>
        <span style={{ display: 'none' }}>Sign in with Google</span>
      </div>
    </button>
  );
};

export const GoogleSheetsRegistrationsView: React.FC<GoogleSheetsRegistrationsViewProps> = ({
  user,
  accessToken,
  needsAuth,
  onAuthChange,
  registrations,
  onAddRegistration,
  onMarkRegistrationsSynced,
  sheetConfig,
  onUpdateSheetConfig,
  userStats,
  onUpdateUserStats,
  pendingWriteRegistrations,
  onClearPendingWrite,
}) => {
  // Registration Form State
  const [fullName, setFullName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [schoolOrCity, setSchoolOrCity] = useState('');
  const [targetScore, setTargetScore] = useState<number>(185);
  const [formSuccessMessage, setFormSuccessMessage] = useState<string | null>(null);

  // Google Auth & Sheets State
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [driveFiles, setDriveFiles] = useState<DriveSpreadsheetItem[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [availableTabs, setAvailableTabs] = useState<string[]>(
    sheetConfig ? [sheetConfig.sheetTabTitle] : []
  );
  const [spreadsheetInput, setSpreadsheetInput] = useState('');
  const [newSheetTitle, setNewSheetTitle] = useState('Реєстрації учасників НМТ 2027');

  // Live Sheet Values Preview
  const [sheetRows, setSheetRows] = useState<string[][]>([]);
  const [isLoadingRows, setIsLoadingRows] = useState(false);

  // Confirmation Modal State (Mandatory before writing/modifying Google Sheets)
  const [pendingAction, setPendingAction] = useState<PendingModalAction | null>(null);
  const [isExecutingAction, setIsExecutingAction] = useState(false);

  // Status / Error Banner
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  // Keep form fields pre-filled when Google User signs in
  useEffect(() => {
    if (user) {
      if (!fullName && user.displayName) setFullName(user.displayName);
      if (!email && user.email) setEmail(user.email);
    }
  }, [user]);

  // If App passed pendingWriteRegistrations (e.g., right after Google Sign-In auto-registration)
  useEffect(() => {
    if (
      pendingWriteRegistrations &&
      pendingWriteRegistrations.length > 0 &&
      sheetConfig &&
      accessToken
    ) {
      setPendingAction({
        type: 'append_rows',
        registrations: pendingWriteRegistrations,
        spreadsheetId: sheetConfig.spreadsheetId,
        spreadsheetTitle: sheetConfig.spreadsheetTitle,
        sheetTabTitle: sheetConfig.sheetTabTitle,
      });
      onClearPendingWrite();
    }
  }, [pendingWriteRegistrations, sheetConfig, accessToken]);

  // Fetch user's recent Google Spreadsheets when authenticated
  useEffect(() => {
    if (accessToken && !needsAuth) {
      handleFetchDriveSpreadsheets(accessToken);
      if (sheetConfig) {
        handleLoadConnectedSheetDetails(accessToken, sheetConfig.spreadsheetId, sheetConfig.sheetTabTitle);
      }
    } else {
      setDriveFiles([]);
      setSheetRows([]);
    }
  }, [accessToken, needsAuth]);

  const handleFetchDriveSpreadsheets = async (token: string) => {
    setIsLoadingDrive(true);
    try {
      const files = await listUserSpreadsheets(token);
      setDriveFiles(files);
    } catch (err: any) {
      console.error('Failed to list Drive spreadsheets:', err);
    } finally {
      setIsLoadingDrive(false);
    }
  };

  const handleLoadConnectedSheetDetails = async (
    token: string,
    spreadsheetId: string,
    preferredTab?: string
  ) => {
    setIsLoadingRows(true);
    setErrorBanner(null);
    try {
      const meta = await getSpreadsheetMetadata(token, spreadsheetId);
      setAvailableTabs(meta.sheetTabTitles);
      const activeTab =
        preferredTab && meta.sheetTabTitles.includes(preferredTab)
          ? preferredTab
          : meta.sheetTabTitles[0];

      const updatedConfig: ConnectedSheetConfig = {
        spreadsheetId: meta.spreadsheetId,
        spreadsheetTitle: meta.title,
        spreadsheetUrl: meta.spreadsheetUrl,
        sheetTabTitle: activeTab,
        autoPromptWriteOnRegister: sheetConfig?.autoPromptWriteOnRegister ?? true,
      };
      onUpdateSheetConfig(updatedConfig);

      const rows = await readSheetRows(token, meta.spreadsheetId, activeTab);
      setSheetRows(rows);
    } catch (err: any) {
      setErrorBanner(err?.message || 'Не вдалося завантажити дані з таблиці Google Sheets.');
    } finally {
      setIsLoadingRows(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setErrorBanner(null);
    try {
      const result = await googleSignIn();
      if (result) {
        onAuthChange(result.user, result.accessToken);
        setStatusBanner(
          `Успішний вхід через Google (${result.user.email}). Доступ до Google Sheets активовано.`
        );
      }
    } catch (err: any) {
      setErrorBanner(err?.message || 'Помилка авторизації через Google.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    await logout();
    onAuthChange(null, null);
    setStatusBanner('Ви вийшли з облікового запису Google.');
  };

  const handleRegisterParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorBanner(null);
    setFormSuccessMessage(null);

    const cleanName = fullName.trim();
    const cleanEmail = email.trim();
    if (!cleanName || !cleanEmail) {
      setErrorBanner("Будь ласка, вкажіть Ім'я та Email для реєстрації.");
      return;
    }

    const nowFormatted = new Date().toLocaleString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const newReg: SiteRegistration = {
      id: `REG-${Date.now().toString().slice(-6)}`,
      registeredAt: nowFormatted,
      fullName: cleanName,
      email: cleanEmail,
      schoolOrCity: schoolOrCity.trim() || 'Не вказано',
      targetScore: Math.min(200, Math.max(100, Number(targetScore) || 180)),
      authMethod: user && user.email === cleanEmail ? 'google' : 'form',
      questionsAnswered: userStats.totalQuestionsAnswered,
      syncedToSheets: false,
    };

    // Update user name in stats if still default
    if (cleanName && userStats.userName !== cleanName) {
      onUpdateUserStats({
        ...userStats,
        userName: cleanName,
      });
    }

    onAddRegistration(newReg, false);
    setFormSuccessMessage(`Учасника «${cleanName}» зареєстровано на сайті!`);

    // If Google Sheets is connected & authenticated, immediately open the confirmation modal to write to Sheets
    if (sheetConfig && accessToken && !needsAuth) {
      setPendingAction({
        type: 'append_rows',
        registrations: [newReg],
        spreadsheetId: sheetConfig.spreadsheetId,
        spreadsheetTitle: sheetConfig.spreadsheetTitle,
        sheetTabTitle: sheetConfig.sheetTabTitle,
      });
    }
  };

  const handleConnectExistingSpreadsheet = async (idOrUrl: string) => {
    if (!accessToken) {
      setErrorBanner('Спочатку увійдіть через Google, щоб підключити таблицю.');
      return;
    }
    if (!idOrUrl.trim()) return;
    await handleLoadConnectedSheetDetails(accessToken, idOrUrl);
    setSpreadsheetInput('');
    setStatusBanner('Таблицю Google Sheets успішно підключено!');
  };

  const handleChangeSheetTab = async (newTabTitle: string) => {
    if (!sheetConfig || !accessToken) return;
    const updated: ConnectedSheetConfig = {
      ...sheetConfig,
      sheetTabTitle: newTabTitle,
    };
    onUpdateSheetConfig(updated);
    setIsLoadingRows(true);
    try {
      const rows = await readSheetRows(accessToken, sheetConfig.spreadsheetId, newTabTitle);
      setSheetRows(rows);
    } catch (err: any) {
      setErrorBanner(err?.message || 'Помилка читання обраного аркуша.');
    } finally {
      setIsLoadingRows(false);
    }
  };

  // Trigger Confirmation Modal before creating a new spreadsheet
  const handleRequestCreateSpreadsheet = () => {
    if (!accessToken || needsAuth) {
      setErrorBanner('Спочатку натисніть «Sign in with Google» для доступу до Google Sheets.');
      return;
    }
    const unsynced = registrations.filter((r) => !r.syncedToSheets);
    setPendingAction({
      type: 'create_spreadsheet',
      newTitle: newSheetTitle.trim() || 'Реєстрації учасників НМТ 2027',
      registrationsToInclude: unsynced,
    });
  };

  // Trigger Confirmation Modal before writing unsynced or selected registrations
  const handleRequestWriteRegistrations = (regsToWrite: SiteRegistration[]) => {
    if (!accessToken || needsAuth) {
      setErrorBanner('Спочатку увійдіть через Google для запису в Google Sheets.');
      return;
    }
    if (!sheetConfig) {
      setErrorBanner('Спочатку оберіть або створіть таблицю Google Sheets.');
      return;
    }
    if (regsToWrite.length === 0) return;

    setPendingAction({
      type: 'append_rows',
      registrations: regsToWrite,
      spreadsheetId: sheetConfig.spreadsheetId,
      spreadsheetTitle: sheetConfig.spreadsheetTitle,
      sheetTabTitle: sheetConfig.sheetTabTitle,
    });
  };

  // Execute confirmed Google Sheets mutation
  const handleConfirmPendingAction = async () => {
    if (!pendingAction || !accessToken) return;
    setIsExecutingAction(true);
    setErrorBanner(null);

    try {
      if (pendingAction.type === 'create_spreadsheet') {
        const meta = await createRegistrationsSpreadsheet(
          accessToken,
          pendingAction.newTitle,
          pendingAction.registrationsToInclude
        );
        const newConfig: ConnectedSheetConfig = {
          spreadsheetId: meta.spreadsheetId,
          spreadsheetTitle: meta.title,
          spreadsheetUrl: meta.spreadsheetUrl,
          sheetTabTitle: meta.sheetTabTitles[0],
          autoPromptWriteOnRegister: true,
        };
        onUpdateSheetConfig(newConfig);
        setAvailableTabs(meta.sheetTabTitles);

        if (pendingAction.registrationsToInclude.length > 0) {
          onMarkRegistrationsSynced(
            pendingAction.registrationsToInclude.map((r) => r.id),
            meta.spreadsheetId
          );
        }

        await handleFetchDriveSpreadsheets(accessToken);
        const rows = await readSheetRows(
          accessToken,
          meta.spreadsheetId,
          meta.sheetTabTitles[0]
        );
        setSheetRows(rows);
        setStatusBanner(
          `Створено нову таблицю «${meta.title}» та записано реєстрації (${pendingAction.registrationsToInclude.length})!`
        );
      } else if (pendingAction.type === 'append_rows') {
        await appendRegistrationsToSheet(
          accessToken,
          pendingAction.spreadsheetId,
          pendingAction.sheetTabTitle,
          pendingAction.registrations
        );
        onMarkRegistrationsSynced(
          pendingAction.registrations.map((r) => r.id),
          pendingAction.spreadsheetId
        );
        const rows = await readSheetRows(
          accessToken,
          pendingAction.spreadsheetId,
          pendingAction.sheetTabTitle
        );
        setSheetRows(rows);
        setStatusBanner(
          `Успішно записано ${pendingAction.registrations.length} реєстрацій у таблицю «${pendingAction.spreadsheetTitle}»!`
        );
      }
      setPendingAction(null);
    } catch (err: any) {
      setErrorBanner(err?.message || 'Сталася помилка під час запису в Google Sheets.');
    } finally {
      setIsExecutingAction(false);
    }
  };

  const unsyncedRegistrations = registrations.filter((r) => !r.syncedToSheets);

  return (
    <div className="space-y-8">
      {/* Top Hero Banner: Site Registration + Google Sheets Sync */}
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Інтеграція Google Sheets · Журнал реєстрацій НМТ 2027</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">
              Реєстрація на сайті та запис у Google Таблиці
            </h2>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Кожна реєстрація учасника на сайті (через форму або через вхід з обліковим записом
              Google) зберігається у журналі та записується безпосередньо у вашу таблицю{' '}
              <strong>Google Sheets</strong>.
            </p>
          </div>

          {/* Google Account Connection Box */}
          <div className="bg-white border border-zinc-200 rounded-xl p-4 sm:p-5 shrink-0 flex flex-col justify-between gap-3 min-w-[280px]">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Google Workspace Доступ
              </span>
              {!needsAuth && accessToken && user ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Підключено
                </span>
              ) : (
                <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                  Потрібен вхід
                </span>
              )}
            </div>

            {!needsAuth && accessToken && user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-9 h-9 rounded-full border border-zinc-200"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                      {(user.displayName || user.email || 'G').slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-zinc-900 truncate">
                      {user.displayName || 'Користувач Google'}
                    </div>
                    <div className="text-xs text-zinc-500 truncate">{user.email}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogout}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 text-xs font-medium text-zinc-700 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Вийти з Google акаунту</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                <p className="text-xs text-zinc-500">
                  Увійдіть через Google, щоб автоматично зареєструватися та підключити запис у
                  Google Sheets:
                </p>
                <GoogleSignInButton
                  onClick={handleGoogleLogin}
                  disabled={isLoggingIn}
                  label={isLoggingIn ? 'Підключення...' : 'Sign in with Google'}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status & Error Alerts */}
      {errorBanner && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-start justify-between gap-3 text-xs text-red-900">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorBanner(null)}
            className="text-red-600 hover:text-red-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {statusBanner && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-start justify-between gap-3 text-xs text-emerald-900">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            className="text-emerald-700 hover:text-emerald-950"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main 2-Column Grid: Left = Registration Form, Right = Google Sheets Connection & Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN (5 cols): Site Registration Form */}
        <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center">
                <UserPlus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-950">
                  Нова реєстрація учасника НМТ 2027
                </h3>
                <p className="text-xs text-zinc-500">
                  Заповніть анкету для запису в базу та Google Sheets
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleRegisterParticipant} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                Ім’я та Прізвище учасника *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Наприклад: Олександр Коваленко"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-zinc-300 focus:border-zinc-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                Електронна пошта (Email) *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@gmail.com"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-zinc-300 focus:border-zinc-900 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                  Місто / Заклад освіти
                </label>
                <input
                  type="text"
                  value={schoolOrCity}
                  onChange={(e) => setSchoolOrCity(e.target.value)}
                  placeholder="м. Київ, Ліцей №142"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-zinc-300 focus:border-zinc-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                  Цільовий бал НМТ (100–200)
                </label>
                <input
                  type="number"
                  min={100}
                  max={200}
                  value={targetScore}
                  onChange={(e) => setTargetScore(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-zinc-300 focus:border-zinc-900 focus:outline-none font-mono"
                />
              </div>
            </div>

            {formSuccessMessage && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-800 font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{formSuccessMessage}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>
                {sheetConfig && accessToken
                  ? 'Зареєструватися та записати в Google Sheets'
                  : 'Зареєструватися на сайті'}
              </span>
            </button>
          </form>

          <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
            <span>Усього реєстрацій на сайті: {registrations.length}</span>
            <span className="font-semibold text-emerald-700">
              У таблиці: {registrations.filter((r) => r.syncedToSheets).length}
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN (7 cols): Google Sheets Configuration & Sync */}
        <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-2xl p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-950">
                  Налаштування Google Таблиці (Google Sheets)
                </h3>
                <p className="text-xs text-zinc-500">
                  Оберіть існуючу таблицю з Google Диску або створіть нову в один клік
                </p>
              </div>
            </div>

            {sheetConfig?.spreadsheetUrl && (
              <a
                href={sheetConfig.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition-colors"
              >
                <span>Відкрити в Google Sheets</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* If not signed in with Google yet */}
          {needsAuth || !accessToken ? (
            <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center space-y-4">
              <FileSpreadsheet className="w-10 h-10 text-emerald-600 mx-auto" />
              <div className="space-y-1 max-w-md mx-auto">
                <h4 className="text-sm font-bold text-zinc-900">
                  Підключіть Google Sheets для автоматичного запису реєстрацій
                </h4>
                <p className="text-xs text-zinc-500">
                  Після входу через Google ви зможете створити нову таблицю або обрати існуючу у
                  вашому Google Drive, і кожна реєстрація на сайті буде записуватись окремим рядком.
                </p>
              </div>
              <div className="flex justify-center">
                <GoogleSignInButton
                  onClick={handleGoogleLogin}
                  disabled={isLoggingIn}
                  label={isLoggingIn ? 'Підключення...' : 'Sign in with Google'}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Active Connected Sheet Card */}
              {sheetConfig ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                        Активна таблиця для запису реєстрацій
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onUpdateSheetConfig(null)}
                      className="text-xs text-zinc-500 hover:text-zinc-900 underline cursor-pointer"
                    >
                      Змінити таблицю
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="bg-white border border-emerald-200/80 rounded-lg p-3">
                      <div className="text-[11px] text-zinc-500">Назва таблиці Google Sheets</div>
                      <div className="text-sm font-bold text-zinc-900 truncate mt-0.5">
                        {sheetConfig.spreadsheetTitle}
                      </div>
                      <div className="text-[10px] font-mono text-zinc-400 truncate mt-0.5">
                        ID: {sheetConfig.spreadsheetId}
                      </div>
                    </div>

                    <div className="bg-white border border-emerald-200/80 rounded-lg p-3">
                      <label className="block text-[11px] text-zinc-500 mb-1">
                        Активний аркуш (вкладка таблиці)
                      </label>
                      <select
                        value={sheetConfig.sheetTabTitle}
                        onChange={(e) => handleChangeSheetTab(e.target.value)}
                        className="w-full text-xs font-semibold text-zinc-900 bg-zinc-50 border border-zinc-200 rounded-md px-2.5 py-1.5 focus:outline-none"
                      >
                        {availableTabs.map((tab) => (
                          <option key={tab} value={tab}>
                            {tab}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Sync Pending Registrations Bar */}
                  {unsyncedRegistrations.length > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-amber-200 rounded-lg p-3">
                      <div className="text-xs text-amber-900">
                        Є <strong>{unsyncedRegistrations.length}</strong> нових реєстрацій на сайті,
                        які ще не записані в цю таблицю.
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRequestWriteRegistrations(unsyncedRegistrations)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Записати всі ({unsyncedRegistrations.length}) в Google Sheets</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-5">
                  {/* 1. Create a New Google Spreadsheet */}
                  <div className="rounded-xl border border-zinc-200 p-4 space-y-3 bg-zinc-50/50">
                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-900">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>Варіант 1: Створити нову таблицю Google Sheets автоматично</span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={newSheetTitle}
                        onChange={(e) => setNewSheetTitle(e.target.value)}
                        placeholder="Назва нової таблиці..."
                        className="flex-1 px-3 py-2 text-xs rounded-lg border border-zinc-300 bg-white focus:border-zinc-900 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleRequestCreateSpreadsheet}
                        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Створити таблицю в Google Sheets</span>
                      </button>
                    </div>
                  </div>

                  {/* 2. Select from User's Google Drive Spreadsheets */}
                  <div className="rounded-xl border border-zinc-200 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-zinc-900">
                        <FolderOpen className="w-4 h-4 text-zinc-700" />
                        <span>Варіант 2: Обрати існуючу таблицю з вашого Google Диску</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFetchDriveSpreadsheets(accessToken)}
                        disabled={isLoadingDrive}
                        className="text-xs text-zinc-600 hover:text-zinc-950 flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${isLoadingDrive ? 'animate-spin' : ''}`}
                        />
                        <span>Оновити список</span>
                      </button>
                    </div>

                    {isLoadingDrive ? (
                      <div className="text-xs text-zinc-500 py-3 text-center">
                        Завантаження ваших таблиць із Google Drive...
                      </div>
                    ) : driveFiles.length === 0 ? (
                      <div className="text-xs text-zinc-500 py-2">
                        У вашому Google Drive не знайдено таблиць або створіть нову вище.
                      </div>
                    ) : (
                      <div className="max-h-40 overflow-y-auto divide-y divide-zinc-100 border border-zinc-200 rounded-lg">
                        {driveFiles.map((file) => (
                          <div
                            key={file.id}
                            className="px-3 py-2 flex items-center justify-between gap-2 hover:bg-zinc-50 text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span className="font-medium text-zinc-800 truncate">
                                {file.name}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleConnectExistingSpreadsheet(file.id)}
                              className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-[11px] shrink-0 cursor-pointer"
                            >
                              Підключити
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 3. Connect by URL or Spreadsheet ID */}
                  <div className="rounded-xl border border-zinc-200 p-4 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-900">
                      <Link2 className="w-4 h-4 text-zinc-700" />
                      <span>Варіант 3: Вставити посилання або ID таблиці Google Sheets</span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={spreadsheetInput}
                        onChange={(e) => setSpreadsheetInput(e.target.value)}
                        placeholder="https://docs.google.com/spreadsheets/d/..."
                        className="flex-1 px-3 py-2 text-xs rounded-lg border border-zinc-300 focus:border-zinc-900 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleConnectExistingSpreadsheet(spreadsheetInput)}
                        className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition-colors cursor-pointer shrink-0"
                      >
                        Підключити за посиланням
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section 1: Site Registrations Journal */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-zinc-950">
              Журнал усіх реєстрацій на сайті ({registrations.length})
            </h3>
            <p className="text-xs text-zinc-500">
              Усі учасники, які зареєструвалися на сайті, та статус запису в Google Sheets
            </p>
          </div>

          {sheetConfig && accessToken && unsyncedRegistrations.length > 0 && (
            <button
              type="button"
              onClick={() => handleRequestWriteRegistrations(unsyncedRegistrations)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Записати несинхронізовані ({unsyncedRegistrations.length}) у Google Sheets</span>
            </button>
          )}
        </div>

        {registrations.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-zinc-200 rounded-xl text-xs text-zinc-500">
            Поки що немає жодної реєстрації. Заповніть форму вище або натисніть «Sign in with
            Google».
          </div>
        ) : (
          <div className="overflow-x-auto border border-zinc-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-semibold">
                  <th className="py-2.5 px-3">ID</th>
                  <th className="py-2.5 px-3">Дата і час</th>
                  <th className="py-2.5 px-3">Ім’я та Прізвище</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Місто / Заклад</th>
                  <th className="py-2.5 px-3">Цільовий бал</th>
                  <th className="py-2.5 px-3">Спосіб</th>
                  <th className="py-2.5 px-3 text-right">Статус Google Sheets</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {registrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-zinc-50/80">
                    <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-500">{reg.id}</td>
                    <td className="py-2.5 px-3 text-zinc-600 whitespace-nowrap">
                      {reg.registeredAt}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-zinc-900">{reg.fullName}</td>
                    <td className="py-2.5 px-3 text-zinc-600">{reg.email}</td>
                    <td className="py-2.5 px-3 text-zinc-600">{reg.schoolOrCity}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-zinc-900">
                      {reg.targetScore}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 font-medium text-[11px]">
                        {reg.authMethod === 'google' ? 'Google' : 'Форма'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {reg.syncedToSheets ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Записано в Sheets
                        </span>
                      ) : sheetConfig && accessToken ? (
                        <button
                          type="button"
                          onClick={() => handleRequestWriteRegistrations([reg])}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          <span>Записати в таблицю</span>
                        </button>
                      ) : (
                        <span className="text-amber-700 font-medium">Очікує підключення таблиці</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bottom Section 2: Live Google Sheets Preview */}
      {sheetConfig && accessToken && !needsAuth && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Table className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="text-base font-bold text-zinc-950">
                  Вміст таблиці Google Sheets наживо («{sheetConfig.spreadsheetTitle}» →{' '}
                  {sheetConfig.sheetTabTitle})
                </h3>
                <p className="text-xs text-zinc-500">
                  Дані зчитуються напряму з вашої таблиці через Google Sheets API
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                handleLoadConnectedSheetDetails(
                  accessToken,
                  sheetConfig.spreadsheetId,
                  sheetConfig.sheetTabTitle
                )
              }
              disabled={isLoadingRows}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 text-xs font-semibold text-zinc-700 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRows ? 'animate-spin' : ''}`} />
              <span>Оновити дані з Google Sheets</span>
            </button>
          </div>

          {isLoadingRows ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              Завантаження рядків з Google Sheets...
            </div>
          ) : sheetRows.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500 border border-dashed border-zinc-200 rounded-xl">
              Обраний аркуш таблиці порожній. Додайте реєстрацію або натисніть «Записати в Google
              Sheets».
            </div>
          ) : (
            <div className="overflow-x-auto border border-zinc-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-emerald-50/70 border-b border-zinc-200 text-zinc-800 font-bold">
                    {sheetRows[0].map((col, idx) => (
                      <th key={idx} className="py-2.5 px-3 whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {sheetRows.slice(1).map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-zinc-50">
                      {sheetRows[0].map((_, cIdx) => (
                        <td key={cIdx} className="py-2 px-3 text-zinc-700 whitespace-nowrap">
                          {row[cIdx] ?? ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MANDATORY USER CONFIRMATION DIALOG FOR GOOGLE SHEETS MUTATIONS */}
      {pendingAction && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-950">
                    Підтвердження запису в Google Sheets
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Будь ласка, підтвердьте внесення змін до вашого облікового запису Google
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPendingAction(null)}
                disabled={isExecutingAction}
                className="text-zinc-400 hover:text-zinc-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {pendingAction.type === 'create_spreadsheet' ? (
              <div className="space-y-3 text-xs text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-xl p-4">
                <p>
                  Буде створено новий файл таблиці у вашому <strong>Google Диску / Sheets</strong>:
                </p>
                <div className="font-semibold text-zinc-900">
                  Назва файлу: «{pendingAction.newTitle}»
                </div>
                <div>
                  Кількість реєстрацій для початкового запису:{' '}
                  <strong>{pendingAction.registrationsToInclude.length}</strong>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-xl p-4">
                <p>
                  До таблиці <strong>«{pendingAction.spreadsheetTitle}»</strong> (аркуш{' '}
                  <strong>«{pendingAction.sheetTabTitle}»</strong>) буде додано{' '}
                  <strong>{pendingAction.registrations.length}</strong> нових рядків реєстрації:
                </p>
                <div className="max-h-40 overflow-y-auto space-y-1.5 pt-1">
                  {pendingAction.registrations.map((r) => (
                    <div
                      key={r.id}
                      className="bg-white border border-zinc-200 rounded-lg px-3 py-2 flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="font-bold text-zinc-900">{r.fullName}</div>
                        <div className="text-[11px] text-zinc-500">
                          {r.email} · {r.schoolOrCity}
                        </div>
                      </div>
                      <span className="font-mono font-bold text-emerald-700">
                        {r.targetScore} б.
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setPendingAction(null)}
                disabled={isExecutingAction}
                className="px-4 py-2 rounded-xl border border-zinc-300 hover:bg-zinc-100 text-xs font-semibold text-zinc-700 cursor-pointer"
              >
                Скасувати
              </button>
              <button
                type="button"
                onClick={handleConfirmPendingAction}
                disabled={isExecutingAction}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isExecutingAction ? 'Запис у Google Sheets...' : 'Підтвердити запис'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
