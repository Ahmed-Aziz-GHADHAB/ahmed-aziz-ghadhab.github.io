/**
 * game.js  –  "Dungeon Dash" Mini-Game
 * ══════════════════════════════════════════════════════════════
 *
 * HOW TO TWEAK THE GAME:
 * ──────────────────────
 *  TILE_CROSS_MS   Speed of player movement (ms to cross one tile).
 *                  Lower = faster player.  Default: 140
 *
 *  ENEMY_INTERVAL  Time between ghost moves (ms).
 *                  Lower = harder.  Default: 480
 *
 *  ENEMY_CHASE_PROB  Probability (0–1) ghost chases instead of roaming.
 *                  0 = always random.  1 = always chase.  Default: 0.72
 *
 *  LIVES           Starting lives.  Default: 3
 *
 *  MAP_TEMPLATE    The dungeon layout.  See legend below.
 *
 * MAP LEGEND:
 *   0 = floor       1 = wall
 *   2 = gem (collectible, +10 pts each)
 *   3 = player start position
 *   4 = exit door (unlocked when all gems collected, +150 pts bonus)
 *   5 = enemy (ghost) start position
 *
 * OBJECTIVE:
 *   Collect every gem (◆), then step onto the exit (▲) to win.
 *   Touching the ghost costs a life; 0 lives = game over.
 * ══════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  /* ── Tuneable constants ──────────────────────────────────── */
  var TILE            = 32;       // pixel size of one grid cell
  var COLS            = 15;       // map width  in tiles
  var ROWS            = 15;       // map height in tiles
  var TILE_CROSS_MS   = 140;      // ms for player to cross one tile  ← tweak speed
  var ENEMY_INTERVAL  = 480;      // ms between ghost moves           ← tweak difficulty
  var ENEMY_CROSS_MS  = 210;      // ms for ghost to cross one tile
  var ENEMY_CHASE_PROB = 0.72;    // chase probability (0-1)          ← tweak AI
  var LIVES           = 3;        // starting lives                   ← tweak lives
  var WIN_BONUS       = 150;      // bonus points for reaching exit
  var GEM_POINTS      = 10;       // points per gem

  var CANVAS_W = TILE * COLS;     // 480 px
  var CANVAS_H = TILE * ROWS;     // 480 px
  var HUD_H    = 36;              // HUD bar at bottom

  /* ── Colour palette (mirrors CSS variables) ─────────────── */
  var C = {
    wall:        '#1a1a35',
    wallEdgeHi:  '#2e2e52',
    wallEdgeSh:  '#0d0d20',
    floor0:      '#0d0d1a',
    floor1:      '#0f0f20',
    gem:         '#00e676',
    gemGlow:     'rgba(0,230,118,0.35)',
    player:      '#00e676',
    playerGlow:  'rgba(0,230,118,0.25)',
    enemy:       '#ff4444',
    enemyGlow:   'rgba(255,68,68,0.25)',
    exitLocked:  '#444460',
    exitOpen:    '#ffd700',
    exitGlow:    'rgba(255,215,0,0.4)',
    hudBg:       'rgba(8,8,20,0.88)',
    hudScore:    '#00e676',
    hudLife:     '#ff4444',
    hudMuted:    '#44445a',
    overlayBg:   'rgba(0,0,0,0.76)',
    winText:     '#ffd700',
    loseText:    '#ff4444',
  };

  /* ── Map template ────────────────────────────────────────── */
  /*
   * Visualisation (# = wall, . = floor, G = gem, P = player,
   *                E = exit, M = monster/ghost)
   *
   *  ###############
   *  #P.G.......G..#
   *  #.###.#.#.###.#
   *  #..G.......G..#  ← gems in corners / mid
   *  #.###.###.###.#
   *  #....G...G....#
   *  #..##.#M#.##..#  ← ghost in centre
   *  #..........G..#  ← open mid corridor
   *  #..##.#.#.##..#
   *  #....G...G....#
   *  #.###.###.###.#
   *  #..G.......G..#
   *  #.###.#.#.###.#
   *  #..G.......GE.#  ← exit bottom-right
   *  ###############
   */
  var MAP_TEMPLATE = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,3,0,2,0,0,0,0,0,0,0,2,0,0,1],
    [1,0,1,1,1,0,1,0,1,0,1,1,1,0,1],
    [1,0,0,2,0,0,0,0,0,0,0,0,2,0,1],
    [1,0,1,1,1,0,1,1,1,0,1,1,1,0,1],
    [1,0,0,0,0,2,0,0,0,2,0,0,0,0,1],
    [1,0,0,1,1,0,1,5,1,0,1,1,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,2,0,1],
    [1,0,0,1,1,0,1,0,1,0,1,1,0,0,1],
    [1,0,0,0,0,2,0,0,0,2,0,0,0,0,1],
    [1,0,1,1,1,0,1,1,1,0,1,1,1,0,1],
    [1,0,0,2,0,0,0,0,0,0,0,0,2,0,1],
    [1,0,1,1,1,0,1,0,1,0,1,1,1,0,1],
    [1,0,0,2,0,0,0,0,0,0,0,2,0,4,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ];

  /* ── Runtime state ───────────────────────────────────────── */
  var canvas, ctx;
  var map, gems, totalGems;
  var player, enemy;
  var gameState;   // 'playing' | 'won' | 'dead'
  var score, lives;
  var lastTimestamp = 0;
  var inputQueue    = [];
  var gemPulse      = 0;
  var playerDefaultRow = 1, playerDefaultCol = 1;
  var enemyDefaultRow  = 6, enemyDefaultCol  = 7;

  /* ══════════════════════════════════════════════════════════
     INIT
  ══════════════════════════════════════════════════════════ */
  function init() {
    canvas = document.getElementById('gameCanvas');
    if (!canvas) return;

    ctx            = canvas.getContext('2d');
    canvas.width   = CANVAS_W;
    canvas.height  = CANVAS_H;

    /* Keyboard input – only prevent scroll when canvas area is focused */
    document.addEventListener('keydown', handleKey);

    setupMobileControls();
    resetGame();
    requestAnimationFrame(gameLoop);
  }

  /* ══════════════════════════════════════════════════════════
     RESET
  ══════════════════════════════════════════════════════════ */
  function resetGame() {
    // Deep-copy the map so we can mutate it each game
    map = MAP_TEMPLATE.map(function (row) { return row.slice(); });

    gems      = {};   // key: "r,c" → true
    totalGems = 0;

    var pRow = playerDefaultRow, pCol = playerDefaultCol;
    var eRow = enemyDefaultRow,  eCol = enemyDefaultCol;

    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        switch (map[r][c]) {
          case 3:
            pRow = r; pCol = c;
            map[r][c] = 0;
            break;
          case 5:
            eRow = r; eCol = c;
            map[r][c] = 0;
            break;
          case 2:
            gems[r + ',' + c] = true;
            totalGems++;
            break;
        }
      }
    }

    player = makeEntity(pRow, pCol);
    player.dir = 2; // facing down initially

    enemy  = makeEntity(eRow, eCol);
    enemy.lastMoveTime = 0;

    score      = 0;
    lives      = LIVES;
    gameState  = 'playing';
    inputQueue = [];
    gemPulse   = 0;

    // Hide restart button (only relevant after game ends)
    var restartBtn = document.getElementById('game-restart');
    if (restartBtn) restartBtn.style.display = 'none';
  }

  /** Creates an entity object at grid position (row, col) */
  function makeEntity(row, col) {
    return {
      row:       row,
      col:       col,
      px:        col * TILE,
      py:        row * TILE,
      targetRow: row,
      targetCol: col,
      moving:    false,
      dir:       1,      // 0=up 1=right 2=down 3=left
    };
  }

  /* ══════════════════════════════════════════════════════════
     INPUT
  ══════════════════════════════════════════════════════════ */
  var KEY_MAP = {
    ArrowUp:    'up',   w: 'up',   W: 'up',
    ArrowDown:  'down', s: 'down', S: 'down',
    ArrowLeft:  'left', a: 'left', A: 'left',
    ArrowRight: 'right',d: 'right',D: 'right',
  };
  var RESTART_KEYS = [' ', 'Enter', 'r', 'R'];

  function handleKey(e) {
    if (KEY_MAP[e.key]) {
      // Prevent page scrolling when arrow keys are pressed
      e.preventDefault();
      if (gameState === 'playing') {
        pushInput(KEY_MAP[e.key]);
      }
    }
    if (RESTART_KEYS.indexOf(e.key) !== -1 && gameState !== 'playing') {
      resetGame();
    }
  }

  function pushInput(dir) {
    if (inputQueue.length < 3) inputQueue.push(dir);
  }

  /* ══════════════════════════════════════════════════════════
     GAME LOOP
  ══════════════════════════════════════════════════════════ */
  function gameLoop(timestamp) {
    var dt = Math.min(timestamp - lastTimestamp, 60);
    lastTimestamp = timestamp;

    if (gameState === 'playing') {
      update(dt, timestamp);
    }
    render(timestamp);
    requestAnimationFrame(gameLoop);
  }

  /* ══════════════════════════════════════════════════════════
     UPDATE
  ══════════════════════════════════════════════════════════ */
  function update(dt, timestamp) {
    gemPulse += dt * 0.003;

    updatePlayer(dt);
    updateEnemy(dt, timestamp);
    checkCollision();
  }

  /* ── Player movement ──────────────────────────────────── */
  function updatePlayer(dt) {
    if (!player.moving) {
      if (inputQueue.length === 0) return;
      var dir = inputQueue.shift();

      var nr = player.row, nc = player.col;
      if      (dir === 'up')    { nr--; player.dir = 0; }
      else if (dir === 'down')  { nr++; player.dir = 2; }
      else if (dir === 'left')  { nc--; player.dir = 3; }
      else if (dir === 'right') { nc++; player.dir = 1; }

      if (isWalkable(nr, nc)) {
        player.targetRow = nr;
        player.targetCol = nc;
        player.moving    = true;
      }

    } else {
      // Slide toward target
      var speed = TILE / TILE_CROSS_MS;
      var delta = speed * dt;

      player.px = lerp(player.px, player.targetCol * TILE, delta);
      player.py = lerp(player.py, player.targetRow * TILE, delta);

      if (Math.abs(player.px - player.targetCol * TILE) < 0.5 &&
          Math.abs(player.py - player.targetRow * TILE) < 0.5) {
        player.px  = player.targetCol * TILE;
        player.py  = player.targetRow * TILE;
        player.row = player.targetRow;
        player.col = player.targetCol;
        player.moving = false;

        // Collect gem
        var key = player.row + ',' + player.col;
        if (gems[key]) {
          delete gems[key];
          score += GEM_POINTS;
        }

        // Check exit
        if (map[player.row][player.col] === 4 && gemCount() === 0) {
          score     += WIN_BONUS;
          gameState  = 'won';
          showRestartBtn();
        }
      }
    }
  }

  /* ── Enemy movement ───────────────────────────────────── */
  function updateEnemy(dt, timestamp) {
    if (!enemy.moving) {
      if (timestamp - enemy.lastMoveTime >= ENEMY_INTERVAL) {
        enemy.lastMoveTime = timestamp;
        moveEnemy();
      }
    } else {
      var speed = TILE / ENEMY_CROSS_MS;
      var delta = speed * dt;

      enemy.px = lerp(enemy.px, enemy.targetCol * TILE, delta);
      enemy.py = lerp(enemy.py, enemy.targetRow * TILE, delta);

      if (Math.abs(enemy.px - enemy.targetCol * TILE) < 0.5 &&
          Math.abs(enemy.py - enemy.targetRow * TILE) < 0.5) {
        enemy.px  = enemy.targetCol * TILE;
        enemy.py  = enemy.targetRow * TILE;
        enemy.row = enemy.targetRow;
        enemy.col = enemy.targetCol;
        enemy.moving = false;
      }
    }
  }

  function moveEnemy() {
    var dirs = [
      { dr:-1, dc:0 }, { dr:1, dc:0 },
      { dr:0, dc:-1 }, { dr:0, dc:1 }
    ];

    var chosen = null;

    if (Math.random() < ENEMY_CHASE_PROB) {
      // Manhattan-distance chase with shuffle to break ties
      shuffle(dirs);
      var best = Infinity;
      for (var i = 0; i < dirs.length; i++) {
        var nr = enemy.row + dirs[i].dr;
        var nc = enemy.col + dirs[i].dc;
        if (!isWalkable(nr, nc)) continue;
        var d = Math.abs(nr - player.row) + Math.abs(nc - player.col);
        if (d < best) { best = d; chosen = { nr: nr, nc: nc }; }
      }
    }

    if (!chosen) {
      // Random walkable step
      shuffle(dirs);
      for (var j = 0; j < dirs.length; j++) {
        var tnr = enemy.row + dirs[j].dr;
        var tnc = enemy.col + dirs[j].dc;
        if (isWalkable(tnr, tnc)) {
          chosen = { nr: tnr, nc: tnc };
          break;
        }
      }
    }

    if (chosen) {
      enemy.targetRow = chosen.nr;
      enemy.targetCol = chosen.nc;
      enemy.moving    = true;
    }
  }

  /* ── Collision ────────────────────────────────────────── */
  function checkCollision() {
    var px = player.px + TILE / 2;
    var py = player.py + TILE / 2;
    var ex = enemy.px  + TILE / 2;
    var ey = enemy.py  + TILE / 2;
    var dist = Math.sqrt((px - ex) * (px - ex) + (py - ey) * (py - ey));

    if (dist < TILE * 0.58) {
      lives--;
      if (lives <= 0) {
        gameState = 'dead';
        showRestartBtn();
      } else {
        // Respawn
        player.row = playerDefaultRow; player.col = playerDefaultCol;
        player.px  = player.col * TILE; player.py = player.row * TILE;
        player.targetRow = player.row;  player.targetCol = player.col;
        player.moving = false;
        inputQueue = [];

        enemy.row = enemyDefaultRow; enemy.col = enemyDefaultCol;
        enemy.px  = enemy.col * TILE; enemy.py = enemy.row * TILE;
        enemy.targetRow = enemy.row;  enemy.targetCol = enemy.col;
        enemy.moving = false;
      }
    }
  }

  /* ══════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════ */
  function render(timestamp) {
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Tiles
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        drawTile(r, c);
      }
    }

    // Gems
    var keys = Object.keys(gems);
    for (var i = 0; i < keys.length; i++) {
      var parts = keys[i].split(',');
      drawGem(+parts[0], +parts[1]);
    }

    // Exit door(s)
    for (var rr = 0; rr < ROWS; rr++) {
      for (var cc = 0; cc < COLS; cc++) {
        if (map[rr][cc] === 4) drawExit(rr, cc);
      }
    }

    drawEnemy(timestamp);
    drawPlayer(timestamp);
    drawHUD();

    if (gameState !== 'playing') drawOverlay();
  }

  /* ── Tile ─────────────────────────────────────────────── */
  function drawTile(r, c) {
    var x = c * TILE, y = r * TILE;
    if (map[r][c] === 1) {
      ctx.fillStyle = C.wall;
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = C.wallEdgeHi;
      ctx.fillRect(x,          y,          TILE, 2);
      ctx.fillRect(x,          y,          2, TILE);
      ctx.fillStyle = C.wallEdgeSh;
      ctx.fillRect(x,          y + TILE-2, TILE, 2);
      ctx.fillRect(x + TILE-2, y,          2, TILE);
    } else {
      ctx.fillStyle = ((r + c) & 1) ? C.floor1 : C.floor0;
      ctx.fillRect(x, y, TILE, TILE);
    }
  }

  /* ── Gem ──────────────────────────────────────────────── */
  function drawGem(r, c) {
    var cx = c * TILE + TILE / 2;
    var cy = r * TILE + TILE / 2;
    var pulse  = Math.sin(gemPulse + r * 0.7 + c * 0.5) * 0.3 + 0.7;
    var radius = 5.5 * pulse;

    // Glow halo
    ctx.save();
    ctx.globalAlpha = 0.35 * pulse;
    ctx.fillStyle = C.gemGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Rotated square (diamond)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = C.gem;
    ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
    // Specular highlight
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillRect(-radius, -radius, radius * 0.7, radius * 0.7);
    ctx.restore();
  }

  /* ── Exit door ────────────────────────────────────────── */
  function drawExit(r, c) {
    var x = c * TILE, y = r * TILE;
    var open = (gemCount() === 0);
    var col  = open ? C.exitOpen : C.exitLocked;

    // Door frame
    ctx.fillStyle = col;
    ctx.fillRect(x + 5, y + 1, TILE - 10, TILE - 1);

    // Door inner fill
    ctx.fillStyle = open ? '#c8960a' : '#1e1e38';
    ctx.fillRect(x + 8, y + 4, TILE - 16, TILE - 7);

    if (open) {
      // Pulsing glow
      var p = Math.sin(Date.now() * 0.004) * 0.5 + 0.5;
      ctx.save();
      ctx.globalAlpha = 0.3 * p;
      ctx.fillStyle = C.exitGlow;
      ctx.fillRect(x, y, TILE, TILE);
      ctx.restore();

      // Up-arrow (exit symbol) drawn manually
      ctx.fillStyle = '#fff8dc';
      ctx.beginPath();
      ctx.moveTo(x + TILE/2, y + 7);
      ctx.lineTo(x + TILE/2 + 6, y + 16);
      ctx.lineTo(x + TILE/2 + 2, y + 16);
      ctx.lineTo(x + TILE/2 + 2, y + 25);
      ctx.lineTo(x + TILE/2 - 2, y + 25);
      ctx.lineTo(x + TILE/2 - 2, y + 16);
      ctx.lineTo(x + TILE/2 - 6, y + 16);
      ctx.closePath();
      ctx.fill();
    } else {
      // Lock body
      ctx.fillStyle = '#666688';
      ctx.fillRect(x + TILE/2 - 4, y + 13, 8, 9);
      // Lock shackle
      ctx.strokeStyle = '#666688';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(x + TILE/2, y + 13, 4, Math.PI, 0);
      ctx.stroke();
    }
  }

  /* ── Player ───────────────────────────────────────────── */
  function drawPlayer(timestamp) {
    var cx = player.px + TILE / 2;
    var cy = player.py + TILE / 2;
    var r  = TILE * 0.36;

    // Glow
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = C.playerGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Body circle
    ctx.fillStyle = C.player;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // White ring
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    // Direction dot (eye)
    var off = r * 0.44;
    var ex = cx, ey = cy;
    if      (player.dir === 0) ey = cy - off;
    else if (player.dir === 2) ey = cy + off;
    else if (player.dir === 1) ex = cx + off;
    else if (player.dir === 3) ex = cx - off;

    ctx.fillStyle = '#0a0a18';
    ctx.beginPath();
    ctx.arc(ex, ey, r * 0.28, 0, Math.PI * 2);
    ctx.fill();
  }

  /* ── Ghost enemy ──────────────────────────────────────── */
  function drawEnemy(timestamp) {
    var cx = enemy.px + TILE / 2;
    var cy = enemy.py + TILE / 2;
    var r  = TILE * 0.38;
    var t  = (timestamp || Date.now()) * 0.006;

    // Glow
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = C.enemyGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Ghost body path
    ctx.fillStyle = C.enemy;
    ctx.beginPath();
    // Dome top
    ctx.arc(cx, cy - r * 0.15, r, 0, Math.PI, true);
    ctx.lineTo(cx - r, cy + r * 0.55);

    // Wavy skirt (4 bumps)
    var segW = (r * 2) / 4;
    for (var i = 0; i < 4; i++) {
      var bx = cx - r + segW * i;
      var wave = Math.sin(t + i * 1.2) * 2.5;
      var midY = (i % 2 === 0) ? cy + r * 0.95 + wave : cy + r * 0.45 + wave;
      ctx.quadraticCurveTo(bx + segW / 2, midY, bx + segW, cy + r * 0.55);
    }
    ctx.closePath();
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx - r * 0.3, cy - r * 0.18, r * 0.22, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.3, cy - r * 0.18, r * 0.22, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0a0a18';
    ctx.beginPath();
    ctx.arc(cx - r * 0.3, cy - r * 0.13, r * 0.12, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.3, cy - r * 0.13, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }

  /* ── HUD ──────────────────────────────────────────────── */
  function drawHUD() {
    // Bar
    ctx.fillStyle = C.hudBg;
    ctx.fillRect(0, CANVAS_H - HUD_H, CANVAS_W, HUD_H);

    // Top separator line
    ctx.fillStyle = 'rgba(0,230,118,0.18)';
    ctx.fillRect(0, CANVAS_H - HUD_H, CANVAS_W, 1);

    ctx.save();
    ctx.textBaseline = 'middle';
    var midY = CANVAS_H - HUD_H / 2;

    // Score
    ctx.font = 'bold 12px Courier New, monospace';
    ctx.fillStyle = C.hudScore;
    ctx.textAlign = 'left';
    ctx.fillText('SCORE ' + score, 10, midY);

    // Gems remaining – draw mini diamond shapes instead of emoji
    var remaining = gemCount();
    drawHUDGem(ctx, 148, midY);
    ctx.fillStyle = C.hudScore;
    ctx.textAlign = 'left';
    ctx.font = 'bold 11px Courier New, monospace';
    ctx.fillText(remaining + '/' + totalGems, 162, midY);

    // Controls hint (centre)
    ctx.fillStyle = C.hudMuted;
    ctx.font = '10px Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('WASD / ARROWS', CANVAS_W / 2, midY);

    // Lives – draw small squares
    ctx.textAlign = 'right';
    var lx = CANVAS_W - 10;
    for (var i = 0; i < LIVES; i++) {
      ctx.fillStyle = (i < lives) ? C.hudLife : 'rgba(255,68,68,0.18)';
      ctx.fillRect(lx - i * 14, midY - 5, 10, 10);
    }

    ctx.restore();
  }

  function drawHUDGem(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = C.hudScore;
    ctx.fillRect(-4, -4, 8, 8);
    ctx.restore();
  }

  /* ── End-game overlay ─────────────────────────────────── */
  function drawOverlay() {
    var gameAreaH = CANVAS_H - HUD_H;
    ctx.fillStyle = C.overlayBg;
    ctx.fillRect(0, 0, CANVAS_W, gameAreaH);

    ctx.save();
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    var mx = CANVAS_W / 2;
    var my = gameAreaH / 2;

    if (gameState === 'won') {
      // Decorative pixel squares
      drawPixelConfetti(ctx, mx, my);

      ctx.font      = 'bold 30px Courier New, monospace';
      ctx.fillStyle = C.winText;
      ctx.shadowColor = C.winText;
      ctx.shadowBlur  = 20;
      ctx.fillText('YOU ESCAPED!', mx, my - 44);
      ctx.shadowBlur  = 0;

      ctx.font      = 'bold 16px Courier New, monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('SCORE: ' + score, mx, my);

      ctx.font      = '12px Courier New, monospace';
      ctx.fillStyle = '#8888aa';
      ctx.fillText('ENTER / SPACE to play again', mx, my + 40);

    } else {
      ctx.font      = 'bold 30px Courier New, monospace';
      ctx.fillStyle = C.loseText;
      ctx.shadowColor = C.loseText;
      ctx.shadowBlur  = 20;
      ctx.fillText('GAME OVER', mx, my - 44);
      ctx.shadowBlur  = 0;

      ctx.font      = 'bold 16px Courier New, monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('SCORE: ' + score, mx, my);

      ctx.font      = '12px Courier New, monospace';
      ctx.fillStyle = '#8888aa';
      ctx.fillText('ENTER / SPACE to try again', mx, my + 40);
    }
    ctx.restore();
  }

  function drawPixelConfetti(ctx, cx, cy) {
    var colors = ['#00e676','#ffd700','#7c4dff','#ff6d00','#ff4444'];
    var t = Date.now() * 0.001;
    ctx.save();
    for (var i = 0; i < 18; i++) {
      var angle  = (i / 18) * Math.PI * 2 + t * 0.7;
      var radius = 70 + Math.sin(t * 2 + i) * 18;
      var px     = cx + Math.cos(angle) * radius;
      var py     = cy + Math.sin(angle) * radius - 30;
      ctx.fillStyle = colors[i % colors.length];
      ctx.globalAlpha = 0.7;
      ctx.fillRect(px - 3, py - 3, 6, 6);
    }
    ctx.restore();
  }

  /* ══════════════════════════════════════════════════════════
     MOBILE CONTROLS  (D-pad + swipe)
  ══════════════════════════════════════════════════════════ */
  function setupMobileControls() {
    // D-pad buttons
    var controls = document.getElementById('game-controls');
    if (controls) {
      controls.querySelectorAll('[data-dir]').forEach(function (btn) {
        function press(e) {
          e.preventDefault();
          if (gameState === 'playing') {
            pushInput(btn.getAttribute('data-dir'));
          } else {
            resetGame();
          }
        }
        btn.addEventListener('touchstart', press, { passive: false });
        btn.addEventListener('mousedown',  press);
      });
    }

    // Restart button
    var restartBtn = document.getElementById('game-restart');
    if (restartBtn) {
      restartBtn.addEventListener('click',      resetGame);
      restartBtn.addEventListener('touchstart', function (e) {
        e.preventDefault(); resetGame();
      }, { passive: false });
    }

    // Swipe on canvas
    var touchStartX = 0, touchStartY = 0;
    if (canvas) {
      canvas.addEventListener('touchstart', function (e) {
        var t = e.touches[0];
        touchStartX = t.clientX;
        touchStartY = t.clientY;
      }, { passive: true });

      canvas.addEventListener('touchend', function (e) {
        var t = e.changedTouches[0];
        var dx = t.clientX - touchStartX;
        var dy = t.clientY - touchStartY;
        var abs = Math.max(Math.abs(dx), Math.abs(dy));
        if (abs < 12) return; // too small

        if (gameState !== 'playing') { resetGame(); return; }

        if (Math.abs(dx) > Math.abs(dy)) {
          pushInput(dx > 0 ? 'right' : 'left');
        } else {
          pushInput(dy > 0 ? 'down' : 'up');
        }
      }, { passive: true });
    }
  }

  function showRestartBtn() {
    var btn = document.getElementById('game-restart');
    if (btn) btn.style.display = 'block';
  }

  /* ══════════════════════════════════════════════════════════
     HELPERS
  ══════════════════════════════════════════════════════════ */
  function isWalkable(r, c) {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return false;
    return map[r][c] !== 1;
  }

  function gemCount() {
    return Object.keys(gems).length;
  }

  /** Move value toward target by delta (pixel-based lerp guard) */
  function lerp(current, target, delta) {
    if (Math.abs(current - target) <= delta) return target;
    return current + (target > current ? delta : -delta);
  }

  /** Fisher-Yates shuffle (in-place) */
  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
  }

  /* ── Boot ─────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
