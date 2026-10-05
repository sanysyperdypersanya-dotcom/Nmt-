import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { SiteRegistration } from '../types/nmt';

export const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
];

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => {
  provider.addScope(scope);
});
provider.setCustomParameters({
  prompt: 'consent',
});

// Flag to indicate if we are in the middle of a sign-in flow.
let isSigningIn = false;
// Cache the access token strictly in memory (never in localStorage or sessionStorage).
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: (user: User | null) => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure(user);
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure(null);
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Не вдалося отримати токен доступу Google Workspace.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

export interface DriveSpreadsheetItem {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export interface SpreadsheetMetadata {
  spreadsheetId: string;
  title: string;
  spreadsheetUrl: string;
  sheetTabTitles: string[];
}

export function extractSpreadsheetIdFromInput(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

export async function listUserSpreadsheets(accessToken: string): Promise<DriveSpreadsheetItem[]> {
  const query = encodeURIComponent(
    "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false"
  );
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&pageSize=25&orderBy=modifiedTime desc&fields=files(id,name,modifiedTime,webViewLink)`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(
      errData?.error?.message || `Помилка завантаження списку таблиць (${res.status})`
    );
  }

  const data = await res.json();
  return (data.files || []) as DriveSpreadsheetItem[];
}

export async function getSpreadsheetMetadata(
  accessToken: string,
  spreadsheetIdOrUrl: string
): Promise<SpreadsheetMetadata> {
  const spreadsheetId = extractSpreadsheetIdFromInput(spreadsheetIdOrUrl);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
    spreadsheetId
  )}?fields=spreadsheetId,spreadsheetUrl,properties.title,sheets.properties.title`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(
      errData?.error?.message || `Не вдалося відкрити таблицю Google Sheets (${res.status})`
    );
  }

  const data = await res.json();
  const sheetTabTitles: string[] = (data.sheets || [])
    .map((s: any) => s?.properties?.title)
    .filter(Boolean);

  return {
    spreadsheetId: data.spreadsheetId || spreadsheetId,
    title: data.properties?.title || 'Таблиця без назви',
    spreadsheetUrl:
      data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    sheetTabTitles: sheetTabTitles.length > 0 ? sheetTabTitles : ['Sheet1'],
  };
}

export const REGISTRATION_SHEET_HEADERS = [
  'ID реєстрації',
  'Дата та час реєстрації',
  "Ім'я та Прізвище",
  'Email учасника',
  'Місто / Заклад освіти',
  'Цільовий бал НМТ 2027',
  'Спосіб реєстрації',
  "Розв'язано завдань",
  'Статус на сайті',
];

export function registrationToSheetRow(reg: SiteRegistration): (string | number)[] {
  return [
    reg.id,
    reg.registeredAt,
    reg.fullName,
    reg.email,
    reg.schoolOrCity || 'Не вказано',
    reg.targetScore,
    reg.authMethod === 'google' ? 'Google Акаунт' : 'Форма реєстрації на сайті',
    reg.questionsAnswered,
    'Зареєстровано (НМТ 2027)',
  ];
}

export async function readSheetRows(
  accessToken: string,
  spreadsheetId: string,
  sheetTabTitle: string
): Promise<string[][]> {
  const range = `${sheetTabTitle}!A1:I200`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
    spreadsheetId
  )}/values/${encodeURIComponent(range)}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(
      errData?.error?.message || `Не вдалося зчитати рядки з аркуша "${sheetTabTitle}"`
    );
  }

  const data = await res.json();
  return (data.values || []) as string[][];
}

export async function createRegistrationsSpreadsheet(
  accessToken: string,
  title: string,
  initialRegistrations: SiteRegistration[] = []
): Promise<SpreadsheetMetadata> {
  const sheetTabTitle = 'Реєстрації НМТ 2027';
  const createUrl = 'https://sheets.googleapis.com/v4/spreadsheets';

  const createRes = await fetch(createUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: title.trim() || 'Реєстрації учасників НМТ 2027',
      },
      sheets: [
        {
          properties: {
            title: sheetTabTitle,
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const errData = await createRes.json().catch(() => ({}));
    throw new Error(
      errData?.error?.message || `Не вдалося створити таблицю Google Sheets (${createRes.status})`
    );
  }

  const createdData = await createRes.json();
  const spreadsheetId: string = createdData.spreadsheetId;
  const actualTabTitle: string =
    createdData.sheets?.[0]?.properties?.title || sheetTabTitle;

  // Write headers + any initial registrations
  const values: (string | number)[][] = [
    REGISTRATION_SHEET_HEADERS,
    ...initialRegistrations.map(registrationToSheetRow),
  ];

  const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
    spreadsheetId
  )}/values/${encodeURIComponent(
    actualTabTitle
  )}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const appendRes = await fetch(appendUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values,
    }),
  });

  if (!appendRes.ok) {
    const errData = await appendRes.json().catch(() => ({}));
    throw new Error(
      errData?.error?.message || 'Таблицю створено, але не вдалося записати заголовки.'
    );
  }

  return {
    spreadsheetId,
    title: createdData.properties?.title || title,
    spreadsheetUrl:
      createdData.spreadsheetUrl ||
      `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    sheetTabTitles: [actualTabTitle],
  };
}

export async function appendRegistrationsToSheet(
  accessToken: string,
  spreadsheetId: string,
  sheetTabTitle: string,
  registrations: SiteRegistration[]
): Promise<void> {
  if (registrations.length === 0) return;

  // First check if the sheet tab already has a header row
  const existingRows = await readSheetRows(accessToken, spreadsheetId, sheetTabTitle).catch(
    () => []
  );

  const valuesToWrite: (string | number)[][] = [];
  if (existingRows.length === 0) {
    valuesToWrite.push(REGISTRATION_SHEET_HEADERS);
  }

  registrations.forEach((reg) => {
    valuesToWrite.push(registrationToSheetRow(reg));
  });

  const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
    spreadsheetId
  )}/values/${encodeURIComponent(
    sheetTabTitle
  )}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const res = await fetch(appendUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: valuesToWrite,
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(
      errData?.error?.message || `Не вдалося записати реєстрації у Google Sheets (${res.status})`
    );
  }
}
