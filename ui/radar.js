// ==========================================================================
// RADAR 2D TACTICAL CANVAS ENGINE (60 FPS)
// ==========================================================================

class TacticalRadar {
  constructor(canvasId, containerId, tooltipId) {
    this.canvas = document.getElementById(canvasId);
    this.container = document.getElementById(containerId);
    this.tooltip = document.getElementById(tooltipId);
    this.ctx = this.canvas.getContext('2d');

    // Map bounds
    this.mapWidth = 3800;
    this.mapHeight = 2000;
    this.mapName = "Lục Đạo Hoang Mạc";
    this.mapId = 5001;
    this.isDesert = true;
    this.isConnected = false;

    // Entities
    this.playerX = 1900;
    this.playerY = 1000;
    this.targetPos = null; // { x, y }
    this.monsters = [];    // [ { id, name, x, y, level, isBoss } ]
    this.ramenList = [];   // [ { id, x, y } ]
    this.pearlList = [];   // [ { id, x, y } ]
    this.npcs = [];        // [ { id, name, x, y } ]

    // Hoang Mac patrol waypoints
    this.patrolWaypoints = [
      { x: 300, y: 300 }, { x: 950, y: 300 }, { x: 1900, y: 300 }, { x: 2850, y: 300 }, { x: 3500, y: 300 },
      { x: 3500, y: 700 }, { x: 2850, y: 700 }, { x: 1900, y: 700 }, { x: 950, y: 700 }, { x: 300, y: 700 },
      { x: 300, y: 1200 }, { x: 950, y: 1200 }, { x: 1900, y: 1200 }, { x: 2850, y: 1200 }, { x: 3500, y: 1200 },
      { x: 3500, y: 1700 }, { x: 2850, y: 1700 }, { x: 1900, y: 1700 }, { x: 950, y: 1700 }, { x: 300, y: 1700 }
    ];

    // Animations
    this.pulseRadius = 6;
    this.pulseDirection = 1;
    this.sonarAngle = 0;
    this.clickRipples = []; // [ { x, y, radius, alpha } ]

    // Render Rect
    this.renderRect = { left: 0, top: 0, width: 0, height: 0 };

    this.initEvents();
    this.handleResize();
    this.startLoop();
  }

  initEvents() {
    window.addEventListener('resize', () => this.handleResize());
    
    // Canvas click: Send move command to C#
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;

      if (this.isInsideMap(sx, sy)) {
        const gamePos = this.screenToGame(sx, sy);
        
        // Add ripple animation
        this.clickRipples.push({
          x: sx,
          y: sy,
          radius: 4,
          alpha: 1.0
        });

        // Trigger IPC to C#
        if (window.bridge && typeof window.bridge.sendMoveTo === 'function') {
          window.bridge.sendMoveTo(gamePos.x, gamePos.y);
        }
      }
    });

    // Canvas hover tooltip
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;

      const hit = this.checkEntityHover(sx, sy);
      if (hit) {
        this.tooltip.style.display = 'block';
        this.tooltip.style.left = `${e.clientX - rect.left + 12}px`;
        this.tooltip.style.top = `${e.clientY - rect.top + 12}px`;
        this.tooltip.innerHTML = hit;
      } else {
        this.tooltip.style.display = 'none';
      }
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.tooltip.style.display = 'none';
    });
  }

  handleResize() {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    
    if (w <= 0 || h <= 0) return;

    this.canvas.width = w;
    this.canvas.height = h;

    // Compute aspect-fit rectangle
    const mapAspect = this.mapWidth / this.mapHeight;
    const padding = 12;
    const availW = Math.max(40, w - padding * 2);
    const availH = Math.max(40, h - padding * 2);
    const availAspect = availW / availH;

    let rw, rh;
    if (mapAspect > availAspect) {
      rw = availW;
      rh = availW / mapAspect;
    } else {
      rh = availH;
      rw = availH * mapAspect;
    }

    this.renderRect = {
      left: Math.round((w - rw) / 2),
      top: Math.round((h - rh) / 2),
      width: Math.round(rw),
      height: Math.round(rh)
    };
  }

  isInsideMap(sx, sy) {
    const r = this.renderRect;
    return sx >= r.left && sx <= r.left + r.width && sy >= r.top && sy <= r.top + r.height;
  }

  gameToScreen(gx, gy) {
    const r = this.renderRect;
    const nx = Math.max(0, Math.min(1, gx / this.mapWidth));
    const ny = Math.max(0, Math.min(1, gy / this.mapHeight));
    return {
      x: r.left + nx * r.width,
      y: r.top + ny * r.height
    };
  }

  screenToGame(sx, sy) {
    const r = this.renderRect;
    const nx = Math.max(0, Math.min(1, (sx - r.left) / r.width));
    const ny = Math.max(0, Math.min(1, (sy - r.top) / r.height));
    return {
      x: Math.round(nx * this.mapWidth),
      y: Math.round(ny * this.mapHeight)
    };
  }

  checkEntityHover(sx, sy) {
    if (!this.isInsideMap(sx, sy)) return null;

    const hoverRadius = 8;

    // Check player
    const pScreen = this.gameToScreen(this.playerX, this.playerY);
    if (Math.hypot(sx - pScreen.x, sy - pScreen.y) <= hoverRadius) {
      return `<b>🟢 Bạn (Nhân vật)</b><br>Tọa độ: (${this.playerX}, ${this.playerY})`;
    }

    // Check target pos
    if (this.targetPos) {
      const tScreen = this.gameToScreen(this.targetPos.x, this.targetPos.y);
      if (Math.hypot(sx - tScreen.x, sy - tScreen.y) <= hoverRadius) {
        return `<b>🎯 Điểm mục tiêu di chuyển</b><br>Tọa độ: (${this.targetPos.x}, ${this.targetPos.y})`;
      }
    }

    // Check ramen
    for (const r of this.ramenList) {
      const sp = this.gameToScreen(r.x, r.y);
      if (Math.hypot(sx - sp.x, sy - sp.y) <= hoverRadius) {
        const dist = Math.round(Math.hypot(r.x - this.playerX, r.y - this.playerY));
        return `<b>🍜 Tô Ramen</b><br>Cách bạn: ${dist} px<br>Tọa độ: (${r.x}, ${r.y})`;
      }
    }

    // Check pearls
    for (const p of this.pearlList) {
      const sp = this.gameToScreen(p.x, p.y);
      if (Math.hypot(sx - sp.x, sy - sp.y) <= hoverRadius) {
        const dist = Math.round(Math.hypot(p.x - this.playerX, p.y - this.playerY));
        return `<b>🔮 Ngọc Xanh</b><br>Cách bạn: ${dist} px<br>Tọa độ: (${p.x}, ${p.y})`;
      }
    }

    // Check monsters
    for (const m of this.monsters) {
      const sp = this.gameToScreen(m.x, m.y);
      if (Math.hypot(sx - sp.x, sy - sp.y) <= hoverRadius) {
        const dist = Math.round(Math.hypot(m.x - this.playerX, m.y - this.playerY));
        const isBoss = m.isBoss || m.id === 50001 || (m.id >= 50000 && m.id <= 50100) || 
                       (m.name && (m.name.toLowerCase().includes('boss') || m.name.toLowerCase().includes('босс')));
        if (isBoss) {
          return `<b>👑 BOSS: ${m.name || 'Boss Hoang Mạc'}</b><br>ID: ${m.id} | Cấp: ${m.level || 50}<br>Cách bạn: ${dist} px`;
        }
        return `<b>⚔️ Quái: ${m.name || 'Quái vật'}</b><br>ID: ${m.id} | Cấp: ${m.level || 1}<br>Cách bạn: ${dist} px`;
      }
    }

    return null;
  }

  // Update data from C# IPC
  updateData(data) {
    if (data.mapWidth) this.mapWidth = data.mapWidth;
    if (data.mapHeight) this.mapHeight = data.mapHeight;
    if (data.mapName) this.mapName = data.mapName;
    if (data.mapId !== undefined) this.mapId = data.mapId;
    if (data.isDesert !== undefined) this.isDesert = data.isDesert;
    if (data.isConnected !== undefined) this.isConnected = data.isConnected;

    if (data.playerX !== undefined) this.playerX = data.playerX;
    if (data.playerY !== undefined) this.playerY = data.playerY;
    if (data.targetPos !== undefined) this.targetPos = data.targetPos;

    if (data.monsters) this.monsters = data.monsters;
    if (data.ramenList) this.ramenList = data.ramenList;
    if (data.pearlList) this.pearlList = data.pearlList;
    if (data.npcs) this.npcs = data.npcs;

    // Update Header Text
    const infoEl = document.getElementById('radarMapInfo');
    if (infoEl) {
      if (this.isConnected) {
        const typeTag = this.isDesert ? '[Hoang Mạc]' : '[Thế Giới]';
        infoEl.textContent = `● ${this.mapName} (ID: ${this.mapId}) — ${this.mapWidth}x${this.mapHeight}px ${typeTag}`;
        infoEl.style.color = '#cbd5e1';
      } else {
        infoEl.textContent = `● Chưa kết nối game (Bấm [▶ START PROXY] và mở NarutoInfinityClient)`;
        infoEl.style.color = '#94a3b8';
      }
    }

    // Update Footer Text
    const footEl = document.getElementById('radarFooter');
    if (footEl) {
      if (!this.isConnected) {
        footEl.textContent = '● Trạng thái: Chờ game kết nối vào bản đồ...';
      } else if (this.isDesert) {
        footEl.textContent = `● Bạn: (${this.playerX}, ${this.playerY}) | Mì: ${this.ramenList.length} | Ngọc: ${this.pearlList.length} | Quái: ${this.monsters.length}`;
      } else {
        footEl.textContent = `● Bạn: (${this.playerX}, ${this.playerY}) | NPC: ${this.npcs.length} | Quái: ${this.monsters.length}`;
      }
    }
  }

  startLoop() {
    const loop = () => {
      this.updateAnimations();
      this.draw();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  updateAnimations() {
    // Pulse animation
    this.pulseRadius += 0.15 * this.pulseDirection;
    if (this.pulseRadius >= 11) this.pulseDirection = -1;
    if (this.pulseRadius <= 5) this.pulseDirection = 1;

    // Sonar sweep angle
    this.sonarAngle = (this.sonarAngle + 0.04) % (Math.PI * 2);

    // Ripple animations
    for (let i = this.clickRipples.length - 1; i >= 0; i--) {
      const rip = this.clickRipples[i];
      rip.radius += 1.5;
      rip.alpha -= 0.035;
      if (rip.alpha <= 0) {
        this.clickRipples.splice(i, 1);
      }
    }
  }

  draw() {
    const ctx = this.ctx;
    const r = this.renderRect;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    if (r.width <= 0 || r.height <= 0) return;

    // 1. Draw Map Glass Container
    ctx.save();
    this.roundRect(ctx, r.left, r.top, r.width, r.height, 8);
    
    // Background gradient
    const bgGrad = ctx.createLinearGradient(r.left, r.top, r.left, r.top + r.height);
    bgGrad.addColorStop(0, '#0c111a');
    bgGrad.addColorStop(1, '#07090e');
    ctx.fillStyle = bgGrad;
    ctx.fill();

    // Clip to rounded rect
    ctx.clip();

    // 2. Draw Coordinate Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;

    const stepX = Math.max(200, Math.floor((this.mapWidth / 6) / 100) * 100);
    const stepY = Math.max(200, Math.floor((this.mapHeight / 4) / 100) * 100);

    for (let gx = stepX; gx < this.mapWidth; gx += stepX) {
      const p1 = this.gameToScreen(gx, 0);
      const p2 = this.gameToScreen(gx, this.mapHeight);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    for (let gy = stepY; gy < this.mapHeight; gy += stepY) {
      const p1 = this.gameToScreen(0, gy);
      const p2 = this.gameToScreen(this.mapWidth, gy);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    // 3. Draw Patrol Waypoints
    if (this.isDesert && this.patrolWaypoints) {
      ctx.fillStyle = 'rgba(99, 102, 241, 0.25)';
      for (const wp of this.patrolWaypoints) {
        const sp = this.gameToScreen(wp.x, wp.y);
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 4. Draw Line to Target
    if (this.targetPos) {
      const spPlayer = this.gameToScreen(this.playerX, this.playerY);
      const spTarget = this.gameToScreen(this.targetPos.x, this.targetPos.y);

      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(spPlayer.x, spPlayer.y);
      ctx.lineTo(spTarget.x, spTarget.y);
      ctx.stroke();
      ctx.restore();

      // Target marker
      ctx.fillStyle = 'rgba(251, 191, 36, 0.3)';
      ctx.beginPath();
      ctx.arc(spTarget.x, spTarget.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 5. Draw Blue Pearls
    for (const p of this.pearlList) {
      const sp = this.gameToScreen(p.x, p.y);
      ctx.fillStyle = '#06b6d4';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#cffafe';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    // 6. Draw Ramen Bowls
    for (const rm of this.ramenList) {
      const sp = this.gameToScreen(rm.x, rm.y);
      ctx.fillStyle = '#f59e0b';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 7;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fef3c7';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    // 7. Draw Monsters
    for (const m of this.monsters) {
      const sp = this.gameToScreen(m.x, m.y);
      const isBoss = m.isBoss || m.id === 50001 || (m.id >= 50000 && m.id <= 50100) || 
                     (m.name && (m.name.toLowerCase().includes('boss') || m.name.toLowerCase().includes('босс')));
      
      if (isBoss) {
        // Draw Boss as gold diamond with glow
        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(sp.x, sp.y - 8);
        ctx.lineTo(sp.x + 7, sp.y);
        ctx.lineTo(sp.x, sp.y + 8);
        ctx.lineTo(sp.x - 7, sp.y);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else {
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
    ctx.shadowBlur = 0;

    // 8. Draw Click Ripples
    for (const rip of this.clickRipples) {
      ctx.strokeStyle = `rgba(56, 189, 248, ${rip.alpha})`;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 9. Draw Player Avatar with Pulse Sonar
    const pScreen = this.gameToScreen(this.playerX, this.playerY);

    // Expanding sonar halo
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(pScreen.x, pScreen.y, this.pulseRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Solid Player Core
    ctx.fillStyle = '#10b981';
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(pScreen.x, pScreen.y, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.restore();

    // 10. Draw Glass Border & Sheen on Map
    ctx.save();
    this.roundRect(ctx, r.left, r.top, r.width, r.height, 8);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Top sheen
    const sheenGrad = ctx.createLinearGradient(r.left, r.top, r.left, r.top + r.height * 0.35);
    sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
    sheenGrad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
    ctx.fillStyle = sheenGrad;
    this.roundRect(ctx, r.left, r.top, r.width, Math.max(4, r.height * 0.35), 8);
    ctx.fill();
    ctx.restore();
  }

  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}

// Global radar instance
window.TacticalRadar = TacticalRadar;
