// dashboard.js - ダッシュボードモジュール
import { getData } from '../storage.js';

export function renderDashboard() {
  const data = getData();
  const companies = data.companies || [];
  const events = data.events || [];
  const esEntries = data.esEntries || [];
  const analysis = data.selfAnalysis || {};
  const answers = data.interviewAnswers || {};

  // Stats計算
  const totalCompanies = companies.length;
  const esSubmitted = companies.filter(c => ['es-submitted', 'interview-1', 'interview-2', 'interview', 'offer'].includes(c.status)).length;
  const interviewCount = companies.filter(c => ['interview-1', 'interview-2', 'interview', 'offer'].includes(c.status)).length;
  const offerCount = companies.filter(c => c.status === 'offer').length;

  // 今後の予定（今日以降）
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingEvents = events
    .filter(e => new Date(e.date) >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 8);

  // 直近の締切
  const deadlineEvents = upcomingEvents.filter(e => e.type === 'deadline');

  // 進捗率計算
  const analysisItems = (analysis.strengths?.length || 0) + (analysis.weaknesses?.length || 0) + (analysis.gakuchika?.length || 0);
  const analysisProgress = Math.min(100, Math.round((analysisItems / 10) * 100));

  const answeredQuestions = Object.keys(answers).length;
  const interviewProgress = Math.min(100, Math.round((answeredQuestions / 20) * 100));

  // 選考パイプライン
  const statusGroups = {
    'interested': companies.filter(c => c.status === 'interested'),
    'not-applied': companies.filter(c => c.status === 'not-applied'),
    'es-submitted': companies.filter(c => c.status === 'es-submitted'),
    'interview-1': companies.filter(c => c.status === 'interview-1'),
    'interview-2': companies.filter(c => c.status === 'interview-2'),
    'interview': companies.filter(c => c.status === 'interview'),
    'offer': companies.filter(c => c.status === 'offer'),
    'rejected': companies.filter(c => c.status === 'rejected'),
  };

  return `
    <div class="page-header">
      <h2>📊 ダッシュボード</h2>
      <p>就活の進捗を一目で確認</p>
    </div>

    <!-- Stats -->
    <div class="stats-grid">
      <div class="stat-card anim-delay-1">
        <span class="stat-icon">🏢</span>
        <div class="stat-value">${totalCompanies}</div>
        <div class="stat-label">管理企業数</div>
      </div>
      <div class="stat-card anim-delay-2">
        <span class="stat-icon">📝</span>
        <div class="stat-value">${esSubmitted}</div>
        <div class="stat-label">ES提出済</div>
      </div>
      <div class="stat-card anim-delay-3">
        <span class="stat-icon">💬</span>
        <div class="stat-value">${interviewCount}</div>
        <div class="stat-label">面接進行中</div>
      </div>
      <div class="stat-card anim-delay-4">
        <span class="stat-icon">🎉</span>
        <div class="stat-value">${offerCount}</div>
        <div class="stat-label">内定獲得</div>
      </div>
    </div>

    <div class="grid-2">
      <!-- 今後の予定 -->
      <div class="card anim-delay-2">
        <div class="card-header">
          <h3 class="card-title">📅 今後の予定</h3>
          <span class="text-sm text-muted">${upcomingEvents.length}件</span>
        </div>
        ${upcomingEvents.length === 0 ? `
          <div class="empty-state" style="padding: 30px;">
            <span class="empty-state-icon" style="font-size: 32px;">📅</span>
            <div class="empty-state-sub">予定がありません</div>
          </div>
        ` : `
          <div class="timeline">
            ${upcomingEvents.map(event => {
    const eventDate = new Date(event.date);
    const isToday = eventDate.toDateString() === new Date().toDateString();
    const dateStr = isToday ? '今日' : `${eventDate.getMonth() + 1}/${eventDate.getDate()}`;
    const typeClass = event.type === 'deadline' ? 'deadline' : event.type === 'interview' ? 'interview-event' : '';
    const typeLabel = { 'seminar': '説明会', 'deadline': '締切', 'interview': '面接', 'other': 'その他' }[event.type] || event.type;
    return `
                <div class="timeline-item ${typeClass}">
                  <div class="timeline-date">${dateStr}（${getDayName(eventDate)}）${event.time ? ' ' + event.time : ''}</div>
                  <div class="timeline-content">
                    <div class="timeline-title">${escapeHtml(event.title)}</div>
                    <div class="timeline-desc">${escapeHtml(event.company || '')} · ${typeLabel}</div>
                  </div>
                </div>
              `;
  }).join('')}
          </div>
        `}
      </div>

      <!-- 進捗サマリー -->
      <div class="card anim-delay-3">
        <div class="card-header">
          <h3 class="card-title">📈 就活進捗</h3>
        </div>

        <div class="mb-24">
          <div class="flex justify-between items-center mb-8">
            <span class="text-sm">自己分析</span>
            <span class="text-sm text-muted">${analysisProgress}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill ${analysisProgress >= 70 ? 'green' : analysisProgress >= 40 ? 'yellow' : ''}" style="width: ${analysisProgress}%"></div>
          </div>
        </div>

        <div class="mb-24">
          <div class="flex justify-between items-center mb-8">
            <span class="text-sm">面接対策</span>
            <span class="text-sm text-muted">${interviewProgress}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill ${interviewProgress >= 70 ? 'green' : interviewProgress >= 40 ? 'yellow' : ''}" style="width: ${interviewProgress}%"></div>
          </div>
        </div>

        <div class="mb-24">
          <div class="flex justify-between items-center mb-8">
            <span class="text-sm">ES作成</span>
            <span class="text-sm text-muted">${esEntries.length}件</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${Math.min(100, esEntries.length * 15)}%"></div>
          </div>
        </div>

        ${deadlineEvents.length > 0 ? `
          <div class="mt-24" style="padding: 14px; background: var(--danger-bg); border-radius: var(--radius-md); border: 1px solid rgba(239,68,68,0.2);">
            <div style="font-size: 13px; font-weight: 600; color: var(--danger); margin-bottom: 8px;">⚠️ 締切迫る</div>
            ${deadlineEvents.slice(0, 3).map(e => {
    const d = new Date(e.date);
    const diff = Math.ceil((d - new Date()) / (1000 * 60 * 60 * 24));
    return `<div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 4px;">${escapeHtml(e.title)} — あと${diff}日</div>`;
  }).join('')}
          </div>
        ` : ''}
      </div>
    </div>

    <!-- 選考ファネル分析 -->
    <div class="card mt-24 anim-delay-4">
      <div class="card-header">
        <h3 class="card-title">📊 選考ファネル分析</h3>
      </div>
      <div class="grid-2">
        <div style="display: flex; flex-direction: column; justify-content: center; gap: 16px;">
          <div class="stat-item flex justify-between">
            <span class="text-secondary text-sm">エントリー（ES提出以上）</span>
            <span class="font-bold">${esSubmitted}社</span>
          </div>
          <div class="stat-item flex justify-between">
            <span class="text-secondary text-sm">書類通過・面接（面接以上）</span>
            <span class="font-bold">${interviewCount}社</span>
          </div>
          <div class="stat-item flex justify-between">
            <span class="text-secondary text-sm">内定</span>
            <span class="font-bold">${offerCount}社</span>
          </div>
          <div class="mt-16 text-sm text-muted">
            <div style="margin-bottom: 8px;"><strong>通過率</strong></div>
            <div>書類通過率: ${esSubmitted > 0 ? Math.round((interviewCount / esSubmitted) * 100) : 0}%</div>
            <div>最終内定率: ${interviewCount > 0 ? Math.round((offerCount / interviewCount) * 100) : 0}%</div>
          </div>
        </div>
        <div style="height: 200px; position: relative;">
          <canvas id="funnelChart"></canvas>
        </div>
      </div>
    </div>

    <!-- 選考パイプライン -->
    <div class="card mt-24 anim-delay-4">
      <div class="card-header">
        <h3 class="card-title">🏢 選考パイプライン</h3>
      </div>
      <div class="pipeline">
        ${renderPipelineColumn('興味あり', statusGroups['interested'], 'purple')}
        ${renderPipelineColumn('未応募', statusGroups['not-applied'], 'blue')}
        ${renderPipelineColumn('ES提出', statusGroups['es-submitted'], 'blue')}
        ${renderPipelineColumn('一次面接', statusGroups['interview-1'], 'yellow')}
        ${renderPipelineColumn('二次面接', statusGroups['interview-2'], 'yellow')}
        ${renderPipelineColumn('選考中', statusGroups['interview'], 'yellow')}
        ${renderPipelineColumn('内定', statusGroups['offer'], 'green')}
        ${renderPipelineColumn('不合格', statusGroups['rejected'], 'red')}
      </div>
    </div>
  `;
}

export function initDashboard() {
  const data = getData();
  const companies = data.companies || [];

  // Stats計算 (ファネル用)
  const esSubmitted = companies.filter(c => ['es-submitted', 'interview-1', 'interview-2', 'interview', 'offer', 'rejected'].includes(c.status)).length; // rejectedでもESは出した可能性があるため（簡略化）
  // 厳密にはES提出後なのか面接後のお祈りなのか不明だが、ここでは「esSubmitted＝興味・未応募以外」とする
  const actualEntry = companies.filter(c => !['interested', 'not-applied'].includes(c.status)).length;
  const interviewCount = companies.filter(c => ['interview-1', 'interview-2', 'interview', 'offer'].includes(c.status)).length;
  const offerCount = companies.filter(c => c.status === 'offer').length;

  createFunnelChart(actualEntry, interviewCount, offerCount);
}

function createFunnelChart(entry, interview, offer) {
  const ctx = document.getElementById('funnelChart');
  if (!ctx || !window.Chart) return;

  new window.Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['内定', '面接', 'エントリー'],
      datasets: [{
        label: '社数',
        data: [offer, interview, entry],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)', // green
          'rgba(245, 158, 11, 0.8)', // yellow
          'rgba(59, 130, 246, 0.8)'  // blue
        ],
        borderRadius: 4,
        barPercentage: 0.6
      }]
    },
    options: {
      indexAxis: 'y', // 横向き
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: { color: '#9898b0', stepSize: 1 }
        },
        y: {
          grid: { display: false },
          ticks: { color: '#e8e8f0', font: { size: 13 } }
        }
      }
    }
  });
}

function renderPipelineColumn(title, companies, color) {
  return `
    <div class="pipeline-column">
      <div class="pipeline-column-header">
        <span class="pipeline-column-title">${title}</span>
        <span class="pipeline-count">${companies.length}</span>
      </div>
      ${companies.length === 0 ? '<div class="text-sm text-muted" style="text-align: center; padding: 20px;">なし</div>' :
      companies.map(c => `
          <div class="pipeline-card" data-company-id="${c.id}">
            <div class="pipeline-card-name">${escapeHtml(c.name)}</div>
            <div class="pipeline-card-info">${escapeHtml(c.industry || '')}</div>
          </div>
        `).join('')}
    </div>
  `;
}

function getDayName(date) {
  return ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
