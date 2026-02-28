// storage.js - Convex + localStorage ハイブリッドストレージ
// Convex を使ってクラウドにデータを保存し、localStorageをキャッシュとして使用

const STORAGE_KEY = 'shukanavi_data';
const SESSION_KEY = 'shukanavi_session_id';

// ========================================
// セッション管理
// ========================================
function getSessionId() {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

// ========================================
// Convex クライアント
// ========================================
let convexClient = null;
let convexReady = false;

// CONVEX_URLは index.html の <script> で window.CONVEX_URL として設定される
export function initConvex() {
  try {
    if (window.convex && window.CONVEX_URL) {
      convexClient = new window.convex.ConvexClient(window.CONVEX_URL);
      convexReady = true;
      console.log('✅ Convex 接続成功');

      // 初回同期: サーバーからデータを取得してローカルに反映
      syncFromServer();
    } else {
      console.warn('⚠️ Convex が利用できません。ローカルモードで動作します。');
    }
  } catch (err) {
    console.error('❌ Convex 接続エラー:', err);
  }
}

// サーバーからデータを取得してローカルに反映
async function syncFromServer() {
  if (!convexReady) return;
  try {
    const sessionId = getSessionId();
    const serverData = await convexClient.query("userData:get", { sessionId });
    if (serverData) {
      const parsed = JSON.parse(serverData);
      // ローカルキャッシュを更新
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      console.log('📥 サーバーからデータを同期しました');
    } else {
      // サーバーにデータがない場合、ローカルデータをアップロード
      const localData = localStorage.getItem(STORAGE_KEY);
      if (localData) {
        await convexClient.mutation("userData:save", {
          sessionId,
          data: localData,
        });
        console.log('📤 ローカルデータをサーバーにアップロードしました');
      }
    }
  } catch (err) {
    console.error('同期エラー:', err);
  }
}

// サーバーにデータを保存（非同期・バックグラウンド）
async function saveToServer(data) {
  if (!convexReady) return;
  try {
    const sessionId = getSessionId();
    await convexClient.mutation("userData:save", {
      sessionId,
      data: JSON.stringify(data),
    });
  } catch (err) {
    console.error('サーバー保存エラー:', err);
  }
}

// ========================================
// デフォルトデータ
// ========================================
const defaultData = {
  companies: [],
  events: [],
  esEntries: [],
  selfAnalysis: {
    strengths: [],
    weaknesses: [],
    gakuchika: [],
    values: []
  },
  interviewAnswers: {},
  obogVisits: [],
  settings: {
    createdAt: new Date().toISOString()
  }
};

// ========================================
// データ操作（既存と同じAPIを維持）
// ========================================
export function getData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveData(defaultData);
      return { ...defaultData };
    }
    return JSON.parse(raw);
  } catch {
    return { ...defaultData };
  }
}

export function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  // サーバーにもバックグラウンドで保存
  saveToServer(data);
}

export function updateData(key, value) {
  const data = getData();
  data[key] = value;
  saveData(data);
  return data;
}

// IDを生成
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// ========================================
// 共有機能
// ========================================
export async function createShareLink() {
  if (!convexReady) {
    throw new Error('Convex に接続されていません。インターネット接続を確認してください。');
  }
  const data = getData();
  const shareId = await convexClient.mutation("shares:create", {
    data: JSON.stringify(data),
  });
  return shareId;
}

export async function getSharedData(shareId) {
  if (!convexReady) {
    throw new Error('Convex に接続されていません。');
  }
  const data = await convexClient.query("shares:get", { shareId });
  if (!data) {
    throw new Error('共有データが見つかりません。');
  }
  return JSON.parse(data);
}

// 共有モードかどうか判定
export function getShareIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('share');
}

// ========================================
// エクスポート・インポート
// ========================================
export function exportData() {
  const data = getData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `shukanavi_backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        saveData(data);
        resolve(data);
      } catch (err) {
        reject(new Error('無効なファイル形式です'));
      }
    };
    reader.onerror = () => reject(new Error('ファイル読み込みに失敗しました'));
    reader.readAsText(file);
  });
}
