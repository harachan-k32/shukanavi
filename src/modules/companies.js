// companies.js - 企業管理モジュール（カンバンボード版）
import { getData, updateData, generateId } from '../storage.js';

const STATUS_MAP = {
  'interested': { label: '興味あり', icon: '◇', class: 'status-interested' },
  'info-session': { label: '説明会', icon: '💡', class: 'status-info-session' },
  'es-submitted': { label: 'ES提出', icon: '→', class: 'status-es-submitted' },
  'web-test': { label: 'Webテスト', icon: '💻', class: 'status-web-test' },
  'gd': { label: 'GD', icon: '👥', class: 'status-gd' },
  'interview-1': { label: '一次面接', icon: '①', class: 'status-interview-1' },
  'interview-2': { label: '二次面接', icon: '②', class: 'status-interview-2' },
  'interview-final': { label: '最終面接', icon: '👑', class: 'status-interview-final' },
  'offer': { label: '内定', icon: '✓', class: 'status-offer' },
  'rejected': { label: '不合格', icon: '✕', class: 'status-rejected' },
};

const INDUSTRY_OPTIONS = [
  'IT・通信', 'メーカー', '商社', '金融', 'コンサル', '広告・メディア',
  'インフラ', '不動産', '小売・流通', '食品', '医療・製薬', 'エンタメ',
  'サービス', '公務員', 'その他'
];

const DEFAULT_STAGES = [
  { id: 'info', label: '会社説明会', done: false },
  { id: 'es', label: 'ES提出', done: false },
  { id: 'webtest', label: 'Webテスト', done: false },
  { id: 'gd', label: 'GD', done: false },
  { id: 'interview1', label: '1次面接', done: false },
  { id: 'interview2', label: '2次面接', done: false },
  { id: 'final', label: '最終面接', done: false },
];

function initTimelineDragAndDrop(editorId) {
  const editor = document.getElementById(editorId);
  if (!editor) return;

  let draggedItem = null;

  editor.addEventListener('dragstart', (e) => {
    const stage = e.target.closest('.timeline-stage');
    if (!stage) return;
    draggedItem = stage;
    setTimeout(() => stage.classList.add('dragging'), 0);
  });

  editor.addEventListener('dragend', (e) => {
    if (!draggedItem) return;
    draggedItem.classList.remove('dragging');
    draggedItem = null;
  });

  editor.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (!draggedItem) return;
    const afterElement = getDragAfterElement(editor, e.clientY);
    if (afterElement == null) {
      editor.appendChild(draggedItem);
    } else {
      editor.insertBefore(draggedItem, afterElement);
    }
  });

  function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.timeline-stage:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }
}

export function renderCompanies() {
  const data = getData();
  const companies = data.companies || [];

  const statusGroups = {};
  Object.keys(STATUS_MAP).forEach(key => {
    statusGroups[key] = companies.filter(c => c.status === key);
  });

  return `
    <div class="page-header">
      <h2>🏢 企業管理</h2>
      <p>選考企業を一元管理・ステータスを追跡</p>
    </div>

    <!-- ツールバー -->
    <div class="kanban-toolbar">
      <div class="kanban-search">
        <span class="kanban-search-icon">🔍</span>
        <input type="text" class="form-input" id="company-search" placeholder="検索..." style="padding-left: 36px;" />
      </div>
      <select class="form-select" id="industry-filter" style="width: 160px;">
        <option value="">全業界</option>
        ${INDUSTRY_OPTIONS.map(i => `<option value="${i}">${i}</option>`).join('')}
      </select>
      <button class="btn btn-secondary" id="btn-compare-companies">
        📊 企業比較 (レーダー)
      </button>
      <button class="btn btn-primary" id="btn-add-company-modal">
        ＋ 追加
      </button>
    </div>

    <!-- カンバンボード -->
    <div class="kanban-board" id="kanban-board">
      ${Object.entries(STATUS_MAP).map(([statusKey, statusInfo]) => {
    const group = statusGroups[statusKey] || [];
    return `
          <div class="kanban-column" data-status="${statusKey}">
            <div class="kanban-column-header">
              <div class="kanban-column-title-wrap">
                <span class="kanban-column-icon">${statusInfo.icon}</span>
                <span class="kanban-column-title">${statusInfo.label}</span>
              </div>
              <span class="kanban-column-count">${group.length}</span>
            </div>
            <div class="kanban-column-body" data-status="${statusKey}">
              ${group.length === 0 ? `
                <div class="kanban-empty">まだありません</div>
              ` : group.map(company => renderKanbanCard(company)).join('')}
            </div>
          </div>
        `;
  }).join('')}
    </div>
  `;
}

function renderKanbanCard(company) {
  // 次の締切を計算
  const nextDeadline = getNextDeadline(company);

  return `
    <div class="kanban-card" draggable="true" data-company-id="${company.id}">
      <div class="kanban-card-header">
        <div class="kanban-card-icon">${getCompanyIcon(company.name)}</div>
        <div class="kanban-card-info">
          <div class="kanban-card-name">${escapeHtml(company.name)}</div>
          <div class="kanban-card-industry">${escapeHtml(company.industry || '')}</div>
        </div>
      </div>
      ${company.recruitUrl ? `
        <a href="${escapeHtml(company.recruitUrl)}" target="_blank" class="kanban-card-link" onclick="event.stopPropagation()">
          🏠 採用ページ ↗
        </a>
      ` : ''}
      ${nextDeadline ? `
        <div class="kanban-card-deadline ${nextDeadline.urgent ? 'urgent' : ''}">
          ⏰ ${nextDeadline.label}　${nextDeadline.dateStr}
        </div>
      ` : ''}
    </div>
  `;
}

function getCompanyIcon(name) {
  // 企業名の最初の2文字をアイコンとして使用
  const initials = (name || '??').substring(0, 2);
  const colors = ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4'];
  const colorIndex = name ? name.charCodeAt(0) % colors.length : 0;
  return `<span class="company-avatar" style="background: ${colors[colorIndex]}">${initials}</span>`;
}

function getNextDeadline(company) {
  if (!company.stages) return null;
  const now = new Date();
  for (const stage of company.stages) {
    if (!stage.done && stage.deadline) {
      const d = new Date(stage.deadline);
      const diff = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
      const isToday = d.toDateString() === now.toDateString();
      return {
        label: stage.label,
        dateStr: isToday ? '今日' : `${d.getMonth() + 1}/${d.getDate()}`,
        urgent: diff <= 3
      };
    }
  }
  return null;
}

// ===== 企業追加モーダル =====
function openAddModal(openModal, closeModal, showToast, refreshPage) {
  const data = getData();

  const body = `
    <div class="company-detail-form">
      <div class="form-group" style="background: rgba(59,130,246,0.05); padding: 16px; border-radius: 8px; border: 1px dashed rgba(59,130,246,0.5); margin-bottom: 24px;">
        <label class="form-label text-primary" style="font-weight: 600;">✨ URLから自動入力する</label>
        <div style="display: flex; gap: 8px;">
          <input type="url" class="form-input" id="auto-extract-url" placeholder="採用ページのURLを貼り付け..." style="flex: 1;" />
          <button type="button" class="btn btn-primary" id="btn-auto-extract" style="white-space: nowrap;">🤖 AIで取得</button>
        </div>
        <div class="text-sm mt-8" style="color: var(--text-muted); font-size: 12px;">URLを入力すると、企業名や業界などが自動で入ります（※今はデモ動作です）</div>
      </div>
      <div class="company-detail-grid">
        <div class="company-detail-left">
          <div class="form-group">
            <label class="form-label">企業名 <span style="color:var(--danger)">*</span></label>
            <input type="text" class="form-input" id="add-company-name" placeholder="例：NTTデータ" />
          </div>
          <div class="form-group">
            <label class="form-label">業界</label>
            <select class="form-select" id="add-company-industry">
              <option value="">選択してください</option>
              ${INDUSTRY_OPTIONS.map(i => `<option value="${i}">${i}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">採用ページ</label>
            <input type="url" class="form-input" id="add-company-recruit-url" placeholder="https://..." />
          </div>
          <div class="form-group">
            <label class="form-label">ログイン情報</label>
          </div>
          <div class="form-group">
            <label class="form-label" style="font-size:12px; color:var(--text-muted)">マイページURL</label>
            <input type="url" class="form-input" id="add-company-mypage-url" placeholder="https://..." />
          </div>
          <div class="form-group">
            <label class="form-label" style="font-size:12px; color:var(--text-muted)">マイページID</label>
            <input type="text" class="form-input" id="add-company-mypage-id" placeholder="ログインID" />
          </div>
          <div class="form-group">
            <label class="form-label" style="font-size:12px; color:var(--text-muted)">パスワード</label>
            <input type="password" class="form-input" id="add-company-mypage-pw" placeholder="パスワード" />
          </div>
        </div>
        <div class="company-detail-right">
          <div class="form-group">
            <label class="form-label">ステータス</label>
            <select class="form-select" id="add-company-status">
              ${Object.entries(STATUS_MAP).map(([key, val]) => `<option value="${key}">${val.label}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">選考タイムライン</label>
            <div class="timeline-editor" id="add-timeline-editor">
              ${DEFAULT_STAGES.map((stage, i) => `
                <div class="timeline-stage" draggable="true" data-stage-index="${i}">
                  <div class="timeline-stage-marker"></div>
                  <div class="timeline-stage-content">
                    <span class="timeline-stage-label">${stage.label}</span>
                  </div>
                </div>
              `).join('')}
            </div>
            <div class="timeline-actions">
              <button class="btn btn-sm btn-secondary" id="btn-add-stage-new">＋ ステージ追加</button>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">メモ</label>
            <textarea class="form-textarea" id="add-company-memo" rows="3" placeholder="メモ..."></textarea>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" id="btn-cancel-add">キャンセル</button>
        <button class="btn btn-primary" id="btn-save-add">保存</button>
      </div>
    </div>
  `;

  openModal('企業を追加', body);

  initTimelineDragAndDrop('add-timeline-editor');

  // 自動入力ボタン
  document.getElementById('btn-auto-extract')?.addEventListener('click', () => {
    const url = document.getElementById('auto-extract-url')?.value;
    if (!url) {
      showToast('URLを入力してください', 'error');
      return;
    }

    const btn = document.getElementById('btn-auto-extract');
    btn.innerHTML = '🤖 取得中...';
    btn.disabled = true;

    // モックのローディング演出
    setTimeout(() => {
      // ドメイン等から適当に推測するモックロジック
      const isIt = url.includes('tech') || url.includes('system') || url.includes('cloud');
      const isBank = url.includes('bank') || url.includes('fg');
      const isTrading = url.includes('corp') || url.includes('trade');

      let mockName = 'サンプル株式会社';
      let mockIndustry = 'その他';
      if (isIt) { mockName = '株式会社デモテクノロジーズ'; mockIndustry = 'IT・通信'; }
      else if (isBank) { mockName = 'サンプル銀行'; mockIndustry = '金融'; }
      else if (isTrading) { mockName = 'デモ商事株式会社'; mockIndustry = '商社'; }
      else if (url.includes('data')) { mockName = 'NTTデータ(モック)'; mockIndustry = 'IT・通信'; }
      else if (url.includes('toyota')) { mockName = 'トヨタ自動車(モック)'; mockIndustry = 'メーカー'; }

      document.getElementById('add-company-name').value = mockName;
      document.getElementById('add-company-industry').value = mockIndustry;
      document.getElementById('add-company-recruit-url').value = url;

      // マイページが存在しそうなURLを生成
      const urlObj = new URL(url.startsWith('http') ? url : 'https://' + url);
      document.getElementById('add-company-mypage-url').value = `https://mypage.${urlObj.hostname}/login`;

      showToast('企業情報を自動取得しました', 'success');
      btn.innerHTML = '✨ 取得完了';
    }, 1200);
  });

  document.getElementById('btn-cancel-add')?.addEventListener('click', closeModal);
  document.getElementById('btn-save-add')?.addEventListener('click', () => {
    const name = document.getElementById('add-company-name')?.value.trim();
    if (!name) {
      showToast('企業名を入力してください', 'error');
      return;
    }

    const data = getData();
    const companies = data.companies || [];

    if (companies.some(c => c.name === name)) {
      showToast('この企業は既に登録されています', 'error');
      return;
    }

    companies.push({
      id: generateId(),
      name,
      industry: document.getElementById('add-company-industry')?.value || '',
      status: document.getElementById('add-company-status')?.value || 'interested',
      recruitUrl: document.getElementById('add-company-recruit-url')?.value.trim() || '',
      mypageUrl: document.getElementById('add-company-mypage-url')?.value.trim() || '',
      mypageId: document.getElementById('add-company-mypage-id')?.value.trim() || '',
      mypagePw: document.getElementById('add-company-mypage-pw')?.value.trim() || '',
      memo: document.getElementById('add-company-memo')?.value || '',
      scores: {
        salary: 3,
        benefits: 3,
        growth: 3,
        match: 3,
        environment: 3
      },
      stages: DEFAULT_STAGES.map(s => ({ ...s, id: generateId(), deadline: '' })),
      createdAt: new Date().toISOString()
    });

    updateData('companies', companies);
    closeModal();
    showToast(`${name} を追加しました`, 'success');
    refreshPage();
  });

  // ステージ追加
  document.getElementById('btn-add-stage-new')?.addEventListener('click', () => {
    const editor = document.getElementById('add-timeline-editor');
    if (!editor) return;
    const index = editor.children.length;
    const stageEl = document.createElement('div');
    stageEl.className = 'timeline-stage';
    stageEl.draggable = true;
    stageEl.dataset.stageIndex = index;
    stageEl.innerHTML = `
      <div class="timeline-stage-marker"></div>
      <div class="timeline-stage-content">
        <input type="text" class="form-input timeline-stage-input" placeholder="ステージ名" style="padding: 6px 10px; font-size: 13px;" />
      </div>
    `;
    editor.appendChild(stageEl);
  });
}

// ===== 企業編集モーダル =====
function openEditModal(id, openModal, closeModal, showToast, refreshPage) {
  const data = getData();
  const company = (data.companies || []).find(c => c.id === id);
  if (!company) return;

  const stages = company.stages || DEFAULT_STAGES.map(s => ({ ...s, id: generateId(), deadline: '' }));

  const body = `
    <div class="company-detail-form">
      <div class="company-detail-header">
        <div class="company-detail-header-left">
          ${getCompanyIcon(company.name)}
          <div>
            <strong style="font-size: 18px;">${escapeHtml(company.name)}</strong>
            ${company.industry ? `<span class="badge badge-blue" style="margin-left: 8px;">${escapeHtml(company.industry)}</span>` : ''}
          </div>
        </div>
      </div>
      ${company.recruitUrl ? `
        <a href="${escapeHtml(company.recruitUrl)}" target="_blank" class="company-recruit-link">🏠 採用ページ ↗</a>
      ` : ''}

      <div class="company-detail-grid">
        <div class="company-detail-left">
          <div class="form-group">
            <label class="form-label">企業名</label>
            <input type="text" class="form-input" id="edit-company-name" value="${escapeHtml(company.name)}" />
          </div>
          <div class="form-group">
            <label class="form-label">業界</label>
            <select class="form-select" id="edit-company-industry">
              <option value="">選択してください</option>
              ${INDUSTRY_OPTIONS.map(i => `<option value="${i}" ${company.industry === i ? 'selected' : ''}>${i}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">採用ページ</label>
            <input type="url" class="form-input" id="edit-company-recruit-url" value="${escapeHtml(company.recruitUrl || '')}" placeholder="https://..." />
          </div>
          <div class="form-group">
            <label class="form-label" style="font-weight: 600;">ログイン情報</label>
          </div>
          <div class="form-group">
            <label class="form-label" style="font-size:12px; color:var(--text-muted)">マイページURL</label>
            <input type="url" class="form-input" id="edit-company-mypage-url" value="${escapeHtml(company.mypageUrl || '')}" placeholder="https://..." />
          </div>
          <div class="form-group">
            <label class="form-label" style="font-size:12px; color:var(--text-muted)">マイページID</label>
            <input type="text" class="form-input" id="edit-company-mypage-id" value="${escapeHtml(company.mypageId || '')}" placeholder="ログインID" />
          </div>
          <div class="form-group">
            <label class="form-label" style="font-size:12px; color:var(--text-muted)">パスワード</label>
            <input type="password" class="form-input" id="edit-company-mypage-pw" value="${escapeHtml(company.mypagePw || '')}" placeholder="パスワード" />
          </div>
          <div class="form-group" style="margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--border);">
            <label class="form-label" style="font-weight: 600;">企業評価（1〜5）</label>
            <div style="display: grid; gap: 12px; margin-top: 16px;">
              ${renderScoreInput('給与・待遇', 'salary', company.scores?.salary || 0)}
              ${renderScoreInput('福利厚生', 'benefits', company.scores?.benefits || 0)}
              ${renderScoreInput('成長性', 'growth', company.scores?.growth || 0)}
              ${renderScoreInput('マッチ度', 'match', company.scores?.match || 0)}
              ${renderScoreInput('働く環境', 'environment', company.scores?.environment || 0)}
            </div>
          </div>
        </div>
        <div class="company-detail-right">
          <div class="form-group">
            <label class="form-label">ステータス</label>
            <select class="form-select" id="edit-company-status">
              ${Object.entries(STATUS_MAP).map(([key, val]) =>
    `<option value="${key}" ${company.status === key ? 'selected' : ''}>${val.label}</option>`
  ).join('')}
            </select>
          </div>
          <div class="form-group">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <label class="form-label" style="margin-bottom: 0;">選考タイムライン</label>
              <button type="button" class="btn btn-secondary btn-sm" id="btn-generate-company-email" style="padding: 4px 8px; font-size: 12px; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3);">
                ✉️ メール文面ツール
              </button>
            </div>
            <div class="timeline-editor" id="edit-timeline-editor">
              ${stages.map((stage, i) => `
                <div class="timeline-stage ${stage.done ? 'done' : ''}" draggable="true" data-stage-index="${i}">
                  <div class="timeline-stage-marker" data-toggle-stage="${i}" title="クリックで完了/未完了を切替"></div>
                  <div class="timeline-stage-content">
                    <span class="timeline-stage-label">${escapeHtml(stage.label)}</span>
                    ${stage.deadline ? `<span class="timeline-stage-date-wrapper" style="display:inline-flex; align-items:center; gap:4px;"><span class="timeline-stage-date">${stage.deadline}</span><button class="remove-deadline-btn" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:12px; padding:0 4px;" data-remove-deadline="${i}">✕</button></span>` : ''}
                  </div>
                  <button class="timeline-stage-deadline-btn" data-set-deadline="${i}" title="締切を設定">📅</button>
                  <button class="timeline-stage-remove-btn" data-remove-stage="${i}" title="削除">✕</button>
                </div>
              `).join('')}
            </div>
            <div class="timeline-actions">
              <button class="btn btn-sm btn-secondary" id="btn-add-stage-edit">＋ ステージ追加</button>
              <button class="btn btn-sm btn-secondary" id="btn-add-deadline-edit">＋ 締切を追加</button>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">メモ</label>
            <textarea class="form-textarea" id="edit-company-memo" rows="3">${escapeHtml(company.memo || '')}</textarea>
          </div>
        </div>
      </div>
      <div class="modal-footer" style="justify-content: space-between;">
        <button class="btn btn-danger" id="btn-delete-company-edit">🗑️ 削除</button>
        <div style="display:flex; gap:12px;">
          <button class="btn btn-secondary" id="btn-cancel-edit">キャンセル</button>
          <button class="btn btn-primary" id="btn-save-edit">保存</button>
        </div>
      </div>
    </div>
  `;

  openModal(`${company.name}`, body);

  // DOMレンダリング完了後にイベントリスナーを登録
  setTimeout(() => {
    // ステージ完了トグル
    document.querySelectorAll('[data-toggle-stage]').forEach(marker => {
      marker.addEventListener('click', () => {
        const stage = marker.closest('.timeline-stage');
        stage.classList.toggle('done');
      });
    });

    initTimelineDragAndDrop('edit-timeline-editor');

    // 締切追加時のUIイベントと既存の削除ボタン設定
    const setupDeadlineRemoveBtns = () => {
      document.querySelectorAll('.remove-deadline-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          btn.closest('.timeline-stage-date-wrapper').remove();
        });
      });
    };
    setupDeadlineRemoveBtns();

    // 締切設定
    document.querySelectorAll('[data-set-deadline]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = btn.dataset.setDeadline;
        const stage = btn.closest('.timeline-stage');
        const content = stage.querySelector('.timeline-stage-content');
        const existing = content.querySelector('.timeline-stage-date-wrapper') || content.querySelector('.timeline-stage-date');
        if (existing) {
          existing.remove();
          return;
        }
        const input = document.createElement('input');
        input.type = 'date';
        input.className = 'form-input timeline-stage-date-input';
        input.style.cssText = 'padding: 4px 8px; font-size: 12px; width: auto; margin-top: 4px;';
        input.addEventListener('change', () => {
          const wrapper = document.createElement('span');
          wrapper.className = 'timeline-stage-date-wrapper';
          wrapper.style.cssText = 'display:inline-flex; align-items:center; gap:4px;';
          wrapper.innerHTML = `<span class="timeline-stage-date">${input.value}</span><button class="remove-deadline-btn" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:12px; padding:0 4px;">✕</button>`;
          input.replaceWith(wrapper);
          setupDeadlineRemoveBtns();
        });
        content.appendChild(input);
        input.focus();
      });
    });

    // ステージ削除
    document.querySelectorAll('[data-remove-stage]').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.closest('.timeline-stage').remove();
      });
    });

    // ステージ追加
    document.getElementById('btn-add-stage-edit')?.addEventListener('click', () => {
      const editor = document.getElementById('edit-timeline-editor');
      if (!editor) return;
      const idx = editor.children.length;
      const stageEl = document.createElement('div');
      stageEl.className = 'timeline-stage';
      stageEl.draggable = true;
      stageEl.dataset.stageIndex = idx;
      stageEl.innerHTML = `
        <div class="timeline-stage-marker"></div>
        <div class="timeline-stage-content">
          <input type="text" class="form-input timeline-stage-input" placeholder="ステージ名" style="padding: 6px 10px; font-size: 13px;" />
        </div>
        <button class="timeline-stage-deadline-btn" data-set-deadline="${idx}" title="締切を設定">📅</button>
        <button class="timeline-stage-remove-btn" title="削除">✕</button>
      `;
      editor.appendChild(stageEl);
      stageEl.querySelector('.timeline-stage-remove-btn').addEventListener('click', () => stageEl.remove());
      stageEl.querySelector('.timeline-stage-marker').addEventListener('click', () => stageEl.classList.toggle('done'));
      stageEl.querySelector('.timeline-stage-deadline-btn').addEventListener('click', () => {
        const content = stageEl.querySelector('.timeline-stage-content');
        const existing = content.querySelector('.timeline-stage-date-wrapper');
        if (existing) {
          existing.remove();
          return;
        }
        const input = document.createElement('input');
        input.type = 'date';
        input.className = 'form-input timeline-stage-date-input';
        input.style.cssText = 'padding: 4px 8px; font-size: 12px; width: auto; margin-top: 4px;';
        input.addEventListener('change', () => {
          const wrapper = document.createElement('span');
          wrapper.className = 'timeline-stage-date-wrapper';
          wrapper.style.cssText = 'display:inline-flex; align-items:center; gap:4px;';
          wrapper.innerHTML = `<span class="timeline-stage-date">${input.value}</span><button class="remove-deadline-btn" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:12px; padding:0 4px;">✕</button>`;
          input.replaceWith(wrapper);
          wrapper.querySelector('.remove-deadline-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            wrapper.remove();
          });
        });
        content.appendChild(input);
        input.focus();
      });
    });

    // 締切追加ボタン
    document.getElementById('btn-add-deadline-edit')?.addEventListener('click', () => {
      const editor = document.getElementById('edit-timeline-editor');
      const stages = editor?.querySelectorAll('.timeline-stage:not(.done)');
      if (stages && stages.length > 0) {
        const firstUndone = stages[0];
        const deadlineBtn = firstUndone.querySelector('[data-set-deadline]');
        if (deadlineBtn) deadlineBtn.click();
      }
    });

    // 削除ボタン
    const deleteBtn = document.getElementById('btn-delete-company-edit');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm(`${company.name} を削除しますか？`)) {
          const data = getData();
          data.companies = (data.companies || []).filter(c => c.id !== id);
          updateData('companies', data.companies);
          closeModal();
          showToast('企業を削除しました', 'success');
          refreshPage();
        }
      });
    }

    // キャンセル
    document.getElementById('btn-cancel-edit')?.addEventListener('click', closeModal);

    // メール文面ツール
    document.getElementById('btn-generate-company-email')?.addEventListener('click', (e) => {
      e.preventDefault();

      const mailBody = `件名：【面接のお礼】（大学名・氏名）

${company.name}
採用ご担当者様

お世話になっております。
本日（または〇月〇日）、面接のお時間をいただきました、
〇〇大学〇〇学部の（あなたの氏名）です。

本日はお忙しい中、貴重なお時間を割いていただき誠にありがとうございました。
皆様から直接お話を伺うことで、貴社の事業や社風についての理解が深まり、
貴社で働きたいという思いがより一層強くなりました。

特に「（※ここに面接で印象に残ったポイントを一言添える）」というお話が大変勉強になりました。

まずは面接のお礼をお伝えしたく、メールを差し上げました。
末筆ながら、貴社の益々のご発展をお祈り申し上げます。

--------------------------------------------------
〇〇大学 〇〇学部 〇〇学科 〇年
（あなたの氏名）
電話：090-XXXX-XXXX
Email：example@email.com
--------------------------------------------------`;

      const modalContent = `
            <div class="form-group">
                <label class="form-label">生成されたお礼メール</label>
                <div class="text-sm text-muted mb-8">※「（あなたの氏名）」などのプレースホルダーを自分の情報に書き換えてお使いください。</div>
                <textarea class="form-textarea" id="generated-company-email-text" rows="18" style="font-size: 13px; line-height: 1.6; font-family: monospace;">${mailBody}</textarea>
            </div>
            <div class="modal-footer flex justify-between gap-12 mt-24">
                <button class="btn btn-secondary" onclick="document.getElementById('modal-close-btn').click();">閉じる</button>
                <button class="btn btn-primary" id="btn-copy-company-email" style="background: var(--success);">📋 クリップボードにコピー</button>
            </div>
        `;

      openModal(`✉️ ${company.name} 宛のメール`, modalContent);

      setTimeout(() => {
        document.getElementById('btn-copy-company-email')?.addEventListener('click', () => {
          const text = document.getElementById('generated-company-email-text').value;
          navigator.clipboard.writeText(text).then(() => {
            showToast('メール文面をコピーしました！メーラーに貼り付けてください。', 'success');
          }).catch(() => {
            showToast('コピーに失敗しました。', 'error');
          });
        });
      }, 100);
    });

    // 保存
    document.getElementById('btn-save-edit')?.addEventListener('click', () => {
      const updatedName = document.getElementById('edit-company-name')?.value.trim();
      if (!updatedName) {
        showToast('企業名は必須です', 'error');
        return;
      }

      // タイムラインステージを収集
      const stageEls = document.querySelectorAll('#edit-timeline-editor .timeline-stage');
      const updatedStages = [];
      stageEls.forEach(el => {
        const labelEl = el.querySelector('.timeline-stage-label');
        const inputEl = el.querySelector('.timeline-stage-input');
        const dateEl = el.querySelector('.timeline-stage-date');
        const dateInputEl = el.querySelector('.timeline-stage-date-input');
        const label = inputEl ? inputEl.value.trim() : (labelEl ? labelEl.textContent.trim() : '');
        if (!label) return;
        updatedStages.push({
          id: generateId(),
          label,
          done: el.classList.contains('done'),
          deadline: dateInputEl ? dateInputEl.value : (dateEl ? dateEl.textContent.trim() : '')
        });
      });

      const data = getData();
      const idx = data.companies.findIndex(c => c.id === id);
      if (idx !== -1) {
        data.companies[idx] = {
          ...data.companies[idx],
          name: updatedName,
          industry: document.getElementById('edit-company-industry')?.value || '',
          status: document.getElementById('edit-company-status')?.value || 'interested',
          recruitUrl: document.getElementById('edit-company-recruit-url')?.value.trim() || '',
          mypageUrl: document.getElementById('edit-company-mypage-url')?.value.trim() || '',
          mypageId: document.getElementById('edit-company-mypage-id')?.value.trim() || '',
          mypagePw: document.getElementById('edit-company-mypage-pw')?.value.trim() || '',
          memo: document.getElementById('edit-company-memo')?.value || '',
          scores: {
            salary: parseInt(document.querySelector('input[name="score-salary"]:checked')?.value || '0', 10),
            benefits: parseInt(document.querySelector('input[name="score-benefits"]:checked')?.value || '0', 10),
            growth: parseInt(document.querySelector('input[name="score-growth"]:checked')?.value || '0', 10),
            match: parseInt(document.querySelector('input[name="score-match"]:checked')?.value || '0', 10),
            environment: parseInt(document.querySelector('input[name="score-environment"]:checked')?.value || '0', 10),
          },
          stages: updatedStages,
        };
        updateData('companies', data.companies);
        closeModal();
        showToast('企業情報を更新しました', 'success');
        refreshPage();
      }
    });
  }, 0);
}

function renderScoreInput(label, key, currentValue) {
  return `
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <span style="font-size: 13px; color: var(--text-secondary);">${label}</span>
      <div class="score-stars">
        ${[5, 4, 3, 2, 1].map(val => `
          <input type="radio" id="score-${key}-${val}" name="score-${key}" value="${val}" ${currentValue === val ? 'checked' : ''} />
          <label for="score-${key}-${val}">★</label>
        `).join('')}
      </div>
    </div>
  `;
}

// ===== 企業比較(レーダーチャート)モーダル =====
function openCompareModal(openModal, closeModal) {
  const data = getData();
  const companies = (data.companies || []).filter(c => c.scores); // 評価がある企業のみ

  if (companies.length === 0) {
    openModal('企業比較', '<div style="padding: 20px;">まだ企業データがありません。企業を登録し、編集画面から評価を入力してください。</div>');
    return;
  }

  const body = `
    <div style="padding-bottom: 20px;">
      <p style="color: var(--text-secondary); margin-bottom: 24px; font-size: 14px;">
        評価済みの企業を最大3社まで選択して比較できます。
      </p>
      
      <div style="display: flex; gap: 16px; margin-bottom: 32px;">
        ${[1, 2, 3].map(i => `
          <div style="flex: 1;">
            <select class="form-select compare-select" id="compare-select-${i}">
              <option value="">-- ${i}社目 --</option>
              ${companies.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('')}
            </select>
          </div>
        `).join('')}
      </div>

      <div style="height: 350px; position: relative; display: flex; justify-content: center;">
        <canvas id="companyRadarChart"></canvas>
      </div>
    </div>
  `;

  openModal('📊 企業比較マトリックス', body);

  setTimeout(() => {
    let radarChart = null;
    const ctx = document.getElementById('companyRadarChart');

    // 初期選択 (最大上位3社を選択)
    const selects = [
      document.getElementById('compare-select-1'),
      document.getElementById('compare-select-2'),
      document.getElementById('compare-select-3')
    ];

    companies.slice(0, 3).forEach((c, i) => {
      if (selects[i]) selects[i].value = c.id;
    });

    function updateChart() {
      if (!ctx || !window.Chart) return;

      const selectedIds = selects.map(s => s.value).filter(Boolean);
      const selectedComps = selectedIds.map(id => companies.find(c => c.id === id)).filter(Boolean);

      const colors = [
        { border: '#7c3aed', bg: 'rgba(124, 58, 237, 0.2)' }, // purple
        { border: '#10b981', bg: 'rgba(16, 185, 129, 0.2)' }, // green
        { border: '#3b82f6', bg: 'rgba(59, 130, 246, 0.2)' }  // blue
      ];

      const chartData = {
        labels: ['給与・待遇', '福利厚生', '成長性', 'マッチ度', '働く環境'],
        datasets: selectedComps.map((c, i) => ({
          label: c.name,
          data: [
            c.scores?.salary || 0,
            c.scores?.benefits || 0,
            c.scores?.growth || 0,
            c.scores?.match || 0,
            c.scores?.environment || 0
          ],
          backgroundColor: colors[i % colors.length].bg,
          borderColor: colors[i % colors.length].border,
          pointBackgroundColor: colors[i % colors.length].border,
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: colors[i % colors.length].border,
          borderWidth: 2,
        }))
      };

      if (radarChart) radarChart.destroy();

      radarChart = new window.Chart(ctx, {
        type: 'radar',
        data: chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          elements: {
            line: { tension: 0.1 }
          },
          scales: {
            r: {
              angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
              grid: { color: 'rgba(255, 255, 255, 0.1)' },
              pointLabels: { color: '#e8e8f0', font: { size: 13 } },
              ticks: {
                display: false,
                min: 0,
                max: 5,
                stepSize: 1
              }
            }
          },
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: '#e8e8f0', padding: 20 }
            }
          }
        }
      });
    }

    selects.forEach(s => s.addEventListener('change', updateChart));
    updateChart();
  }, 0);
}

// ===== ドラッグ＆ドロップ =====
function initDragAndDrop(showToast, refreshPage) {
  let draggedCard = null;
  let draggedId = null;

  document.querySelectorAll('.kanban-card').forEach(card => {
    card.addEventListener('dragstart', (e) => {
      draggedCard = card;
      draggedId = card.dataset.companyId;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', draggedId);
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      document.querySelectorAll('.kanban-column-body').forEach(col => {
        col.classList.remove('drag-over');
      });
      draggedCard = null;
      draggedId = null;
    });
  });

  document.querySelectorAll('.kanban-column-body').forEach(column => {
    column.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      column.classList.add('drag-over');
    });

    column.addEventListener('dragleave', (e) => {
      if (!column.contains(e.relatedTarget)) {
        column.classList.remove('drag-over');
      }
    });

    column.addEventListener('drop', (e) => {
      e.preventDefault();
      column.classList.remove('drag-over');
      const newStatus = column.dataset.status;
      const companyId = e.dataTransfer.getData('text/plain');

      if (!companyId || !newStatus) return;

      const data = getData();
      const company = (data.companies || []).find(c => c.id === companyId);
      if (!company || company.status === newStatus) return;

      company.status = newStatus;
      updateData('companies', data.companies);
      showToast(`${company.name} を「${STATUS_MAP[newStatus].label}」に移動しました`, 'success');
      refreshPage();
    });
  });
}

// ===== 初期化 =====
export function initCompanies(showToast, openModal, closeModal, refreshPage) {
  // ドラッグ＆ドロップ
  initDragAndDrop(showToast, refreshPage);

  // 企業追加ボタン
  document.getElementById('btn-add-company-modal')?.addEventListener('click', () => {
    openAddModal(openModal, closeModal, showToast, refreshPage);
  });

  // 企業比較ボタン
  document.getElementById('btn-compare-companies')?.addEventListener('click', () => {
    openCompareModal(openModal, closeModal);
  });

  // カンバンカードクリック → 編集モーダル
  document.querySelectorAll('.kanban-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.companyId;
      openEditModal(id, openModal, closeModal, showToast, refreshPage);
    });
  });

  // 検索
  document.getElementById('company-search')?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    document.querySelectorAll('.kanban-card').forEach(card => {
      const name = card.querySelector('.kanban-card-name')?.textContent.toLowerCase() || '';
      const industry = card.querySelector('.kanban-card-industry')?.textContent.toLowerCase() || '';
      card.style.display = (name.includes(query) || industry.includes(query)) ? '' : 'none';
    });
  });

  // 業界フィルター
  document.getElementById('industry-filter')?.addEventListener('change', (e) => {
    const filter = e.target.value;
    document.querySelectorAll('.kanban-card').forEach(card => {
      if (!filter) {
        card.style.display = '';
        return;
      }
      const industry = card.querySelector('.kanban-card-industry')?.textContent || '';
      card.style.display = industry === filter ? '' : 'none';
    });
  });
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
