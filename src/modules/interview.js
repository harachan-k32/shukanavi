// interview.js - 面接対策モジュール
import { getData, updateData } from '../storage.js';

const COMMON_QUESTIONS = [
    { id: 'q1', category: '基本', question: '自己紹介をお願いします' },
    { id: 'q2', category: '基本', question: '志望動機を教えてください' },
    { id: 'q3', category: '基本', question: '学生時代に力を入れたことは？' },
    { id: 'q4', category: '基本', question: '自己PRをお願いします' },
    { id: 'q5', category: '基本', question: '短所(弱み)を教えてください' },
    { id: 'q6', category: '基本', question: '長所(強み)を教えてください' },
    { id: 'q7', category: '志望', question: 'なぜこの業界を志望しますか？' },
    { id: 'q8', category: '志望', question: '当社を志望した理由は？' },
    { id: 'q9', category: '志望', question: '他にどんな企業を受けていますか？' },
    { id: 'q10', category: '志望', question: '入社したらやりたいことは？' },
    { id: 'q11', category: '志望', question: '5年後のキャリアプランは？' },
    { id: 'q12', category: '志望', question: '当社の課題は何だと思いますか？' },
    { id: 'q13', category: '性格', question: '周りからどんな人だと言われますか？' },
    { id: 'q14', category: '性格', question: 'ストレス解消法は？' },
    { id: 'q15', category: '性格', question: 'チームワークで大切にしていることは？' },
    { id: 'q16', category: '性格', question: 'リーダーシップの経験はありますか？' },
    { id: 'q17', category: '性格', question: '挫折した経験はありますか？' },
    { id: 'q18', category: '経験', question: 'アルバイト経験について教えてください' },
    { id: 'q19', category: '経験', question: '部活・サークルでの役割は？' },
    { id: 'q20', category: '経験', question: '困難をどう乗り越えましたか？' },
    { id: 'q21', category: '経験', question: '最も成長した経験は？' },
    { id: 'q22', category: '経験', question: 'グループワークでの自分の役割は？' },
    { id: 'q23', category: '学業', question: '研究テーマ・卒論のテーマは？' },
    { id: 'q24', category: '学業', question: 'なぜその学部・学科を選びましたか？' },
    { id: 'q25', category: '学業', question: '大学で最も印象に残っている授業は？' },
    { id: 'q26', category: 'その他', question: '最近気になるニュースは？' },
    { id: 'q27', category: 'その他', question: '趣味・特技を教えてください' },
    { id: 'q28', category: 'その他', question: '最後に何か質問はありますか？（逆質問）' },
    { id: 'q29', category: 'その他', question: '他社の選考状況を教えてください' },
    { id: 'q30', category: 'その他', question: '転勤は可能ですか？' },
];

const CATEGORIES = ['すべて', '基本', '志望', '性格', '経験', '学業', 'その他'];

export function renderInterview() {
    const data = getData();
    const answers = data.interviewAnswers || {};
    const answeredCount = Object.keys(answers).length;
    const totalCount = COMMON_QUESTIONS.length;
    const progress = Math.round((answeredCount / totalCount) * 100);

    return `
    <div class="page-header">
      <h2>💬 面接対策</h2>
      <p>よくある質問への回答を準備して万全の対策を</p>
    </div>

    <!-- 進捗 -->
    <div class="card mb-24">
      <div class="flex justify-between items-center mb-8">
        <h3 class="card-title">📊 回答準備の進捗</h3>
        <span class="text-sm text-muted">${answeredCount} / ${totalCount} 問回答済み</span>
      </div>
      <div class="progress-bar" style="height: 12px;">
        <div class="progress-fill ${progress >= 70 ? 'green' : progress >= 40 ? 'yellow' : ''}" style="width: ${progress}%"></div>
      </div>
      <div class="text-sm text-muted mt-8">${progress}% 完了</div>
    </div>

    <!-- カテゴリフィルター -->
    <div class="tabs mb-24" id="interview-filter-tabs">
      ${CATEGORIES.map((cat, i) => `
        <button class="tab ${i === 0 ? 'active' : ''}" data-interview-filter="${cat}">${cat}</button>
      `).join('')}
    </div>

    <!-- 質問リスト -->
    <div id="interview-questions">
      ${COMMON_QUESTIONS.map(q => {
        const answer = answers[q.id] || '';
        const hasAnswer = answer.trim().length > 0;
        return `
          <div class="qa-item ${hasAnswer ? '' : ''}" data-qa-id="${q.id}" data-qa-category="${q.category}">
            <div class="qa-question">
              <div class="flex items-center gap-12">
                <span style="font-size: 16px;">${hasAnswer ? '✅' : '⬜'}</span>
                <div>
                  <div style="font-size: 14px;">${escapeHtml(q.question)}</div>
                  <div class="text-sm text-muted">${q.category}</div>
                </div>
              </div>
              <span class="qa-toggle">▼</span>
            </div>
            <div class="qa-answer">
              <textarea class="form-textarea" data-answer-for="${q.id}" rows="5" placeholder="ここに回答を入力...&#10;&#10;STAR法で整理しましょう：&#10;S（状況）→ T（課題）→ A（行動）→ R（結果）">${escapeHtml(answer)}</textarea>
              <div class="flex justify-between items-center mt-8">
                <span class="char-count">${answer.length}字</span>
                <button class="btn btn-sm btn-primary" data-save-answer="${q.id}">💾 保存</button>
              </div>
            </div>
          </div>
        `;
    }).join('')}
    </div>
  `;
}

export function initInterview(showToast, openModal, closeModal, refreshPage) {
    // アコーディオン開閉
    document.querySelectorAll('.qa-question').forEach(q => {
        q.addEventListener('click', () => {
            const item = q.closest('.qa-item');
            const wasOpen = item.classList.contains('open');
            // 他を閉じる（任意）
            // document.querySelectorAll('.qa-item').forEach(i => i.classList.remove('open'));
            if (wasOpen) {
                item.classList.remove('open');
            } else {
                item.classList.add('open');
            }
        });
    });

    // 回答保存
    document.querySelectorAll('[data-save-answer]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const qId = btn.dataset.saveAnswer;
            const textarea = document.querySelector(`[data-answer-for="${qId}"]`);
            const answer = textarea?.value || '';

            const data = getData();
            if (!data.interviewAnswers) data.interviewAnswers = {};
            data.interviewAnswers[qId] = answer;
            updateData('interviewAnswers', data.interviewAnswers);

            showToast('回答を保存しました', 'success');

            // UIを更新（チェックマーク）
            const item = btn.closest('.qa-item');
            const icon = item?.querySelector('.qa-question span');
            if (icon) icon.textContent = answer.trim() ? '✅' : '⬜';

            // 進捗バーを更新
            updateProgressDisplay(data.interviewAnswers);
        });
    });

    // テキストエリアのリアルタイム文字数
    document.querySelectorAll('[data-answer-for]').forEach(textarea => {
        textarea.addEventListener('input', () => {
            const charCount = textarea.closest('.qa-answer')?.querySelector('.char-count');
            if (charCount) charCount.textContent = `${textarea.value.length}字`;
        });
    });

    // カテゴリフィルター
    document.querySelectorAll('[data-interview-filter]').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('[data-interview-filter]').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const filter = tab.dataset.interviewFilter;
            document.querySelectorAll('[data-qa-id]').forEach(item => {
                if (filter === 'すべて' || item.dataset.qaCategory === filter) {
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });
}

function updateProgressDisplay(answers) {
    const answeredCount = Object.values(answers).filter(a => a.trim()).length;
    const progress = Math.round((answeredCount / COMMON_QUESTIONS.length) * 100);

    const progressFill = document.querySelector('.progress-fill');
    if (progressFill) {
        progressFill.style.width = `${progress}%`;
        progressFill.className = `progress-fill ${progress >= 70 ? 'green' : progress >= 40 ? 'yellow' : ''}`;
    }

    const progressText = document.querySelector('.card .text-sm.text-muted.mt-8');
    if (progressText) progressText.textContent = `${progress}% 完了`;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
