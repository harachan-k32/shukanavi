// es-manager.js - ES・志望動機管理モジュール
import { getData, updateData, generateId } from '../storage.js';

const ES_TEMPLATES = {
  'gakuchika': {
    label: 'ガクチカ',
    icon: '🎓',
    template: '【取り組み】\n\n【課題・目標】\n\n【行動】\n\n【結果・学び】\n',
    maxChars: 400
  },
  'motivation': {
    label: '志望動機',
    icon: '💡',
    template: '【志望理由】\n\n【実現したいこと】\n\n【なぜこの会社か】\n',
    maxChars: 400
  },
  'self-pr': {
    label: '自己PR',
    icon: '⭐',
    template: '【強み】\n\n【具体的なエピソード】\n\n【入社後の活かし方】\n',
    maxChars: 400
  },
  'free': {
    label: '自由記述',
    icon: '📝',
    template: '',
    maxChars: 800
  }
};

export function renderEsManager() {
  const data = getData();
  const esEntries = data.esEntries || [];
  const companies = data.companies || [];

  return `
    <div class="page-header">
      <h2>📝 ES・志望動機管理</h2>
      <p>企業ごとのES・志望動機をテンプレートで効率的に管理</p>
    </div>

    <!-- テンプレート -->
    <div class="card mb-24">
      <div class="card-header">
        <h3 class="card-title">テンプレートから作成</h3>
      </div>
      <div class="stats-grid" style="margin-bottom: 0;">
        ${Object.entries(ES_TEMPLATES).map(([key, tmpl]) => `
          <div class="stat-card" style="cursor: pointer; text-align: center;" data-create-es="${key}">
            <span class="stat-icon">${tmpl.icon}</span>
            <div style="font-weight: 600; font-size: 14px;">${tmpl.label}</div>
            <div class="text-sm text-muted">${tmpl.maxChars}字以内</div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- 新規作成フォーム -->
    <div class="card mb-24" id="es-create-form" style="display: none;">
      <div class="card-header">
        <h3 class="card-title" id="es-form-title">新規ES作成</h3>
        <button class="btn-icon" id="btn-close-es-form">✕</button>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">企業名</label>
          <select class="form-select" id="es-company">
            <option value="">企業を選択...</option>
            ${companies.map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`).join('')}
            <option value="__custom__">手動入力</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">種類</label>
          <select class="form-select" id="es-type">
            ${Object.entries(ES_TEMPLATES).map(([key, tmpl]) => `<option value="${key}">${tmpl.label}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-group" id="es-custom-company-group" style="display: none;">
        <label class="form-label">企業名（手動入力）</label>
        <input type="text" class="form-input" id="es-custom-company" placeholder="企業名を入力..." />
      </div>
      <div class="form-group">
        <label class="form-label">質問・テーマ</label>
        <input type="text" class="form-input" id="es-question" placeholder="例：学生時代に力を入れたことは？" />
      </div>
      <div class="form-group">
        <div class="flex justify-between items-end mb-8">
          <label class="form-label mb-0">回答</label>
          <button type="button" class="btn btn-secondary btn-sm" id="btn-adjust-es" style="padding: 4px 8px; font-size: 12px; background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.3);">
            🤖 AIで文字数・構成を整える
          </button>
        </div>
        <textarea class="form-textarea" id="es-content" rows="10" placeholder="ここに回答を入力..."></textarea>
        <div class="char-count" id="es-char-count">0 / <span id="es-max-chars">400</span>字</div>
      </div>
      <button class="btn btn-primary w-full" id="btn-save-es">💾 保存</button>
    </div>

    <!-- ES一覧 -->
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">保存済みES一覧</h3>
        <span class="text-sm text-muted">${esEntries.length}件</span>
      </div>
      ${esEntries.length === 0 ? `
        <div class="empty-state">
          <span class="empty-state-icon">📝</span>
          <div class="empty-state-text">まだESが保存されていません</div>
          <div class="empty-state-sub">上のテンプレートから作成を始めましょう</div>
        </div>
      ` : `
        <div>
          ${esEntries.map(entry => {
    const tmpl = ES_TEMPLATES[entry.type] || ES_TEMPLATES['free'];
    return `
              <div class="list-item" style="flex-direction: column; align-items: stretch;" data-es-id="${entry.id}">
                <div class="flex justify-between items-center">
                  <div class="flex items-center gap-8">
                    <span style="font-size: 18px;">${tmpl.icon}</span>
                    <div>
                      <div style="font-weight: 500;">${escapeHtml(entry.company || '未設定')} - ${tmpl.label}</div>
                      <div class="text-sm text-muted">${escapeHtml(entry.question || '')}</div>
                    </div>
                  </div>
                  <div class="list-item-right">
                    <span class="badge badge-purple">${(entry.content || '').length}字</span>
                    <button class="btn-icon" data-edit-es="${entry.id}" title="編集">✏️</button>
                    <button class="btn-icon" data-delete-es="${entry.id}" title="削除">🗑️</button>
                  </div>
                </div>
                <div class="text-sm text-muted" style="margin-top: 8px; white-space: pre-wrap; max-height: 60px; overflow: hidden;">${escapeHtml((entry.content || '').substring(0, 150))}${(entry.content || '').length > 150 ? '...' : ''}</div>
              </div>
            `;
  }).join('')}
        </div>
      `}
    </div>
  `;
}

export function initEsManager(showToast, openModal, closeModal, refreshPage) {
  const form = document.getElementById('es-create-form');
  let currentEditId = null;

  // テンプレートクリック
  document.querySelectorAll('[data-create-es]').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.createEs;
      const tmpl = ES_TEMPLATES[type];
      if (form) form.style.display = 'block';
      document.getElementById('es-type').value = type;
      document.getElementById('es-content').value = tmpl.template;
      document.getElementById('es-max-chars').textContent = tmpl.maxChars;
      document.getElementById('es-form-title').textContent = `${tmpl.label}を作成`;
      updateCharCount();
      currentEditId = null;
      form.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // フォーム閉じる
  document.getElementById('btn-close-es-form')?.addEventListener('click', () => {
    if (form) form.style.display = 'none';
    currentEditId = null;
  });

  // 企業選択（手動入力切替）
  document.getElementById('es-company')?.addEventListener('change', (e) => {
    const customGroup = document.getElementById('es-custom-company-group');
    if (customGroup) {
      customGroup.style.display = e.target.value === '__custom__' ? 'block' : 'none';
    }
  });

  // 文字数カウント
  document.getElementById('es-content')?.addEventListener('input', updateCharCount);

  // タイプ変更
  document.getElementById('es-type')?.addEventListener('change', (e) => {
    const tmpl = ES_TEMPLATES[e.target.value];
    document.getElementById('es-max-chars').textContent = tmpl.maxChars;
    updateCharCount();
  });

  // AI文面調整ボタン
  document.getElementById('btn-adjust-es')?.addEventListener('click', () => {
    const contentEl = document.getElementById('es-content');
    const originalText = contentEl.value;
    const maxChars = parseInt(document.getElementById('es-max-chars').textContent) || 400;
    const btn = document.getElementById('btn-adjust-es');

    if (!originalText.trim()) {
      showToast('回答を先に入力してください', 'error');
      return;
    }

    btn.innerHTML = '🤖 生成中...';
    btn.disabled = true;

    setTimeout(() => {
      const adjustedText = mockAiAdjustText(originalText, maxChars);
      contentEl.value = adjustedText;
      updateCharCount();

      showToast('AIが文章を整えました', 'success');
      btn.innerHTML = '🤖 変更を元に戻す';
      btn.onclick = () => {
        contentEl.value = originalText;
        updateCharCount();
        btn.innerHTML = '🤖 AIで文字数・構成を整える';
        btn.onclick = null; // リセット
      };
      btn.disabled = false;
    }, 800);
  });

  // 保存
  document.getElementById('btn-save-es')?.addEventListener('click', () => {
    let company = document.getElementById('es-company')?.value;
    if (company === '__custom__') {
      company = document.getElementById('es-custom-company')?.value.trim();
    }
    const type = document.getElementById('es-type')?.value || 'free';
    const question = document.getElementById('es-question')?.value.trim();
    const content = document.getElementById('es-content')?.value;

    if (!content?.trim()) {
      showToast('回答を入力してください', 'error');
      return;
    }

    const data = getData();
    const esEntries = data.esEntries || [];

    if (currentEditId) {
      const idx = esEntries.findIndex(e => e.id === currentEditId);
      if (idx !== -1) {
        esEntries[idx] = { ...esEntries[idx], company, type, question, content };
      }
      showToast('ESを更新しました', 'success');
    } else {
      esEntries.push({
        id: generateId(),
        company, type, question, content,
        createdAt: new Date().toISOString()
      });
      showToast('ESを保存しました', 'success');
    }

    updateData('esEntries', esEntries);
    currentEditId = null;
    refreshPage();
  });

  // 編集
  document.querySelectorAll('[data-edit-es]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.editEs;
      const data = getData();
      const entry = (data.esEntries || []).find(e => e.id === id);
      if (!entry) return;

      if (form) form.style.display = 'block';
      document.getElementById('es-company').value = entry.company || '';
      document.getElementById('es-type').value = entry.type || 'free';
      document.getElementById('es-question').value = entry.question || '';
      document.getElementById('es-content').value = entry.content || '';
      document.getElementById('es-form-title').textContent = 'ESを編集';

      const tmpl = ES_TEMPLATES[entry.type] || ES_TEMPLATES['free'];
      document.getElementById('es-max-chars').textContent = tmpl.maxChars;
      updateCharCount();
      currentEditId = id;
      form.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // 削除
  document.querySelectorAll('[data-delete-es]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.deleteEs;
      if (confirm('このESを削除しますか？')) {
        const data = getData();
        data.esEntries = (data.esEntries || []).filter(e => e.id !== id);
        updateData('esEntries', data.esEntries);
        showToast('ESを削除しました', 'success');
        refreshPage();
      }
    });
  });
}

function updateCharCount() {
  const content = document.getElementById('es-content')?.value || '';
  const maxChars = parseInt(document.getElementById('es-max-chars')?.textContent || '400');
  const countEl = document.getElementById('es-char-count');
  if (countEl) {
    const len = content.length;
    countEl.textContent = `${len} / ${maxChars}字`;
    countEl.className = 'char-count' + (len > maxChars ? ' danger' : len > maxChars * 0.9 ? ' warning' : '');
  }
}

function mockAiAdjustText(text, maxChars) {
  if (text.length <= maxChars * 0.9) {
    // 短い場合: 増やすモック
    return `【AIによる肉付け（目標${maxChars}字）】\n${text}\n\n（さらに、この経験を通じて得られた学びは、入社後の〇〇という業務においても強いリーダーシップとして活かせると確信しています。また、周囲を巻き込む力は...）\n※AIによる推敲結果です。`;
  } else if (text.length > maxChars) {
    // 長い場合: 削るモック
    return `【AIによる要約（目標${maxChars}字）】\n${text.substring(0, maxChars - 30)}...\n\n※文字数オーバーのため、冗長な表現をカットしました。`;
  } else {
    // ちょうど良い場合: 整える
    return `【AIによる構成調整】\n${text}\n\n※このままでも素晴らしい文章です。より論理的な構成に微調整しました。`;
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
