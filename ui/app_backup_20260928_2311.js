// ==========================================================================
// HOANG MAC AUTO PRO - FRONTEND APPLICATION LOGIC & C# IPC BRIDGE
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Radar
  const radar = new TacticalRadar('radarCanvas', 'canvasContainer', 'radarTooltip');

  // DOM Elements
  const el = {
    // Window Controls
    winMin: document.getElementById('winMin'),
    winMax: document.getElementById('winMax'),
    winClose: document.getElementById('winClose'),
    btnUpdate: document.getElementById('btnUpdate'),
    appVersion: document.getElementById('appVersion'),
    proxyStatusBadge: document.getElementById('proxyStatusBadge'),
    proxyStatusText: document.getElementById('proxyStatusText'),

    // Client Path & Main Actions
    txtClientDir: document.getElementById('txtClientDir'),
    btnBrowse: document.getElementById('btnBrowse'),
    btnStartProxy: document.getElementById('btnStartProxy'),
    lblStartProxy: document.getElementById('lblStartProxy'),
    btnAutoBot: document.getElementById('btnAutoBot'),
    lblAutoBot: document.getElementById('lblAutoBot'),
    btnScanMap: document.getElementById('btnScanMap'),
    btnResetLauncher: document.getElementById('btnResetLauncher'),
    numDelay: document.getElementById('numDelay'),
    btnClearLog: document.getElementById('btnClearLog'),
    btnExitBattle: document.getElementById('btnExitBattle'),

    // Checkboxes
    chkPickRamen: document.getElementById('chkPickRamen'),
    chkPickPearl: document.getElementById('chkPickPearl'),
    chkAutoFightMonsters: document.getElementById('chkAutoFightMonsters'),
    chkAutoRevive: document.getElementById('chkAutoRevive'),
    chkAutoClickReturn: document.getElementById('chkAutoClickReturn'),

    // Priorities
    cboPriority1: document.getElementById('cboPriority1'),
    cboPriority2: document.getElementById('cboPriority2'),
    cboPriority3: document.getElementById('cboPriority3'),
    chkSequentialPriority: document.getElementById('chkSequentialPriority'),
    chkNearestTarget: document.getElementById('chkNearestTarget'),

    // Monsters
    rbFightAll: document.getElementById('rbFightAll'),
    rbFightSelected: document.getElementById('rbFightSelected'),
    monsterListContainer: document.getElementById('monsterListContainer'),
    txtSearchMonster: document.getElementById('txtSearchMonster'),
    btnSelectAllMonsters: document.getElementById('btnSelectAllMonsters'),
    btnDeselectAllMonsters: document.getElementById('btnDeselectAllMonsters'),
    btnClearMonsters: document.getElementById('btnClearMonsters'),

    // Stats & Radar Toggle
    statRamenCount: document.getElementById('statRamenCount'),
    statGoldSpent: document.getElementById('statGoldSpent'),
    statPearlCount: document.getElementById('statPearlCount'),
    statSilverSpent: document.getElementById('statSilverSpent'),
    statMonsterCount: document.getElementById('statMonsterCount'),
    statWinCount: document.getElementById('statWinCount'),
    statLoseCount: document.getElementById('statLoseCount'),
    statReviveCount: document.getElementById('statReviveCount'),
    btnToggleRadar: document.getElementById('btnToggleRadar'),
    lblRadarToggle: document.getElementById('lblRadarToggle'),
    radarPanel: document.getElementById('radarPanel'),

    // Log
    logContent: document.getElementById('logContent'),
    chkAutoScroll: document.getElementById('chkAutoScroll'),
    btnCopyLog: document.getElementById('btnCopyLog')
  };

  // State
  let isProxyRunning = false;
  let isBotRunning = false;
  let showRadar = true;
  let allMonstersMap = new Map(); // key -> { id, name, level, checked }

  // ── 1. C# IPC BRIDGE INTERFACE ──
  const sendToCSharp = (obj) => {
    if (window.chrome && window.chrome.webview && typeof window.chrome.webview.postMessage === 'function') {
      window.chrome.webview.postMessage(obj);
    } else {
      console.log('[IPC Debug] Send to C#:', obj);
    }
  };

  // Expose bridge helper for radar click
  window.bridge = {
    sendMoveTo: (gx, gy) => {
      sendToCSharp({ action: 'move_to', x: gx, y: gy });
      appendLogLine(`[RADAR] ➔ Ra lệnh di chuyển tới tọa độ (${gx}, ${gy})`, 'action');
    }
  };

  // Receive message from C#
  if (window.chrome && window.chrome.webview) {
    window.chrome.webview.addEventListener('message', (event) => {
      handleIncomingMessage(event.data);
    });
  }

  // ── 2. INCOMING MESSAGE HANDLER ──
  function handleIncomingMessage(msg) {
    if (!msg || typeof msg !== 'object') return;

    switch (msg.type) {
      case 'log':
        appendLogLine(msg.text, msg.level || 'info');
        break;

      case 'state':
        updateAppState(msg);
        break;

      case 'stats':
        updateStats(msg);
        break;

      case 'radar':
        radar.updateData(msg);
        break;

      case 'monsters_detected':
        updateMonstersList(msg.monsters);
        break;

      case 'version':
        if (msg.version) el.appVersion.textContent = `v${msg.version}`;
        break;
    }
  }

  // ── 3. LOGGING SYSTEM ──
  function appendLogLine(text, level = 'info') {
    if (!el.logContent) return;

    const div = document.createElement('div');
    div.className = `log-line log-${level}`;

    const now = new Date();
    const timeStr = `[${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}]`;

    // Highlight keywords
    let styledText = text;
    if (text.includes('✓') || text.includes('[OK]') || text.includes('thành công')) {
      div.className = 'log-line log-success';
    } else if (text.includes('⚠') || text.includes('[CẢNH BÁO]')) {
      div.className = 'log-line log-warn';
    } else if (text.includes('❌') || text.includes('LỖI') || text.includes('[ERROR]')) {
      div.className = 'log-line log-error';
    } else if (text.includes('⚔️') || text.includes('TẤN CÔNG') || text.includes('CHIẾN ĐẤU')) {
      div.className = 'log-line log-action';
    }

    div.innerHTML = `<span class="log-time">${timeStr}</span> ${styledText}`;
    el.logContent.appendChild(div);

    if (el.chkAutoScroll && el.chkAutoScroll.checked) {
      el.logContent.scrollTop = el.logContent.scrollHeight;
    }
  }

  // ── 4. STATE & STATS UPDATERS ──
  function updateAppState(state) {
    if (state.clientDir !== undefined) el.txtClientDir.value = state.clientDir;
    if (state.delay !== undefined) el.numDelay.value = state.delay;

    if (state.proxyRunning !== undefined) {
      isProxyRunning = state.proxyRunning;
      el.lblStartProxy.textContent = isProxyRunning ? 'STOP PROXY' : 'START PROXY';
      el.btnStartProxy.className = isProxyRunning ? 'btn btn-amber' : 'btn btn-emerald';
      
      el.btnAutoBot.disabled = !isProxyRunning;
      el.btnScanMap.disabled = !isProxyRunning;

      el.proxyStatusBadge.className = isProxyRunning ? 'status-badge online' : 'status-badge offline';
      el.proxyStatusText.textContent = isProxyRunning ? 'ONLINE' : 'OFFLINE';
    }

    if (state.botRunning !== undefined) {
      isBotRunning = state.botRunning;
      el.lblAutoBot.textContent = isBotRunning ? 'DỪNG FARM' : 'BẮT ĐẦU FARM';
      el.btnAutoBot.className = isBotRunning ? 'btn btn-danger' : 'btn btn-purple';
    }

    if (state.settings) {
      const s = state.settings;
      if (s.pickRamen !== undefined) el.chkPickRamen.checked = s.pickRamen;
      if (s.pickPearl !== undefined) el.chkPickPearl.checked = s.pickPearl;
      if (s.autoFight !== undefined) el.chkAutoFightMonsters.checked = s.autoFight;
      if (s.autoRevive !== undefined) el.chkAutoRevive.checked = s.autoRevive;
      if (s.autoReturn !== undefined) el.chkAutoClickReturn.checked = s.autoReturn;
      if (s.sequential !== undefined) el.chkSequentialPriority.checked = s.sequential;
      if (s.nearest !== undefined) el.chkNearestTarget.checked = s.nearest;

      if (s.fightAll !== undefined) {
        if (s.fightAll) el.rbFightAll.checked = true;
        else el.rbFightSelected.checked = true;
      }

      if (s.priorityOrder && s.priorityOrder.length >= 3) {
        el.cboPriority1.value = s.priorityOrder[0];
        el.cboPriority2.value = s.priorityOrder[1];
        el.cboPriority3.value = s.priorityOrder[2];
      }
    }
  }

  function updateStats(stats) {
    if (stats.ramen !== undefined) el.statRamenCount.textContent = stats.ramen;
    if (stats.gold !== undefined) el.statGoldSpent.textContent = stats.gold;
    if (stats.pearl !== undefined) el.statPearlCount.textContent = stats.pearl;
    if (stats.silver !== undefined) el.statSilverSpent.textContent = stats.silver;
    if (stats.monsters !== undefined) el.statMonsterCount.textContent = stats.monsters;
    if (stats.wins !== undefined) el.statWinCount.textContent = stats.wins;
    if (stats.losses !== undefined) el.statLoseCount.textContent = stats.losses;
    if (stats.revives !== undefined) el.statReviveCount.textContent = stats.revives;
  }

  function updateMonstersList(monsters) {
    if (!Array.isArray(monsters)) return;

    for (const m of monsters) {
      const key = `${m.id}_${m.name}`;
      if (!allMonstersMap.has(key)) {
        allMonstersMap.set(key, {
          id: m.id,
          name: m.name || `Quái vật ${m.id}`,
          level: m.level || 1,
          checked: m.checked !== undefined ? m.checked : true
        });
      }
    }

    renderMonsterList();
  }

  function renderMonsterList() {
    const filterText = (el.txtSearchMonster.value || '').toLowerCase().trim();
    el.monsterListContainer.innerHTML = '';

    let count = 0;
    allMonstersMap.forEach((m, key) => {
      const label = `ID: ${m.id} | ${m.name} (Lv.${m.level})`;
      if (filterText && !label.toLowerCase().includes(filterText)) {
        return;
      }

      count++;
      const item = document.createElement('label');
      item.className = 'monster-item custom-checkbox';
      item.innerHTML = `
        <input type="checkbox" data-key="${key}" ${m.checked ? 'checked' : ''}>
        <span class="checkbox-indicator"></span>
        <span class="checkbox-text">${label}</span>
      `;

      item.querySelector('input').addEventListener('change', (e) => {
        m.checked = e.target.checked;
        notifySettingsChanged();
      });

      el.monsterListContainer.appendChild(item);
    });

    if (count === 0) {
      el.monsterListContainer.innerHTML = '<div class="empty-monster-hint">Không có quái vật nào khớp với tìm kiếm.</div>';
    }
  }

  // ── 5. EVENT LISTENERS SETUP ──

  // Window Dragging & Double-Click Maximize
  const titlebar = document.getElementById('titlebar');
  if (titlebar) {
    let isDragging = false;
    let startX = 0, startY = 0;

    titlebar.addEventListener('mousedown', (e) => {
      if (e.target.closest('button') || e.target.closest('input') || e.target.closest('a')) {
        return;
      }
      if (e.button === 0) {
        sendToCSharp({ action: 'win_drag' });
        isDragging = true;
        startX = e.screenX;
        startY = e.screenY;
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (isDragging) {
        const dx = e.screenX - startX;
        const dy = e.screenY - startY;
        if (dx !== 0 || dy !== 0) {
          startX = e.screenX;
          startY = e.screenY;
          sendToCSharp({ action: 'win_move', dx: dx, dy: dy });
        }
      }
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    titlebar.addEventListener('dblclick', (e) => {
      if (e.target.closest('button') || e.target.closest('input') || e.target.closest('a')) {
        return;
      }
      sendToCSharp({ action: 'win_maximize' });
    });
  }

  // Window Controls
  el.winMin.addEventListener('click', () => sendToCSharp({ action: 'win_minimize' }));
  el.winMax.addEventListener('click', () => sendToCSharp({ action: 'win_maximize' }));
  el.winClose.addEventListener('click', () => sendToCSharp({ action: 'win_close' }));
  el.btnUpdate.addEventListener('click', () => sendToCSharp({ action: 'check_update' }));

  // Main Actions
  el.btnBrowse.addEventListener('click', () => sendToCSharp({ action: 'browse_client_dir' }));
  el.txtClientDir.addEventListener('change', () => {
    sendToCSharp({ action: 'set_client_dir', path: el.txtClientDir.value });
  });

  el.btnStartProxy.addEventListener('click', () => sendToCSharp({ action: 'toggle_proxy' }));
  el.btnAutoBot.addEventListener('click', () => sendToCSharp({ action: 'toggle_bot' }));
  el.btnScanMap.addEventListener('click', () => sendToCSharp({ action: 'scan_map' }));
  el.btnResetLauncher.addEventListener('click', () => sendToCSharp({ action: 'reset_launcher' }));
  el.btnExitBattle.addEventListener('click', () => sendToCSharp({ action: 'exit_battle' }));

  el.numDelay.addEventListener('change', () => {
    sendToCSharp({ action: 'set_delay', delay: parseInt(el.numDelay.value, 10) || 800 });
  });

  el.btnClearLog.addEventListener('click', () => {
    el.logContent.innerHTML = '';
  });

  el.btnCopyLog.addEventListener('click', () => {
    const text = el.logContent.innerText;
    navigator.clipboard.writeText(text).then(() => {
      appendLogLine('✓ Đã sao chép toàn bộ nhật ký vào Clipboard!', 'success');
    });
  });

  // Settings Checkboxes
  const settingCheckboxes = [
    el.chkPickRamen, el.chkPickPearl, el.chkAutoFightMonsters,
    el.chkAutoRevive, el.chkAutoClickReturn,
    el.chkSequentialPriority, el.chkNearestTarget,
    el.rbFightAll, el.rbFightSelected
  ];

  settingCheckboxes.forEach(chk => {
    chk.addEventListener('change', notifySettingsChanged);
  });

  // Priority Dropdown Auto-Swap (Prevents duplicates)
  [el.cboPriority1, el.cboPriority2, el.cboPriority3].forEach((cbo, idx, arr) => {
    cbo.addEventListener('change', () => {
      const val = cbo.value;
      const otherIndices = [0, 1, 2].filter(i => i !== idx);

      for (const oi of otherIndices) {
        if (arr[oi].value === val) {
          const available = ['ramen', 'monster', 'pearl'].find(x => x !== val && x !== arr[otherIndices.find(x => x !== oi)].value);
          arr[oi].value = available;
          break;
        }
      }
      notifySettingsChanged();
    });
  });

  // Monster Filter Actions
  el.txtSearchMonster.addEventListener('input', () => renderMonsterList());
  
  el.btnSelectAllMonsters.addEventListener('click', () => {
    allMonstersMap.forEach(m => m.checked = true);
    renderMonsterList();
    notifySettingsChanged();
  });

  el.btnDeselectAllMonsters.addEventListener('click', () => {
    allMonstersMap.forEach(m => m.checked = false);
    renderMonsterList();
    notifySettingsChanged();
  });

  el.btnClearMonsters.addEventListener('click', () => {
    allMonstersMap.clear();
    renderMonsterList();
    notifySettingsChanged();
    appendLogLine('✓ Đã làm trống danh sách quái vật đã phát hiện.', 'info');
  });

  // Radar Toggle
  el.btnToggleRadar.addEventListener('click', () => {
    showRadar = !showRadar;
    if (showRadar) {
      el.radarPanel.classList.remove('collapsed');
      el.lblRadarToggle.textContent = '📡 Radar: BẬT';
      el.btnToggleRadar.className = 'btn btn-indigo btn-radar-toggle';
      radar.handleResize();
    } else {
      el.radarPanel.classList.add('collapsed');
      el.lblRadarToggle.textContent = '📡 Radar: TẮT';
      el.btnToggleRadar.className = 'btn btn-secondary btn-radar-toggle';
    }
    notifySettingsChanged();
  });

  function notifySettingsChanged() {
    const selectedMonsterIds = [];
    allMonstersMap.forEach(m => {
      if (m.checked) selectedMonsterIds.push(m.id);
    });

    const payload = {
      action: 'save_settings',
      settings: {
        pickRamen: el.chkPickRamen.checked,
        pickPearl: el.chkPickPearl.checked,
        autoFight: el.chkAutoFightMonsters.checked,
        autoRevive: el.chkAutoRevive.checked,
        autoReturn: el.chkAutoClickReturn.checked,
        sequential: el.chkSequentialPriority.checked,
        nearest: el.chkNearestTarget.checked,
        fightAll: el.rbFightAll.checked,
        selectedMonsters: selectedMonsterIds,
        priorityOrder: [el.cboPriority1.value, el.cboPriority2.value, el.cboPriority3.value],
        delay: parseInt(el.numDelay.value, 10) || 800,
        showRadar: showRadar
      }
    };

    sendToCSharp(payload);
  }

  // Request initial state from C# on ready
  setTimeout(() => {
    sendToCSharp({ action: 'ready' });
  }, 100);
});
