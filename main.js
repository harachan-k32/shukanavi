// main.js - SPAルーター & アプリケーションコントローラー
import { renderDashboard, initDashboard } from './src/modules/dashboard.js';
import { renderCompanies, initCompanies } from './src/modules/companies.js';
import { renderSchedule, initSchedule } from './src/modules/schedule.js';
import { renderEsManager, initEsManager } from './src/modules/es-manager.js';
import { renderSelfAnalysis, initSelfAnalysis } from './src/modules/self-analysis.js';
import { renderInterview, initInterview } from './src/modules/interview.js';
import { renderObogTracker, initObogTracker } from './src/modules/obog-tracker.js';
import { exportData, importData, getData, initConvex, createShareLink, getSharedData, getShareIdFromUrl } from './src/storage.js';

// DOM要素
const mainContent = document.getElementById('main-content');
const navMenu = document.getElementById('nav-menu');
const modalOverlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');
const toastContainer = document.getElementById('toast-container');
const sidebar = document.getElementById('sidebar');
const mobileToggle = document.getElementById('mobile-menu-toggle');

let currentPage = 'dashboard';
let isShareMode = false; // 共有（閲覧専用）モード

// ========================================
// ルーティング
// ========================================
const pages = {
    'dashboard': { render: renderDashboard, init: initDashboard },
    'companies': { render: renderCompanies, init: initCompanies },
    'schedule': { render: renderSchedule, init: initSchedule },
    'es-manager': { render: renderEsManager, init: initEsManager },
    'self-analysis': { render: renderSelfAnalysis, init: initSelfAnalysis },
    'interview': { render: renderInterview, init: initInterview },
    'obog-tracker': { render: renderObogTracker, init: initObogTracker },
};

function navigateTo(page) {
    if (!pages[page]) return;

    currentPage = page;

    // ナビゲーション更新
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === page);
    });

    // コンテンツレンダリング
    mainContent.innerHTML = pages[page].render();

    // ページ固有の初期化
    if (pages[page].init) {
        pages[page].init(showToast, openModal, closeModal, () => navigateTo(currentPage));
    }

    // ダッシュボードのパイプラインカードクリック
    if (page === 'dashboard') {
        document.querySelectorAll('.pipeline-card').forEach(card => {
            card.addEventListener('click', () => {
                navigateTo('companies');
            });
        });
    }

    // スクロールトップ
    mainContent.scrollTop = 0;

    // モバイルメニューを閉じる
    sidebar.classList.remove('open');
}

// ========================================
// ナビゲーションイベント
// ========================================
navMenu.addEventListener('click', (e) => {
    const navItem = e.target.closest('.nav-item');
    if (navItem) {
        navigateTo(navItem.dataset.page);
    }
});

// モバイルメニュー
mobileToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
});

// サイドバー外クリックで閉じる
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 &&
        sidebar.classList.contains('open') &&
        !sidebar.contains(e.target) &&
        !mobileToggle.contains(e.target)) {
        sidebar.classList.remove('open');
    }
});

// ========================================
// モーダル
// ========================================
function openModal(title, body) {
    modalTitle.textContent = title;
    modalBody.innerHTML = body;
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
});

// ESCキーでモーダルを閉じる
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
        closeModal();
    }
});

// ========================================
// トースト通知
// ========================================
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    toast.innerHTML = `<span>${icons[type] || ''}  </span><span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fadeIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ========================================
// エクスポート・インポート
// ========================================
document.getElementById('btn-export')?.addEventListener('click', () => {
    exportData();
    showToast('データをエクスポートしました', 'success');
});

const importFileInput = document.getElementById('import-file');
document.getElementById('btn-import')?.addEventListener('click', () => {
    importFileInput.click();
});

importFileInput?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
        await importData(file);
        showToast('データをインポートしました', 'success');
        navigateTo(currentPage);
    } catch (err) {
        showToast(err.message, 'error');
    }
    importFileInput.value = '';
});

// ========================================
// リマインダーチェック
// ========================================
function checkReminders() {
    const data = getData();
    const now = new Date();
    // 明日の開始と終わり
    const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const tomorrowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);

    let reminderMessages = [];

    // スケジュールからの抽出
    (data.events || []).forEach(ev => {
        if (!ev.date) return;
        const evDate = new Date(ev.date);
        if (evDate >= tomorrowStart && evDate < tomorrowEnd) {
            const typeLabel = ev.type === 'deadline' ? 'ES締切' : ev.type === 'interview' ? '面接' : '予定';
            reminderMessages.push(`明日は「${ev.title}」の${typeLabel}があります。`);
        }
    });

    // 企業カンバンのステージ（締切）からの抽出
    (data.companies || []).forEach(c => {
        (c.stages || []).forEach(stage => {
            if (!stage.done && stage.deadline) {
                const slDate = new Date(stage.deadline);
                if (slDate >= tomorrowStart && slDate < tomorrowEnd) {
                    reminderMessages.push(`明日は${c.name}の「${stage.label}」の締切です。`);
                }
            }
        });
    });

    // トーストで逐次表示
    reminderMessages.forEach((msg, idx) => {
        setTimeout(() => {
            showToast('【リマインド】' + msg, 'info');
        }, idx * 1500 + 1000); // 1秒後から順次
    });
}

// ========================================
// 共有リンク生成
// ========================================
document.getElementById('btn-share')?.addEventListener('click', async () => {
    try {
        showToast('共有リンクを生成中...', 'info');
        const shareId = await createShareLink();
        const shareUrl = `${window.location.origin}${window.location.pathname}?share=${shareId}`;

        // モーダルで共有URLを表示
        openModal('🔗 共有リンク', `
            <div style="text-align:center;padding:20px;">
                <p style="margin-bottom:16px;font-size:15px;">このURLを友達に送ってね！<br><small style="color:var(--color-text-muted);">(閲覧のみ)</small></p>
                <div style="background:var(--color-bg-tertiary);padding:14px;border-radius:10px;word-break:break-all;font-family:monospace;font-size:13px;margin-bottom:16px;">${shareUrl}</div>
                <button id="btn-copy-share" class="btn btn-primary" style="padding:10px 24px;font-size:15px;">📋 コピーする</button>
            </div>
        `);

        document.getElementById('btn-copy-share')?.addEventListener('click', () => {
            navigator.clipboard.writeText(shareUrl).then(() => {
                showToast('共有リンクをコピーしました！', 'success');
            });
        });
    } catch (err) {
        showToast('共有リンクの生成に失敗しました: ' + err.message, 'error');
    }
});

// ========================================
// 共有モードチェック
// ========================================
async function checkShareMode() {
    const shareId = getShareIdFromUrl();
    if (!shareId) return false;

    try {
        showToast('共有データを読み込み中...', 'info');
        const sharedData = await getSharedData(shareId);

        // 共有データをローカルストレージに一時保存（閲覧用）
        localStorage.setItem('shukanavi_data', JSON.stringify(sharedData));
        isShareMode = true;

        // UIを閲覧モードに
        document.querySelector('.sidebar-footer').innerHTML = `
            <div style="text-align:center;padding:12px;color:var(--color-text-muted);font-size:13px;">
                👀 閲覧モード<br>
                <a href="${window.location.pathname}" style="color:var(--color-primary);text-decoration:none;font-weight:600;">自分のデータに戻る →</a>
            </div>
        `;

        // ヘッダーに閲覧モードバッジ追加
        const logoSub = document.querySelector('.logo-sub');
        if (logoSub) {
            logoSub.textContent = '👀 閲覧モード（共有データ）';
            logoSub.style.color = '#fbbf24';
        }

        showToast('共有データを表示中（閲覧のみ）', 'info');
        return true;
    } catch (err) {
        showToast('共有データの読み込みに失敗しました: ' + err.message, 'error');
        return false;
    }
}

// ========================================
// 初期化
// ========================================
async function init() {
    // Convex 初期化
    initConvex();

    // 共有モードチェック
    await checkShareMode();

    // ダッシュボード表示
    navigateTo('dashboard');
    setTimeout(checkReminders, 500);
}

init();
