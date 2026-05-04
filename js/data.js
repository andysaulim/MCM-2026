// ============================================================
// MCM 2026 — Training data
// All routes on W&OD trail from Wiehle Avenue (trail mile 17)
// Going west: rural, fewer crossings (preferred for longer runs)
// Going east toward Vienna (trail mile 11): more populated
// ============================================================

const RACE = {
  name: 'Marine Corps Marathon',
  date: '2026-10-25',
  startTime: '7:55 AM',
  edition: '51st',
  course: 'Pentagon → GW Parkway → Key Bridge → Georgetown → Lincoln Memorial → Tidal Basin → Capitol → Pentagon → Iwo Jima',
};

const RUNNER = {
  name: 'Andy',
  age: 35,
  height: '5\'8"',
  startWeight: 190,
  goalWeight: 173,
  marathonGoal: '4:08',
  marathonPace: '9:28/mi',
  halfPR: '2:05',
  priorMCMs: 2,
  lastMCM: '4:30',
};

const TUNE_UP = {
  name: 'DC Half Marathon',
  date: '2026-09-20',
  week: 20,
  url: 'https://runsignup.com/Race/DC/Washington/DCHalf',
  strategy: 'Run as workout, not race. First 8 mi at MP (9:28). Last 5 mi: if feeling strong, drop to 9:00–9:15. If not, hold MP. Goal: 1:58–2:02.',
};

// Pace targets by phase (min:sec per mile)
const PACES = {
  phase0: { easy: '11:30', long: '11:15', tempo: null, mp: null, intervals: null },
  phase1: { easy: '11:00', long: '10:45', tempo: '9:35', mp: '9:28', intervals: null },
  phase2: { easy: '10:30', long: '10:15', tempo: '9:20', mp: '9:28', intervals: '8:45' },
  phase3: { easy: '10:15', long: '10:00', tempo: '9:00', mp: '9:28', intervals: '8:30' },
  phase4: { easy: '10:00', long: '10:00', tempo: '9:00', mp: '9:28', intervals: '9:00' },
};

// W&OD routes from Wiehle (trail mile 17). Distances are out-and-back from Wiehle.
const ROUTES = {
  3:  'W&OD: Wiehle → Reston Town Ctr area → back · turnaround at trail mile 18.5',
  4:  'W&OD: Wiehle → mile 19 → back',
  5:  'W&OD: Wiehle → mile 19.5 → back',
  6:  'W&OD: Wiehle → Herndon (mile 20) → back',
  7:  'W&OD: Wiehle → mile 20.5 → back',
  8:  'W&OD: Wiehle → Trailside Park (mile 21) → back',
  9:  'W&OD: Wiehle → mile 21.5 → back',
  10: 'W&OD: Wiehle → Sterling (mile 22) → back',
  11: 'W&OD: Wiehle → mile 22.5 → back',
  12: 'W&OD: Wiehle → mile 23 → back',
  13: 'W&OD: Wiehle → mile 23.5 → back',
  14: 'W&OD: Wiehle → mile 24 → back',
  15: 'W&OD: Wiehle → mile 24.5 → back',
  16: 'W&OD: Wiehle → mile 25 → back',
  17: 'W&OD: Wiehle → mile 25.5 → back',
  18: 'W&OD: Wiehle → mile 26 → back',
  20: 'W&OD: Wiehle → mile 27 → back',
};
function route(mi) {
  if (mi === 0) return '—';
  if (mi <= 3) return ROUTES[3];
  return ROUTES[Math.round(mi)] || `W&OD: Wiehle out-and-back · ${mi} mi`;
}

// Workout factories — produces structured workouts with warmup/work/recovery/cooldown
function easyRun(miles, pace) {
  return {
    structure: [
      { label: 'Easy', detail: `${miles} mi @ ${pace}/mi`, miles },
    ],
    total: miles,
  };
}
function easyWithStrides(miles, pace, strideCount) {
  return {
    structure: [
      { label: 'Easy', detail: `${miles - 0.2} mi @ ${pace}/mi`, miles: miles - 0.2 },
      { label: 'Strides', detail: `${strideCount} × 20 sec @ 90% effort, walk 60 sec between`, miles: 0.2 },
    ],
    total: miles,
  };
}
function tempo(wuMi, tempoMi, cdMi, easyPace, tempoPace) {
  const total = wuMi + tempoMi + cdMi;
  return {
    structure: [
      { label: 'Warmup', detail: `${wuMi} mi @ ${easyPace}/mi`, miles: wuMi },
      { label: 'Tempo', detail: `${tempoMi} mi @ ${tempoPace}/mi`, miles: tempoMi },
      { label: 'Cooldown', detail: `${cdMi} mi @ ${easyPace}/mi`, miles: cdMi },
    ],
    total,
  };
}
function intervals800(wuMi, count, easyPace, repPace, cdMi) {
  const workMi = count * 0.5;
  const recMi = (count - 1) * 0.25;
  const total = wuMi + workMi + recMi + cdMi;
  return {
    structure: [
      { label: 'Warmup', detail: `${wuMi} mi @ ${easyPace}/mi`, miles: wuMi },
      { label: 'Reps', detail: `${count} × 800m @ ${repPace}/mi pace (${(0.5 * 60 / paceToSec(repPace)).toFixed(2)} min each)`, miles: workMi },
      { label: 'Recovery', detail: `400m jog between reps (${count - 1} jogs × 0.25 mi)`, miles: recMi },
      { label: 'Cooldown', detail: `${cdMi} mi @ ${easyPace}/mi`, miles: cdMi },
    ],
    total: Math.round(total * 10) / 10,
  };
}
function intervals1mi(wuMi, count, easyPace, repPace, cdMi) {
  const workMi = count * 1;
  const recMi = (count - 1) * 0.25;
  const total = wuMi + workMi + recMi + cdMi;
  return {
    structure: [
      { label: 'Warmup', detail: `${wuMi} mi @ ${easyPace}/mi`, miles: wuMi },
      { label: 'Reps', detail: `${count} × 1 mi @ ${repPace}/mi`, miles: workMi },
      { label: 'Recovery', detail: `400m jog between reps (${count - 1} jogs × 0.25 mi)`, miles: recMi },
      { label: 'Cooldown', detail: `${cdMi} mi @ ${easyPace}/mi`, miles: cdMi },
    ],
    total: Math.round(total * 10) / 10,
  };
}
function longRun(miles, pace, mpMiles, mpPace) {
  if (mpMiles && mpMiles > 0) {
    return {
      structure: [
        { label: 'Easy', detail: `${miles - mpMiles} mi @ ${pace}/mi`, miles: miles - mpMiles },
        { label: 'Marathon Pace', detail: `${mpMiles} mi @ ${mpPace}/mi (last ${mpMiles} miles)`, miles: mpMiles },
      ],
      total: miles,
    };
  }
  return {
    structure: [
      { label: 'Long', detail: `${miles} mi @ ${pace}/mi`, miles },
    ],
    total: miles,
  };
}
function runWalk(totalMin, runSec, walkSec) {
  return {
    structure: [
      { label: 'Run/walk', detail: `Run ${runSec / 60} min / walk ${walkSec / 60} min, repeat for ${totalMin} min`, miles: Math.round(totalMin / 11 * 10) / 10 },
    ],
    total: Math.round(totalMin / 11 * 10) / 10,
  };
}
function paceToSec(pace) {
  const [m, s] = pace.split(':').map(Number);
  return m * 60 + s;
}

// ============================================================
// THE 25-WEEK PLAN
// ============================================================
const PLAN = [
  // ===== PHASE 0: BASE REBUILD (W1–3) =====
  { week: 1, phase: 'Phase 0 · Base Rebuild', dates: 'May 4 – May 10', focus: 'Comeback Week 1 — relearn the rhythm', pushups: 40, days: [
    { day: 'Mon', date: 'May 4', when: 'PM', timeMin: 30, type: 'easy', title: 'Run/walk 25 min', desc: 'Out the door is the only goal. No pace target.', workout: runWalk(25, 240, 60), pace: 'easy effort', route: route(2.5), extras: ['pushups', 'circuit', 'bands'] },
    { day: 'Tue', date: 'May 5', when: 'REST', timeMin: 5, type: 'rest', title: 'Rest day', desc: 'Restaurant 5–10pm. Pushups + circuit only.', workout: { structure: [], total: 0 }, pace: '—', route: '—', extras: ['pushups', 'circuit'] },
    { day: 'Wed', date: 'May 6', when: 'AM', timeMin: 30, type: 'easy', title: 'Run/walk 25 min', desc: 'Same format as Mon. Feel out the response.', workout: runWalk(25, 240, 60), pace: 'easy effort', route: route(2.5), extras: ['pushups'] },
    { day: 'Thu', date: 'May 7', when: 'AM', timeMin: 35, type: 'strength', title: 'Strength A (light) + circuit + bands', desc: 'Half the weight you think you need. Form first. Restaurant 5–10pm.', workout: { structure: [], total: 0 }, pace: '—', route: 'Home gym', extras: ['pushups', 'circuit', 'bands'] },
    { day: 'Fri', date: 'May 8', when: 'REST', timeMin: 5, type: 'rest', title: 'Rest day', desc: 'Pre-long-run rest. Pushups only.', workout: { structure: [], total: 0 }, pace: '—', route: '—', extras: ['pushups'] },
    { day: 'Sat', date: 'May 9', when: 'AM', timeMin: 40, type: 'long', title: 'LONG · 30 min run/walk', desc: 'Run 5 min / walk 1 min. Restaurant 5–10pm.', workout: runWalk(30, 300, 60), pace: 'easy effort', route: route(3), extras: ['pushups', 'circuit'] },
    { day: 'Sun', date: 'May 10', when: 'AM', timeMin: 25, type: 'easy', title: 'Recovery walk-jog 20 min', desc: 'Mostly walk, light jogs. Restaurant 5–10pm.', workout: runWalk(20, 180, 120), pace: 'very easy', route: route(2), extras: ['pushups', 'circuit'] },
  ]},
  { week: 2, phase: 'Phase 0 · Base Rebuild', dates: 'May 11 – May 17', focus: 'More continuous running', pushups: 40, days: [
    { day: 'Mon', date: 'May 11', when: 'PM', timeMin: 35, type: 'easy', title: 'Easy 30 min', desc: 'Mostly continuous. Walk only if needed.', workout: easyRun(3, '11:30'), pace: '11:30/mi', route: route(3), extras: ['pushups', 'circuit', 'bands'] },
    { day: 'Tue', date: 'May 12', when: 'REST', timeMin: 5, type: 'rest', title: 'Rest day', desc: 'Restaurant 5–10pm.', workout: { structure: [], total: 0 }, pace: '—', route: '—', extras: ['pushups', 'circuit'] },
    { day: 'Wed', date: 'May 13', when: 'AM', timeMin: 30, type: 'easy', title: 'Easy 25 min', desc: 'Treadmill if weather is bad.', workout: easyRun(2.5, '11:30'), pace: '11:30/mi', route: route(2.5), extras: ['pushups'] },
    { day: 'Thu', date: 'May 14', when: 'AM', timeMin: 40, type: 'strength', title: 'Strength A + circuit + bands', desc: 'Add 5 lb if last week felt easy. Restaurant 5–10pm.', workout: { structure: [], total: 0 }, pace: '—', route: 'Home gym', extras: ['pushups', 'circuit', 'bands'] },
    { day: 'Fri', date: 'May 15', when: 'PM', timeMin: 25, type: 'easy', title: 'Easy 20 min', desc: 'Optional — skip if tired.', workout: easyRun(2, '11:30'), pace: '11:30/mi', route: route(2), extras: ['pushups'] },
    { day: 'Sat', date: 'May 16', when: 'AM', timeMin: 50, type: 'long', title: 'LONG · 4 mi continuous', desc: 'First continuous longer run. Restaurant 5–10pm.', workout: easyRun(4, '11:15'), pace: '11:15/mi', route: route(4), extras: ['pushups', 'circuit'] },
    { day: 'Sun', date: 'May 17', when: 'REST', timeMin: 5, type: 'rest', title: 'Rest day', desc: 'Pushups + circuit. Restaurant 5–10pm.', workout: { structure: [], total: 0 }, pace: '—', route: '—', extras: ['pushups', 'circuit'] },
  ]},
  { week: 3, phase: 'Phase 0 · Base Rebuild', dates: 'May 18 – May 24', focus: 'Last base week before structured plan', pushups: 40, days: [
    { day: 'Mon', date: 'May 18', when: 'PM', timeMin: 45, type: 'easy', title: 'Easy 35 min', desc: 'Build to 35 min continuous.', workout: easyRun(3.5, '11:15'), pace: '11:15/mi', route: route(3.5), extras: ['pushups', 'circuit', 'bands'] },
    { day: 'Tue', date: 'May 19', when: 'REST', timeMin: 5, type: 'rest', title: 'Rest day', desc: 'Restaurant 5–10pm.', workout: { structure: [], total: 0 }, pace: '—', route: '—', extras: ['pushups', 'circuit'] },
    { day: 'Wed', date: 'May 20', when: 'AM', timeMin: 35, type: 'easy', title: 'Easy 30 min', desc: 'Conversational throughout.', workout: easyRun(3, '11:15'), pace: '11:15/mi', route: route(3), extras: ['pushups'] },
    { day: 'Thu', date: 'May 21', when: 'AM', timeMin: 40, type: 'strength', title: 'Strength A + circuit + bands', desc: 'Restaurant 5–10pm.', workout: { structure: [], total: 0 }, pace: '—', route: 'Home gym', extras: ['pushups', 'circuit', 'bands'] },
    { day: 'Fri', date: 'May 22', when: 'PM', timeMin: 30, type: 'easy', title: 'Easy 25 min', desc: 'Pre-long-run shake-out.', workout: easyRun(2.5, '11:15'), pace: '11:15/mi', route: route(2.5), extras: ['pushups'] },
    { day: 'Sat', date: 'May 23', when: 'AM', timeMin: 60, type: 'long', title: 'LONG · 5 mi', desc: 'Longest yet. Bring water. Restaurant 5–10pm.', workout: easyRun(5, '11:00'), pace: '11:00/mi', route: route(5), extras: ['pushups', 'circuit'] },
    { day: 'Sun', date: 'May 24', when: 'AM', timeMin: 35, type: 'easy', title: 'Easy 30 min recovery', desc: 'Restaurant 5–10pm.', workout: easyRun(3, '11:30'), pace: '11:30/mi', route: route(3), extras: ['pushups', 'circuit'] },
  ]},

  // ===== PHASE 1: BASE + CUT (W4–9) =====
  { week: 4, phase: 'Base + Cut', dates: 'May 25 – May 31', focus: 'Structured plan begins · Diet cut starts', pushups: 40, days: [
    { day: 'Mon', date: 'May 25', when: 'PM', timeMin: 50, type: 'easy', title: 'Easy 4 mi + 4 strides', desc: 'Strides at end build leg turnover.', workout: easyWithStrides(4, '11:00', 4), pace: '11:00/mi', route: route(4), extras: ['pushups', 'circuit', 'bands'] },
    { day: 'Tue', date: 'May 26', when: 'REST', timeMin: 5, type: 'rest', title: 'Rest day', desc: 'Restaurant 5–10pm.', workout: { structure: [], total: 0 }, pace: '—', route: '—', extras: ['pushups', 'circuit'] },
    { day: 'Wed', date: 'May 27', when: 'AM', timeMin: 50, type: 'easy', title: 'Easy 4 mi', desc: 'Conversational pace.', workout: easyRun(4, '11:00'), pace: '11:00/mi', route: route(4), extras: ['pushups'] },
    { day: 'Thu', date: 'May 28', when: 'AM', timeMin: 45, type: 'strength', title: 'Strength A + circuit + bands', desc: 'Real progressive overload begins. Restaurant 5–10pm.', workout: { structure: [], total: 0 }, pace: '—', route: 'Home gym', extras: ['pushups', 'circuit', 'bands'] },
    { day: 'Fri', date: 'May 29', when: 'PM', timeMin: 35, type: 'easy', title: 'Easy 3 mi', desc: 'Pre-long-run shake-out.', workout: easyRun(3, '11:00'), pace: '11:00/mi', route: route(3), extras: ['pushups'] },
    { day: 'Sat', date: 'May 30', when: 'AM', timeMin: 75, type: 'long', title: 'LONG · 6 mi', desc: 'Sip water every 15 min. Restaurant 5–10pm.', workout: longRun(6, '11:00'), pace: '11:00/mi', route: route(6), extras: ['pushups', 'circuit'] },
    { day: 'Sun', date: 'May 31', when: 'REST', timeMin: 5, type: 'rest', title: 'Rest day', desc: 'Restaurant 5–10pm.', workout: { structure: [], total: 0 }, pace: '—', route: '—', extras: ['pushups', 'circuit'] },
  ]},
  { week: 5, phase: 'Base + Cut', dates: 'Jun 1 – Jun 7', focus: 'First tempo work', pushups: 50, days: [
    { day: 'Mon', date: 'Jun 1', when: 'PM', timeMin: 55, type: 'quality', title: 'TEMPO · 4 mi total', desc: 'First real quality session. Lock the middle 2 mi at tempo effort.', workout: tempo(1, 2, 1, '11:00', '9:50'), pace: 'WU 11:00 / T 9:50 / CD 11:00', route: route(4), extras: ['pushups', 'circuit', 'bands'] },
    { day: 'Tue', date: 'Jun 2', when: 'REST', timeMin: 5, type: 'rest', title: 'Rest day', desc: 'Restaurant 5–10pm.', workout: { structure: [], total: 0 }, pace: '—', route: '—', extras: ['pushups', 'circuit'] },
    { day: 'Wed', date: 'Jun 3', when: 'AM', timeMin: 50, type: 'easy', title: 'Easy 4 mi', desc: 'Recovery from tempo.', workout: easyRun(4, '11:00'), pace: '11:00/mi', route: route(4), extras: ['pushups'] },
    { day: 'Thu', date: 'Jun 4', when: 'AM', timeMin: 45, type: 'strength', title: 'Strength A + circuit + bands', desc: 'Add 5 lb where you can. Restaurant 5–10pm.', workout: { structure: [], total: 0 }, pace: '—', route: 'Home gym', extras: ['pushups', 'circuit', 'bands'] },
    { day: 'Fri', date: 'Jun 5', when: 'PM', timeMin: 35, type: 'easy', title: 'Easy 3 mi', desc: 'Pre-long-run shake-out.', workout: easyRun(3, '11:00'), pace: '11:00/mi', route: route(3), extras: ['pushups'] },
    { day: 'Sat', date: 'Jun 6', when: 'AM', timeMin: 85, type: 'long', title: 'LONG · 7 mi', desc: 'First gel at mile 4. Restaurant 5–10pm.', workout: longRun(7, '11:00'), pace: '11:00/mi', route: route(7), extras: ['pushups', 'circuit'] },
    { day: 'Sun', date: 'Jun 7', when: 'AM', timeMin: 35, type: 'easy', title: 'Easy 3 mi recovery', desc: 'Restaurant 5–10pm.', workout: easyRun(3, '11:15'), pace: '11:15/mi', route: route(3), extras: ['pushups', 'circuit'] },
  ]},
  { week: 6, phase: 'Base + Cut', dates: 'Jun 8 – Jun 14', focus: 'Build volume · longer tempo', pushups: 50, days: [
    { day: 'Mon', date: 'Jun 8', when: 'PM', timeMin: 65, type: 'quality', title: 'TEMPO · 5 mi total', desc: 'Lengthen the tempo middle.', workout: tempo(1, 3, 1, '11:00', '9:45'), pace: 'WU 11:00 / T 9:45 / CD 11:00', route: route(5), extras: ['pushups', 'circuit', 'bands'] },
    { day: 'Tue', date: 'Jun 9', when: 'REST', timeMin: 5, type: 'rest', title: 'Rest day', desc: 'Restaurant 5–10pm.', workout: { structure: [], total: 0 }, pace: '—', route: '—', extras: ['pushups', 'circuit'] },
    { day: 'Wed', date: 'Jun 10', when: 'AM', timeMin: 60, type: 'easy', title: 'Easy 5 mi', desc: 'Steady aerobic.', workout: easyRun(5, '10:50'), pace: '10:50/mi', route: route(5), extras: ['pushups'] },
    { day: 'Thu', date: 'Jun 11', when: 'AM', timeMin: 45, type: 'strength', title: 'Strength A + circuit + bands', desc: 'Restaurant 5–10pm.', workout: { structure: [], total: 0 }, pace: '—', route: 'Home gym', extras: ['pushups', 'circuit', 'bands'] },
    { day: 'Fri', date: 'Jun 12', when: 'PM', timeMin: 35, type: 'easy', title: 'Easy 3 mi', desc: 'Pre-long-run.', workout: easyRun(3, '11:00'), pace: '11:00/mi', route: route(3), extras: ['pushups'] },
    { day: 'Sat', date: 'Jun 13', when: 'AM', timeMin: 95, type: 'long', title: 'LONG · 8 mi', desc: 'Gels at mi 4 + 7. Restaurant 5–10pm.', workout: longRun(8, '11:00'), pace: '11:00/mi', route: route(8), extras: ['pushups', 'circuit'] },
    { day: 'Sun', date: 'Jun 14', when: 'AM', timeMin: 35, type: 'easy', title: 'Easy 3 mi recovery', desc: 'Restaurant 5–10pm.', workout: easyRun(3, '11:15'), pace: '11:15/mi', route: route(3), extras: ['pushups', 'circuit'] },
  ]},
  { week: 7, phase: 'Base + Cut · CUTBACK', dates: 'Jun 15 – Jun 21', focus: 'Recovery week — intentionally lower', pushups: 50, days: [
    { day: 'Mon', date: 'Jun 15', when: 'PM', timeMin: 50, type: 'easy', title: 'Easy 4 mi + 4 strides', desc: 'Light effort cutback.', workout: easyWithStrides(4, '11:00', 4), pace: '11:00/mi', route: route(4), extras: ['pushups', 'circuit', 'bands'] },
    { day: 'Tue', date: 'Jun 16', when: 'REST', timeMin: 5, type: 'rest', title: 'Rest day', desc: 'Restaurant 5–10pm.', workout: { structure: [], total: 0 }, pace: '—', route: '—', extras: ['pushups', 'circuit'] },
    { day: 'Wed', date: 'Jun 17', when: 'AM', timeMin: 50, type: 'easy', title: 'Easy 4 mi', desc: 'Conversational.', workout: easyRun(4, '11:00'), pace: '11:00/mi', route: route(4), extras: ['pushups'] },
    { day: 'Thu', date: 'Jun 18', when: 'AM', timeMin: 45, type: 'strength', title: 'Strength A + circuit + bands', desc: 'Restaurant 5–10pm.', workout: { structure: [], total: 0 }, pace: '—', route: 'Home gym', extras: ['pushups', 'circuit', 'bands'] },
    { day: 'Fri', date: 'Jun 19', when: 'REST', timeMin: 5, type: 'rest', title: 'Rest day', desc: 'Pushups only.', workout: { structure: [], total: 0 }, pace: '—', route: '—', extras: ['pushups'] },
    { day: 'Sat', date: 'Jun 20', when: 'AM', timeMin: 75, type: 'long', title: 'LONG · 6 mi (cutback)', desc: 'Relaxed. Restaurant 5–10pm.', workout: longRun(6, '11:00'), pace: '11:00/mi', route: route(6), extras: ['pushups', 'circuit'] },
    { day: 'Sun', date: 'Jun 21', when: 'AM', timeMin: 35, type: 'easy', title: 'Easy 3 mi', desc: 'Restaurant 5–10pm.', workout: easyRun(3, '11:00'), pace: '11:00/mi', route: route(3), extras: ['pushups', 'circuit'] },
  ]},
  { week: 8, phase: 'Base + Cut', dates: 'Jun 22 – Jun 28', focus: 'Lengthen tempo to 4 mi', pushups: 50, days: [
    { day: 'Mon', date: 'Jun 22', when: 'PM', timeMin: 70, type: 'quality', title: 'TEMPO · 6 mi total', desc: '4 mi at tempo — first really hard one.', workout: tempo(1, 4, 1, '11:00', '9:35'), pace: 'WU 11:00 / T 9:35 / CD 11:00', route: route(6), extras: ['pushups', 'circuit', 'bands'] },
    { day: 'Tue', date: 'Jun 23', when: 'REST', timeMin: 5, type: 'rest', title: 'Rest day', desc: 'Restaurant 5–10pm.', workout: { structure: [], total: 0 }, pace: '—', route: '—', extras: ['pushups', 'circuit'] },
    { day: 'Wed', date: 'Jun 24', when: 'AM', timeMin: 60, type: 'easy', title: 'Easy 5 mi', desc: 'Recovery.', workout: easyRun(5, '10:50'), pace: '10:50/mi', route: route(5), extras: ['pushups'] },
    { day: 'Thu', date: 'Jun 25', when: 'AM', timeMin: 45, type: 'strength', title: 'Strength A + circuit + bands', desc: 'Restaurant 5–10pm.', workout: { structure: [], total: 0 }, pace: '—', route: 'Home gym', extras: ['pushups', 'circuit', 'bands'] },
    { day: 'Fri', date: 'Jun 26', when: 'PM', timeMin: 35, type: 'easy', title: 'Easy 3 mi', desc: 'Pre-long-run.', workout: easyRun(3, '10:50'), pace: '10:50/mi', route: route(3), extras: ['pushups'] },
    { day: 'Sat', date: 'Jun 27', when: 'AM', timeMin: 105, type: 'long', title: 'LONG · 9 mi', desc: 'Gels every 30 min. Restaurant 5–10pm.', workout: longRun(9, '10:50'), pace: '10:50/mi', route: route(9), extras: ['pushups', 'circuit'] },
    { day: 'Sun', date: 'Jun 28', when: 'AM', timeMin: 45, type: 'easy', title: 'Easy 4 mi recovery', desc: 'Restaurant 5–10pm.', workout: easyRun(4, '11:00'), pace: '11:00/mi', route: route(4), extras: ['pushups', 'circuit'] },
  ]},
  { week: 9, phase: 'Base + Cut', dates: 'Jun 29 – Jul 5', focus: 'First 10-mile long run', pushups: 50, days: [
    { day: 'Mon', date: 'Jun 29', when: 'PM', timeMin: 70, type: 'quality', title: 'TEMPO · 6 mi total', desc: 'Tempo gets faster as fitness builds.', workout: tempo(1, 4, 1, '11:00', '9:30'), pace: 'WU 11:00 / T 9:30 / CD 11:00', route: route(6), extras: ['pushups', 'circuit', 'bands'] },
    { day: 'Tue', date: 'Jun 30', when: 'REST', timeMin: 5, type: 'rest', title: 'Rest day', desc: 'Restaurant 5–10pm.', workout: { structure: [], total: 0 }, pace: '—', route: '—', extras: ['pushups', 'circuit'] },
    { day: 'Wed', date: 'Jul 1', when: 'AM', timeMin: 60, type: 'easy', title: 'Easy 5 mi', desc: 'Steady aerobic.', workout: easyRun(5, '10:45'), pace: '10:45/mi', route: route(5), extras: ['pushups'] },
    { day: 'Thu', date: 'Jul 2', when: 'AM', timeMin: 45, type: 'strength', title: 'Strength A + circuit + bands', desc: 'Restaurant 5–10pm.', workout: { structure: [], total: 0 }, pace: '—', route: 'Home gym', extras: ['pushups', 'circuit', 'bands'] },
    { day: 'Fri', date: 'Jul 3', when: 'PM', timeMin: 35, type: 'easy', title: 'Easy 3 mi', desc: 'Pre-long-run.', workout: easyRun(3, '10:45'), pace: '10:45/mi', route: route(3), extras: ['pushups'] },
    { day: 'Sat', date: 'Jul 4', when: 'AM', timeMin: 115, type: 'long', title: 'LONG · 10 mi', desc: 'Holiday — start early before heat. Full gel rotation. Restaurant 5–10pm.', workout: longRun(10, '10:45'), pace: '10:45/mi', route: route(10), extras: ['pushups', 'circuit'] },
    { day: 'Sun', date: 'Jul 5', when: 'AM', timeMin: 45, type: 'easy', title: 'Easy 4 mi recovery', desc: 'Restaurant 5–10pm.', workout: easyRun(4, '11:00'), pace: '11:00/mi', route: route(4), extras: ['pushups', 'circuit'] },
  ]},

  // ===== PHASE 2: BUILD (W10–15) =====
  { week: 10, phase: 'Build · CUTBACK', dates: 'Jul 6 – Jul 12', focus: 'Recovery + transition to build phase', pushups: 60, days: [
    { day: 'Mon', date: 'Jul 6', when: 'PM', timeMin: 60, type: 'easy', title: 'Easy 5 mi + 4 strides', desc: 'Light cutback.', workout: easyWithStrides(5, '10:45', 4), pace: '10:45/mi', route: route(5), extras: ['pushups', 'circuit', 'bands'] },
    { day: 'Tue', date: 'Jul 7', when: 'REST', timeMin: 5, type: 'rest', title: 'Rest day', desc: 'Restaurant 5–10pm.', workout: { structure: [], total: 0 }, pace: '—', route: '—', extras: ['pushups', 'circuit'] },
    { day: 'Wed', date: 'Jul 8', when: 'AM', timeMin: 50, type: 'easy', title: 'Easy 4 mi', desc: 'Recovery.', workout: easyRun(4, '10:45'), pace: '10:45/mi', route: route(4), extras: ['pushups'] },
    { day: 'Thu', date: 'Jul 9', when: 'AM', timeMin: 45, type: 'strength', title: 'Strength A + circuit + bands', desc: 'Restaurant 5–10pm.', workout: { structure: [], total: 0 }, pace: '—', route: 'Home gym', extras: ['pushups', 'circuit', 'bands'] },
    { day: 'Fri', date: 'Jul 10', when: 'REST', timeMin: 5, type: 'rest', title: 'Rest day', desc: 'Cutback Friday.', workout: { structure: [], total: 0 }, pace: '—', route: '—', extras: ['pushups'] },
    { day: 'Sat', date: 'Jul 11', when: 'AM', timeMin: 95, type: 'long', title: 'LONG · 8 mi (cutback)', desc: 'Relaxed. Restaurant 5–10pm.', workout: longRun(8, '10:45'), pace: '10:45/mi', route: route(8), extras: ['pushups', 'circuit'] },
    { day: 'Sun', date: 'Jul 12', when: 'AM', timeMin: 35, type: 'easy', title: 'Easy 3 mi', desc: 'Restaurant 5–10pm.', workout: easyRun(3, '10:45'), pace: '10:45/mi', route: route(3), extras: ['pushups', 'circuit'] },
  ]},
  { week: 11, phase: 'Build · Cut', dates: 'Jul 13 – Jul 19', focus: 'Add intervals + first MP work', pushups: 60, days: [
    { day: 'Mon', date: 'Jul 13', when: 'PM', timeMin: 75, type: 'quality', title: 'INTERVALS · 5×800m', desc: 'First track-style workout. Best at South Lakes HS track or measured W&OD section.', workout: intervals800(1, 5, '11:00', '8:45', 1), pace: 'WU 11:00 / Reps 8:45 / Jog rec / CD 11:00', route: 'South Lakes HS track or W&OD measured 800m', extras: ['pushups', 'circuit', 'bands'] },
    { day: 'Tue', date: 'Jul 14', when: 'REST', timeMin: 5, type: 'rest', title: 'Rest day', desc: 'Restaurant 5–10pm.', workout: { structure: [], total: 0 }, pace: '—', route: '—', extras: ['pushups', 'circuit'] },
    { day: 'Wed', date: 'Jul 15', when: 'AM', timeMin: 60, type: 'easy', title: 'Easy 5 mi', desc: 'Steady recovery.', workout: easyRun(5, '10:30'), pace: '10:30/mi', route: route(5), extras: ['pushups'] },
    { day: 'Thu', date: 'Jul 16', when: 'AM', timeMin: 45, type: 'strength', title: 'Strength A + circuit + bands', desc: 'Restaurant 5–10pm.', workout: { structure: [], total: 0 }, pace: '—', route: 'Home gym', extras: ['pushups', 'circuit', 'bands'] },
    { day: 'Fri', date: 'Jul 17', when: 'PM', timeMin: 35, type: 'easy', title: 'Easy 3 mi', desc: 'Pre-long-run.', workout: easyRun(3, '10:30'), pace: '10:30/mi', route: route(3), extras: ['pushups'] },
    { day: 'Sat', date: 'Jul 18', when: 'AM', timeMin: 125, type: 'long', title: 'LONG · 11 mi (last 2 @ MP)', desc: 'First MP work. Lock in 9:28 the last 2 mi. Restaurant 5–10pm.', workout: longRun(11, '10:30', 2, '9:28'), pace: '10:30 → 9:28', route: route(11), extras: ['pushups', 'circuit'] },
    { day: 'Sun', date: 'Jul 19', when: 'AM', timeMin: 45, type: 'easy', title: 'Easy 4 mi recovery', desc: 'Restaurant 5–10pm.', workout: easyRun(4, '10:45'), pace: '10:45/mi', route: route(4), extras: ['pushups', 'circuit'] },
  ]},
  { week: 12, phase: 'Build · Cut', dates: 'Jul 20 – Jul 26', focus: 'Lengthen tempo + extend MP', pushups: 60, days: [
    { day: 'Mon', date: 'Jul 20', when: 'PM', timeMin: 80, type: 'quality', title: 'TEMPO · 7 mi total', desc: '5 mi at tempo — extended threshold work.', workout: tempo(1, 5, 1, '11:00', '9:25'), pace: 'WU 11:00 / T 9:25 / CD 11:00', route: route(7), extras: ['pushups', 'circuit', 'bands'] },
    { day: 'Tue', date: 'Jul 21', when: 'REST', timeMin: 5, type: 'rest', title: 'Rest day', desc: 'Restaurant 5–10pm.', workout: { structure: [], total: 0 }, pace: '—', route: '—', extras: ['pushups', 'circuit'] },
    { day: 'Wed', date: 'Jul 22', when: 'AM', timeMin: 60, type: 'easy', title: 'Easy 5 mi', desc: 'Steady.', workout: easyRun(5, '10:30'), pace: '10:30/mi', route: route(5), extras: ['pushups'] },
    { day: 'Thu', date: 'Jul 23', when: 'AM', timeMin: 45, type: 'strength', title: 'Strength A + circuit + bands', desc: 'Restaurant 5–10pm.', workout: { structure: [], total: 0 }, pace: '—', route: 'Home gym', extras: ['pushups', 'circuit', 'bands'] },
    { day: 'Fri', date: 'Jul 24', when: 'PM', timeMin: 35, type: 'easy', title: 'Easy 3 mi', desc: 'Pre-long-run.', workout: easyRun(3, '10:30'), pace: '10:30/mi', route: route(3), extras: ['pushups'] },
    { day: 'Sat', date: 'Jul 25', when: 'AM', timeMin: 135, type: 'long', title: 'LONG · 12 mi (last 3 @ MP)', desc: 'Practice race-day fueling — full kit. Caffeine gel at mi 9. Restaurant 5–10pm.', workout: longRun(12, '10:30', 3, '9:28'), pace: '10:30 → 9:28', route: route(12), extras: ['pushups', 'circuit'] },
    { day: 'Sun', date: 'Jul 26', when: 'AM', timeMin: 45, type: 'easy', title: 'Easy 4 mi recovery', desc: 'Restaurant 5–10pm.', workout: easyRun(4, '10:45'), pace: '10:45/mi', route: route(4), extras: ['pushups', 'circuit'] },
  ]},
  { week: 13, phase: 'Build · CUTBACK', dates: 'Jul 27 – Aug 2', focus: 'Recovery week', pushups: 60, days: [
    { day: 'Mon', date: 'Jul 27', when: 'PM', timeMin: 60, type: 'easy', title: 'Easy 5 mi + 6 strides', desc: 'Light cutback.', workout: easyWithStrides(5, '10:30', 6), pace: '10:30/mi', route: route(5), extras: ['pushups', 'circuit', 'bands'] },
    { day: 'Tue', date: 'Jul 28', when: 'REST', timeMin: 5, type: 'rest', title: 'Rest day', desc: 'Restaurant 5–10pm.', workout: { structure: [], total: 0 }, pace: '—', route: '—', extras: ['pushups', 'circuit'] },
    { day: 'Wed', date: 'Jul 29', when: 'AM', timeMin: 60, type: 'easy', title: 'Easy 5 mi', desc: 'Steady.', workout: easyRun(5, '10:30'), pace: '10:30/mi', route: route(5), extras: ['pushups'] },
    { day: 'Thu', date: 'Jul 30', when: 'AM', timeMin: 45, type: 'strength', title: 'Strength A + circuit + bands', desc: 'Restaurant 5–10pm.', workout: { structure: [], total: 0 }, pace: '—', route: 'Home gym', extras: ['pushups', 'circuit', 'bands'] },
    { day: 'Fri', date: 'Jul 31', when: 'REST', timeMin: 5, type: 'rest', title: 'Rest day', desc: 'Cutback Friday.', workout: { structure: [], total: 0 }, pace: '—', route: '—', extras: ['pushups'] },
    { day: 'Sat', date: 'Aug 1', when: 'AM', timeMin: 105, type: 'long', title: 'LONG · 9 mi (no MP)', desc: 'Cutback long run, easy effort. Restaurant 5–10pm.', workout: longRun(9, '10:30'), pace: '10:30/mi', route: route(9), extras: ['pushups', 'circuit'] },
    { day: 'Sun', date: 'Aug 2', when: 'AM', timeMin: 35, type: 'easy', title: 'Easy 3 mi', desc: 'Restaurant 5–10pm.', workout: easyRun(3, '10:30'), pace: '10:30/mi', route: route(3), extras: ['pushups', 'circuit'] },
  ]},
  { week: 14, phase: 'Build · Cut', dates: 'Aug 3 – Aug 9', focus: 'Bigger intervals, longer MP', pushups: 70, days: [
    { day: 'Mon', date: 'Aug 3', when: 'PM', timeMin: 80, type: 'quality', title: 'INTERVALS · 6×800m', desc: 'Add a rep — building VO2max ceiling.', workout: intervals800(1, 6, '11:00', '8:40', 1), pace: 'WU 11:00 / Reps 8:40 / Jog rec / CD 11:00', route: 'South Lakes HS track or W&OD measured', extras: ['pushups', 'circuit', 'bands'] },
    { day: 'Tue', date: 'Aug 4', when: 'REST', timeMin: 5, type: 'rest', title: 'Rest day', desc: 'Restaurant 5–10pm.', workout: { structure: [], total: 0 }, pace: '—', route: '—', extras: ['pushups', 'circuit'] },
    { day: 'Wed', date: 'Aug 5', when: 'AM', timeMin: 60, type: 'easy', title: 'Easy 5 mi', desc: 'Recovery from intervals.', workout: easyRun(5, '10:15'), pace: '10:15/mi', route: route(5), extras: ['pushups'] },
    { day: 'Thu', date: 'Aug 6', when: 'AM', timeMin: 45, type: 'strength', title: 'Strength A + circuit + bands', desc: 'Restaurant 5–10pm.', workout: { structure: [], total: 0 }, pace: '—', route: 'Home gym', extras: ['pushups', 'circuit', 'bands'] },
    { day: 'Fri', date: 'Aug 7', when: 'PM', timeMin: 35, type: 'easy', title: 'Easy 3 mi', desc: 'Pre-long-run.', workout: easyRun(3, '10:30'), pace: '10:30/mi', route: route(3), extras: ['pushups'] },
    { day: 'Sat', date: 'Aug 8', when: 'AM', timeMin: 155, type: 'long', title: 'LONG · 14 mi (last 4 @ MP)', desc: 'Heat training: leave by 6:30am. Restaurant 5–10pm.', workout: longRun(14, '10:15', 4, '9:28'), pace: '10:15 → 9:28', route: route(14), extras: ['pushups', 'circuit'] },
    { day: 'Sun', date: 'Aug 9', when: 'AM', timeMin: 45, type: 'easy', title: 'Easy 4 mi recovery', desc: 'Restaurant 5–10pm.', workout: easyRun(4, '10:45'), pace: '10:45/mi', route: route(4), extras: ['pushups', 'circuit'] },
  ]},
  { week: 15, phase: 'Build · Cut', dates: 'Aug 10 – Aug 16', focus: 'Last week of aggressive cut', pushups: 70, days: [
    { day: 'Mon', date: 'Aug 10', when: 'PM', timeMin: 90, type: 'quality', title: 'TEMPO · 8 mi total', desc: 'Biggest tempo of cycle. 6 mi at threshold.', workout: tempo(1, 6, 1, '11:00', '9:15'), pace: 'WU 11:00 / T 9:15 / CD 11:00', route: route(8), extras: ['pushups', 'circuit', 'bands'] },
    { day: 'Tue', date: 'Aug 11', when: 'REST', timeMin: 5, type: 'rest', title: 'Rest day', desc: 'Restaurant 5–10pm.', workout: { structure: [], total: 0 }, pace: '—', route: '—', extras: ['pushups', 'circuit'] },
    { day: 'Wed', date: 'Aug 12', when: 'AM', timeMin: 70, type: 'easy', title: 'Easy 6 mi', desc: 'Steady.', workout: easyRun(6, '10:15'), pace: '10:15/mi', route: route(6), extras: ['pushups'] },
    { day: 'Thu', date: 'Aug 13', when: 'AM', timeMin: 45, type: 'strength', title: 'Strength A + circuit + bands', desc: 'Restaurant 5–10pm.', workout: { structure: [], total: 0 }, pace: '—', route: 'Home gym', extras: ['pushups', 'circuit', 'bands'] },
    { day: 'Fri', date: 'Aug 14', when: 'PM', timeMin: 35, type: 'easy', title: 'Easy 3 mi', desc: 'Pre-long-run.', workout: easyRun(3, '10:15'), pace: '10:15/mi', route: route(3), extras: ['pushups'] },
    { day: 'Sat', date: 'Aug 15', when: 'AM', timeMin: 165, type: 'long', title: 'LONG · 15 mi (last 4 @ MP)', desc: 'Hardest cut-phase run. Eat well after — cut phase ends Mon. Restaurant 5–10pm.', workout: longRun(15, '10:15', 4, '9:28'), pace: '10:15 → 9:28', route: route(15), extras: ['pushups', 'circuit'] },
    { day: 'Sun', date: 'Aug 16', when: 'AM', timeMin: 45, type: 'easy', title: 'Easy 4 mi recovery', desc: 'Restaurant 5–10pm.', workout: easyRun(4, '10:45'), pace: '10:45/mi', route: route(4), extras: ['pushups', 'circuit'] },
  ]},

  // ===== PHASE 3: PEAK · MAINTENANCE (W16–21) =====
  { week: 16, phase: 'Peak · MAINTENANCE · CUTBACK', dates: 'Aug 17 – Aug 23', focus: 'CALORIES UP — start eating at maintenance', pushups: 70, days: [
    { day: 'Mon', date: 'Aug 17', when: 'PM', timeMin: 60, type: 'easy', title: 'Easy 5 mi + 6 strides', desc: 'Cutback after 15-mile peak last week.', workout: easyWithStrides(5, '10:15', 6), pace: '10:15/mi', route: route(5), extras: ['pushups', 'circuit', 'bands'] },
    { day: 'Tue', date: 'Aug 18', when: 'REST', timeMin: 5, type: 'rest', title: 'Rest day', desc: 'Restaurant 5–10pm.', workout: { structure: [], total: 0 }, pace: '—', route: '—', extras: ['pushups', 'circuit'] },
    { day: 'Wed', date: 'Aug 19', when: 'AM', timeMin: 60, type: 'easy', title: 'Easy 5 mi', desc: 'Steady.', workout: easyRun(5, '10:15'), pace: '10:15/mi', route: route(5), extras: ['pushups'] },
    { day: 'Thu', date: 'Aug 20', when: 'AM', timeMin: 45, type: 'strength', title: 'Strength (lighter -20%) + circuit + bands', desc: 'Drop weights this week. Restaurant 5–10pm.', workout: { structure: [], total: 0 }, pace: '—', route: 'Home gym', extras: ['pushups', 'circuit', 'bands'] },
    { day: 'Fri', date: 'Aug 21', when: 'REST', timeMin: 5, type: 'rest', title: 'Rest day', desc: 'Cutback Friday.', workout: { structure: [], total: 0 }, pace: '—', route: '—', extras: ['pushups'] },
    { day: 'Sat', date: 'Aug 22', when: 'AM', timeMin: 135, type: 'long', title: 'LONG · 12 mi (no MP, easy)', desc: 'Cutback. Refuel fully — cal UP from today. Restaurant 5–10pm.', workout: longRun(12, '10:15'), pace: '10:15/mi', route: route(12), extras: ['pushups', 'circuit'] },
    { day: 'Sun', date: 'Aug 23', when: 'AM', timeMin: 45, type: 'easy', title: 'Easy 4 mi recovery', desc: 'Restaurant 5–10pm.', workout: easyRun(4, '10:30'), pace: '10:30/mi', route: route(4), extras: ['pushups', 'circuit'] },
  ]},
  { week: 17, phase: 'Peak · Maintain', dates: 'Aug 24 – Aug 30', focus: 'Big peak block — 16 mi long with MP', pushups: 70, days: [
    { day: 'Mon', date: 'Aug 24', when: 'PM', timeMin: 90, type: 'quality', title: 'INTERVALS · 5×1mi @ 10K', desc: 'Big interval session — 1-mile reps near 10K race pace.', workout: intervals1mi(1, 5, '11:00', '8:45', 1), pace: 'WU 11:00 / Reps 8:45 / 400m jog rec / CD 11:00', route: 'South Lakes HS track or W&OD', extras: ['pushups', 'circuit', 'bands'] },
    { day: 'Tue', date: 'Aug 25', when: 'REST', timeMin: 5, type: 'rest', title: 'Rest day', desc: 'Restaurant 5–10pm.', workout: { structure: [], total: 0 }, pace: '—', route: '—', extras: ['pushups', 'circuit'] },
    { day: 'Wed', date: 'Aug 26', when: 'AM', timeMin: 70, type: 'easy', title: 'Easy 6 mi', desc: 'Recovery from intervals.', workout: easyRun(6, '10:00'), pace: '10:00/mi', route: route(6), extras: ['pushups'] },
    { day: 'Thu', date: 'Aug 27', when: 'AM', timeMin: 45, type: 'strength', title: 'Strength A + circuit + bands', desc: 'Restaurant 5–10pm.', workout: { structure: [], total: 0 }, pace: '—', route: 'Home gym', extras: ['pushups', 'circuit', 'bands'] },
    { day: 'Fri', date: 'Aug 28', when: 'PM', timeMin: 35, type: 'easy', title: 'Easy 3 mi', desc: 'Pre-long-run.', workout: easyRun(3, '10:15'), pace: '10:15/mi', route: route(3), extras: ['pushups'] },
    { day: 'Sat', date: 'Aug 29', when: 'AM', timeMin: 175, type: 'long', title: 'LONG · 16 mi (last 5 @ MP)', desc: 'Full race-day kit rehearsal — shoes, fuel, hydration. Restaurant 5–10pm.', workout: longRun(16, '10:15', 5, '9:28'), pace: '10:15 → 9:28', route: route(16), extras: ['pushups', 'circuit'] },
    { day: 'Sun', date: 'Aug 30', when: 'AM', timeMin: 45, type: 'easy', title: 'Easy 4 mi recovery', desc: 'Restaurant 5–10pm.', workout: easyRun(4, '10:30'), pace: '10:30/mi', route: route(4), extras: ['pushups', 'circuit'] },
  ]},
  { week: 18, phase: 'Peak · CUTBACK', dates: 'Aug 31 – Sep 6', focus: 'Recovery before peak push', pushups: 70, days: [
    { day: 'Mon', date: 'Aug 31', when: 'PM', timeMin: 60, type: 'easy', title: 'Easy 5 mi + 6 strides', desc: 'Light week.', workout: easyWithStrides(5, '10:15', 6), pace: '10:15/mi', route: route(5), extras: ['pushups', 'circuit', 'bands'] },
    { day: 'Tue', date: 'Sep 1', when: 'REST', timeMin: 5, type: 'rest', title: 'Rest day', desc: 'Restaurant 5–10pm.', workout: { structure: [], total: 0 }, pace: '—', route: '—', extras: ['pushups', 'circuit'] },
    { day: 'Wed', date: 'Sep 2', when: 'AM', timeMin: 60, type: 'easy', title: 'Easy 5 mi', desc: 'Steady.', workout: easyRun(5, '10:15'), pace: '10:15/mi', route: route(5), extras: ['pushups'] },
    { day: 'Thu', date: 'Sep 3', when: 'AM', timeMin: 45, type: 'strength', title: 'Strength A + circuit + bands', desc: 'Restaurant 5–10pm.', workout: { structure: [], total: 0 }, pace: '—', route: 'Home gym', extras: ['pushups', 'circuit', 'bands'] },
    { day: 'Fri', date: 'Sep 4', when: 'REST', timeMin: 5, type: 'rest', title: 'Rest day', desc: 'Cutback Friday.', workout: { structure: [], total: 0 }, pace: '—', route: '—', extras: ['pushups'] },
    { day: 'Sat', date: 'Sep 5', when: 'AM', timeMin: 135, type: 'long', title: 'LONG · 12 mi (last 3 @ MP)', desc: 'Cutback. Restaurant 5–10pm.', workout: longRun(12, '10:00', 3, '9:28'), pace: '10:00 → 9:28', route: route(12), extras: ['pushups', 'circuit'] },
    { day: 'Sun', date: 'Sep 6', when: 'AM', timeMin: 45, type: 'easy', title: 'Easy 4 mi recovery', desc: 'Restaurant 5–10pm.', workout: easyRun(4, '10:30'), pace: '10:30/mi', route: route(4), extras: ['pushups', 'circuit'] },
  ]},
  { week: 19, phase: 'Peak · Maintain', dates: 'Sep 7 – Sep 13', focus: 'Peak long run — 18 mi · biggest run of cycle', pushups: 70, days: [
    { day: 'Mon', date: 'Sep 7', when: 'PM', timeMin: 90, type: 'quality', title: 'TEMPO · 8 mi total', desc: '6 mi at threshold — sharpening.', workout: tempo(1, 6, 1, '11:00', '9:00'), pace: 'WU 11:00 / T 9:00 / CD 11:00', route: route(8), extras: ['pushups', 'circuit', 'bands'] },
    { day: 'Tue', date: 'Sep 8', when: 'REST', timeMin: 5, type: 'rest', title: 'Rest day', desc: 'Restaurant 5–10pm.', workout: { structure: [], total: 0 }, pace: '—', route: '—', extras: ['pushups', 'circuit'] },
    { day: 'Wed', date: 'Sep 9', when: 'AM', timeMin: 70, type: 'easy', title: 'Easy 6 mi', desc: 'Recovery.', workout: easyRun(6, '10:00'), pace: '10:00/mi', route: route(6), extras: ['pushups'] },
    { day: 'Thu', date: 'Sep 10', when: 'AM', timeMin: 45, type: 'strength', title: 'Strength A + circuit + bands', desc: 'Restaurant 5–10pm.', workout: { structure: [], total: 0 }, pace: '—', route: 'Home gym', extras: ['pushups', 'circuit', 'bands'] },
    { day: 'Fri', date: 'Sep 11', when: 'PM', timeMin: 45, type: 'easy', title: 'Easy 4 mi', desc: 'Pre-long-run.', workout: easyRun(4, '10:15'), pace: '10:15/mi', route: route(4), extras: ['pushups'] },
    { day: 'Sat', date: 'Sep 12', when: 'AM', timeMin: 200, type: 'long', title: 'LONG · 18 mi (last 6 @ MP) — THE BIG ONE', desc: 'Full kit, full fuel, full mental rehearsal. This run = your race confidence. Restaurant 5–10pm.', workout: longRun(18, '10:15', 6, '9:28'), pace: '10:15 → 9:28', route: route(18), extras: ['pushups', 'circuit'] },
    { day: 'Sun', date: 'Sep 13', when: 'AM', timeMin: 45, type: 'easy', title: 'Easy 4 mi recovery', desc: 'Walk if you need to. Restaurant 5–10pm.', workout: easyRun(4, '10:45'), pace: '10:45/mi', route: route(4), extras: ['pushups', 'circuit'] },
  ]},
  { week: 20, phase: 'Peak · TUNE-UP HALF', dates: 'Sep 14 – Sep 20', focus: 'DC Half on Sun Sep 20 — fitness check', pushups: 70, days: [
    { day: 'Mon', date: 'Sep 14', when: 'PM', timeMin: 60, type: 'easy', title: 'Easy 5 mi + 4 strides', desc: 'Pre-race week. Lighter weights this week.', workout: easyWithStrides(5, '10:15', 4), pace: '10:15/mi', route: route(5), extras: ['pushups', 'circuit', 'bands'] },
    { day: 'Tue', date: 'Sep 15', when: 'REST', timeMin: 5, type: 'rest', title: 'Rest day', desc: 'Restaurant 5–10pm.', workout: { structure: [], total: 0 }, pace: '—', route: '—', extras: ['pushups', 'circuit'] },
    { day: 'Wed', date: 'Sep 16', when: 'AM', timeMin: 60, type: 'quality', title: 'TEMPO · 5 mi sharpener', desc: '3 mi at threshold — wakes the system.', workout: tempo(1, 3, 1, '11:00', '9:10'), pace: 'WU 11:00 / T 9:10 / CD 11:00', route: route(5), extras: ['pushups'] },
    { day: 'Thu', date: 'Sep 17', when: 'AM', timeMin: 30, type: 'easy', title: 'Easy 3 mi (light strength)', desc: 'Reduce strength load. Restaurant 5–10pm.', workout: easyRun(3, '10:30'), pace: '10:30/mi', route: route(3), extras: ['pushups'] },
    { day: 'Fri', date: 'Sep 18', when: 'REST', timeMin: 5, type: 'rest', title: 'Rest + race prep', desc: 'Lay out kit. Hydrate.', workout: { structure: [], total: 0 }, pace: '—', route: '—', extras: ['pushups'] },
    { day: 'Sat', date: 'Sep 19', when: 'AM', timeMin: 25, type: 'easy', title: 'Easy 2 mi shake-out + 4 strides', desc: 'Pre-race shake-out. TRY TO GET RESTAURANT OFF.', workout: easyWithStrides(2, '10:30', 4), pace: '10:30/mi', route: 'DC area near hotel or W&OD short loop', extras: ['pushups'] },
    { day: 'Sun', date: 'Sep 20', when: 'AM', timeMin: 130, type: 'tune', title: 'TUNE-UP HALF · DC Half · target 1:58–2:02', desc: 'Run as workout: first 8 mi @ MP (9:28). Last 5 mi: hold MP or drop to 9:00–9:15 if strong. Predicts ~4:08–4:15 marathon.', workout: { structure: [{ label: 'Race', detail: '13.1 mi · first 8 @ 9:28 MP, last 5 @ 9:00–9:28', miles: 13.1 }], total: 13.1 }, pace: '9:00–9:28/mi', route: 'DC Half Marathon course (Washington, DC)', extras: ['pushups'] },
  ]},
  { week: 21, phase: 'Peak · CUTBACK', dates: 'Sep 21 – Sep 27', focus: 'Recovery from half + last meaningful long run', pushups: 60, days: [
    { day: 'Mon', date: 'Sep 21', when: 'REST', timeMin: 25, type: 'rest', title: 'REST + 30-min walk', desc: 'Post-race recovery. Massage gun.', workout: { structure: [], total: 0 }, pace: '—', route: 'Walk in neighborhood', extras: ['pushups'] },
    { day: 'Tue', date: 'Sep 22', when: 'REST', timeMin: 5, type: 'rest', title: 'Rest day', desc: 'Restaurant 5–10pm.', workout: { structure: [], total: 0 }, pace: '—', route: '—', extras: ['pushups', 'circuit'] },
    { day: 'Wed', date: 'Sep 23', when: 'AM', timeMin: 60, type: 'easy', title: 'Easy 5 mi very easy', desc: 'Just turning the legs over.', workout: easyRun(5, '10:30'), pace: '10:30/mi', route: route(5), extras: ['pushups'] },
    { day: 'Thu', date: 'Sep 24', when: 'AM', timeMin: 45, type: 'strength', title: 'Strength (light) + circuit + bands', desc: 'Lighter weights post-race. Restaurant 5–10pm.', workout: { structure: [], total: 0 }, pace: '—', route: 'Home gym', extras: ['pushups', 'circuit', 'bands'] },
    { day: 'Fri', date: 'Sep 25', when: 'REST', timeMin: 5, type: 'rest', title: 'Rest day', desc: 'Pre-long-run rest.', workout: { structure: [], total: 0 }, pace: '—', route: '—', extras: ['pushups'] },
    { day: 'Sat', date: 'Sep 26', when: 'AM', timeMin: 155, type: 'long', title: 'LONG · 14 mi (last 4 @ MP) — last big workout', desc: 'Final dress rehearsal before taper. Restaurant 5–10pm.', workout: longRun(14, '10:00', 4, '9:28'), pace: '10:00 → 9:28', route: route(14), extras: ['pushups', 'circuit'] },
    { day: 'Sun', date: 'Sep 27', when: 'AM', timeMin: 35, type: 'easy', title: 'Easy 3 mi recovery', desc: 'Restaurant 5–10pm.', workout: easyRun(3, '10:30'), pace: '10:30/mi', route: route(3), extras: ['pushups', 'circuit'] },
  ]},

  // ===== PHASE 4: TAPER (W22–24) =====
  { week: 22, phase: 'TAPER -25%', dates: 'Sep 28 – Oct 4', focus: 'Volume down 25%, intensity stays', pushups: 50, days: [
    { day: 'Mon', date: 'Sep 28', when: 'PM', timeMin: 70, type: 'quality', title: 'TEMPO · 6 mi total', desc: '4 mi at threshold.', workout: tempo(1, 4, 1, '11:00', '9:00'), pace: 'WU 11:00 / T 9:00 / CD 11:00', route: route(6), extras: ['pushups', 'circuit', 'bands'] },
    { day: 'Tue', date: 'Sep 29', when: 'REST', timeMin: 5, type: 'rest', title: 'Rest day', desc: 'Restaurant 5–10pm.', workout: { structure: [], total: 0 }, pace: '—', route: '—', extras: ['pushups', 'circuit'] },
    { day: 'Wed', date: 'Sep 30', when: 'AM', timeMin: 60, type: 'easy', title: 'Easy 5 mi', desc: 'Steady.', workout: easyRun(5, '10:00'), pace: '10:00/mi', route: route(5), extras: ['pushups'] },
    { day: 'Thu', date: 'Oct 1', when: 'AM', timeMin: 40, type: 'strength', title: 'Strength (lighter) + circuit + bands', desc: 'Mobility-focused. Restaurant 5–10pm.', workout: { structure: [], total: 0 }, pace: '—', route: 'Home gym', extras: ['pushups', 'circuit', 'bands'] },
    { day: 'Fri', date: 'Oct 2', when: 'PM', timeMin: 35, type: 'easy', title: 'Easy 3 mi', desc: 'Pre-long-run.', workout: easyRun(3, '10:00'), pace: '10:00/mi', route: route(3), extras: ['pushups'] },
    { day: 'Sat', date: 'Oct 3', when: 'AM', timeMin: 130, type: 'long', title: 'LONG · 12 mi (last 3 @ MP)', desc: 'Comfortable, controlled. Restaurant 5–10pm.', workout: longRun(12, '10:00', 3, '9:28'), pace: '10:00 → 9:28', route: route(12), extras: ['pushups', 'circuit'] },
    { day: 'Sun', date: 'Oct 4', when: 'AM', timeMin: 35, type: 'easy', title: 'Easy 3 mi recovery', desc: 'Restaurant 5–10pm.', workout: easyRun(3, '10:30'), pace: '10:30/mi', route: route(3), extras: ['pushups', 'circuit'] },
  ]},
  { week: 23, phase: 'TAPER -50%', dates: 'Oct 5 – Oct 11', focus: 'Volume down 50%, intensity stays', pushups: 40, days: [
    { day: 'Mon', date: 'Oct 5', when: 'PM', timeMin: 60, type: 'quality', title: 'MP intervals · 4×1mi @ MP', desc: 'Race pace rehearsal.', workout: intervals1mi(1, 4, '11:00', '9:28', 1), pace: 'Reps 9:28 (MP)', route: route(6), extras: ['pushups', 'circuit', 'bands'] },
    { day: 'Tue', date: 'Oct 6', when: 'REST', timeMin: 5, type: 'rest', title: 'Rest day', desc: 'Restaurant 5–10pm.', workout: { structure: [], total: 0 }, pace: '—', route: '—', extras: ['pushups', 'circuit'] },
    { day: 'Wed', date: 'Oct 7', when: 'AM', timeMin: 50, type: 'easy', title: 'Easy 4 mi', desc: 'Recovery.', workout: easyRun(4, '10:00'), pace: '10:00/mi', route: route(4), extras: ['pushups'] },
    { day: 'Thu', date: 'Oct 8', when: 'AM', timeMin: 35, type: 'strength', title: 'Strength (very light, mobility) + circuit', desc: 'Restaurant 5–10pm.', workout: { structure: [], total: 0 }, pace: '—', route: 'Home gym', extras: ['pushups', 'circuit', 'bands'] },
    { day: 'Fri', date: 'Oct 9', when: 'REST', timeMin: 5, type: 'rest', title: 'Rest day', desc: 'Pre-long-run rest.', workout: { structure: [], total: 0 }, pace: '—', route: '—', extras: ['pushups'] },
    { day: 'Sat', date: 'Oct 10', when: 'AM', timeMin: 90, type: 'long', title: 'LONG · 8 mi', desc: 'Feel sharp, not tired. Restaurant 5–10pm.', workout: longRun(8, '10:00'), pace: '10:00/mi', route: route(8), extras: ['pushups', 'circuit'] },
    { day: 'Sun', date: 'Oct 11', when: 'AM', timeMin: 35, type: 'easy', title: 'Easy 3 mi', desc: 'Restaurant 5–10pm.', workout: easyRun(3, '10:30'), pace: '10:30/mi', route: route(3), extras: ['pushups', 'circuit'] },
  ]},
  { week: 24, phase: 'TAPER -65%', dates: 'Oct 12 – Oct 18', focus: 'Sharpen + rest — last full week before race', pushups: 40, days: [
    { day: 'Mon', date: 'Oct 12', when: 'PM', timeMin: 55, type: 'easy', title: 'Easy 5 mi + 4 pickups @ MP', desc: '4 × 30-sec pickups at MP turnover.', workout: easyWithStrides(5, '10:00', 4), pace: '10:00/mi · pickups 9:28', route: route(5), extras: ['pushups', 'circuit', 'bands'] },
    { day: 'Tue', date: 'Oct 13', when: 'REST', timeMin: 5, type: 'rest', title: 'Rest day', desc: 'Restaurant 5–10pm.', workout: { structure: [], total: 0 }, pace: '—', route: '—', extras: ['pushups', 'circuit'] },
    { day: 'Wed', date: 'Oct 14', when: 'AM', timeMin: 50, type: 'easy', title: 'Easy 4 mi', desc: 'Steady.', workout: easyRun(4, '10:00'), pace: '10:00/mi', route: route(4), extras: ['pushups'] },
    { day: 'Thu', date: 'Oct 15', when: 'AM', timeMin: 25, type: 'rest', title: 'Mobility only — no strength', desc: 'Foam roll, stretch, light bands. Restaurant 5–10pm.', workout: { structure: [], total: 0 }, pace: '—', route: 'Home', extras: ['pushups', 'bands'] },
    { day: 'Fri', date: 'Oct 16', when: 'REST', timeMin: 5, type: 'rest', title: 'Rest day', desc: 'Pre-long-run rest.', workout: { structure: [], total: 0 }, pace: '—', route: '—', extras: ['pushups'] },
    { day: 'Sat', date: 'Oct 17', when: 'AM', timeMin: 70, type: 'long', title: 'LONG · 6 mi (last 2 @ MP) — last meaningful run', desc: 'Final pace check. Restaurant 5–10pm.', workout: longRun(6, '10:00', 2, '9:28'), pace: '10:00 → 9:28', route: route(6), extras: ['pushups', 'circuit'] },
    { day: 'Sun', date: 'Oct 18', when: 'AM', timeMin: 35, type: 'easy', title: 'Easy 3 mi shake-out', desc: 'Keep it short. Restaurant 5–10pm.', workout: easyRun(3, '10:00'), pace: '10:00/mi', route: route(3), extras: ['pushups', 'circuit'] },
  ]},

  // ===== RACE WEEK (W25) =====
  { week: 25, phase: 'RACE WEEK', dates: 'Oct 19 – Oct 25', focus: 'Sharpen, hydrate, carb-load, race', pushups: 30, days: [
    { day: 'Mon', date: 'Oct 19', when: 'REST', timeMin: 25, type: 'rest', title: 'REST + 20-min walk + foam roll', desc: 'Hydration ramp begins (100 oz/day).', workout: { structure: [], total: 0 }, pace: '—', route: 'Walk', extras: ['pushups'] },
    { day: 'Tue', date: 'Oct 20', when: 'AM', timeMin: 50, type: 'easy', title: 'Easy 4 mi + 4 strides @ MP turnover', desc: 'Heart rate stays low. Strides about turnover, not effort.', workout: easyWithStrides(4, '10:00', 4), pace: '10:00/mi', route: route(4), extras: ['pushups'] },
    { day: 'Wed', date: 'Oct 21', when: 'AM', timeMin: 35, type: 'easy', title: 'Easy 3 mi', desc: 'Begin moderate carb-load. CUT KIMCHI, SPICY, RAW VEG from today.', workout: easyRun(3, '10:00'), pace: '10:00/mi', route: route(3), extras: ['pushups'] },
    { day: 'Thu', date: 'Oct 22', when: 'AM', timeMin: 25, type: 'easy', title: 'Easy 2 mi shake-out + 4 strides', desc: 'Last run before expo. Lay out race kit tonight.', workout: easyWithStrides(2, '10:00', 4), pace: '10:00/mi', route: route(2), extras: ['pushups'] },
    { day: 'Fri', date: 'Oct 23', when: 'REST', timeMin: 5, type: 'rest', title: 'REST + Expo + Carb-load', desc: 'Pickup bib at MCM Expo. Aggressive carb-load. TRY TO GET RESTAURANT OFF.', workout: { structure: [], total: 0 }, pace: '—', route: 'MCM Expo', extras: ['pushups'] },
    { day: 'Sat', date: 'Oct 24', when: 'AM', timeMin: 25, type: 'easy', title: 'Easy 20-min shake-out + 4×20s pickups', desc: 'Off feet rest of day. Last meal by 7pm. Bed by 9pm. ABSOLUTELY GET RESTAURANT OFF.', workout: easyWithStrides(2, '10:00', 4), pace: '10:00/mi', route: 'Hotel/Arlington area or W&OD short', extras: [] },
    { day: 'Sun', date: 'Oct 25', when: 'AM', timeMin: 250, type: 'race', title: 'MARINE CORPS MARATHON · 26.2 mi @ 9:28 = 4:08:00', desc: 'Wake 4:30am. Howitzer at 7:55am. Iwo Jima finish.', workout: { structure: [{ label: 'Race', detail: '26.2 mi marathon — Pentagon → DC → Pentagon → Iwo Jima', miles: 26.2 }], total: 26.2 }, pace: '9:28/mi target', route: 'MCM 51 — Pentagon start, Iwo Jima finish', extras: [] },
  ]},
];

// Sum up total miles for each week (computed from workouts)
PLAN.forEach(wk => {
  wk.miles = wk.days.reduce((sum, d) => sum + (d.workout?.total || 0), 0);
  wk.miles = Math.round(wk.miles * 10) / 10;
});

// ============================================================
// EXERCISE LIBRARY
// ============================================================
const EXERCISES = {
  strength: [
    {
      id: 'goblet-squat',
      name: 'Goblet Squat',
      sets: '3 sets × 6 reps',
      equipment: 'One dumbbell',
      videoUrl: 'https://www.youtube.com/watch?v=MeIiIdhvXT4',
      videoLabel: 'Squat University demo',
      description: 'Hold a dumbbell vertically at chest height with both hands. Feet shoulder-width apart, toes slightly out. Sit back and down as if into a chair, knees tracking over toes. Drive through heels to stand. Builds quad and glute strength for hill running.',
      formCues: ['Chest up, eyes forward', 'Knees out — track over toes', 'Drive through heels', 'Hip crease below knee at bottom'],
    },
    {
      id: 'romanian-deadlift',
      name: 'Romanian Deadlift (RDL)',
      sets: '3 sets × 6 reps',
      equipment: 'Two dumbbells',
      videoUrl: 'https://www.youtube.com/watch?v=hCDzSR6bW10',
      videoLabel: 'Athlean-X form breakdown',
      description: 'Stand with dumbbells in front of thighs, feet hip-width. Hinge at the hips, push butt back, slight knee bend. Lower dumbbells along the front of legs until you feel a deep hamstring stretch. Drive hips forward to stand. Critical for late-race power.',
      formCues: ['Hinge at hip, not bend at waist', 'Push hips back — not down', 'Soft knee bend, not a squat', 'Dumbbells stay close to legs'],
    },
    {
      id: 'bulgarian-split-squat',
      name: 'Bulgarian Split Squat',
      sets: '3 sets × 6 reps each side',
      equipment: 'Two dumbbells, bench',
      videoUrl: 'https://www.youtube.com/watch?v=2C-uNgKwPLE',
      videoLabel: 'Form demo',
      description: 'Stand 2-3 feet in front of bench. Place top of one foot behind on bench. Hold dumbbells at sides. Lower until front thigh is parallel to ground, back knee approaching floor. Drive through front heel to stand. The most running-specific lift.',
      formCues: ['Front knee tracks over toes', 'Most weight on front leg', 'Stay tall through torso', 'Step far enough forward — not too close to bench'],
    },
    {
      id: 'dumbbell-bench',
      name: 'Dumbbell Bench Press',
      sets: '3 sets × 8 reps',
      equipment: 'Two dumbbells, bench',
      videoUrl: 'https://www.youtube.com/watch?v=VmB1G1K7v94',
      videoLabel: 'Form guide',
      description: 'Lie on back on bench, dumbbells at chest level, palms forward. Press up until arms extend (not locked out). Lower with control to chest. Upper body posture support — keeps you from slumping in late-race miles.',
      formCues: ['Shoulder blades pinched back into bench', 'Feet flat on floor', 'Slight arch in lower back natural', 'Don\'t bounce at the bottom'],
    },
    {
      id: 'single-arm-row',
      name: 'Single-Arm Dumbbell Row',
      sets: '3 sets × 8 reps each side',
      equipment: 'One dumbbell, bench',
      videoUrl: 'https://www.youtube.com/watch?v=pYcpY20QaE8',
      videoLabel: 'Form guide',
      description: 'One knee and same-side hand on bench, opposite leg planted. Hold dumbbell in free hand, arm extended. Row dumbbell to side of ribcage, elbow back. Lower with control. Counters running\'s forward-shoulder bias.',
      formCues: ['Back flat, parallel to ground', 'Pull elbow back, not out', 'Squeeze shoulder blade at top', 'Lower with control'],
    },
    {
      id: 'hip-thrust',
      name: 'Hip Thrust',
      sets: '3 sets × 10 reps',
      equipment: 'One dumbbell, bench',
      videoUrl: 'https://www.youtube.com/watch?v=xDmFkJxPzeM',
      videoLabel: 'Bret Contreras (the godfather of hip thrusts) demo',
      description: 'Sit on floor with upper back against bench, knees bent, feet flat. Place dumbbell on hips. Drive heels into floor and thrust hips up until body forms straight line from knees to shoulders. Squeeze glutes hard at top.',
      formCues: ['Tuck chin, don\'t crane neck', 'Drive through heels not toes', 'Squeeze glutes at top — count 1 second', 'Don\'t hyperextend lower back'],
    },
    {
      id: 'calf-raise',
      name: 'Single-Leg Calf Raise',
      sets: '3 sets × 12 reps each side',
      equipment: 'Step or curb (optional dumbbell)',
      videoUrl: 'https://www.youtube.com/watch?v=mdb0Ze1IZkc',
      videoLabel: 'Form demo',
      description: 'Stand on one foot on edge of step, heel hanging off. Lower heel below step level, then raise high onto ball of foot. Hold dumbbell in same-side hand for added load. Achilles and calf resilience — prevents Achilles tendinitis.',
      formCues: ['Slow eccentric (lowering) — 3 seconds down', 'Full range — heel below step', 'Pause at top', 'No bounce'],
    },
    {
      id: 'plank',
      name: 'Plank',
      sets: 'Hold 60 sec',
      equipment: 'None',
      videoUrl: 'https://www.youtube.com/watch?v=ASdvN_XEl_c',
      videoLabel: 'Form check',
      description: 'Forearms on floor, elbows under shoulders. Body in straight line from head to heels. Brace core — imagine someone about to punch your stomach. Don\'t let hips sag or pike.',
      formCues: ['Straight line shoulder to ankle', 'Squeeze glutes', 'Brace core hard', 'Breathe — don\'t hold breath'],
    },
  ],
  circuit: [
    {
      id: 'bw-squat',
      name: 'Bodyweight Squat',
      sets: '15 reps',
      videoUrl: 'https://www.youtube.com/watch?v=YaXPRqUwItQ',
      videoLabel: 'Form demo',
      description: 'Same form as goblet squat, no weight. Feet shoulder-width, sit back into a chair, drive through heels.',
    },
    {
      id: 'glute-bridge',
      name: 'Glute Bridge',
      sets: '10 reps',
      videoUrl: 'https://www.youtube.com/watch?v=OUgsJ8-Vi0E',
      videoLabel: 'Form demo',
      description: 'Lie on back, knees bent, feet flat. Drive through heels to lift hips up. Squeeze glutes at top. From W5+: single-leg variation. From W12+: hip thrusts on bench.',
    },
    {
      id: 'plank-hold',
      name: 'Plank Hold',
      sets: 'Build: 30s → 45s (W5+) → 60s (W10+)',
      videoUrl: 'https://www.youtube.com/watch?v=ASdvN_XEl_c',
      videoLabel: 'Form check',
      description: 'Forearms on floor, body in straight line. Brace core, breathe steadily.',
    },
    {
      id: 'side-plank',
      name: 'Side Plank',
      sets: '30 sec each side',
      videoUrl: 'https://www.youtube.com/watch?v=K2VljzCC16g',
      videoLabel: 'Form demo',
      description: 'Lie on side, prop up on forearm, elbow under shoulder. Stack feet. Lift hips so body forms straight line. Hold.',
    },
    {
      id: 'dead-bug',
      name: 'Dead Bug',
      sets: '10 each side',
      videoUrl: 'https://www.youtube.com/watch?v=g_BYB0R-4Ws',
      videoLabel: 'Form guide',
      description: 'Lie on back, arms straight up, knees bent at 90° above hips. Lower opposite arm and leg toward floor while keeping lower back pressed flat. Return and switch sides.',
    },
  ],
  bands: [
    {
      id: 'monster-walk',
      name: 'Monster Walk',
      sets: '20 steps each direction',
      videoUrl: 'https://www.youtube.com/watch?v=g0X0lq-sV4w',
      videoLabel: 'Form demo',
      description: 'Loop band around ankles or just above knees. Half-squat stance. Take big steps forward, maintaining tension. Walk forward, then backward.',
    },
    {
      id: 'lateral-walk',
      name: 'Lateral Band Walk',
      sets: '20 steps each direction',
      videoUrl: 'https://www.youtube.com/watch?v=Xd1XlvyxWZE',
      videoLabel: 'Form guide',
      description: 'Band around ankles or knees. Half-squat. Step sideways, maintain tension, control return foot. Don\'t let knees collapse inward.',
    },
    {
      id: 'clamshell',
      name: 'Clamshell',
      sets: '15 each side',
      videoUrl: 'https://www.youtube.com/watch?v=B9Fz4yZTgQg',
      videoLabel: 'Form demo',
      description: 'Lie on side, knees bent at 45°, hips stacked. Band around thighs above knees. Keep feet together, lift top knee against band. Lower with control.',
    },
    {
      id: 'banded-bridge',
      name: 'Banded Glute Bridge',
      sets: '15 reps',
      videoUrl: 'https://www.youtube.com/watch?v=OUgsJ8-Vi0E',
      videoLabel: 'Glute bridge form',
      description: 'Glute bridge with band around thighs above knees. Push knees out against band as you lift hips.',
    },
    {
      id: 'pull-apart',
      name: 'Band Pull-Apart',
      sets: '15 reps',
      videoUrl: 'https://www.youtube.com/watch?v=5Ab1HbeXm70',
      videoLabel: 'Form guide',
      description: 'Hold band at shoulder height, arms extended forward. Pull band apart by squeezing shoulder blades together. Keep arms straight.',
    },
  ],
};

// Smoothie recipes
const SMOOTHIES = [
  {
    name: 'Pre-run',
    when: '60–90 min before running',
    cal: 280, protein: 14, carbs: 50, fat: 4,
    ingredients: ['1 frozen banana', '1 cup oat milk', '1 tbsp honey', '¼ tsp salt', '½ scoop protein powder'],
    why: 'Quick carbs from banana and honey. Low fat and low fiber so it won\'t sit in your gut. Salt for hydration retention.',
  },
  {
    name: 'Post-run recovery',
    when: 'Within 30 min of finishing',
    cal: 430, protein: 32, carbs: 50, fat: 12,
    ingredients: ['1 frozen banana', '1 cup oat milk', '1 scoop chocolate protein', '1 tbsp peanut butter', '1 cup spinach', 'Ice'],
    why: 'Roughly 3:1 carb-to-protein ratio — well-studied optimal for glycogen restoration plus muscle protein synthesis. Spinach for iron (vegetarian critical).',
  },
  {
    name: 'Breakfast meal-replacement',
    when: 'Busy weekday mornings',
    cal: 580, protein: 38, carbs: 75, fat: 14,
    ingredients: ['½ cup rolled oats', '1 frozen banana', '1 cup oat milk', '1 scoop protein', '1 tbsp almond butter', '1 cup mixed berries', '1 cup spinach', 'Ice'],
    why: 'Full meal in a glass. Oats for slow-burn carbs and beta-glucan fiber. Berries for antioxidants. Spinach for iron and B-vitamins.',
  },
  {
    name: 'Post-long-run (Sat AM)',
    when: 'After 14+ mi long runs',
    cal: 520, protein: 28, carbs: 90, fat: 5,
    ingredients: ['1 cup oat milk', '1 cup tart cherry juice', '1 frozen banana', '1 scoop protein', '1 tbsp honey', '1 tsp ground ginger', 'Ice'],
    why: 'Tart cherry juice has clinical evidence for reducing post-exercise muscle soreness 24–48 hr later. Ginger for GI comfort post-gel.',
  },
  {
    name: 'Evening recovery / sleep aid',
    when: '30–60 min before bed on hard days',
    cal: 280, protein: 8, carbs: 38, fat: 12,
    ingredients: ['1 cup oat milk', '½ frozen banana', '1 tbsp almond butter', '1 tsp cocoa powder', 'Pinch cinnamon', '1 tsp honey'],
    why: 'Magnesium from cocoa and almonds helps sleep onset. Tryptophan precursors from oat milk. Light on protein at night.',
  },
];

// Restaurant guide
const RESTAURANT = {
  goodOptions: [
    { dish: 'Plain white rice', why: 'Ideal pre-long-run carbs. Easy to digest.' },
    { dish: 'Plain congee (no meat)', why: 'Perfect race-week fuel. Hydrating, gentle on stomach.' },
    { dish: 'Steamed bok choy, gai lan, choy sum', why: 'Iron, folate, vitamin K. Vegetarian must-have.' },
    { dish: 'Stir-fried mixed vegetables (light oil)', why: 'Vitamins, fiber, satiety. Ask for light oil.' },
    { dish: 'Mapo tofu (request light oil)', why: 'Protein + carbs + heat. Sichuan peppercorn aids circulation.' },
    { dish: 'Egg drop or wonton soup', why: 'Hydration, light protein, warmth.' },
    { dish: 'Steamed dumplings (vegetable, jiaozi)', why: 'Carbs + vegetables. Not pan-fried.' },
    { dish: 'Plain steamed tofu', why: 'Protein. Soy sauce on the side (control sodium).' },
    { dish: 'Hot pot (vegetables, tofu, mushrooms, glass noodles)', why: 'Customizable, broth-based, low fat.' },
    { dish: 'Hot tea (oolong, pu-erh, jasmine)', why: 'Counts toward hydration. Aids digestion.' },
  ],
  limitOptions: [
    { dish: 'General Tso\'s tofu, sweet and sour anything', why: 'Sugar bomb. Hundreds of empty calories.' },
    { dish: 'Lo mein, chow mein', why: 'Refined carbs swimming in oil.' },
    { dish: 'Restaurant fried rice', why: 'Calorie-dense. Often 800+ cal per serving.' },
    { dish: 'Spring rolls, pan-fried dumplings, scallion pancakes', why: 'Fried in seed oil. Inflammatory load.' },
    { dish: 'Boba tea', why: 'Sugar bomb. 50–80g sugar per cup.' },
    { dish: 'Heavy soy/oyster sauce dishes', why: 'Sodium overload.' },
  ],
};

// MCM course mile-by-mile
const COURSE = [
  { mi: '0–2', section: 'The Howitzer Start', desc: 'Pentagon area. Downhill on Route 110, then onto GW Parkway. Crowded — let the field clear. Pace 9:35–9:40, NOT goal pace.' },
  { mi: '3–5', section: 'GW Parkway → Key Bridge', desc: 'Beautiful views of the Potomac. Settle into rhythm at goal pace 9:28. Cross Key Bridge into Georgetown.' },
  { mi: '6–8', section: 'Georgetown M Street', desc: 'Crowd support starts here. Up M Street, then turn south. First gel at mile 4 if not already.' },
  { mi: '9–10', section: 'Kennedy Center → Lincoln Memorial', desc: 'Iconic stretch. Lincoln Memorial on your left. You\'re running through history. Hold pace, enjoy this.' },
  { mi: '11–13', section: 'Hains Point Approach', desc: 'Cross Memorial Bridge. Half marathon split here — should be ~2:04. If significantly faster, you went out too hot.' },
  { mi: '14–18', section: 'HAINS POINT — DEATH ZONE', desc: 'Flat, exposed, mentally crushing. Long out-and-back loop on the peninsula. No crowds. Wind off the river. This is where casual marathoners blow up. Mile-by-mile focus only. Caffeine in your back pocket.' },
  { mi: '19–22', section: 'The Wall Section', desc: 'Past Hains Point, through the National Mall area. Caffeine gel at mile 20. Your body asks if you can do this. Yes. You trained for this exact moment.' },
  { mi: '23–25', section: 'Crossing back to Virginia', desc: 'Cross 14th Street Bridge into Virginia. If you held pace through 22, you have legs to drop pace here. Pass dozens of runners who blew up.' },
  { mi: '26–26.2', section: 'IWO JIMA HILL', desc: 'The famous final climb up to the Marine Corps War Memorial. Brutally short, brutally steep. Survive it. Finish line is right at the top.' },
];
