
window.PB = {};

PB.roadmap = [
  { id:"p1", title:"Phase 1 · Foundations", when:"Weeks 1–2", items:[
    "Read Dalton – Mind Over Markets: the TPO, Initial Balance, Value Area sections",
    "Learn the whole dictionary in tab 01 (be able to say each entry’s definition + usage out loud)",
    "On ATAS Daily Profile RTH: mark POC, VAH, VAL, IB, open/close yourself for the last 20 NQ sessions",
    "In those 20 sessions, circle every single print, tail (excess) and poor high/low",
    "Compute the Rotation Factor by hand for 5 sessions, compare with your first impression",
    "Pass: Quiz 01 ≥ 80% and 20 sessions fully marked"
  ]},
  { id:"p2", title:"Phase 2 · Day structure", when:"Weeks 3–4", items:[
    "Classify day type + shape + open type for 30 sessions (store in a Notion database or a sheet)",
    "Record the day-to-day value relationship for those 30 sessions",
    "Log the IB Journal (tab 03) for 30 sessions: average IB width, % of days with range extension, % reaching 1.5x/2x",
    "Count: what % of days the IB is broken on both sides (neutral) on your NQ",
    "Practise spike rules: find 10 days with a late spike, record where the next day opened and the outcome",
    "Pass: Quiz 02 ≥ 80%, reclassify 10 random sessions with ≥ 8 correct"
  ]},
  { id:"p3", title:"Phase 3 · Levels & Plan", when:"Weeks 5–6", items:[
    "Every evening use the Plan Builder (tab 07) to plan 10 consecutive sessions, trade them on sim",
    "Each plan has exactly 2 scenarios (A/B), each with zone, trigger, target, invalidation",
    "Backtest the 80% rule on ATAS Market Replay: 20 times, record how often the VA is traversed",
    "Backtest IB extension 1.5x/2x when the IB is narrow: 20 times",
    "Score levels (table in tab 04) for every zone before a sim entry",
    "Pass: 10 consecutive plans written before 9:25 ET, ≥ 90% of trades inside the plan"
  ]},
  { id:"p4", title:"Phase 4 · VWAP RTH + CVD add-in", when:"Weeks 7–8", items:[
    "Every session record the VWAP state (balance / trend / phase change) at 10:30 ET",
    "Record the VWAP vs dPOC relationship at 10:30 and 11:30 ET",
    "Set the CVD reset at 9:30 ET on the M1 execution chart, same anchor as VWAP RTH",
    "Collect 20 CVD divergences at TPO zones, classify exhaustion / absorption, record the outcome",
    "Grade every setup A++ / A+ / B / C, only trade A+ or better on sim",
    "Pass: Quiz 04 + 05 ≥ 80%, A+ setup win rate on sim measured over ≥ 30 trades"
  ]},
  { id:"p5", title:"Phase 5 · Live prop trading", when:"Week 9+", items:[
    "Live: max 2–3 trades/day, A+ setups or better only, stop at 11:30 ET (23:30 Vietnam)",
    "Weekly review: rate of correct A/B scenarios, repeated mistakes, trades outside the plan",
    "Optional: switch on Tier 4 scalping only after 20 consecutive sessions with ≥ 90% of trades in plan",
    "50-question final test (tab 09) ≥ 40/50 three times in a row"
  ]}
];

PB.glossary = [
  { n:"TPO & Period", c:"", def:"Each cell (or letter) = a price traded during a 30-minute period. NQ RTH has 13 periods: A 9:30, B 10:00, C 10:30, D 11:00, E 11:30, F 12:00, G 12:30, H 13:00, I 13:30, J 14:00, K 14:30, L 15:00, M 15:30 ET.", read:"The more cells stacked horizontally at a price, the more time the market spent there.", use:"Your trade window (9:30–11:30 ET) only covers A–D. Every in-session decision is based on A–D versus yesterday’s profile." },
  { n:"Presence vs Participation", c:"", def:"Presence = time spent at a price (TPO). Participation = volume actually traded at a price (volume profile).", read:"Thick TPO + thin volume = present but few participants: weak value. Thin TPO + thick volume = big business passing quickly: a strong level.", use:"This is why your template puts TPO and volume profile side by side. Prefer levels that both confirm." },
  { n:"POC (TPOC vs VPOC)", c:"poc", def:"TPOC = the price with the most TPOs (time). VPOC = the price with the most volume. Usually close to each other but not necessarily.", read:"The POC is the 'fairest' price of the session. A high POC = buyers built value high (P); a low POC = b.", use:"Yesterday’s POC is the natural target of every rotation inside the VA. A POC not yet revisited = naked POC, a magnet." },
  { n:"Value Area (VAH / VAL)", c:"va", def:"The area holding ~70% of TPOs (or volume) around the POC. Upper edge VAH, lower edge VAL.", read:"Inside the VA = fair value, both sides agree. Outside the VA = an 'unfair'price, the market either rejects it quickly or accepts it and builds new value.", use:"The VA edges are the most important Tier 2 levels of the day: fade on rejection, go with acceptance (tab 04)." },
  { n:"Initial Balance (IB)", c:"ib", def:"The range of A + B, i.e. 9:30–10:30 ET. IB width = IB High − IB Low.", read:"An IB narrow versus average = the two sides have not agreed yet, a strong range extension is likely. A wide IB = most of the day’s range is in, leaning to rotation.", use:"The IB is the anchor of the IB model you use. Compare IB width with the 20-session average (tool in tab 04)." },
  { n:"Range Extension (RE)", c:"ib", def:"Price moves outside the IB after 10:30 ET.", read:"One-sided RE = initiative activity on that side. Two-sided RE = Neutral day.", use:"RE with a sloping VWAP and CVD in the same direction → go with it, target IB 1.5x/2x." },
  { n:"Single prints", c:"", def:"Price rows with only a single letter, inside the profile (not at an extreme).", read:"Price moved fast in one direction with no two-way trade = an imbalance area.", use:"The first test is usually support/resistance. If fully filled and price is accepted, the imbalance has been repaired and the level is spent." },
  { n:"Tail / Excess", c:"va", def:"≥ 2 consecutive single-print rows at a session extreme. Buying tail at the low, selling tail at the high.", read:"Responsive participants rejected price very fast: the auction on that side is complete.", use:"A high/low with a tail is a strong level, do not expect it to be swept soon. A stop can sit beyond the tail." },
  { n:"Poor high / Poor low", c:"", def:"An extreme where ≥ 2 different letters touch exactly the same price, with no tail. Also called an unfinished auction.", read:"The market stopped there because it ran out of participants in the session, not because of strong rejection.", use:"Magnet: usually swept in later sessions. Use it as a target, do not place a stop right behind it." },
  { n:"Open / Close marker", c:"", def:"The arrows on your template: the 9:30 open price and the 16:00 close price.", read:"A close near the extreme in the day’s direction = strong, likely to continue. A close back in the middle = balance.", use:"Close location feeds the spike rules and the expectation for the next day’s open." },
  { n:"Halfback & IB mid", c:"", def:"Halfback = the midpoint of the day’s current range. IB mid = the midpoint of the IB.", read:"Price above halfback = buyers are winning the session; below = sellers.", use:"A Tier 4 scalping level, also where to move the stop to breakeven." },
  { n:"Rotation Factor (RF)", c:"", def:"The total score comparing each period’s high/low with the previous period (+1 higher, −1 lower, 0 equal).", read:"Large positive RF = upward rotation dominates; near 0 = two-sided.", use:"Quick confirmation of the open type after A–C. Not an entry signal." },
  { n:"Naked POC (nPOC)", c:"poc", def:"The POC of an older session that price has not come back to touch.", read:"Old fair value not yet retested.", use:"A high-probability target. Several nPOCs close together = a Tier 1 zone." },
  { n:"Spike", c:"", def:"A strong one-directional move in the last 1–2 periods of the session (L, M).", read:"Not yet validated by the market. Where the next day opens relative to the spike tells you whether it was real or fake.", use:"See the spike rules table in tab 04." },
  { n:"Overnight inventory", c:"lvl", def:"Whether most ETH trading sits above (net long) or below (net short) yesterday’s RTH close.", read:"Heavily one-sided inventory often gets 'unwound' in the opposite direction in the first 30–60 minutes of RTH.", use:"Overnight inventory net long + open at the ON high → be careful buying the open; combine with the OSR model (sweep ON range → reclaim)." },
  { n:"Composite profile", c:"lvl", def:"Merging several days with overlapping VAs into one large profile.", read:"Overlapping multi-day VAs = durable fair value. Composite edges are stronger than a single-day VA edge.", use:"Example in the template: 30/10, 02/11, 04/11 have overlapping VAs around 28,360–28,880, ideal for a composite." }
];

PB.tiers = [
  ["1","Weekly VAH / VAL / POC","Tab Weekly Profile","The week’s value, higher-timeframe bias","Price inside the weekly VA → balance, favour rotation. Open outside the weekly VA → favour going with it",false],
  ["1","Composite VA (multi-day)","Merged profile","Durable multi-day fair value","Composite edges are the strongest fade zones; break and acceptance → multi-day trend",false],
  ["1","Multi-day naked POC","Extended POC","Old untested fair value","Priority target; the first touch often reacts",false],
  ["2","PD VAH / PD VAL","Yesterday’s Daily Profile RTH","Edge of yesterday’s fair value","Fade on rejection; go with acceptance; 80% rule when coming back into the VA",false],
  ["2","PD POC","Yesterday’s Daily Profile RTH","Yesterday’s fairest price","Target of rotations inside the VA, bias pivot",false],
  ["2","PD High / PD Low","Yesterday’s Daily Profile RTH","Liquidity, yesterday’s stops","Sweep & reclaim (same logic as OSR); if poor, it is a magnet",false],
  ["2","Poor high / poor low","Marked by hand","Unfinished auction","Magnet / target, no stop right behind it",false],
  ["2","Single prints / RTH gap","Profile + so open/close","Imbalance area","Support/resistance on the first test; fully filled = spent",false],
  ["3","ON High / ON Low / ON POC","Tab Daily Profile ETH","Overnight inventory boundary","Your OSR model: sweep the ON edge → reclaim → retest",false],
  ["3","RTH Open (9:30)","Marker open","Open-type classification anchor","Holding above/below the open after 30 minutes = who won the A period",false],
  ["3","IB High / IB Low","10:30 ET","Range extension boundary","Narrow IB → go with the breakout; wide IB → fade the IB edges",false],
  ["3","VWAP RTH ± SD","Chart M1 execution","The session’s dynamic value","Confluence, xem tab 05",false],
  ["4","A-period High / Low","First 30 minutes","Opening range","Break + retest; fail break = ORR",true],
  ["4","IB mid, IB 1.5x / 2x","Computed from the IB","Target extension","Take partial profits; 2x is rare, trend days only",true],
  ["4","Developing POC (dPOC)","Today’s profile","Value in motion","dPOC migrates in the trade direction → pullbacks to the dPOC are add points",true],
  ["4","Halfback","Day’s mid-range","Who is winning the session so far","Move stop to breakeven, filter scalp direction",true],
  ["4","Period High / Low (30m)","Each letter","Micro structure","Trailing stop: in an uptrend, stop below the previous period’s low",true],
  ["4","Intraday single prints","Today’s profile","New imbalance","The first retest is a scalp entry",true],
  ["4","VWAP ±1 SD","Chart M1","Bingbong zone","Scalp rotations when VWAP is flat",true]
];


PB.dayTypes = {
  normal:{ name:"Normal", periods:[[12,30],[13,29],[16,26],[15,24],[17,25],[18,24],[16,23],[17,25],[19,24],[18,23],[17,23],[19,25],[20,23]], open:20, close:21,
    sig:"Very wide IB (A and B have made almost the whole range). Little or no range extension.",
    mean:"Large timeframe participants came in early and set the boundaries for the whole day. The rest is rotation.",
    act:"Fade the IB edges on CVD exhaustion. Target IB mid / POC. Do not chase breakouts." },
  nvar:{ name:"Normal Variation", periods:[[16,26],[15,24],[18,25],[22,31],[25,33],[26,32],[24,30],[25,31],[26,30],[25,31],[24,29],[25,30],[26,29]], open:19, close:28,
    sig:"Average IB, one-sided range extension, usually about 1.2–2x the IB.",
    mean:"Initiative buyers (or sellers) appear after the IB and move value. The most common day type on index futures.",
    act:"After RE, buy pullbacks to the IB high / dPOC / VWAP. Target IB 1.5x – 2x." },
  trend:{ name:"Trend", periods:[[2,7],[5,10],[8,13],[11,16],[14,19],[17,22],[19,24],[22,27],[24,29],[26,31],[29,34],[31,36],[33,38]], open:3, close:37,
    sig:"Narrow IB, a thin elongated profile, every period makes a new high/low, the close is at the extreme.",
    mean:"One side is in complete control, the other has no chance to build value.",
    act:"Do not fade. Enter at the previous period’s low / VWAP / +1 SD. Trail the stop by period." },
  dd:{ name:"Double Distribution", periods:[[4,10],[5,11],[6,10],[5,9],[7,11],[10,23],[20,27],[21,28],[22,27],[20,26],[21,27],[22,28],[23,27]], open:6, close:25,
    sig:"Two value areas separated by a band of single prints. Usually starts with a narrow IB.",
    mean:"Morning balance, then new information pushes price into a second balance area.",
    act:"The single prints in the middle are support (or resistance) on the first test. If they are fully filled the next day = a weak signal." },
  neutral:{ name:"Neutral", periods:[[14,24],[15,25],[17,29],[18,26],[15,23],[9,17],[11,19],[13,20],[15,21],[16,22],[17,23],[16,22],[17,21]], open:19, close:19,
    sig:"Range extension on both sides of the IB. Neutral center: close in the middle of the range. Neutral extreme: close at one extreme.",
    mean:"Center = both sides balanced, no winner yet. Extreme = the winner appears late in the session, usually continuing the next day.",
    act:"Center: expect balance the next day. Extreme: favour the close direction the next day." },
  nontrend:{ name:"Non-Trend", periods:[[17,22],[18,22],[17,21],[18,22],[17,21],[18,21],[17,22],[18,21],[17,21],[18,22],[17,21],[18,21],[18,21]], open:19, close:20,
    sig:"Narrow IB, the whole day barely leaves the IB. A very small range.",
    mean:"Lack of information, often before big news or a holiday. Energy is building.",
    act:"Do not trade inside the range. The next day watch for a breakout from this balance area." },
  pshape:{ name:"P-shape", periods:[[2,9],[7,15],[13,22],[18,26],[21,27],[20,26],[21,27],[22,26],[21,26],[22,27],[21,26],[22,26],[22,25]], open:3, close:24,
    sig:"Thin stem below, value bulging at the top.",
    mean:"Usually short covering: old shorts closing, not necessarily new buyers.",
    act:"The next day you need to see new buying (holding above the VA) before trusting continuation. If price falls back into the thin stem → it can move fast." },
  bshape:{ name:"b-shape", flipOf:"pshape", open:26, close:5,
    sig:"Thin stem above, value bulging at the bottom.",
    mean:"Usually long liquidation: old longs exiting.",
    act:"The next day you need to see new selling (holding below the VA) before trusting continuation." }
};
PB.dayOrder = ["normal","nvar","trend","dd","neutral","nontrend","pshape","bshape"];

PB.openTypes = [
  { id:"od", name:"Open Drive", conf:"Highest", chip:"good", pts:[[0,50],[10,56],[20,60],[30,58],[40,66],[55,72],[70,70],[85,80],[100,86]],
    def:"Price moves strongly in one direction right from 9:30 and never comes back to test the open.",
    act:"Go with it. Only enter the first small pullback into a nearby level (ON high, PDH). Never fade." },
  { id:"otd", name:"Open Test Drive", conf:"Cao", chip:"good", level:36, pts:[[0,50],[10,44],[20,38],[28,36],[36,40],[46,50],[58,58],[70,64],[85,74],[100,82]],
    def:"Price tests a level on the opposite side (PDH/PDL, ON high/low) to check there is no more business, then reverses and drives through the open.",
    act:"Wait for the test to finish + an open reclaim. A close match for your OSR model (sweep → reclaim → retest)." },
  { id:"orr", name:"Open Rejection Reverse", conf:"Medium", chip:"warn", pts:[[0,50],[12,56],[22,63],[30,66],[40,60],[52,50],[64,42],[78,34],[90,28],[100,24]],
    def:"Price moves one way, meets responsive activity at a level, gets rejected and reverses back through the open.",
    act:"Trade in the direction after the open is crossed. Target the opposite VA edge. Stop beyond the rejected extreme." },
  { id:"oa", name:"Open Auction", conf:"Low", chip:"bad", pts:[[0,50],[10,57],[20,46],[30,55],[40,43],[52,54],[64,47],[76,58],[88,45],[100,52]],
    def:"Price rotates around the open both ways, neither side in control. In range: expect balance. Out of range: a direction must be chosen early.",
    act:"Do not trade the A period. Wait for the IB to form, trade the IB edges or a breakout confirmed by CVD." }
];

PB.openLoc = [
  { id:"or-up", label:"Above yesterday’s range", conf:"Strong imbalance", chip:"good",
    txt:"Open above PD High. The highest confidence that there is upside imbalance. The market must prove the new prices are accepted.",
    watch:"Open Drive / Open Test Drive down to PDH and holds → go with it. If it comes back into yesterday’s range and holds 1 period → trapped longs, ORR down, target VAH then POC.",
    model:"OSR: sweep the ON low or PDH → reclaim → long." },
  { id:"va-up", label:"Above VA, inside range", conf:"Leaning up, moderate", chip:"warn",
    txt:"Open between VAH and PD High. The market is testing prices above value but has not left the range.",
    watch:"Holds above VAH (accept) → tests PD High. Comes back into the VA and is accepted 2 periods → 80% rule to VAL.",
    model:"Scenario A: long the VAH retest. Scenario B: short when accepted back inside the VA." },
  { id:"in-va", label:"Inside yesterday’s VA", conf:"Balance", chip:"",
    txt:"Open inside yesterday’s value. Default: both sides still agree, rotation inside the VA.",
    watch:"Fade VAH / VAL on CVD exhaustion or absorption, target POC. Only switch to breakout on acceptance outside the VA.",
    model:"The VWAP ±1 SD ping-pong playbook + fading the VA edges." },
  { id:"va-dn", label:"Below VA, inside range", conf:"Leaning down, moderate", chip:"warn",
    txt:"Open between VAL and PD Low. Mirror image of 'Above VA, inside range'.",
    watch:"Holds below VAL → tests PD Low. Comes back into the VA + accepted 2 periods → 80% rule to VAH.",
    model:"Scenario A: short the VAL retest. Scenario B: long when accepted back inside the VA." },
  { id:"or-dn", label:"Below yesterday’s range", conf:"Strong imbalance", chip:"bad",
    txt:"Open below PD Low. Downside imbalance, e.g. 30/10 in your template.",
    watch:"Open Drive down → go with it, sell pullbacks. Comes back into the range and holds → trapped shorts, ORR up.",
    model:"OSR: sweep the ON high or PDL → reject → short." }
];

PB.valRel = [
  { n:"Higher value", p:[20,50], t:[58,85], m:"Today’s VA is entirely above yesterday’s VA.", b:"Clearly bullish. The next day favour longs at the new VAH/POC." },
  { n:"Overlapping higher", p:[20,55], t:[40,75], m:"Overlapping but shifted up.", b:"Moderately bullish, needs more confirmation." },
  { n:"Unchanged / Overlapping", p:[25,65], t:[28,62], m:"Almost identical.", b:"Balance. Fade the edges, prepare a composite." },
  { n:"Inside value", p:[15,80], t:[35,60], m:"Today’s VA sits inside yesterday’s VA.", b:"Compression. Prepare for a breakout, do not guess the direction in advance." },
  { n:"Outside value", p:[35,60], t:[15,80], m:"Today’s VA engulfs yesterday’s VA.", b:"Expansion, both sides active. Use the close location to pick a direction." },
  { n:"Overlapping lower", p:[40,75], t:[20,55], m:"Overlapping but shifted down.", b:"Moderately bearish." },
  { n:"Lower value", p:[55,85], t:[15,48], m:"Today’s VA is entirely below yesterday’s VA.", b:"Clearly bearish. The next day favour shorts at the new VAL/POC." }
];

(function(){
  const flip = a => a.map(([x,y]) => [x,100-y]);
  const p1 = [[0,30],[15,55],[25,70],[35,58],[45,52],[60,68],[70,76],[80,62],[100,40]];
  const c1 = [[0,20],[15,50],[25,72],[35,55],[45,48],[60,58],[70,62],[80,45],[100,25]];
  const p2 = [[0,30],[15,55],[25,70],[35,58],[45,52],[60,66],[70,69],[80,55],[100,35]];
  const c2 = [[0,20],[15,45],[25,60],[35,50],[45,48],[60,70],[70,82],[80,62],[100,40]];
  PB.cvd = [
    { n:"Exhaustion · bearish", where:"At VAH / PDH / +2 SD", price:p1, cvd:c1, ph:[[25,70],[70,76]], ch:[[25,72],[70,62]], lvl:72,
      rule:"Price makes a higher high, CVD makes a lower high.", mean:"Each leg up needs fewer aggressive buyers. Aggressive buyers are drying up.", act:"Short after the last leg’s low breaks; stop above the new high; target POC / VWAP." },
    { n:"Absorption · bearish", where:"At VAH / PDH / +2 SD", price:p2, cvd:c2, ph:[[25,70],[70,69]], ch:[[25,60],[70,82]], lvl:70,
      rule:"CVD makes a strong higher high, price cannot exceed the old high.", mean:"Buyers still hit the market hard but passive sellers at the level absorb everything.", act:"Usually stronger than exhaustion. Short on a negative delta flip; stop above the level; target the opposite VA." },
    { n:"Exhaustion · bullish", where:"At VAL / PDL / −2 SD", price:flip(p1), cvd:flip(c1), ph:flip([[25,70],[70,76]]), ch:flip([[25,72],[70,62]]), lvl:28,
      rule:"Price makes a lower low, CVD makes a higher low.", mean:"Aggressive sellers are drying up.", act:"Long after the last leg’s high breaks; stop below the new low; target POC / VWAP." },
    { n:"Absorption · bullish", where:"At VAL / PDL / −2 SD", price:flip(p2), cvd:flip(c2), ph:flip([[25,70],[70,69]]), ch:flip([[25,60],[70,82]]), lvl:30,
      rule:"CVD makes a strong lower low, price holds a higher low / equal low.", mean:"Passive buyers absorb all the market selling.", act:"Long on a positive delta flip; stop below the level; target the opposite VA." }
  ];
})();

PB.cvdCheck = [
  "Is price at a TPO zone scoring ≥ 4 (tab 04)?",
  "Today’s regime: balance or trend? (open type, IB, VWAP slope)",
  "Compare the last 2 price swings at the zone with the 2 matching CVD swings (reset 9:30 ET)",
  "Is it exhaustion or absorption? Smart Tape showing large orders standing at the level → extra confidence",
  "Is there a trigger yet: M1 structure break, level reclaim or delta flip. Stop beyond the extreme, target POC / VWAP"
];

PB.timeline = [
  ["16:00","04:00 (+1)","03:00 (+1)","RTH close. Capture the profile, do the post-session review when you wake up."],
  ["Vietnam daytime","—","—","Read yesterday’s profile: day type, shape, close, value relationship. Update Tier 1–2 levels."],
  ["18:00","06:00","05:00","Globex opens, the ETH session starts."],
  ["08:00–09:00","20:00–21:00","19:00–20:00","Daily Profile ETH tab: ON high/low/POC, inventory. 8:30 ET news."],
  ["09:15–09:25","21:15–21:25","20:15–20:25","Lock in the expected open location, scenarios A/B, invalidation. Plan Builder."],
  ["09:30–10:00","21:30–22:00","20:30–21:00","A period: classify the open type. OSR window."],
  ["10:00–10:30","22:00–22:30","21:00–21:30","B period: the IB forms. Careful with the 10:00 ET news."],
  ["10:30–11:30","22:30–23:30","21:30–22:30","After the IB: range extension or rotation. IB model. Stop at 11:30 ET."],
  ["Sau 11:30","23:30","22:30","Shut down the platform. Write a short journal entry."]
];

PB.preCheck = [
  "Record yesterday’s day type, shape, close location",
  "Yesterday’s value relationship versus the day before",
  "Weekly VA: is price inside or outside?",
  "Update Tier 1–2: VAH/VAL/POC, PDH/PDL, nPOC, poor H/L, single prints, gap",
  "Tab ETH: ON high/low, ON POC, inventory",
  "News calendar 8:30 / 10:00 ET",
  "Expected open location (1 of the 5 zones)",
  "Scenarios A and B, each with zone, trigger, target, invalidation",
  "Mark the no-trade zone (mid-VA, far from any level)",
  "Rule reminder: max 2–3 trades, stop at 11:30 ET, the prop daily loss limit"
];

PB.postCheck = [
  "Capture the Daily Profile RTH after 16:00 ET",
  "Record day type, shape, open type, IB width, whether there was RE and on which side",
  "Which scenario happened? Where was the plan wrong?",
  "Each trade: zone score, grade, was it the right trigger",
  "Mark new levels for tomorrow: VA/POC, poor H/L, single prints, spike",
  "Write down one lesson and one thing to keep"
];

PB.decision = [
  ["Open type (9:30–10:00)","OD → go with it, only enter the first pullback. OTD → wait for the test + reclaim. ORR → the opposite scenario. OA → do not trade the A period."],
  ["Did price reach a zone in the plan?","No → do nothing. A trade outside the plan is a mistake, even if it wins."],
  ["Does the zone score ≥ 6?","No → use it only as a target. 4–5 → needs very clear CVD + trigger."],
  ["Does VWAP allow this direction?","Trend against you (sloping VWAP, price riding the band) → drop the fade idea."],
  ["Does CVD confirm?","Divergence / absorption for a fade; CVD making new extremes with price for a breakout."],
  ["Trigger orderflow","Delta flip / DOM / M1 structure break. Stop beyond the extreme, target the next level."],
  ["10:30 IB xong","IB < 70% of average → favour range extension. IB > 130% → favour rotation inside the IB."],
  ["Stop","2–3 trades done, loss limit hit, or 11:30 ET (23:30 Vietnam)."]
];


PB.days = [
  { d:"29/10", h:29675, l:29105, vah:29625, poc:29485, val:29415, o:29610, c:29180,
    read:"Value built at the very top (VA ~29,415–29,625), then late in the session price slid all the way down to ~29,105 with single-cell TPO columns: single prints / a late selling spike. Close near the low.",
    lesson:"Weak close + down spike. Per the spike rules: next day opening below the spike (29,105–29,350) = continuation; opening inside the spike = balance; opening above the spike = spike rejected.", tag:"Down spike", chip:"bad" },
  { d:"30/10", h:28860, l:28230, vah:28745, poc:28570, val:28360, o:28795, c:28560,
    read:"Open ~28,795, about 310 points below the 29/10 low: open outside the range, below even the spike. Much lower value. Left an unfilled RTH gap 28,860–29,105.",
    lesson:"A textbook example of 'opening below the range' + spike rules confirming continuation. The gap overhead is a magnet / Tier 2 resistance for the following days.", tag:"Out-of-range open", chip:"bad" },
  { d:"02/11", h:28890, l:28100, vah:28880, poc:28650, val:28360, o:28720, c:28225,
    read:"Very wide range (~790 points), breaking both the high and the low of 30/10 (outside day). The VA widened upward (overlapping higher), but the close was near the low.",
    lesson:"Most likely a Neutral Extreme (check the IB on ATAS): both sides broken, close at the lower extreme → the next day leans down. Remember this expectation to compare with 03/11.", tag:"Outside day · weak close", chip:"warn" },
  { d:"03/11", h:28445, l:28215, vah:28395, poc:28330, val:28280, o:28270, c:28320,
    read:"A narrow inside day (~230 points) in the lower part of the 02/11 range. Very narrow VA 28,280–28,395. Held above the 02/11 low (28,100) and the purple level 28,176.",
    lesson:"The bearish expectation from the 02/11 close was NOT followed through: sellers could not push price lower. A narrow balance after a wide day = energy building, prepare for a breakout.", tag:"Inside day · balance", chip:"" },
  { d:"04/11", h:28975, l:28405, vah:28795, poc:28680, val:28505, o:28430, c:28657, dev:true,
    read:"Open ~28,430 near the 03/11 high, drove up out of the 03/11 balance. Swept through the 02/11 high (28,890) up to ~28,975. Developing POC ~28,680 matches the 02/11 POC (~28,650).",
    lesson:"Higher value versus 03/11: the breakout from balance was accepted. Price returned to the 02/11 fair value. After the close, check whether the 28,975 high has a tail (rejection) or is a poor high.", tag:"Breakout balance · developing", chip:"good" }
];

PB.caseLevels = [
  ["28,860 – 28,975","04/11 PD High + 02/11 High + RTH gap bottom","Cluster resistance / breakout zone. Accepted above → target the gap fill to 29,105"],
  ["28,795","VAH 04/11 (developing)","Upper value edge. Fade on CVD exhaustion"],
  ["28,650 – 28,680","POC 04/11 + POC 02/11","Pivot. Two POCs coinciding = multi-day fair value"],
  ["28,505","VAL 04/11 (developing)","Lower value edge"],
  ["28,445","03/11 High = the broken balance boundary","Breakout retest. Losing this level = the 04/11 breakout failed"],
  ["28,330","POC 03/11","Target if the breakout fails"],
  ["28,176","Your purple level","Higher-timeframe Tier 1, below the 03/11 low"],
  ["29,105 – 29,350","Single prints 29/10","Resistance on the first test above the gap"]
];

/* ===== Quiz ===== */

PB.ibScen = [
  { n:"One-sided break + acceptance", dt:"Normal Variation / Trend", chip:"good",
    pts:[[0,48],[10,58],[20,40],[35,52],[45,62],[52,66],[60,64],[68,72],[78,76],[90,84],[100,86]],
    sig:"Price leaves the IB and holds at least 1 period, VWAP sloping in the break direction.", act:"Setup IB-1. Target 1.5x then 2x or the next Tier 1–2 level." },
  { n:"Break + retest of the IB edge", dt:"Normal Variation", chip:"good", dot:[56,61,"Retest IBH"],
    pts:[[0,48],[10,58],[20,40],[35,52],[42,63],[48,70],[56,61],[62,64],[72,74],[85,80],[100,85]],
    sig:"Breaks IBH, comes back to test the old IBH and holds (absorption / delta flip).", act:"The best IB-1 entry: enter on the retest, stop below the retest low." },
  { n:"Failed break (fake-out)", dt:"Normal / Neutral", chip:"bad", dot:[48,66,"Failed break"],
    pts:[[0,48],[10,58],[20,40],[35,52],[42,62],[48,66],[54,60],[60,55],[70,47],[80,40],[90,36],[100,38]],
    sig:"Breaks out but the period closes back inside the IB, CVD divergence at the extreme.", act:"Setup IB-2. Target IB mid then the opposite IB edge." },
  { n:"Both sides broken", dt:"Neutral", chip:"warn",
    pts:[[0,48],[10,58],[20,40],[35,52],[44,66],[52,60],[62,44],[70,30],[78,28],[88,40],[100,47]],
    sig:"Range extension both above and below the IB.", act:"Usually completes after 11:30. Close in the middle = balance; close at an extreme = direction for the next day." },
  { n:"No IB break", dt:"Normal / Non-Trend", chip:"",
    pts:[[0,48],[10,58],[20,40],[35,52],[45,56],[55,44],[65,54],[75,42],[85,52],[100,49]],
    sig:"Price rotates inside the IB, VWAP flat near the IB mid.", act:"Setup IB-3 (scalp edge ↔ mid) or stand aside. The next day watch for a breakout from this area." }
];

PB.ibSetups = [
  { id:"IB-1", n:"IB Breakout go-with", pb:"Playbook E", chip:"good",
    cond:"Narrow or normal-to-narrow IB; break during C–D; VWAP sloping the same way; CVD making new extremes with price; an untouched level ahead.",
    entry:"Retest of the IB edge (old IBH turned support) with absorption / delta flip; or a pullback to VWAP / +1 SD.",
    stop:"Below the retest low; or when price comes back inside the IB by more than 25% of the IB width.",
    tgt:"1.5x → 2x, or the nearest Tier 1–2 level (whichever is closer).",
    inv:"A period closes back inside the IB." },
  { id:"IB-2", n:"Failed break / fade", pb:"Playbook F", chip:"bad",
    cond:"Wide IB, or an IB edge matching a Tier 1–2 level; the break has thin volume; CVD divergence / absorption at the extreme.",
    entry:"When price closes back inside the IB with a trigger (M1 structure break, delta flip).",
    stop:"Beyond the extreme of the break.",
    tgt:"IB mid, then the opposite IB edge.",
    inv:"Price breaks again and holds outside the IB for 1 period." },
  { id:"IB-3", n:"IB rotation (scalp, Tier 4)", pb:"Optional", chip:"vw",
    cond:"Normal / wide IB, no RE yet, VWAP flat near the IB mid.",
    entry:"Fade IBH / IBL on CVD exhaustion, or an IB mid reclaim.",
    stop:"A small distance beyond the IB edge (e.g. 10% of width).",
    tgt:"IB mid. Do not hold through the mid.",
    inv:"One-sided RE with VWAP starting to slope." },
  { id:"IB-4", n:"Opening range (A period) break", pb:"Optional", chip:"vw",
    cond:"A clear Open Drive / OTD, narrow A-period range, matching scenario A of the plan.",
    entry:"Retest of the A-high / A-low after B breaks out.",
    stop:"Back to the middle of the A range.",
    tgt:"The next level in the plan; the IB is still forming so keep targets short.",
    inv:"B reverses back through the open (turning into an ORR)." }
];

PB.ibCheck = [
  "Record IBH, IBL, IB width and % versus the 20-session average",
  "Where the IB sits relative to yesterday’s VA / range (outside / straddling an edge / inside)",
  "Does the open type classified at 10:00 match the IB shape?",
  "Is VWAP RTH sloping or flat, is price above or below VWAP?",
  "Is the dPOC in the upper or lower half of the IB?",
  "Which Tier 1–2 level sits just outside IBH / IBL (fuel for a breakout or a wall for a fade)?",
  "Did the 10:00 ET news distort period B?",
  "Pick the post-IB bias: IB-1 breakout / IB-2 fade / IB-3 rotation / stand aside, and write the invalidation"
];

PB.ibSample = [
  {d:"sample-1",h:28700,l:28600,dh:28790,dl:28580,n:"sample data"},
  {d:"sample-2",h:28520,l:28300,dh:28560,dl:28290,n:"sample data"},
  {d:"sample-3",h:28450,l:28380,dh:28640,dl:28370,n:"sample data"},
  {d:"sample-4",h:28900,l:28700,dh:28910,dl:28650,n:"sample data"},
  {d:"sample-5",h:28330,l:28220,dh:28340,dl:28120,n:"sample data"},
  {d:"sample-6",h:28800,l:28640,dh:28800,dl:28640,n:"sample data"}
];
