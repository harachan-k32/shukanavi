// obog-tracker.js - OB・OG訪問トラッカーモジュール
import { getData, updateData, generateId } from '../storage.js';

let currentDetailId = null;

export function renderObogTracker() {
  const data = getData();
  let visits = data.obogVisits || [];

  // マイグレーション
  let needsUpdate = false;
  visits = visits.map(v => {
    if (!v.meetings) {
      needsUpdate = true;
      const newV = {
        id: v.id, name: v.name, company: v.company, department: v.department, contact: v.contact, createdAt: v.createdAt, meetings: []
      };
      if (v.date || v.memo || v.thanksSent !== undefined) {
        newV.meetings.push({
          id: generateId(), date: v.date || '', memo: v.memo || '', thanksSent: v.thanksSent || false
        });
      }
      return newV;
    }
    return v;
  });

  if (needsUpdate) updateData('obogVisits', visits);

  const isDetail = !!currentDetailId;
  const visit = isDetail ? visits.find(v => v.id === currentDetailId) : null;
  if (isDetail && !visit) currentDetailId = null;

  if (currentDetailId && visit) {
    return renderDetailView(visit);
  } else {
    const totalVisits = visits.reduce((acc, v) => acc + (v.meetings?.length || 0), 0);
    const completedThanks = visits.reduce((acc, v) => acc + (v.meetings?.filter(m => m.thanksSent).length || 0), 0);
    return renderListView(visits, totalVisits, completedThanks);
  }
}

function renderListView(visits, totalVisits, completedThanks) {
  return `
    <div class="page-header">
      <h2>🤝 OB・OG訪問トラッカー</h2>
      <p>訪問履歴、議事録、お礼メールの送信状況を管理</p>
    </div>

    <div class="grid-2 mb-24">
      <div class="card" style="display: flex; gap: 24px; align-items: center;">
        <div style="flex: 1; text-align: center; border-right: 1px solid var(--border);">
          <div class="text-sm text-muted">総訪問数</div>
          <div style="font-size: 32px; font-weight: 700; color: var(--text-primary);">${totalVisits}</div>
        </div>
        <div style="flex: 1; text-align: center;">
          <div class="text-sm text-muted">お礼メール完了</div>
          <div style="font-size: 32px; font-weight: 700; color: var(--success);">${completedThanks}</div>
        </div>
      </div>
      <div style="display: flex; align-items: center; justify-content: flex-end;">
        <button class="btn btn-primary" id="btn-add-obog-modal" style="padding: 16px 24px; font-size: 16px; width: 100%; height: 100%; justify-content: center;">
          ＋ 新規訪問記録を追加
        </button>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3 class="card-title">訪問記録一覧</h3>
      </div>
      <div id="obog-list">
        ${visits.length === 0 ? `
          <div class="empty-state">
            <span class="empty-state-icon">🤝</span>
            <div class="empty-state-text">訪問記録がありません</div>
            <div class="empty-state-sub">先輩を訪問してリアルな情報を集めましょう</div>
          </div>
        ` : `
          <div style="display: grid; gap: 16px;">
            ${visits.sort((a, b) => new Date(b.date) - new Date(a.date)).map(v => `
              <div class="list-item" style="flex-direction: column; align-items: stretch;" data-obog-id="${v.id}">
                <div class="flex justify-between items-center">
                  <div class="flex items-center gap-12">
                    <span class="company-avatar" style="background: var(--accent-primary); width: 48px; height: 48px; font-size: 20px;">
                      ${(v.name || 'OB').substring(0, 1)}
                    </span>
                    <div>
                      <div class="flex items-center gap-8 mb-4">
                        <strong style="font-size: 18px;">${escapeHtml(v.name)}</strong>
                        <span class="text-sm text-muted">先輩</span>
                      </div>
                      <div class="text-sm">
                        🏢 ${escapeHtml(v.company || '未入力')}
                      </div>
                    </div>
                  </div>
                  <div style="display: flex; gap: 8px;">
                    <button class="btn btn-secondary btn-sm" data-add-meeting="${v.id}">＋ 面談追加</button>
                    <button class="btn btn-primary btn-sm" data-show-obog-detail="${v.id}">詳細を見る 〉</button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    </div>
  `;
}

function renderDetailView(v) {
  return `
    <div class="page-header" style="display: flex; gap: 16px; align-items: center; margin-bottom: 24px;">
       <button class="btn btn-secondary btn-sm" id="btn-back-to-list" style="padding: 8px 12px;">🔙 一覧へ戻る</button>
       <div>
         <h2 style="margin: 0;">🤝 ${escapeHtml(v.name)}さんの詳細レポート</h2>
       </div>
    </div>

    <div class="card mb-24">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <div class="flex items-center gap-12 mb-12">
            <span class="company-avatar" style="background: var(--accent-primary); width: 56px; height: 56px; font-size: 24px;">
              ${(v.name || 'OB').substring(0, 1)}
            </span>
            <div>
              <div class="text-xl" style="font-weight: 700;">${escapeHtml(v.name)} <span class="text-sm text-muted" style="font-weight: 400;">先輩</span></div>
              <div class="text-md">🏢 ${escapeHtml(v.company || '未登録')} ${v.department ? `（${escapeHtml(v.department)}）` : ''}</div>
            </div>
          </div>
          <div class="text-sm mt-12" style="background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; display: inline-block;">
            📬 連絡先: ${v.contact ? escapeHtml(v.contact) : '<span class="text-muted">未登録</span>'}
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-secondary btn-sm" data-edit-obog="${v.id}">✏️ 編集</button>
          <button class="btn btn-secondary btn-sm" data-delete-obog="${v.id}" style="color: var(--danger);">🗑️ 削除</button>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header flex justify-between items-center">
        <h3 class="card-title">面談履歴 (${(v.meetings || []).length}件)</h3>
        <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary btn-sm" data-generate-email="${v.id}" style="background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3);">✉️ お礼メール作成</button>
            <button class="btn btn-primary btn-sm" data-add-meeting="${v.id}">＋ 面談を追加</button>
        </div>
      </div>
      <div>
        ${(v.meetings && v.meetings.length > 0) ? `
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${v.meetings.sort((a, b) => new Date(b.date) - new Date(a.date)).map(m => `
              <div>
                <div class="accordion-header" data-toggle-accordion="${m.id}" style="font-size: 14px;">
                  <div style="display: flex; align-items: center; gap: 16px;">
                    <span style="font-weight: 600;">📅 ${m.date ? new Date(m.date).toLocaleDateString('ja-JP') : '未定'}</span>
                    <span style="color: var(--text-muted);">${m.memo ? '📝 議事録あり' : '議事録なし'}</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 16px;">
                     <label class="flex items-center gap-4" style="cursor: pointer; font-size: 13px;" onclick="event.stopPropagation()">
                      <input type="checkbox" class="thanks-checkbox" data-meeting-thanks="${v.id}:${m.id}" ${m.thanksSent ? 'checked' : ''} />
                      <span class="${m.thanksSent ? 'text-success' : 'text-muted'}">お礼メール済</span>
                    </label>
                    <span class="accordion-icon" id="icon-${m.id}">▼</span>
                  </div>
                </div>
                <div class="accordion-content" id="content-${m.id}">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                    <div id="memo-text-area-${m.id}" style="white-space: pre-wrap; font-size: 14px; color: var(--text-secondary); line-height: 1.6; flex: 1;">${escapeHtml(m.memo || 'メモはありません')}</div>
                    <div style="display: flex; flex-direction: column; gap: 8px; margin-left: 16px;">
                      <button class="btn btn-secondary btn-sm" data-edit-meeting="${v.id}:${m.id}">✏️ 編集</button>
                      <button class="btn btn-secondary btn-sm" data-delete-meeting="${v.id}:${m.id}" style="color: var(--danger);">🗑️ 削除</button>
                    </div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="empty-state" style="padding: 24px 0;">
            <div class="empty-state-text" style="font-size: 14px;">面談記録がありません</div>
            <div class="empty-state-sub" style="font-size: 13px;">「＋ 面談を追加」から新しい記録を作成してください</div>
          </div>
        `}
      </div>
    </div>
  `;
}

export function initObogTracker(showToast, openModal, closeModal, refreshPage) {
  // ----------------------
  // 新規作成・編集モーダル
  // ----------------------
  function showObogModal(id = null) {
    const data = getData();
    const companies = data.companies || [];
    let visit = null;
    let isEdit = false;

    if (id) {
      visit = (data.obogVisits || []).find(v => v.id === id);
      isEdit = !!visit;
    }

    const body = `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">先輩の名前 <span style="color:var(--danger)">*</span></label>
          <input type="text" class="form-input" id="obog-name" placeholder="例：山田 太郎" value="${isEdit ? escapeHtml(visit.name) : ''}" />
        </div>
        <div class="form-group">
          <label class="form-label">連絡先</label>
          <input type="text" class="form-input" id="obog-contact" placeholder="メールやSNSなど" value="${isEdit ? escapeHtml(visit.contact || '') : ''}" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">企業</label>
          <select class="form-select" id="obog-company">
            <option value="">選択または手入力...</option>
            ${companies.map(c => `<option value="${escapeHtml(c.name)}" ${isEdit && visit.company === c.name ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}
            <option value="__custom__">手動入力</option>
          </select>
        </div>
        <div class="form-group" id="obog-custom-company-wrapper" style="display: none;">
          <label class="form-label">企業名(手動)</label>
          <input type="text" class="form-input" id="obog-custom-company" placeholder="企業名を入力" value="${isEdit && !companies.some(c => c.name === visit.company) ? escapeHtml(visit.company || '') : ''}" />
        </div>
        <div class="form-group">
          <label class="form-label">所属部署</label>
          <input type="text" class="form-input" id="obog-department" placeholder="例：営業部" value="${isEdit ? escapeHtml(visit.department || '') : ''}" />
        </div>
      </div>
      <div class="modal-footer flex justify-end gap-12 mt-24">
        <button class="btn btn-secondary" id="btn-obog-cancel">キャンセル</button>
        <button class="btn btn-primary" id="btn-obog-save">💾 保存</button>
      </div>
    `;

    openModal(isEdit ? '訪問記録を編集' : '新規訪問記録を追加', body);

    // 企業選択での手動入力切り替え
    const companySelect = document.getElementById('obog-company');
    const customWrapper = document.getElementById('obog-custom-company-wrapper');
    const customInput = document.getElementById('obog-custom-company');

    // 初回チェック
    if (isEdit && visit.company && !companies.some(c => c.name === visit.company)) {
      companySelect.value = '__custom__';
      customWrapper.style.display = 'block';
      customInput.value = visit.company;
    }

    companySelect.addEventListener('change', (e) => {
      if (e.target.value === '__custom__') {
        customWrapper.style.display = 'block';
      } else {
        customWrapper.style.display = 'none';
      }
    });

    document.getElementById('btn-obog-cancel')?.addEventListener('click', closeModal);

    document.getElementById('btn-obog-save')?.addEventListener('click', () => {
      const name = document.getElementById('obog-name')?.value.trim();
      if (!name) {
        showToast('先輩の名前は必須です', 'error');
        return;
      }

      let company = companySelect.value;
      if (company === '__custom__') {
        company = customInput.value.trim();
      }

      const payload = {
        id: isEdit ? id : generateId(),
        name,
        company,
        department: document.getElementById('obog-department')?.value.trim() || '',
        contact: document.getElementById('obog-contact')?.value.trim() || '',
        createdAt: isEdit ? visit.createdAt : new Date().toISOString()
      };

      const freshData = getData();
      freshData.obogVisits = freshData.obogVisits || [];

      if (isEdit) {
        const idx = freshData.obogVisits.findIndex(v => v.id === id);
        if (idx !== -1) {
          freshData.obogVisits[idx] = { ...freshData.obogVisits[idx], ...payload };
        }
      } else {
        payload.meetings = [];
        freshData.obogVisits.push(payload);
      }

      updateData('obogVisits', freshData.obogVisits);
      closeModal();
      showToast(isEdit ? '更新しました' : '追加しました', 'success');
      refreshPage();
    });
  }

  // イベントリスナーのデタッチ・アタッチ
  document.getElementById('btn-add-obog-modal')?.addEventListener('click', () => {
    showObogModal(null);
  });

  function showMeetingModal(obogId, meetingId = null) {
    const data = getData();
    const vIdx = (data.obogVisits || []).findIndex(v => String(v.id) === String(obogId));
    if (vIdx === -1) return;
    const visit = data.obogVisits[vIdx];

    let meeting = null;
    let isEdit = false;
    if (meetingId) {
      meeting = (visit.meetings || []).find(m => String(m.id) === String(meetingId));
      isEdit = !!meeting;
    }

    const body = `
      <div class="form-group">
        <label class="form-label">訪問日 / 面談日</label>
        <input type="date" class="form-input" id="meeting-date" value="${isEdit ? (meeting.date || '') : new Date().toISOString().split('T')[0]}" />
      </div>
      <div class="form-group">
        <div class="flex justify-between items-end mb-8">
          <label class="form-label mb-0">議事録・メモ</label>
          <button type="button" class="btn btn-secondary btn-sm" id="btn-insert-template" style="padding: 4px 8px; font-size: 12px; background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.3);">
            🤖 AIに質問を考えさせる
          </button>
        </div>
        <textarea class="form-textarea" id="meeting-memo" rows="12" placeholder="面談のメモや議事録を入力...">${isEdit ? escapeHtml(meeting.memo || '') : ''}</textarea>
      </div>
      <div class="form-group flex items-center gap-8 mb-24">
        <label class="flex items-center gap-8" style="cursor:pointer;">
          <input type="checkbox" id="meeting-thanks" ${isEdit && meeting.thanksSent ? 'checked' : ''} />
          <span>お礼メールを送信した</span>
        </label>
      </div>
      <div class="modal-footer flex justify-end gap-12">
        <button class="btn btn-secondary" id="btn-meeting-cancel">キャンセル</button>
        <button class="btn btn-primary" id="btn-meeting-save">💾 保存</button>
      </div>
    `;

    openModal(isEdit ? '面談記録を編集' : '新しい面談記録を追加', body);

    document.getElementById('btn-insert-template')?.addEventListener('click', () => {
      const memoInput = document.getElementById('meeting-memo');
      const btn = document.getElementById('btn-insert-template');
      if (memoInput) {
        btn.innerHTML = '🤖 生成中...';
        btn.disabled = true;
        setTimeout(() => {
          memoInput.value = memoInput.value + generateMockQuestions();
          btn.innerHTML = '🤖 もう一度AIに考えさせる';
          btn.disabled = false;
        }, 600);
      }
    });

    document.getElementById('btn-meeting-cancel')?.addEventListener('click', closeModal);

    document.getElementById('btn-meeting-save')?.addEventListener('click', () => {
      const date = document.getElementById('meeting-date')?.value || '';
      const memo = document.getElementById('meeting-memo')?.value || '';
      const thanksSent = document.getElementById('meeting-thanks')?.checked || false;

      const freshData = getData();
      const targetVIdx = (freshData.obogVisits || []).findIndex(v => String(v.id) === String(obogId));
      if (targetVIdx !== -1) {
        freshData.obogVisits[targetVIdx].meetings = freshData.obogVisits[targetVIdx].meetings || [];

        if (isEdit) {
          const mIdx = freshData.obogVisits[targetVIdx].meetings.findIndex(m => String(m.id) === String(meetingId));
          if (mIdx !== -1) {
            freshData.obogVisits[targetVIdx].meetings[mIdx] = {
              ...freshData.obogVisits[targetVIdx].meetings[mIdx],
              date, memo, thanksSent
            };
          }
        } else {
          freshData.obogVisits[targetVIdx].meetings.push({
            id: generateId(), date, memo, thanksSent
          });
        }
        updateData('obogVisits', freshData.obogVisits);
        closeModal();
        showToast(isEdit ? '面談記録を更新しました' : '面談記録を追加しました', 'success');
        refreshPage();
      }
    });
  }

  document.querySelectorAll('[data-edit-obog]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      showObogModal(btn.dataset.editObog);
    });
  });

  // メール作成モーダル
  document.querySelectorAll('[data-generate-email]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const obogId = btn.dataset.generateEmail;
      const data = getData();
      const visit = (data.obogVisits || []).find(v => String(v.id) === String(obogId));
      if (!visit) return;

      const companyName = visit.company || '〇〇株式会社';
      const personName = visit.name || '〇〇';

      const mailBody = `件名：【お礼】OB・OG訪問のお礼（大学名・氏名）

${companyName}
${visit.department ? visit.department + ' ' : ''}${personName}様

お世話になっております。
本日OB訪問でお話を伺いました、〇〇大学〇〇学部の（あなたの氏名）です。

本日はお忙しい中、私のためにお時間を割いていただき、誠にありがとうございました。

${personName}様から直接伺った〇〇に関するお話や、業務における具体的なエピソードは、私の企業理解を深める上で大変勉強になりました。
特に、「（※ここに今日印象に残った話を一言添える）」というお言葉が非常に心に響き、貴社で働きたいという思いがより一層強くなりました。

今後は本日いただいたアドバイスを活かし、さらなる企業研究と自己分析に励んでまいります。

本来であれば直接お伺いして御礼を申し上げるべきところではございますが、まずはメールにて感謝の意をお伝えさせていただきます。
末筆ではございますが、${personName}様の益々のご活躍と貴社のご発展をお祈り申し上げます。

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
              <textarea class="form-textarea" id="generated-email-text" rows="18" style="font-size: 13px; line-height: 1.6; font-family: monospace;">${mailBody}</textarea>
            </div>
            <div class="modal-footer flex justify-between gap-12 mt-24">
              <button class="btn btn-secondary" onclick="document.getElementById('modal-close-btn').click();">閉じる</button>
              <button class="btn btn-primary" id="btn-copy-email" style="background: var(--success);">📋 クリップボードにコピー</button>
            </div>
          `;

      openModal('✉️ お礼メールを生成', modalContent);

      document.getElementById('btn-copy-email')?.addEventListener('click', () => {
        const text = document.getElementById('generated-email-text').value;
        navigator.clipboard.writeText(text).then(() => {
          showToast('メール文面をコピーしました！メーラーに貼り付けてください。', 'success');
        }).catch(() => {
          showToast('コピーに失敗しました。手動でコピーしてください。', 'error');
        });
      });
    });
  });

  document.querySelectorAll('[data-delete-obog]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm('この訪問記録を削除しますか？')) {
        const id = btn.dataset.deleteObog;
        const data = getData();
        data.obogVisits = (data.obogVisits || []).filter(v => v.id !== id);
        updateData('obogVisits', data.obogVisits);
        showToast('削除しました', 'success');
        refreshPage();
      }
    });
  });

  // 面談追加ボタン
  document.querySelectorAll('[data-add-meeting]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      showMeetingModal(btn.dataset.addMeeting, null);
    });
  });

  // 面談編集・削除ボタン
  document.querySelectorAll('[data-edit-meeting]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const [obogId, meetingId] = btn.dataset.editMeeting.split(':');
      showMeetingModal(obogId, meetingId);
    });
  });

  document.querySelectorAll('[data-delete-meeting]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm('この面談記録を削除しますか？')) {
        const [obogId, meetingId] = btn.dataset.deleteMeeting.split(':');
        const data = getData();
        const vIdx = (data.obogVisits || []).findIndex(v => v.id === obogId);
        if (vIdx !== -1 && data.obogVisits[vIdx].meetings) {
          data.obogVisits[vIdx].meetings = data.obogVisits[vIdx].meetings.filter(m => m.id !== meetingId);
          updateData('obogVisits', data.obogVisits);
          showToast('面談記録を削除しました', 'success');
          refreshPage();
        }
      }
    });
  });

  // 一覧へ戻るボタン
  document.getElementById('btn-back-to-list')?.addEventListener('click', () => {
    currentDetailId = null;
    refreshPage();
  });

  // 詳細を見るボタン
  document.querySelectorAll('[data-show-obog-detail]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      currentDetailId = btn.dataset.showObogDetail;
      refreshPage();
    });
  });

  // OBOG詳細（相手の情報＋議事録一覧）の開閉
  document.querySelectorAll('[data-toggle-obog-details]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.toggleObogDetails;
      const detailsDiv = document.getElementById(`obog-details-${id}`);
      if (detailsDiv.style.display === 'none') {
        detailsDiv.style.display = 'flex';
      } else {
        detailsDiv.style.display = 'none';
      }
    });
  });

  // アコーディオン開閉
  document.querySelectorAll('[data-toggle-accordion]').forEach(header => {
    header.addEventListener('click', () => {
      const id = header.dataset.toggleAccordion;
      const content = document.getElementById(`content-${id}`);
      const icon = document.getElementById(`icon-${id}`);
      if (content.classList.contains('open')) {
        content.classList.remove('open');
        icon.textContent = '▼';
      } else {
        content.classList.add('open');
        icon.textContent = '▲';
      }
    });
  });

  document.querySelectorAll('.thanks-checkbox').forEach(chk => {
    chk.addEventListener('change', (e) => {
      const [obogId, meetingId] = chk.dataset.meetingThanks.split(':');
      const isChecked = e.target.checked;
      const data = getData();

      const vIdx = (data.obogVisits || []).findIndex(v => v.id === obogId);
      if (vIdx !== -1 && data.obogVisits[vIdx].meetings) {
        const mIdx = data.obogVisits[vIdx].meetings.findIndex(m => m.id === meetingId);
        if (mIdx !== -1) {
          data.obogVisits[vIdx].meetings[mIdx].thanksSent = isChecked;
          updateData('obogVisits', data.obogVisits);

          const span = chk.nextElementSibling;
          if (isChecked) {
            span.className = 'text-success';
            showToast('お礼メール済みに変更しました', 'success');
          } else {
            span.className = 'text-muted';
            showToast('お礼メール未送信に変更しました', 'info');
          }
        }
      }
    });
  });
}

function generateMockQuestions() {
  const topics = [
    "若手の裁量と成長環境",
    "実際の残業時間とワークライフバランス",
    "社内の評価制度と昇進のリアル",
    "部署間の異動やキャリアパスの柔軟性",
    "現在抱えている事業課題と今後の戦略",
    "会社のカルチャーとマッチする人物像"
  ];
  const q1 = [
    "1. 入社前と入社後で一番ギャップを感じた「社風」や「仕事の進め方」のエピソードを教えていただけますか？",
    "1. プロジェクトの初期段階で提案が通らなかった際、どのようにリカバリーされたか伺いたいです。",
    "1. 御社で「成長している」と感じる人が共通して持っているマインドセットは何だと思いますか？",
    "1. 業務の中で最も「やりがい」と「泥臭さ」を感じた瞬間のエピソードを伺えますか？"
  ];
  const q2 = [
    "2. 競合他社と比較して、御社だからこそ実現できた強みや、逆に課題と感じる部分は何でしょうか？",
    "2. 〇〇部署における直近の大きな挑戦や、それに伴う失敗談などがあれば教えていただきたいです。",
    "2. もし今、〇〇先輩が就活生に戻ったとしたら、今の会社をもう一度選びますか？その理由も伺いたいです。",
    "2. 評価される際に、数字の成果とプロセスのどちらがより重視される傾向にありますか？"
  ];
  const q3 = [
    "3. 今後5年間で、〇〇先輩ご自身が社内で達成したい目標やキャリアビジョンは何ですか？",
    "3. 今後ビジネス環境が変わる中で、中途ではなく新卒に期待される役割は何だとお考えですか？",
    "3. プライベートと仕事の両立において、会社から受けているサポートで助かっていることはありますか？",
    "3. 若手のうちから裁量を持たせてもらえるとのことですが、具体的に「任せてもらえた」と感じたプロジェクトは何でしょうか？"
  ];

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const prompts = [
    `\n\n==========================\n🤖 AI自動生成: 次回の質問案\n`,
    `【テーマ案: ${pick(topics)}】\n\n`,
    `${pick(q1)}\n\n${pick(q2)}\n\n${pick(q3)}\n`
  ];
  return prompts.join("");
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
