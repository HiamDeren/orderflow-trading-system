
(function(){
'use strict';
const Q=[
{
"id": "L094",
"course": "levels",
"mod": "ema",
"q": "What is EMA9’s α?",
"o": [
"0,111 (= 1/9)",
"0,200 (= 2/10)",
"0,900",
"0,050"
],
"a": 1,
"e": "α = 2/(N+1) = 2/10 = 0.2. Each new candle pulls EMA9 20% of the way toward the close."
},
{
"id": "L095",
"course": "levels",
"mod": "ema",
"q": "Core difference between EMA9 and SMA9?",
"o": [
"EMA9 uses only the high",
"EMA9 gives newer candles more weight, decaying into the past",
"EMA9 is always above SMA9",
"No difference, just a different name"
],
"a": 1,
"e": "SMA9 gives each candle an equal 1/9. EMA9 gives the newest candle 20% and the 9th only ~3.4%, so the EMA reacts faster."
},
{
"id": "L096",
"course": "levels",
"mod": "ema",
"q": "Roughly what % of EMA9’s weight do the last 9 candles carry?",
"o": [
"100%",
"~50%",
"~87%",
"~20%"
],
"a": 2,
"e": "1 − 0.8⁹ ≈ 86.6%. The rest comes from older candles. That is why “EMA9 ≈ 9-candle average” is only approximately right."
},
{
"id": "L097",
"course": "levels",
"mod": "ema",
"q": "Average lag of EMA34 on M1 is roughly?",
"o": [
"~4 min",
"~16 min",
"~34 min",
"~1 min"
],
"a": 1,
"e": "Lag ≈ (N−1)/2 = 16.5 candles. On M1 that is about 16 minutes. So the 9/34 cross always comes after the top/bottom."
},
{
"id": "L098",
"course": "levels",
"mod": "ema",
"q": "Using 9/34 on a 30s chart, how much time does EMA9 cover?",
"o": [
"9 min",
"4.5 min",
"18 min",
"30 seconds"
],
"a": 1,
"e": "9 candles × 30s = 4.5 minutes. Changing the timeframe changes the EMA’s time horizon even with the same period."
},
{
"id": "L099",
"course": "levels",
"mod": "ema",
"q": "In a short, a 1m candle wicks above EMA9 but closes below it. What does the rule say?",
"o": [
"Exit now",
"Hold the trade, only the close counts",
"Add to the position",
"Switch to 30s to double-check"
],
"a": 1,
"e": "The rule only counts the body close. A wick that pierces and closes back is a reaction, even possibly a sign of absorption that favours the short."
},
{
"id": "L100",
"course": "levels",
"mod": "ema",
"q": "Why not use the 9/34 cross as an entry trigger?",
"o": [
"Because the cross is never right",
"Because the cross lags by construction and crosses constantly in a sideways market",
"Because ATAS cannot draw the cross",
"Because the cross is only for D1"
],
"a": 1,
"e": "Two reasons: the cross comes late (lag) and in a range it “crosses all over the place”. The cross confirms the state; it is not a trigger."
},
{
"id": "L101",
"course": "levels",
"mod": "ema",
"q": "Which sign shows you are in S4 (range)?",
"o": [
"9–34 spread widening",
"EMA9 and 34 flat and braided, 3 or more crosses in 30 candles",
"Price hugs EMA9 without closing back across",
"EMA34 slopes steeply"
],
"a": 1,
"e": "S4: both lines flat and braided, crossing constantly. Turn the EMA off as a signal and trade TPO edges with OF."
},
{
"id": "L102",
"course": "levels",
"mod": "ema",
"q": "Which stack is bearish?",
"o": [
"Price > EMA9 > EMA34",
"Price < EMA9 < EMA34",
"EMA9 > Price > EMA34",
"EMA34 > EMA9 > Price but EMA34 slopes up"
],
"a": 1,
"e": "Bear stack: price below EMA9, EMA9 below EMA34. Option D has the bear order but EMA34 slopes up, so it is a transition, not yet a downtrend."
},
{
"id": "L103",
"course": "levels",
"mod": "ema",
"q": "S1 trend, price is about 40 points from EMA9 and you want to go long. What should you do?",
"o": [
"Market long now before missing it",
"Wait for price to return to EMA9 or a TPO zone near EMA9, then consider E1",
"Short because price has risen a lot",
"Switch to 2m"
],
"a": 1,
"e": "An extended price gives poor R:R and a wide stop. Wait for an E1 retest. Shorting against S1 without a sweep and a candle closing back across EMA9 is fading the trend."
},
{
"id": "L104",
"course": "levels",
"mod": "ema",
"q": "In model E3 (short), where is a sensible stop?",
"o": [
"Below EMA34",
"Above the sweep high or beyond the swept zone",
"Fixed 5 points",
"Below the nearest low"
],
"a": 1,
"e": "The E3 idea is wrong once price is accepted back beyond the zone or reclaims the sweep high. Put the stop beyond those levels."
},
{
"id": "L105",
"course": "levels",
"mod": "ema",
"q": "Checklist scores 3/5 layers, all gates pass, both L2 and L4 present. Grade?",
"o": [
"Grade A++",
"Grade A+",
"Grade B: half size or skip",
"STOP"
],
"a": 2,
"e": "5 = A++, 4 = A+, 3 = B. A score of 3 missing L2 (location) or L4 (OF trigger) is automatically NO."
},
{
"id": "L106",
"course": "levels",
"mod": "ema",
"q": "Short from VAH, a candle closes above both EMA9 and EMA34 but still below VAH. What does the ladder say?",
"o": [
"Exit everything now",
"Add because VAH still holds",
"Hold half, stop above VAH, read OF at VAH",
"Remove the stop and wait for price to return"
],
"a": 2,
"e": "This is step 4: the TPO zone outranks the EMA. The next deciding layer is orderflow at VAH. A close above VAH exits everything."
},
{
"id": "L107",
"course": "levels",
"mod": "ema",
"q": "In a trade on 1m, you open a 30s chart, see the 30s candles “closing nicely” and keep holding although 1m has closed on the wrong side of EMA9 twice. What mistake is this?",
"o": [
"Not a mistake, more timeframes is better",
"Confirmation bias: switching timeframe mid-trade to find a reason to hold",
"Indicator setup error",
"α calculation error"
],
"a": 1,
"e": "Pick the timeframe before the session. Switching mid-trade to get the answer you want breaks the rule and easily leads to blowing the trailing drawdown."
},
{
"id": "L108",
"course": "levels",
"mod": "ema",
"q": "In your stack, what is the right role of EMA 9/34?",
"o": [
"Primary entry trigger",
"Read the state, grant directional permission, and manage the trade. The trigger is orderflow",
"Replaces the TPO zone",
"Define the bias of the day"
],
"a": 1,
"e": "Layer 3 · State. Context comes from the TPO bias, location from TPO zones/VWAP, the trigger from footprint/delta/CVD. The EMA links those layers to trade management."
}
];
window.QBANK=(window.QBANK||[]).concat(Q.map(q=>Object.assign({vis:null},q)));
const M=(window.QMODS=window.QMODS||{}).levels||{},N={};
Object.keys(M).forEach(k=>{N[k]=M[k];if(k==='vwap')N.ema='EMA 9/34';});
if(!N.ema)N.ema='EMA 9/34';
window.QMODS.levels=N;
})();
