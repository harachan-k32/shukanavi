// schedule.js - スケジュール管理モジュール
import { getData, updateData, generateId } from '../storage.js';

const EVENT_TYPES = {
  'seminar': { label: '説明会', icon: '🏢', color: 'blue' },
  'deadline': { label: 'ES締切', icon: '📝', color: 'red' },
  'interview': { label: '面接', icon: '💬', color: 'yellow' },
  'other': { label: 'その他', icon: '📌', color: 'purple' }
};

export function renderSchedule() {
  const data = getData();
  const events = data.events || [];
  const companies = data.companies || [];
  const now = new Date();

  return `
    <div class="page-header">
      <h2>📅 スケジュール管理</h2>
      <p>説明会・ES締切・面接日程を管理</p>
    </div>

    <div class="grid-2">
      <!-- カレンダー -->
      <div class="card">
        <div class="calendar" id="calendar-container">
          ${renderCalendar(now.getFullYear(), now.getMonth(), events)}
        </div>
      </div>

      <!-- イベント追加 -->
      <div class="card">
        <div class="card-header flex justify-between items-center">
          <h3 class="card-title">予定を追加</h3>
          <button type="button" class="btn btn-secondary btn-sm" id="btn-ai-schedule-parse" style="padding: 4px 8px; font-size: 12px; background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.3);">
            🤖 文章からAI自動入力
          </button>
        </div>
        <div class="form-group">
          <label class="form-label">タイトル</label>
          <input type="text" class="form-input" id="event-title" placeholder="例：○○会社 一次面接" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">日付</label>
            <input type="date" class="form-input" id="event-date" />
          </div>
          <div class="form-group">
            <label class="form-label">時間</label>
            <input type="time" class="form-input" id="event-time" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">種類</label>
            <select class="form-select" id="event-type">
              ${Object.entries(EVENT_TYPES).map(([key, val]) => `<option value="${key}">${val.icon} ${val.label}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">関連企業</label>
            <select class="form-select" id="event-company">
              <option value="">選択なし</option>
              ${companies.map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">メモ</label>
          <textarea class="form-textarea" id="event-memo" rows="2" placeholder="メモ..."></textarea>
        </div>
        <button class="btn btn-primary w-full" id="btn-add-event">＋ 予定を追加</button>
      </div>
    </div>

    <!-- 予定一覧 -->
    <div class="card mt-24">
      <div class="card-header">
        <h3 class="card-title">予定一覧</h3>
        <div class="tabs" style="margin-bottom: 0; border: none; background: transparent; padding: 0;">
          <button class="tab active" data-event-filter="upcoming">今後</button>
          <button class="tab" data-event-filter="past">過去</button>
          <button class="tab" data-event-filter="all">すべて</button>
        </div>
      </div>
      <div id="event-list">
        ${renderEventList(events, 'upcoming')}
      </div>
    </div>
  `;
}

function renderCalendar(year, month, events) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const today = new Date();

  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const dayHeaders = ['日', '月', '火', '水', '木', '金', '土'];

  // イベントがある日をマップ
  const eventDays = {};
  events.forEach(e => {
    const d = new Date(e.date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const key = d.getDate();
      if (!eventDays[key]) eventDays[key] = [];
      eventDays[key].push(e.type);
    }
  });

  let calendarDays = '';

  // 前月の日
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    calendarDays += `<div class="calendar-day other-month">${prevMonthLastDay - i}</div>`;
  }

  // 当月の日
  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
    const hasEvents = eventDays[day];
    let eventClass = '';
    if (hasEvents) {
      eventClass = 'has-events';
      if (hasEvents.includes('deadline')) eventClass += ' event-deadline';
      else if (hasEvents.includes('interview')) eventClass += ' event-interview';
    }
    calendarDays += `<div class="calendar-day ${isToday ? 'today' : ''} ${eventClass}" data-date="${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}">${day}</div>`;
  }

  // 次月の日（6行まで埋める）
  const totalCells = startDayOfWeek + daysInMonth;
  const remaining = (7 - (totalCells % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    calendarDays += `<div class="calendar-day other-month">${i}</div>`;
  }

  return `
    <div class="calendar-header">
      <button class="btn-icon" data-calendar-nav="prev">◀</button>
      <span class="calendar-title" data-calendar-year="${year}" data-calendar-month="${month}">${year}年 ${monthNames[month]}</span>
      <button class="btn-icon" data-calendar-nav="next">▶</button>
    </div>
    <div class="calendar-grid">
      ${dayHeaders.map(d => `<div class="calendar-day-header">${d}</div>`).join('')}
      ${calendarDays}
    </div>
  `;
}

function renderEventList(events, filter) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let filtered = [...events];
  if (filter === 'upcoming') {
    filtered = events.filter(e => new Date(e.date) >= today);
  } else if (filter === 'past') {
    filtered = events.filter(e => new Date(e.date) < today);
  }

  filtered.sort((a, b) => {
    if (filter === 'past') return new Date(b.date) - new Date(a.date);
    return new Date(a.date) - new Date(b.date);
  });

  if (filtered.length === 0) {
    return `
      <div class="empty-state" style="padding: 30px;">
        <span class="empty-state-icon" style="font-size: 32px;">📅</span>
        <div class="empty-state-sub">予定がありません</div>
      </div>
    `;
  }

  return filtered.map(event => {
    const eventDate = new Date(event.date);
    const typeInfo = EVENT_TYPES[event.type] || EVENT_TYPES['other'];
    const diff = Math.ceil((eventDate - new Date()) / (1000 * 60 * 60 * 24));
    const diffText = diff === 0 ? '今日' : diff === 1 ? '明日' : diff > 0 ? `あと${diff}日` : `${Math.abs(diff)}日前`;

    return `
      <div class="list-item" data-event-id="${event.id}">
        <div class="list-item-left">
          <span style="font-size: 20px;">${typeInfo.icon}</span>
          <div>
            <div style="font-weight: 500;">${escapeHtml(event.title)}</div>
            <div class="text-sm text-muted">
              ${eventDate.getMonth() + 1}/${eventDate.getDate()}（${getDayName(eventDate)}）
              ${event.time ? ' ' + event.time : ''}
              ${event.company ? ' · ' + escapeHtml(event.company) : ''}
            </div>
          </div>
        </div>
        <div class="list-item-right">
          <span class="badge badge-${typeInfo.color}">${diffText}</span>
          <button class="btn-icon" data-delete-event="${event.id}" title="削除">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
}

export function initSchedule(showToast, openModal, closeModal, refreshPage) {
  // イベント追加
  document.getElementById('btn-add-event')?.addEventListener('click', () => {
    const title = document.getElementById('event-title')?.value.trim();
    const date = document.getElementById('event-date')?.value;
    const time = document.getElementById('event-time')?.value;
    const type = document.getElementById('event-type')?.value || 'other';
    const company = document.getElementById('event-company')?.value;
    const memo = document.getElementById('event-memo')?.value;

    if (!title || !date) {
      showToast('タイトルと日付は必須です', 'error');
      return;
    }

    const data = getData();
    const events = data.events || [];
    events.push({
      id: generateId(),
      title, date, time, type, company, memo,
      createdAt: new Date().toISOString()
    });
    updateData('events', events);
    showToast('予定を追加しました', 'success');
    refreshPage();
  });

  // AI自動入力モーダル表示
  document.getElementById('btn-ai-schedule-parse')?.addEventListener('click', () => {
    const modalContent = `
            <div class="form-group">
                <label class="form-label">企業からのメールや案内文を貼り付け</label>
                <textarea class="form-textarea" id="ai-schedule-text-input" rows="8" placeholder="例：\n株式会社〇〇 一次面接のご案内\n日時：2026年3月15日(金) 14:00〜15:00\n場所：オンライン..."></textarea>
            </div>
            <div class="modal-footer flex justify-end gap-12 mt-24">
                <button class="btn btn-secondary" onclick="document.getElementById('modal-close-btn').click();">キャンセル</button>
                <button class="btn btn-primary" id="btn-parse-schedule">🤖 予定を抽出する</button>
            </div>
        `;
    openModal('🤖 AIスケジュール自動入力', modalContent);

    // ボタンがレイトバインディングされるので少し待つ
    setTimeout(() => {
      document.getElementById('btn-parse-schedule')?.addEventListener('click', () => {
        const text = document.getElementById('ai-schedule-text-input')?.value || '';
        if (!text.trim()) {
          showToast('文章を貼り付けてください', 'error');
          return;
        }
        const btn = document.getElementById('btn-parse-schedule');
        btn.innerHTML = '🤖 抽出中...';
        btn.disabled = true;

        setTimeout(() => {
          // 簡単なモックパースロジック（実際にはAI APIを叩く想定）
          // 1. 日付の抽出 (例: 3/15, 3月15日)
          const today = new Date();
          let eDate = '';
          const dateMatch = text.match(/(\\d{1,2})[月/](\\d{1,2})[日]?/);
          if (dateMatch) {
            const m = dateMatch[1].padStart(2, '0');
            const d = dateMatch[2].padStart(2, '0');
            const year = today.getFullYear();
            eDate = `${year}-${m}-${d}`;
          }

          // 2. 時間の抽出
          let eTime = '';
          const timeMatch = text.match(/(\\d{1,2})[:：](\\d{2})/);
          if (timeMatch) {
            eTime = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
          }

          // 3. タイトル・種類の推論
          let eTitle = '予定';
          let eType = 'other';
          if (text.includes('面接')) { eType = 'interview'; eTitle = '面接'; }
          else if (text.includes('説明会')) { eType = 'seminar'; eTitle = '説明会'; }
          else if (text.includes('ES') || text.includes('提出')) { eType = 'deadline'; eTitle = 'ES締切'; }

          const companyMatch = text.match(/(株式会社\\S+|\\S+株式会社|\\S+（株）|（株）\\S+)/);
          if (companyMatch) {
            eTitle = `${companyMatch[1]} ${eTitle}`;
          }

          // フォームに反映
          if (eTitle) document.getElementById('event-title').value = eTitle;
          if (eDate) document.getElementById('event-date').value = eDate;
          if (eTime) document.getElementById('event-time').value = eTime;
          if (eType) document.getElementById('event-type').value = eType;

          document.getElementById('event-memo').value = text;

          closeModal();
          showToast('スケジュールの入力欄に自動反映しました', 'success');
        }, 1000);
      });
    }, 100);
  });

  // カレンダーナビゲーション
  document.querySelectorAll('[data-calendar-nav]').forEach(btn => {
    btn.addEventListener('click', () => {
      const titleEl = document.querySelector('.calendar-title');
      let year = parseInt(titleEl.dataset.calendarYear);
      let month = parseInt(titleEl.dataset.calendarMonth);

      if (btn.dataset.calendarNav === 'prev') {
        month--;
        if (month < 0) { month = 11; year--; }
      } else {
        month++;
        if (month > 11) { month = 0; year++; }
      }

      const data = getData();
      const container = document.getElementById('calendar-container');
      if (container) {
        container.innerHTML = renderCalendar(year, month, data.events || []);
        // Re-bind calendar nav
        initSchedule(showToast, openModal, closeModal, refreshPage);
      }
    });
  });

  // カレンダーの日付クリック
  document.querySelectorAll('.calendar-day[data-date]').forEach(day => {
    day.addEventListener('click', () => {
      const dateInput = document.getElementById('event-date');
      if (dateInput) dateInput.value = day.dataset.date;
    });
  });

  // イベントフィルター
  document.querySelectorAll('[data-event-filter]').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('[data-event-filter]').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const data = getData();
      const listEl = document.getElementById('event-list');
      if (listEl) {
        listEl.innerHTML = renderEventList(data.events || [], tab.dataset.eventFilter);
        // Re-bind delete buttons
        bindDeleteButtons(showToast, refreshPage);
      }
    });
  });

  // 削除ボタン
  bindDeleteButtons(showToast, refreshPage);
}

function bindDeleteButtons(showToast, refreshPage) {
  document.querySelectorAll('[data-delete-event]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.deleteEvent;
      if (confirm('この予定を削除しますか？')) {
        const data = getData();
        data.events = (data.events || []).filter(ev => ev.id !== id);
        updateData('events', data.events);
        showToast('予定を削除しました', 'success');
        refreshPage();
      }
    });
  });
}

function getDayName(date) {
  return ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
