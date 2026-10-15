'use client';
import { useId, useState } from 'react';
import { cashCandles, cashHistogram, cashSteps, type CashDay } from '../lib/chart-data';
import { compact, exact, niceTicks, useElementWidth } from './ui';

const VIEWS = [
  { key: 'range', label: 'Range area', note: 'Cash with vs. without interruption. The shaded gap is temporarily unavailable cash.' },
  { key: 'candle', label: 'Candlestick', note: 'Weekly opening, high, low and closing cash. Green = rising; red = falling. Simulated cash, not prices.' },
  { key: 'ohlc', label: 'OHLC', note: 'Weekly cash range. Left tick = opening cash; right tick = closing cash. Highs and lows include the opening balance.' },
  { key: 'line', label: 'Line', note: 'Daily cash after payments. Steps show scheduled changes; negative cash means unpaid obligations.' },
  { key: 'volume', label: 'Volume', note: 'Scheduled payments per day in USD. Red marks a payment day with a cash gap. Not trading volume.' },
  { key: 'histogram', label: 'Histogram', note: 'Number of days in each cash-balance range. A distribution of your plan, not a probability forecast.' },
] as const;
type View = typeof VIEWS[number]['key'];

export default function CashChart({daily, opening, proposed, day, onDay, durationDays, firstShortfallDay, diagnostic = false}: {
  daily: CashDay[]; opening: number; proposed?: CashDay[]; day: number; onDay: (day: number) => void;
  durationDays: number; firstShortfallDay: number | null; diagnostic?: boolean;
}) {
  const [view, setView] = useState<View>('range'), [hover, setHover] = useState<number | null>(null);
  const [ref, width] = useElementWidth<HTMLDivElement>(600);
  const id = useId(), narrow = width < 520;
  const left = 8, right = narrow ? 64 : 76, top = 28, plotH = narrow ? 190 : 220;
  const plotW = width - left - right, bottom = top + plotH, height = bottom + 42;
  const col = plotW / 30, x = (d: number) => left + (d - 1) * col;
  const active = hover ?? day, selected = daily[active - 1];
  const candles = cashCandles(daily, opening), bins = cashHistogram(daily);
  const candleView = view === 'candle' || view === 'ohlc';
  const cashView = view === 'range' || view === 'line';
  const values = candleView ? candles.flatMap(c => [c.low, c.high]) : daily.flatMap(d => [d.baseline, d.stressed]);
  if (cashView && proposed) values.push(...proposed.map(d => d.stressed));
  const extent = view === 'volume' ? niceTicks(0, Math.max(...daily.map(d=>d.due), 1))
    : view === 'histogram' ? niceTicks(0, Math.max(...bins.map(b=>b.days.length), 1))
    : niceTicks(Math.min(...values, 0), Math.max(...values, opening, 1));
  const y = (value: number) => top + (extent.max - value) / (extent.max - extent.min || 1) * plotH;
  const path = (rows: CashDay[], key: 'baseline' | 'stressed') => cashSteps(rows, key)
    .map(([d,v],i)=>`${i?'L':'M'} ${x(d)} ${y(v)}`).join(' ');
  const range = [...cashSteps(daily,'baseline'), ...cashSteps(daily,'stressed').reverse()]
    .map(([d,v],i)=>`${i?'L':'M'} ${x(d)} ${y(v)}`).join(' ') + ' Z';
  const week = candles.find(c=>active>=c.start&&active<=c.end)!;
  const pick = (e: React.PointerEvent<SVGRectElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    return Math.max(1, Math.min(30, Math.floor((e.clientX-box.left)/box.width*30)+1));
  };
  const inspectKey = (e: React.KeyboardEvent) => {
    const next = e.key==='ArrowRight'?Math.min(30,day+1):e.key==='ArrowLeft'?Math.max(1,day-1):e.key==='Home'?1:e.key==='End'?30:null;
    if(next!==null){e.preventDefault();onDay(next);setHover(null);}
  };
  const paymentMax = Math.max(1, ...daily.map(d=>d.due));

  return <div className="cash-chart">
    {diagnostic&&<div className="chart-switch" role="group" aria-label="Chart type">
      {VIEWS.map(v=><button key={v.key} type="button" aria-pressed={view===v.key} onClick={()=>{setView(v.key);setHover(null);}}>{v.label}</button>)}
    </div>}
    {!diagnostic&&<h3>When does accessible cash run out?</h3>}
    <p className="chart-context" id={id}>{VIEWS.find(v=>v.key===view)!.note}</p>
    {cashView&&<div className="cash-legend"><span><i className="cash-key scenario"/>With interruption</span><span><i className="cash-key baseline"/>Without interruption</span>{proposed&&<span><i className="cash-key prepared"/>Proposal · unconfirmed</span>}</div>}
    <dl className="readout" aria-live="polite">
      {candleView?<>
        <div><dt>Days</dt><dd>{week.start}–{week.end}</dd></div>
        {(['open','high','low','close'] as const).map(key=><div key={key}><dt>{key[0].toUpperCase()+key.slice(1)}</dt><dd>{exact(week[key])}</dd></div>)}
      </>:<>
        <div><dt>Day</dt><dd>{active}</dd></div><div><dt>Cash left</dt><dd className={selected.stressed<0?'bad-text':''}>{exact(selected.stressed)}</dd></div>
        <div><dt>Payment due</dt><dd>{exact(selected.due)}</dd></div>
        {cashView&&<div><dt>Without interruption</dt><dd>{exact(selected.baseline)}</dd></div>}
        {cashView&&proposed&&<div><dt>Proposal</dt><dd>{exact(proposed[active-1].stressed)}</dd></div>}
      </>}
    </dl>
    <div ref={ref} className="chart-box" tabIndex={0} role="slider" aria-label="Inspect cash outlook day" aria-describedby={id}
      aria-valuemin={1} aria-valuemax={30} aria-valuenow={day} aria-valuetext={`Day ${day}, cash left ${exact(daily[day-1].stressed)}`} onKeyDown={inspectKey}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${VIEWS.find(v=>v.key===view)!.label} of simulated cash. ${view==='histogram'?'Cash ranges in USD; vertical axis counts days.':'Horizontal axis: days 1 to 30; vertical axis: USD.'}`}>
        {extent.ticks.filter(t=>view!=='histogram'||Number.isInteger(t)).map(t=><g key={t}>
          <line x1={left} x2={left+plotW} y1={y(t)} y2={y(t)} stroke={t===0?'#64748b':'#e7edf4'} strokeDasharray={t===0?undefined:'3 4'}/>
          <text x={left+plotW+8} y={y(t)+4} className="axis-label">{view==='histogram'?`${t} days`:compact(t)}</text>
        </g>)}
        {view==='range'&&<path d={range} fill="#2563eb" opacity=".13"/>}
        {cashView&&<>
          <path d={path(daily,'baseline')} fill="none" stroke="#64748b" strokeWidth="1.6" strokeDasharray="5 4"/>
          <path d={path(daily,'stressed')} fill="none" stroke="#2563eb" strokeWidth="2.2"/>
          {proposed&&<path d={path(proposed,'stressed')} fill="none" stroke="#047857" strokeWidth="2" strokeDasharray="3 2"/>}
          {firstShortfallDay&&<circle cx={x(firstShortfallDay)+col/2} cy={y(daily[firstShortfallDay-1].stressed)} r="4" fill="#b91c1c" stroke="#fff"><title>{`First shortfall: day ${firstShortfallDay}`}</title></circle>}
          {durationDays<30&&<g><line x1={x(durationDays+1)} x2={x(durationDays+1)} y1={top} y2={bottom} stroke="#047857" strokeDasharray="3 4"/><text x={Math.max(left,Math.min(x(durationDays+1),left+plotW-128))} y="17" className="chart-note good">Funds return · day {durationDays+1}</text></g>}
        </>}
        {candleView&&candles.map((c,i)=>{
          const cx=(x(c.start)+x(c.end+1))/2, half=Math.min(14,(c.end-c.start+1)*col*.22);
          const color=c.close>=c.open?'#047857':'#b91c1c';
          return <g key={c.start} opacity={active>=c.start&&active<=c.end?1:.75}>
            <title>{`Days ${c.start}–${c.end}: open ${exact(c.open)}, high ${exact(c.high)}, low ${exact(c.low)}, close ${exact(c.close)}`}</title>
            <line x1={cx} x2={cx} y1={y(c.high)} y2={y(c.low)} stroke={color} strokeWidth="2"/>
            {view==='candle'?<rect x={cx-half} y={Math.min(y(c.open),y(c.close))} width={half*2} height={Math.max(2,Math.abs(y(c.open)-y(c.close)))} fill={color}/>
              :<><line x1={cx-half} x2={cx} y1={y(c.open)} y2={y(c.open)} stroke={color} strokeWidth="2"/><line x1={cx} x2={cx+half} y1={y(c.close)} y2={y(c.close)} stroke={color} strokeWidth="2"/></>}
            <text x={cx} y={bottom+22} textAnchor="middle" className="axis-label">{narrow?`W${i+1}`:`${c.start}–${c.end}`}</text>
          </g>;
        })}
        {view==='volume'&&daily.map(d=><rect key={d.day} x={x(d.day)+col*.16} y={y(d.due)} width={col*.68} height={bottom-y(d.due)} fill={d.shortfall>0?'#b91c1c':'#2563eb'} opacity={d.day===active?1:.65}><title>{`Day ${d.day}: ${exact(d.due)} scheduled`}</title></rect>)}
        {view==='histogram'&&bins.map((b,i)=>{
          const w=plotW/bins.length, bx=left+i*w;
          return <g key={i}>
            <rect x={bx+2} y={y(b.days.length)} width={Math.max(1,w-4)} height={bottom-y(b.days.length)} fill={b.high<=0?'#b91c1c':'#2563eb'} opacity={b.days.includes(active)?1:.5}>
              <title>{`${exact(b.low)} to ${exact(b.high)}${i===bins.length-1?' inclusive':' exclusive'}: ${b.days.length} days`}</title>
            </rect>
            <text x={bx+w/2} y={y(b.days.length)-6} textAnchor="middle" className="axis-label">{b.days.length}</text>
            <text x={bx+w/2} y={bottom+22} textAnchor="middle" className="axis-label">{compact(b.low)}</text>
            <text x={bx+w/2} y={bottom+37} textAnchor="middle" className="axis-label">{compact(b.high)}</text>
          </g>;
        })}
        {!candleView&&view!=='histogram'&&(narrow?[1,10,20,30]:[1,5,10,15,20,25,30]).map(d=><text key={d} x={x(d)+col/2} y={bottom+24} textAnchor="middle" className="axis-label">{narrow?d:`Day ${d}`}</text>)}
        {view!=='histogram'&&<>
          <line x1={x(active)+col/2} x2={x(active)+col/2} y1={top} y2={bottom} stroke="#0f172a" opacity=".3" strokeDasharray="3 3"/>
          <rect x={left} y={top} width={plotW} height={plotH} fill="transparent" style={{touchAction:'pan-y',cursor:'crosshair'}}
            onPointerMove={e=>setHover(pick(e))} onPointerLeave={()=>setHover(null)} onPointerDown={e=>{const d=pick(e);setHover(d);onDay(d);}}/>
        </>}
      </svg>
    </div>
    {!diagnostic&&<><section className="payment-story" aria-label="Linked payment timeline">
      <h3>Which payments create pressure?</h3>
      <p className="chart-context">Daily payments in USD · aligned with the range-area outlook. Red = a cash gap on that payment day.</p>
      <svg width={width} height={120} viewBox={`0 0 ${width} 120`} role="img" aria-label="Daily scheduled payments, aligned with the cash outlook">
        <line x1={left} x2={left+plotW} y1={90} y2={90} stroke="#64748b"/>
        <text x={left+plotW+8} y={20} className="axis-label">{compact(paymentMax)}</text>
        <text x={left+plotW+8} y={94} className="axis-label">$0</text>
        {daily.map(d=><g key={d.day}><rect x={x(d.day)+col*.16} y={90-d.due/paymentMax*70} width={col*.68} height={d.due/paymentMax*70} fill={d.shortfall>0?'#b91c1c':'#64748b'}><title>{`Day ${d.day}: ${exact(d.due)} due`}</title></rect>
          <rect x={x(d.day)} y={15} width={col} height={75} fill="transparent" style={{cursor:'crosshair'}} onPointerMove={()=>setHover(d.day)} onPointerLeave={()=>setHover(null)} onPointerDown={()=>{onDay(d.day);setHover(d.day);}}/></g>)}
        <line x1={x(active)+col/2} x2={x(active)+col/2} y1={15} y2={90} stroke="#2563eb" strokeDasharray="3 3"/>
        {[1,10,20,30].map(d=><text key={d} x={x(d)+col/2} y={112} textAnchor="middle" className="axis-label">{d}</text>)}
      </svg>
    </section>
    <section className="duration-story" aria-label="Cash gap duration">
      <h3>How long does the gap last?</h3>
      <p className="chart-context"><b>{daily.filter(d=>d.shortfall>0).length} of 30 days</b> have unpaid obligations. Each square is one day; this counts duration, not probability.</p>
      <div className="day-strip">{daily.map(d=><button type="button" key={d.day} aria-label={`Day ${d.day}: ${d.shortfall>0?exact(d.shortfall)+' short':'covered'}`} aria-pressed={d.day===active} onClick={()=>{onDay(d.day);setHover(null);}} style={{background:d.shortfall>0?'#b91c1c':'#e2e8f0',color:d.shortfall>0?'white':'#475569'}}>{d.day}</button>)}</div>
    </section></>}
    <label className="inspect-day">Inspect day <input type="range" min="1" max="30" value={day} onChange={e=>{onDay(Number(e.target.value));setHover(null);}}/><b>{day}</b></label>
    <details className="chart-details"><summary>View exact chart data</summary>
      <div className="table-scroll" role="region" aria-label="Chart values" tabIndex={0}><table>
        {view==='histogram'?<><thead><tr><th>Cash range · USD</th><th>Days</th></tr></thead><tbody>{bins.map((b,i)=><tr key={i}><td>{exact(b.low)} ≤ cash {i===bins.length-1?'≤':'<'} {exact(b.high)}</td><td>{b.days.length}</td></tr>)}</tbody></>
          :candleView?<><thead><tr><th>Days</th><th>Open</th><th>High</th><th>Low</th><th>Close</th></tr></thead><tbody>{candles.map(c=><tr key={c.start}><td>{c.start}–{c.end}</td>{[c.open,c.high,c.low,c.close].map((v,i)=><td key={i}>{exact(v)}</td>)}</tr>)}</tbody></>
          :<><thead><tr><th>Day</th><th>Cash left</th><th>Without interruption</th><th>Payment due</th>{proposed&&<th>Proposal</th>}</tr></thead><tbody>{daily.map(d=><tr key={d.day}><td>{d.day}</td><td>{exact(d.stressed)}</td><td>{exact(d.baseline)}</td><td>{exact(d.due)}</td>{proposed&&<td>{exact(proposed[d.day-1].stressed)}</td>}</tr>)}</tbody></>}
      </table></div>
    </details>
    {!diagnostic&&<details className="chart-details"><summary>Alternative diagnostics · candle, OHLC, line, volume, histogram</summary><p className="chart-context">Optional views of this cash series, not additional evidence or market prices.</p><CashChart daily={daily} opening={opening} proposed={proposed} day={day} onDay={onDay} durationDays={durationDays} firstShortfallDay={firstShortfallDay} diagnostic/></details>}
  </div>;
}
