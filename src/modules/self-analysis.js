// self-analysis.js - 自己分析サポートモジュール
import { getData, updateData, generateId } from '../storage.js';

export function renderSelfAnalysis() {
    const data = getData();
    const analysis = data.selfAnalysis || { strengths: [], weaknesses: [], gakuchika: [], values: [] };

    return `
    <div class="page-header">
      <h2>🎯 自己分析</h2>
      <p>自分の強み・弱み・ガクチカ・価値観を整理</p>
    </div>

    <!-- タブ -->
    <div class="tabs" id="analysis-tabs">
      <button class="tab active" data-analysis-tab="strengths">💪 強み</button>
      <button class="tab" data-analysis-tab="weaknesses">🔧 弱み・改善点</button>
      <button class="tab" data-analysis-tab="gakuchika">🎓 ガクチカ</button>
      <button class="tab" data-analysis-tab="values">🌟 価値観</button>
    </div>

    <!-- 強み -->
    <div class="analysis-panel" data-panel="strengths">
      <div class="grid-2">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">💪 強みリスト</h3>
          </div>
          <div style="display: flex; gap: 8px; margin-bottom: 16px;">
            <input type="text" class="form-input" id="strength-input" placeholder="例：コミュニケーション能力" style="flex: 1;" />
            <button class="btn btn-primary" id="btn-add-strength">追加</button>
          </div>
          <div class="chip-container" id="strength-chips">
            ${analysis.strengths.map(s => `
              <div class="chip">
                <span>💪 ${escapeHtml(s.text)}</span>
                <span class="chip-remove" data-remove-strength="${s.id}">✕</span>
              </div>
            `).join('')}
          </div>
          ${analysis.strengths.length === 0 ? '<div class="text-sm text-muted mt-16">まだ強みが追加されていません</div>' : ''}
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">💡 強みを探すヒント</h3>
          </div>
          <div style="font-size: 13px; color: var(--text-secondary); line-height: 2;">
            <div>🔹 周りから「すごい」と言われること</div>
            <div>🔹 他の人より楽にできること</div>
            <div>🔹 アルバイト・部活で褒められたこと</div>
            <div>🔹 困難を乗り越えた経験</div>
            <div>🔹 長時間続けても苦にならないこと</div>
            <div style="margin-top: 12px; padding: 12px; background: var(--accent-subtle); border-radius: var(--radius-sm);">
              <strong>よくある強み例：</strong><br/>
              主体性、協調性、計画力、分析力、<br/>
              コミュニケーション力、忍耐力、<br/>
              リーダーシップ、柔軟性、創造力
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 弱み -->
    <div class="analysis-panel" data-panel="weaknesses" style="display: none;">
      <div class="grid-2">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">🔧 弱み・改善点リスト</h3>
          </div>
          <div style="display: flex; gap: 8px; margin-bottom: 16px;">
            <input type="text" class="form-input" id="weakness-input" placeholder="例：心配性なところ" style="flex: 1;" />
            <button class="btn btn-primary" id="btn-add-weakness">追加</button>
          </div>
          <div class="chip-container" id="weakness-chips">
            ${analysis.weaknesses.map(w => `
              <div class="chip">
                <span>🔧 ${escapeHtml(w.text)}</span>
                <span class="chip-remove" data-remove-weakness="${w.id}">✕</span>
              </div>
            `).join('')}
          </div>
          ${analysis.weaknesses.length === 0 ? '<div class="text-sm text-muted mt-16">まだ弱みが追加されていません</div>' : ''}
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">💡 弱みの伝え方</h3>
          </div>
          <div style="font-size: 13px; color: var(--text-secondary); line-height: 2;">
            <div>✅ 弱みを認めた上で改善策を述べる</div>
            <div>✅ 強みの裏返しとして表現する</div>
            <div>✅ 具体的な改善行動を示す</div>
            <div style="margin-top: 12px; padding: 12px; background: var(--warning-bg); border-radius: var(--radius-sm);">
              <strong>例：</strong>「心配性」→「慎重に物事を<br/>
              進めるため準備を入念にしますが、<br/>
              時には大胆さも必要だと学びました」
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ガクチカ -->
    <div class="analysis-panel" data-panel="gakuchika" style="display: none;">
      <div class="card mb-24">
        <div class="card-header">
          <h3 class="card-title">ガクチカを追加</h3>
        </div>
        <div class="form-group">
          <label class="form-label">タイトル</label>
          <input type="text" class="form-input" id="gakuchika-title" placeholder="例：飲食店でのアルバイトリーダー経験" />
        </div>
        <div class="form-group">
          <label class="form-label">カテゴリ</label>
          <select class="form-select" id="gakuchika-category">
            <option value="club">部活・サークル</option>
            <option value="work">アルバイト</option>
            <option value="study">学業・研究</option>
            <option value="volunteer">ボランティア</option>
            <option value="internship">インターン</option>
            <option value="other">その他</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">状況・背景</label>
          <textarea class="form-textarea" id="gakuchika-situation" rows="2" placeholder="どんな状況だったか？"></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">課題・目標</label>
          <textarea class="form-textarea" id="gakuchika-task" rows="2" placeholder="何が課題/目標だったか？"></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">行動</label>
          <textarea class="form-textarea" id="gakuchika-action" rows="2" placeholder="何をしたか？"></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">結果・学び</label>
          <textarea class="form-textarea" id="gakuchika-result" rows="2" placeholder="どんな結果になったか？何を学んだか？"></textarea>
        </div>
        <button class="btn btn-primary w-full" id="btn-add-gakuchika">💾 保存</button>
      </div>

      <!-- ガクチカ一覧 -->
      <div id="gakuchika-list">
        ${analysis.gakuchika.length === 0 ? `
          <div class="empty-state">
            <span class="empty-state-icon">🎓</span>
            <div class="empty-state-text">ガクチカがまだありません</div>
            <div class="empty-state-sub">STAR法で整理して登録しましょう</div>
          </div>
        ` : analysis.gakuchika.map(g => `
          <div class="card mb-16">
            <div class="flex justify-between items-center mb-8">
              <div>
                <span class="badge badge-blue mb-8">${getCategoryLabel(g.category)}</span>
                <h4 style="font-weight: 600; margin-top: 4px;">${escapeHtml(g.title)}</h4>
              </div>
              <button class="btn-icon" data-delete-gakuchika="${g.id}" title="削除">🗑️</button>
            </div>
            <div style="font-size: 13px; color: var(--text-secondary); line-height: 1.8;">
              ${g.situation ? `<div><strong>状況：</strong>${escapeHtml(g.situation)}</div>` : ''}
              ${g.task ? `<div><strong>課題：</strong>${escapeHtml(g.task)}</div>` : ''}
              ${g.action ? `<div><strong>行動：</strong>${escapeHtml(g.action)}</div>` : ''}
              ${g.result ? `<div><strong>結果：</strong>${escapeHtml(g.result)}</div>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- 価値観 -->
    <div class="analysis-panel" data-panel="values" style="display: none;">
      <div class="grid-2">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">🌟 大切にしている価値観</h3>
          </div>
          <div style="display: flex; gap: 8px; margin-bottom: 16px;">
            <input type="text" class="form-input" id="value-input" placeholder="例：チームワーク" style="flex: 1;" />
            <button class="btn btn-primary" id="btn-add-value">追加</button>
          </div>
          <div class="chip-container" id="value-chips">
            ${analysis.values.map(v => `
              <div class="chip">
                <span>🌟 ${escapeHtml(v.text)}</span>
                <span class="chip-remove" data-remove-value="${v.id}">✕</span>
              </div>
            `).join('')}
          </div>
          ${analysis.values.length === 0 ? '<div class="text-sm text-muted mt-16">まだ価値観が追加されていません</div>' : ''}
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">💡 価値観の見つけ方</h3>
          </div>
          <div style="font-size: 13px; color: var(--text-secondary); line-height: 2;">
            <div>🔹 嬉しかった経験を思い出す</div>
            <div>🔹 怒りを感じた場面を振り返る</div>
            <div>🔹 尊敬する人の特徴を考える</div>
            <div>🔹 譲れないこだわりは何か</div>
            <div style="margin-top: 12px; padding: 12px; background: var(--accent-subtle); border-radius: var(--radius-sm);">
              <strong>よくある価値観例：</strong><br/>
              成長、挑戦、安定、創造性、<br/>
              社会貢献、チームワーク、自律、<br/>
              ワークライフバランス、多様性
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function initSelfAnalysis(showToast, openModal, closeModal, refreshPage) {
    // タブ切り替え
    document.querySelectorAll('[data-analysis-tab]').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('[data-analysis-tab]').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.querySelectorAll('.analysis-panel').forEach(panel => {
                panel.style.display = 'none';
            });
            const target = document.querySelector(`[data-panel="${tab.dataset.analysisTab}"]`);
            if (target) target.style.display = 'block';
        });
    });

    // 強み追加
    bindChipAdd('strength', 'strengths', showToast, refreshPage);
    // 弱み追加
    bindChipAdd('weakness', 'weaknesses', showToast, refreshPage);
    // 価値観追加
    bindChipAdd('value', 'values', showToast, refreshPage);

    // 強み削除
    bindChipRemove('strength', 'strengths', showToast, refreshPage);
    // 弱み削除
    bindChipRemove('weakness', 'weaknesses', showToast, refreshPage);
    // 価値観削除
    bindChipRemove('value', 'values', showToast, refreshPage);

    // ガクチカ追加
    document.getElementById('btn-add-gakuchika')?.addEventListener('click', () => {
        const title = document.getElementById('gakuchika-title')?.value.trim();
        if (!title) {
            showToast('タイトルを入力してください', 'error');
            return;
        }

        const data = getData();
        const analysis = data.selfAnalysis || { strengths: [], weaknesses: [], gakuchika: [], values: [] };
        analysis.gakuchika.push({
            id: generateId(),
            title,
            category: document.getElementById('gakuchika-category')?.value || 'other',
            situation: document.getElementById('gakuchika-situation')?.value,
            task: document.getElementById('gakuchika-task')?.value,
            action: document.getElementById('gakuchika-action')?.value,
            result: document.getElementById('gakuchika-result')?.value,
            createdAt: new Date().toISOString()
        });
        updateData('selfAnalysis', analysis);
        showToast('ガクチカを保存しました', 'success');
        refreshPage();
    });

    // ガクチカ削除
    document.querySelectorAll('[data-delete-gakuchika]').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.deleteGakuchika;
            if (confirm('このガクチカを削除しますか？')) {
                const data = getData();
                const analysis = data.selfAnalysis || { strengths: [], weaknesses: [], gakuchika: [], values: [] };
                analysis.gakuchika = analysis.gakuchika.filter(g => g.id !== id);
                updateData('selfAnalysis', analysis);
                showToast('ガクチカを削除しました', 'success');
                refreshPage();
            }
        });
    });
}

function bindChipAdd(prefix, key, showToast, refreshPage) {
    const input = document.getElementById(`${prefix}-input`);
    const btn = document.getElementById(`btn-add-${prefix}`);

    const addItem = () => {
        const text = input?.value.trim();
        if (!text) return;

        const data = getData();
        const analysis = data.selfAnalysis || { strengths: [], weaknesses: [], gakuchika: [], values: [] };
        if (!analysis[key]) analysis[key] = [];

        if (analysis[key].some(item => item.text === text)) {
            showToast('同じ項目が既に存在します', 'error');
            return;
        }

        analysis[key].push({ id: generateId(), text });
        updateData('selfAnalysis', analysis);
        showToast('追加しました', 'success');
        refreshPage();
    };

    btn?.addEventListener('click', addItem);
    input?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addItem();
    });
}

function bindChipRemove(prefix, key, showToast, refreshPage) {
    document.querySelectorAll(`[data-remove-${prefix}]`).forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset[`remove${prefix.charAt(0).toUpperCase() + prefix.slice(1)}`];
            const data = getData();
            const analysis = data.selfAnalysis || { strengths: [], weaknesses: [], gakuchika: [], values: [] };
            analysis[key] = (analysis[key] || []).filter(item => item.id !== id);
            updateData('selfAnalysis', analysis);
            showToast('削除しました', 'success');
            refreshPage();
        });
    });
}

function getCategoryLabel(category) {
    const map = {
        'club': '部活・サークル', 'work': 'アルバイト', 'study': '学業・研究',
        'volunteer': 'ボランティア', 'internship': 'インターン', 'other': 'その他'
    };
    return map[category] || category;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
