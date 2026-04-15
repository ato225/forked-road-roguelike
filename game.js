const el = {
  hpStat: document.getElementById("hp-stat"),
  atkStat: document.getElementById("atk-stat"),
  defStat: document.getElementById("def-stat"),
  goldStat: document.getElementById("gold-stat"),
  potionCount: document.getElementById("potion-count"),
  bombCount: document.getElementById("bomb-count"),
  tonicCount: document.getElementById("tonic-count"),
  runIndicator: document.getElementById("run-indicator"),
  roomTitle: document.getElementById("room-title"),
  roomTag: document.getElementById("room-tag"),
  roomDescription: document.getElementById("room-description"),
  enemyBox: document.getElementById("enemy-box"),
  enemyName: document.getElementById("enemy-name"),
  enemyHp: document.getElementById("enemy-hp"),
  enemyAtk: document.getElementById("enemy-atk"),
  enemyDef: document.getElementById("enemy-def"),
  actionArea: document.getElementById("action-area"),
  pathButtons: document.getElementById("path-buttons"),
  inventoryList: document.getElementById("inventory-list"),
  inventorySummary: document.getElementById("inventory-summary"),
  gearList: document.getElementById("gear-list"),
  logList: document.getElementById("log-list"),
  logCount: document.getElementById("log-count"),
  restartBtn: document.getElementById("restart-btn"),
};

const STORAGE_KEY = "forked-road-roguelike-save-v1";
const MIN_ELITE_FLOOR = 5;

const PATHS = [
  {
    id: "safe",
    label: "안전한 길",
    className: "safe",
    summary: "마을, 휴식, 상점 확률이 높고 전투는 비교적 약합니다.",
    weights: [
      ["village", 26],
      ["camp", 18],
      ["shrine", 14],
      ["treasure", 14],
      ["merchant", 10],
      ["dungeon", 12],
      ["trap", 3],
      ["elite", 1],
    ],
  },
  {
    id: "normal",
    label: "평범한 길",
    className: "normal",
    summary: "전투와 보상, 이벤트가 고르게 섞여 있습니다.",
    weights: [
      ["village", 13],
      ["camp", 10],
      ["shrine", 10],
      ["treasure", 18],
      ["merchant", 8],
      ["dungeon", 29],
      ["trap", 6],
      ["elite", 3],
    ],
  },
  {
    id: "danger",
    label: "위험한 길",
    className: "danger",
    summary: "강한 몬스터와 함정이 많지만 골드와 장비 보상이 큽니다.",
    weights: [
      ["village", 7],
      ["camp", 6],
      ["shrine", 8],
      ["treasure", 18],
      ["merchant", 5],
      ["dungeon", 35],
      ["trap", 8],
      ["elite", 8],
    ],
  },
];

const ENEMY_POOLS = {
  safe: [
    { name: "슬라임", hp: 22, atk: 7, def: 2, gold: [9, 15] },
    { name: "들개", hp: 25, atk: 8, def: 2, gold: [10, 16] },
    { name: "도적 수습생", hp: 27, atk: 9, def: 3, gold: [12, 18] },
  ],
  normal: [
    { name: "고블린 정찰병", hp: 32, atk: 10, def: 4, gold: [14, 24] },
    { name: "해골 병사", hp: 36, atk: 11, def: 5, gold: [16, 26] },
    { name: "늑대 무리 우두머리", hp: 38, atk: 12, def: 4, gold: [17, 27] },
  ],
  danger: [
    { name: "오우거", hp: 50, atk: 15, def: 7, gold: [28, 40] },
    { name: "암흑 기사", hp: 54, atk: 16, def: 8, gold: [30, 44] },
    { name: "독 전갈", hp: 46, atk: 17, def: 6, gold: [29, 43] },
  ],
  elite: [
    { name: "미궁의 감시자", hp: 70, atk: 18, def: 9, gold: [45, 62] },
    { name: "저주받은 챔피언", hp: 76, atk: 19, def: 10, gold: [48, 66] },
    { name: "심연의 포식자", hp: 82, atk: 21, def: 9, gold: [52, 72] },
  ],
};

const GEAR_REWARDS = [
  { name: "청동 검", text: "공격력 +2", effect: { atk: 2 } },
  { name: "철제 흉갑", text: "최대 체력 +8", effect: { maxHp: 8 } },
  { name: "수호 방패", text: "방어력 +2", effect: { def: 2 } },
  { name: "사냥꾼 장갑", text: "공격력 +1, 최대 체력 +4", effect: { atk: 1, maxHp: 4 } },
  { name: "기사의 문장", text: "공격력 +1, 방어력 +1", effect: { atk: 1, def: 1 } },
  { name: "별빛 부적", text: "최대 체력 +6, 방어력 +1", effect: { maxHp: 6, def: 1 } },
];

const SHOP_ITEMS = [
  { id: "potion", kind: "consumable", name: "치유 물약", desc: "체력을 24 회복합니다.", cost: 18 },
  { id: "bomb", kind: "consumable", name: "화염 폭탄", desc: "전투 중 적에게 20 고정 피해를 줍니다.", cost: 24 },
  { id: "tonic", kind: "consumable", name: "방패 약병", desc: "현재 전투가 끝날 때까지 방어력 +3.", cost: 22 },
  { id: "gear_atk", kind: "gear", name: "상인의 검집", desc: "공격력이 영구히 2 증가합니다.", cost: 42, gearText: "공격력 +2", effect: { atk: 2 } },
  { id: "gear_def", kind: "gear", name: "강철 버클러", desc: "방어력이 영구히 2 증가합니다.", cost: 40, gearText: "방어력 +2", effect: { def: 2 } },
  { id: "gear_vit", kind: "gear", name: "생명의 브로치", desc: "최대 체력이 영구히 10 증가합니다.", cost: 44, gearText: "최대 체력 +10", effect: { maxHp: 10 } },
];

const state = createInitialState();

function createInitialState() {
  return {
    turn: 1,
    mode: "explore",
    currentPathId: null,
    room: {
      type: "start",
      title: "여정의 시작",
      text: "세 갈래 길이 눈앞에 펼쳐졌습니다. 길의 분위기를 읽고 다음 방을 정하세요.",
      tag: "대기",
      tagClass: "neutral",
    },
    player: {
      hp: 48,
      maxHp: 48,
      atk: 10,
      def: 4,
      gold: 30,
      inventory: { potion: 2, bomb: 1, tonic: 1 },
      gear: [],
      tempDef: 0,
    },
    enemy: null,
    shopStock: [],
    logs: [],
    pendingReward: null,
    gameOver: false,
  };
}

function saveGame() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadGame() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    addLog("새 모험", "새로운 탐험이 시작되었습니다.");
    return;
  }

  try {
    const loaded = JSON.parse(raw);
    Object.assign(state, createInitialState(), loaded);
    state.player = {
      ...createInitialState().player,
      ...loaded.player,
      inventory: { ...createInitialState().player.inventory, ...(loaded.player?.inventory || {}) },
      gear: Array.isArray(loaded.player?.gear) ? loaded.player.gear : [],
    };
    state.logs = Array.isArray(loaded.logs) ? loaded.logs.slice(0, 30) : [];
  } catch (error) {
    Object.assign(state, createInitialState());
    addLog("저장 오류", "저장 데이터가 손상되어 새 게임으로 시작합니다.");
  }
}

function addLog(title, text) {
  state.logs.unshift({ title, text });
  state.logs = state.logs.slice(0, 30);
}

function clampHp() {
  state.player.hp = Math.max(0, Math.min(state.player.hp, state.player.maxHp));
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickWeighted(entries) {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = Math.random() * total;
  for (const [value, weight] of entries) {
    roll -= weight;
    if (roll <= 0) {
      return value;
    }
  }
  return entries[entries.length - 1][0];
}

function pickOne(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function getItemMeta(itemId) {
  return SHOP_ITEMS.find((item) => item.id === itemId);
}

function setRoom(title, text, tag, tagClass) {
  state.room = { title, text, tag, tagClass };
}

function buildShopStock() {
  const consumables = SHOP_ITEMS
    .filter((item) => item.kind === "consumable")
    .map((item) => ({
      ...item,
      cost: item.cost + randomInt(-2, 4),
    }));

  const selectedGear = pickOne(SHOP_ITEMS.filter((item) => item.kind === "gear"));
  const gearItem = {
    ...selectedGear,
    cost: selectedGear.cost + randomInt(-4, 6),
  };
  return [...consumables, gearItem];
}

function getAdjustedWeights(path) {
  const weights = path.weights.map(([type, weight]) => [type, weight]);

  if (state.player.gold < 20) {
    for (const entry of weights) {
      if (entry[0] === "village") {
        entry[1] = Math.max(1, entry[1] - 8);
      } else if (entry[0] === "merchant") {
        entry[1] = Math.max(1, entry[1] - 3);
      } else if (entry[0] === "camp") {
        entry[1] += 4;
      } else if (entry[0] === "dungeon") {
        entry[1] += 4;
      } else if (entry[0] === "treasure") {
        entry[1] += 3;
      }
    }
  } else if (state.player.gold < 35) {
    for (const entry of weights) {
      if (entry[0] === "village") {
        entry[1] = Math.max(1, entry[1] - 4);
      } else if (entry[0] === "merchant") {
        entry[1] = Math.max(1, entry[1] - 1);
      } else if (entry[0] === "dungeon") {
        entry[1] += 2;
      } else if (entry[0] === "treasure") {
        entry[1] += 2;
      }
    }
  }

  return weights;
}

function applyPurchasedGear(item) {
  state.player.gear.push(`${item.name} (${item.gearText})`);
  state.player.maxHp += item.effect.maxHp || 0;
  state.player.atk += item.effect.atk || 0;
  state.player.def += item.effect.def || 0;
  state.player.hp += item.effect.maxHp || 0;
  clampHp();
}

function createEnemy(tier) {
  const base = pickOne(ENEMY_POOLS[tier]);
  const scaling = Math.floor((state.turn - 1) / 3);
  const hpBoost = scaling * (tier === "elite" ? 7 : 4);
  const statBoost = scaling * (tier === "elite" ? 2 : 1);
  return {
    name: base.name,
    hp: base.hp + hpBoost,
    maxHp: base.hp + hpBoost,
    atk: base.atk + statBoost,
    def: base.def + statBoost,
    gold: randomInt(base.gold[0], base.gold[1]) + scaling * 3,
    elite: tier === "elite",
    fleeAttempts: 0,
    fleeBaseChance: 0,
  };
}

function calculateInitialFleeChance(enemy) {
  if (!enemy) {
    return 0;
  }

  const playerPower = state.player.atk + state.player.def + state.player.tempDef + Math.floor(state.player.maxHp / 12);
  const enemyPower = enemy.atk + enemy.def + Math.floor(enemy.maxHp / 10);
  const diff = playerPower - enemyPower;

  let chance = 0.5 + diff * 0.018;
  if (enemy.elite) {
    chance -= 0.16;
  }

  return Math.max(0.12, Math.min(0.78, chance));
}

function applyGearReward(extraBonus = false) {
  const reward = pickOne(GEAR_REWARDS);
  state.player.gear.push(`${reward.name} (${reward.text})`);
  state.player.maxHp += reward.effect.maxHp || 0;
  state.player.atk += reward.effect.atk || 0;
  state.player.def += reward.effect.def || 0;
  state.player.hp += reward.effect.maxHp || 0;

  if (extraBonus) {
    const bonusGold = randomInt(18, 32);
    state.player.gold += bonusGold;
    addLog("정예 보상", `${reward.name}을 얻고 ${bonusGold}골드를 추가로 챙겼습니다.`);
    return `${reward.name}을 얻었습니다. ${reward.text}. 추가로 ${bonusGold}골드를 획득했습니다.`;
  }

  addLog("장비 획득", `${reward.name}을 얻었습니다. ${reward.text}.`);
  return `${reward.name}을 얻었습니다. ${reward.text}.`;
}

function enterExplorationState() {
  state.mode = "explore";
  state.enemy = null;
  state.player.tempDef = 0;
  state.shopStock = [];
  state.pendingReward = null;
}

function choosePath(pathId) {
  if (state.mode !== "explore" || state.gameOver) {
    return;
  }

  const path = PATHS.find((entry) => entry.id === pathId);
  let roomType = pickWeighted(getAdjustedWeights(path));
  state.currentPathId = pathId;
  state.turn += 1;

  const currentFloor = Math.max(1, state.turn - 1);
  if (roomType === "elite" && currentFloor < MIN_ELITE_FLOOR) {
    roomType = pathId === "danger" ? "dungeon" : pickWeighted([
      ["dungeon", 3],
      ["treasure", 2],
      ["shrine", 2],
      ["camp", 1],
    ]);
  }

  if (roomType === "dungeon") {
    const tier = pathId === "safe" ? "safe" : pathId === "normal" ? "normal" : "danger";
    startCombat(tier, path.label, roomType);
    return;
  }

  if (roomType === "elite") {
    startCombat("elite", path.label, roomType);
    return;
  }

  if (roomType === "village") {
    state.mode = "village";
    state.shopStock = buildShopStock();
    const heal = Math.min(state.player.maxHp - state.player.hp, randomInt(8, 14));
    state.player.hp += heal;
    setRoom("작은 마을", `휴식과 거래가 가능한 마을에 도착했습니다. 여관 밥을 먹고 체력 ${heal}을 회복했습니다.`, "마을", "safe");
    addLog("마을 도착", `체력 ${heal} 회복 후 상점을 둘러볼 수 있습니다.`);
    render();
    return;
  }

  if (roomType === "merchant") {
    state.mode = "village";
    state.shopStock = buildShopStock().map((item) => ({ ...item, cost: Math.max(10, item.cost - 3) }));
    setRoom("유랑 상인", "길목에서 만난 상인이 잠시 거래를 제안합니다. 일반 상점보다 조금 저렴합니다.", "상인", "normal");
    addLog("상인 조우", "유랑 상인이 할인된 가격으로 물건을 판매합니다.");
    render();
    return;
  }

  if (roomType === "camp") {
    const heal = randomInt(10, 18);
    state.player.hp += heal;
    clampHp();
    setRoom("모닥불 쉼터", `잠시 숨을 고르며 체력 ${heal}을 회복했습니다. 다음 길을 바로 선택할 수 있습니다.`, "휴식", "safe");
    addLog("휴식", `모닥불에서 체력 ${heal} 회복.`);
    render();
    return;
  }

  if (roomType === "shrine") {
    const result = pickOne([
      () => {
        state.player.atk += 1;
        return "빛나는 성소에서 축복을 받아 공격력이 1 올랐습니다.";
      },
      () => {
        state.player.def += 1;
        return "고요한 성소의 보호를 받아 방어력이 1 올랐습니다.";
      },
      () => {
        state.player.maxHp += 6;
        state.player.hp += 6;
        return "성소의 기운으로 최대 체력이 6 올랐습니다.";
      },
    ])();
    setRoom("고대 성소", result, "성소", "safe");
    addLog("성소", result);
    render();
    return;
  }

  if (roomType === "treasure") {
    const text = applyGearReward(false);
    setRoom("보물 상자", `잠긴 상자를 열어 강화 장비를 얻었습니다. ${text}`, "보물", "normal");
    render();
    return;
  }

  if (roomType === "trap") {
    const type = pickOne(["damage", "gold", "mixed"]);
    let text = "";
    if (type === "damage") {
      const damage = randomInt(8, 15);
      state.player.hp -= damage;
      clampHp();
      text = `숨겨진 화살 함정에 걸려 체력 ${damage}를 잃었습니다.`;
    } else if (type === "gold") {
      const gold = Math.min(state.player.gold, randomInt(10, 18));
      state.player.gold -= gold;
      text = `도적의 매복을 만나 ${gold}골드를 빼앗겼습니다.`;
    } else {
      const damage = randomInt(5, 9);
      const gold = Math.min(state.player.gold, randomInt(6, 12));
      state.player.hp -= damage;
      state.player.gold -= gold;
      clampHp();
      text = `낙석과 약탈을 동시에 당해 체력 ${damage}, 골드 ${gold}를 잃었습니다.`;
    }
    setRoom("함정 지대", text, "함정", "danger");
    addLog("함정", text);
    if (state.player.hp <= 0) {
      handleGameOver("함정으로 쓰러졌습니다.");
    }
    render();
  }
}

function startCombat(tier, pathLabel, roomType) {
  state.mode = "combat";
  state.enemy = createEnemy(tier);
  state.enemy.fleeBaseChance = calculateInitialFleeChance(state.enemy);
  const intro =
    roomType === "elite"
      ? `${pathLabel} 끝자락에서 강력한 적이 길을 막습니다.`
      : `${pathLabel}에서 적이 튀어나왔습니다. 전투를 준비하세요.`;
  setRoom(state.enemy.elite ? "정예 전투" : "전투 발생", intro, state.enemy.elite ? "정예" : "전투", state.enemy.elite ? "danger" : "normal");
  addLog("전투 시작", `${state.enemy.name}와 조우했습니다.`);
  render();
}

function calculateDamage(attackerAtk, defenderDef) {
  return Math.max(1, attackerAtk - defenderDef + randomInt(-2, 3));
}

function enemyTurn(extraDefense = 0) {
  if (!state.enemy || state.enemy.hp <= 0 || state.gameOver) {
    return;
  }

  const totalDefense = state.player.def + state.player.tempDef + extraDefense;
  const damage = calculateDamage(state.enemy.atk, totalDefense);
  state.player.hp -= damage;
  clampHp();
  addLog("적의 공격", `${state.enemy.name}에게 ${damage} 피해를 받았습니다.`);
  if (state.player.hp <= 0) {
    handleGameOver(`${state.enemy.name}에게 패배했습니다.`);
  }
}

function attackEnemy() {
  if (state.mode !== "combat" || !state.enemy || state.gameOver) {
    return;
  }

  const damage = calculateDamage(state.player.atk, state.enemy.def);
  state.enemy.hp = Math.max(0, state.enemy.hp - damage);
  addLog("플레이어 공격", `${state.enemy.name}에게 ${damage} 피해를 입혔습니다.`);
  if (state.enemy.hp <= 0) {
    winCombat();
    return;
  }
  enemyTurn(0);
  render();
}

function defendTurn() {
  if (state.mode !== "combat" || !state.enemy || state.gameOver) {
    return;
  }

  addLog("방어", "방패를 세워 이번 턴 방어를 강화했습니다.");
  enemyTurn(5);
  render();
}

function getFleeChance(enemy) {
  if (!enemy) {
    return 0;
  }

  const baseChance = enemy.fleeBaseChance || calculateInitialFleeChance(enemy);
  const retryBonus = enemy.fleeAttempts * 0.12;
  return Math.max(0.12, Math.min(0.9, baseChance + retryBonus));
}

function fleeCombat() {
  if (state.mode !== "combat" || !state.enemy || state.gameOver) {
    return;
  }

  const successRate = getFleeChance(state.enemy);
  if (Math.random() < successRate) {
    setRoom("도주 성공", "적의 시야를 피해 빠져나왔습니다. 다음 갈림길을 선택할 수 있습니다.", "도주", "neutral");
    addLog("도주", `${state.enemy.name}에게서 탈출했습니다.`);
    enterExplorationState();
    render();
    return;
  }

  addLog("도주 실패", "도망치려 했지만 붙잡혔습니다.");
  state.enemy.fleeAttempts += 1;
  enemyTurn(0);
  render();
}

function useItem(itemId, inCombat = false) {
  const count = state.player.inventory[itemId] || 0;
  if (count <= 0 || state.gameOver) {
    return;
  }

  if ((itemId === "bomb" || itemId === "tonic") && !inCombat) {
    return;
  }

  const meta = getItemMeta(itemId);
  state.player.inventory[itemId] -= 1;

  if (itemId === "potion") {
    const heal = 24;
    state.player.hp += heal;
    clampHp();
    addLog("아이템 사용", `${meta.name} 사용. 체력 ${heal} 회복.`);
    if (inCombat) {
      enemyTurn(0);
    }
  } else if (itemId === "bomb") {
    if (!state.enemy || !inCombat) {
      state.player.inventory[itemId] += 1;
      return;
    }
    const damage = 20;
    state.enemy.hp = Math.max(0, state.enemy.hp - damage);
    addLog("아이템 사용", `${meta.name} 사용. ${state.enemy.name}에게 ${damage} 고정 피해.`);
    if (state.enemy.hp <= 0) {
      winCombat();
      return;
    }
    enemyTurn(0);
  } else if (itemId === "tonic") {
    state.player.tempDef += 3;
    addLog("아이템 사용", `${meta.name} 사용. 이번 전투 동안 방어력 +3.`);
    if (inCombat) {
      enemyTurn(0);
    }
  }

  render();
}

function buyItem(itemId) {
  if (state.mode !== "village" || state.gameOver) {
    return;
  }

  const item = state.shopStock.find((entry) => entry.id === itemId);
  if (!item || state.player.gold < item.cost) {
    return;
  }

  state.player.gold -= item.cost;
  if (item.kind === "gear") {
    applyPurchasedGear(item);
    state.shopStock = state.shopStock.filter((entry) => entry.id !== item.id);
    addLog("구매", `${item.name} 구매. ${item.cost}골드 사용, ${item.gearText} 적용.`);
  } else {
    state.player.inventory[item.id] = (state.player.inventory[item.id] || 0) + 1;
    addLog("구매", `${item.name} 구매. ${item.cost}골드 사용.`);
  }
  render();
}

function leaveVillage() {
  if (state.mode !== "village" || state.gameOver) {
    return;
  }
  setRoom("마을을 떠남", "준비를 마치고 다시 갈림길로 나아갑니다.", "출발", "neutral");
  addLog("출발", "다시 탐험을 이어갑니다.");
  enterExplorationState();
  render();
}

function winCombat() {
  const reward = state.enemy.gold;
  const enemyName = state.enemy.name;
  state.player.gold += reward;
  addLog("승리", `${enemyName} 격파. ${reward}골드 획득.`);
  let text = `${enemyName}을 물리치고 ${reward}골드를 획득했습니다.`;

  if (state.enemy.elite) {
    text += ` ${applyGearReward(true)}`;
  } else if (Math.random() < 0.34) {
    const bonusItem = pickOne(["potion", "bomb", "tonic"]);
    state.player.inventory[bonusItem] = (state.player.inventory[bonusItem] || 0) + 1;
    text += ` 전리품으로 ${getItemMeta(bonusItem).name}을 얻었습니다.`;
    addLog("전리품", `${getItemMeta(bonusItem).name} 획득.`);
  }

  setRoom("전투 승리", text, "승리", "safe");
  enterExplorationState();
  render();
}

function handleGameOver(reason) {
  state.gameOver = true;
  state.mode = "gameover";
  setRoom("모험 종료", `${reason} 새 게임 버튼으로 다시 시작할 수 있습니다.`, "패배", "danger");
  addLog("게임 오버", reason);
  render();
}

function restartGame() {
  Object.assign(state, createInitialState());
  addLog("새 모험", "새로운 탐험이 시작되었습니다.");
  saveGame();
  render();
}

function renderStats() {
  clampHp();
  el.hpStat.textContent = `${state.player.hp} / ${state.player.maxHp}`;
  el.atkStat.textContent = state.player.atk;
  el.defStat.textContent = state.player.def + state.player.tempDef;
  el.goldStat.textContent = `${state.player.gold}G`;
  el.potionCount.textContent = state.player.inventory.potion || 0;
  el.bombCount.textContent = state.player.inventory.bomb || 0;
  el.tonicCount.textContent = state.player.inventory.tonic || 0;
  el.runIndicator.textContent = `탐험 ${Math.max(1, state.turn - 1)}층`;
}

function renderRoom() {
  el.roomTitle.textContent = state.room.title;
  el.roomDescription.textContent = state.room.text;
  el.roomTag.textContent = state.room.tag;
  el.roomTag.className = `pill ${state.room.tagClass}`;

  if (state.enemy && state.mode === "combat") {
    el.enemyBox.classList.remove("hidden");
    el.enemyName.textContent = state.enemy.name;
    el.enemyHp.textContent = `${state.enemy.hp} / ${state.enemy.maxHp}`;
    el.enemyAtk.textContent = `공격 ${state.enemy.atk}`;
    el.enemyDef.textContent = `방어 ${state.enemy.def}`;
  } else {
    el.enemyBox.classList.add("hidden");
  }
}

function makeButton(label, className, onClick, disabled = false) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  button.disabled = disabled;
  button.addEventListener("click", onClick);
  return button;
}

function renderActions() {
  el.actionArea.innerHTML = "";

  if (state.mode === "combat" && state.enemy) {
    const fleeChance = Math.round(getFleeChance(state.enemy) * 100);
    el.actionArea.append(
      makeButton("공격", "action-btn", attackEnemy),
      makeButton("방어", "action-btn alt", defendTurn),
      makeButton("치유 물약 사용", "action-btn", () => useItem("potion", true), (state.player.inventory.potion || 0) <= 0),
      makeButton("화염 폭탄 사용", "action-btn", () => useItem("bomb", true), (state.player.inventory.bomb || 0) <= 0),
      makeButton("방패 약병 사용", "action-btn", () => useItem("tonic", true), (state.player.inventory.tonic || 0) <= 0),
      makeButton(`도주 시도 (${fleeChance}%)`, "action-btn warn", fleeCombat),
    );
    return;
  }

  if (state.mode === "village") {
    state.shopStock.forEach((item) => {
      const card = document.createElement("div");
      card.className = "shop-card";
      const header = document.createElement("header");
      const title = document.createElement("strong");
      title.textContent = item.name;
      const cost = document.createElement("span");
      cost.textContent = `${item.cost}G`;
      header.append(title, cost);

      const desc = document.createElement("p");
      desc.textContent = item.desc;

      const button = makeButton(`${item.name} 구매`, "shop-btn", () => buyItem(item.id), state.player.gold < item.cost);
      card.append(header, desc, button);
      el.actionArea.append(card);
    });
    el.actionArea.append(makeButton("마을 떠나기", "action-btn", leaveVillage));
    return;
  }

  if (state.mode === "gameover") {
    el.actionArea.append(makeButton("새 게임 시작", "action-btn warn", restartGame));
    return;
  }

  el.actionArea.append(makeButton("치유 물약 사용", "action-btn alt", () => useItem("potion", false), (state.player.inventory.potion || 0) <= 0));
}

function renderPaths() {
  el.pathButtons.innerHTML = "";
  const disabled = state.mode !== "explore" || state.gameOver;
  PATHS.forEach((path) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `path-btn ${path.className}`;
    button.disabled = disabled;
    button.addEventListener("click", () => choosePath(path.id));

    const title = document.createElement("strong");
    title.textContent = path.label;
    const detail = document.createElement("small");
    detail.textContent = path.summary;
    button.append(title, detail);
    el.pathButtons.append(button);
  });
}

function renderInventory() {
  el.inventoryList.innerHTML = "";
  const items = Object.entries(state.player.inventory).filter(([, count]) => count > 0);
  el.inventorySummary.textContent = items.length ? `${items.length}종 보유` : "비어 있음";

  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "room-description";
    empty.textContent = "현재 사용할 수 있는 소비 아이템이 없습니다.";
    el.inventoryList.append(empty);
  } else {
    items.forEach(([itemId, count]) => {
      const meta = getItemMeta(itemId);
      const card = document.createElement("div");
      card.className = "inventory-item";
      const header = document.createElement("header");
      const title = document.createElement("strong");
      title.textContent = `${meta.name} x${count}`;
      const modeText = document.createElement("span");
      modeText.textContent = itemId === "bomb" ? "전투 전용" : "사용 가능";
      header.append(title, modeText);

      const desc = document.createElement("p");
      desc.textContent = meta.desc;

      const allowed = state.mode === "combat" || itemId === "potion";
      const button = makeButton(
        state.mode === "combat" ? "지금 사용" : "사용",
        "inventory-btn",
        () => useItem(itemId, state.mode === "combat"),
        !allowed,
      );

      card.append(header, desc, button);
      el.inventoryList.append(card);
    });
  }

  el.gearList.innerHTML = "";
  if (state.player.gear.length === 0) {
    const item = document.createElement("li");
    item.textContent = "아직 획득한 장비 강화가 없습니다.";
    el.gearList.append(item);
  } else {
    state.player.gear.forEach((gear) => {
      const item = document.createElement("li");
      item.textContent = gear;
      el.gearList.append(item);
    });
  }
}

function renderLogs() {
  el.logList.innerHTML = "";
  el.logCount.textContent = `${state.logs.length}개`;
  state.logs.forEach((entry) => {
    const card = document.createElement("article");
    card.className = "log-entry";
    const title = document.createElement("strong");
    title.textContent = entry.title;
    const body = document.createElement("p");
    body.textContent = entry.text;
    card.append(title, body);
    el.logList.append(card);
  });
}

function render() {
  renderStats();
  renderRoom();
  renderActions();
  renderPaths();
  renderInventory();
  renderLogs();
  saveGame();
}

el.restartBtn.addEventListener("click", restartGame);

loadGame();
render();
