// @page: Landing
import React, { useState } from 'react'

/* ===========================================================
   CAUCASUS AUTO — Landing (Phase 1: hero + calculator)
   =========================================================== */

const AUCTIONS: Record<string, { fee: number }> = {
  'Copart': { fee: 520 },
  'IAAI': { fee: 545 },
  'Manheim': { fee: 600 },
}

const ORIGINS: Record<string, { port: string; inland: number; ocean: number; days: number; x: number; y: number }> = {
  'Los Angeles, CA': { port: 'Long Beach', inland: 395, ocean: 1050, days: 45, x: 14, y: 58 },
  'Houston, TX': { port: 'Houston', inland: 180, ocean: 1120, days: 40, x: 44, y: 70 },
  'Chicago, IL': { port: 'New York', inland: 540, ocean: 950, days: 38, x: 58, y: 40 },
  'Newark, NJ': { port: 'New York', inland: 250, ocean: 950, days: 30, x: 78, y: 38 },
  'Savannah, GA': { port: 'Savannah', inland: 120, ocean: 980, days: 35, x: 70, y: 62 },
}

const VEHICLES: Record<string, number> = {
  'Sedan': 0,
  'Medium Duty Truck': 150,
  'Quadrocycle': -150,
  'Motorcycles': -180,
  'Bob Cat': 120,
  '3 Cars Cont. (SUV)': 90,
  'Van': 100,
  'Boat': 80,
  'Truck': 200,
  'Heavy Equipment': 300,
}
const DEST: Record<string, number> = { 'ფოთი': 0, 'ბათუმი': 40 }

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US')
}

/* ---------- small inline icons ---------- */
const IconTruck = (p: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M5 17a2 2 0 1 0 4 0a2 2 0 1 0-4 0m10 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0" />
    <path d="M5 17H3V6a1 1 0 0 1 1-1h9v12m-4 0h6m4 0h2v-6h-8m0-5h5l3 5" />
  </svg>
)
const IconShip = (p: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M2 21c1.3.1 2.4-1 3.3-1s2.5 1 3.4 1c1 0 2.2-1 3.3-1s2.3 1 3.3 1c1.3.1 2.4-1 3.4-1s2.5 1 3.3 1" />
    <path d="M6 20.5c-1.4-1.8-2.4-4-2.8-5.2c-.2-.5 0-.7.5-.9l7.5-3.3c.4-.2.6-.3.8-.3s.4.1.8.3l7.5 3.3c.5.2.6.4.5.9c-.4 1.2-1.4 3.4-2.8 5.2" />
    <path d="m6 13l.2-2.8c.1-1.7.2-2.6.8-3.2c.6-.5 1.4-.5 3.2-.5h3.6c1.8 0 2.6 0 3.2.5c.6.6.6 1.5.8 3.2L21 13" />
    <path d="M12 3v8" />
  </svg>
)
const IconPin = (p: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)
const IconChevron = (p: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="m6 9 6 6 6-6" /></svg>
)
const IconArrow = (p: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12h14m-6-7 7 7-7 7" /></svg>
)
const IconShield = (p: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="m9 12 2 2 4-4" /></svg>
)

/* ---------- reusable bits ---------- */
function Mark({ className }: any) {
  return (
    <svg viewBox="0 0 48 28" className={className} fill="none">
      <path className="fill-brand-600" d="M24 24C15 23 6 18 1 8c8 5 16 7 23 8z" />
      <path className="fill-brand-700" d="M24 24c9-1 18-6 23-16-8 5-16 7-23 8z" />
      <path className="fill-brand-400" d="M24 15C17 14 10 11 6 4c6 4 12 6 18 6z" />
      <path className="fill-brand-500" d="M24 15c7-1 14-4 18-11-4 5-11 7-18 6z" />
    </svg>
  )
}
function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <Mark className="h-8 w-12 shrink-0" />
      <div className="flex flex-col leading-none">
        <span className="font-display text-xl font-800 tracking-[0.04em] text-ink-50">SRL</span>
        <span className="mt-1 font-mono text-[9px] font-500 tracking-[0.4em] text-ink-400">SORELI</span>
      </div>
    </div>
  )
}

function Field({ label, icon, children }: any) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-400">
        {icon}{label}
      </span>
      {children}
    </label>
  )
}
function Select({ value, onChange, options }: any) {
  return (
    <div className="relative">
      <select value={value} onChange={onChange}
        className="h-11 w-full appearance-none rounded-field border border-ink-700 bg-ink-950 px-3.5 pr-9 text-sm font-500 text-ink-100 outline-none transition-colors hover:border-ink-500 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30">
        {options.map((o: string) => <option key={o} className="bg-ink-900">{o}</option>)}
      </select>
      <IconChevron className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
    </div>
  )
}

export default function Landing() {
  const [auction, setAuction] = useState('Copart')
  const [origin, setOrigin] = useState('Los Angeles, CA')
  const [vehicle, setVehicle] = useState('Sedan')
  const [dest, setDest] = useState('ფოთი')
  const [method, setMethod] = useState<'container' | 'roro'>('container')
  const [faq, setFaq] = useState<number | null>(0)

  const o = ORIGINS[origin]
  const auctionFee = AUCTIONS[auction].fee
  const inland = o.inland + VEHICLES[vehicle]
  const ocean = o.ocean + DEST[dest] + (method === 'roro' ? -180 : 0)
  const service = 300
  const total = auctionFee + inland + ocean + service

  return (
    <div className="w-full bg-ink-950 font-sans text-ink-100 antialiased">
      {/* ============ NAV ============ */}
      <header className="sticky top-0 z-30 border-b border-ink-800/80 bg-ink-950/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <Logo />
          <nav className="hidden items-center gap-8 lg:flex">
            {['ლოტები', 'კალკულატორი', 'როგორ მუშაობს', 'ბლოგი', 'კონტაქტი'].map((n, i) => (
              <a key={n} href="#" onClick={(e) => e.preventDefault()}
                className={`text-sm font-500 transition-colors ${i === 1 ? 'text-ink-50' : 'text-ink-400 hover:text-ink-100'}`}>{n}</a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <button type="button" className="inline-flex h-10 items-center rounded-btn border border-ink-700 px-4 text-sm font-display font-600 uppercase tracking-wide text-ink-100 transition-colors hover:border-ink-500 hover:bg-ink-800">შესვლა</button>
          </div>
        </div>
      </header>

      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden border-b border-ink-800">
        {/* dark base */}
        <div className="absolute inset-0 bg-ink-950" />
        {/* container photo — right half */}
        <div className="absolute inset-y-0 right-0 w-full lg:w-[58%]">
          <img
            src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&q=80"
            alt="კონტეინერები პორტში"
            className="h-full w-full object-cover object-center"
          />
          {/* fade left edge into dark */}
          <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/70 to-transparent" />
          {/* fade top & bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-ink-950/60" />
        </div>

        {/* floating container badge */}
        <div className="pointer-events-none absolute bottom-20 right-[8%] hidden lg:flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 rounded-card border border-ink-700/60 bg-ink-900/80 px-4 py-3 backdrop-blur-md shadow-pop">
            <svg className="h-5 w-5 text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="1"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-400">კონტეინერი</div>
              <div className="font-display text-sm font-700 text-ink-100">40HC · Savannah → Poti</div>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-card border border-ink-700/60 bg-ink-900/80 px-4 py-3 backdrop-blur-md shadow-pop">
            <svg className="h-5 w-5 text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-400">ჩამოსვლა</div>
              <div className="font-display text-sm font-700 text-success-400">ETA: 18 დღე</div>
            </div>
          </div>
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-8 lg:px-10 lg:py-12">
          <div className="max-w-xl">
            <h1 className="mt-6 font-display text-4xl font-900 uppercase leading-[0.92] tracking-tight text-ink-50 sm:text-5xl lg:text-[3.75rem]">
              შენი მანქანა<br />
              <span className="text-brand-500">ამერიკიდან</span>
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-300">
              ვყიდულობთ, ვაზიდავთ და გავაბაჟებთ ავტომობილებს Copart-სა და IAAI-დან — ლოტის შერჩევიდან ფოთის პორტამდე, ერთ სივრცეში.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href="#calc" onClick={(e) => e.preventDefault()} className="inline-flex h-14 items-center gap-2 rounded-btn bg-brand-600 px-8 font-display text-sm font-700 uppercase tracking-widest text-white shadow-[0_10px_30px_-8px_rgba(226,96,9,0.7)] transition-colors hover:bg-brand-500">
                გამოთვალე ღირებულება <IconArrow className="h-5 w-5" />
              </a>
              <button type="button" className="inline-flex h-14 items-center gap-2 rounded-btn border border-ink-600 bg-ink-900/60 px-8 font-display text-sm font-700 uppercase tracking-widest text-ink-100 backdrop-blur transition-colors hover:border-ink-400 hover:bg-ink-800">
                ნახე ლოტები
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CALCULATOR ============ */}
      <section id="calc" className="relative border-b border-ink-800 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-brand-500">ტრანსპორტირების კალკულატორი</span>
              <h2 className="mt-2 font-display text-4xl font-800 uppercase tracking-tight text-ink-50 sm:text-5xl">
                გამოთვალე მიწოდება<br className="hidden sm:block" /> პორტამდე
              </h2>
            </div>
            <p className="max-w-xs text-sm text-ink-400">
              აირჩიე აუქციონი და ლოკაცია — ვაჩვენებთ სრულ ღირებულებას და სავარაუდო ვადას ფოთამდე.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-12">
            {/* ---- form ---- */}
            <div className="rounded-card border border-ink-800 bg-ink-900 p-6 lg:col-span-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label="აუქციონი" icon={<IconShield className="h-3.5 w-3.5" />}>
                  <Select value={auction} onChange={(e: any) => setAuction(e.target.value)} options={Object.keys(AUCTIONS)} />
                </Field>
                <Field label="დანიშნულების პორტი" icon={<IconShip className="h-3.5 w-3.5" />}>
                  <Select value={dest} onChange={(e: any) => setDest(e.target.value)} options={Object.keys(DEST)} />
                </Field>
                <Field label="აუქციონის ლოკაცია" icon={<IconPin className="h-3.5 w-3.5" />}>
                  <Select value={origin} onChange={(e: any) => setOrigin(e.target.value)} options={Object.keys(ORIGINS)} />
                </Field>
                <Field label="ჩატვირთვის პორტი" icon={<IconShip className="h-3.5 w-3.5" />}>
                  <div className="flex h-10 w-full items-center rounded-field border border-ink-700 bg-ink-950 px-3 font-mono text-sm text-ink-300">
                    {ORIGINS[origin].port}
                  </div>
                </Field>
                <div className="sm:col-span-2">
                  <Field label="ავტომობილის ტიპი" icon={<IconTruck className="h-3.5 w-3.5" />}>
                    <Select value={vehicle} onChange={(e: any) => setVehicle(e.target.value)} options={Object.keys(VEHICLES)} />
                  </Field>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3 rounded-btn border border-ink-800 bg-ink-950 px-4 py-3">
                <IconShield className="h-5 w-5 shrink-0 text-brand-500" />
                <p className="text-xs leading-snug text-ink-400">ფასი მოიცავს დაზღვევას და ლოტის გატანას. საბაჟო/აქციზი იანგარიშება ცალკე.</p>
              </div>
            </div>

            {/* ---- route + breakdown ---- */}
            <div className="grid gap-6 lg:col-span-7">
              {/* route map */}
              <div className="relative overflow-hidden rounded-card border border-ink-800 bg-ink-950 p-6">
                <div className="absolute inset-0 bg-[radial-gradient(circle,#252529_1px,transparent_1.5px)] bg-[length:20px_20px] opacity-60" />
                <div className="relative flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-400">მარშრუტი</span>
                  <span className="inline-flex items-center gap-1.5 rounded-pill bg-accent-500/15 px-2.5 py-1 font-mono text-[10px] font-600 uppercase tracking-wider text-accent-400 ring-1 ring-accent-500/25">
                    ≈ {o.days} დღე
                  </span>
                </div>

                {/* route line */}
                <div className="relative mt-10 mb-2">
                  <div className="flex items-center">
                    {/* origin */}
                    <div className="flex flex-col items-center">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-600 ring-4 ring-brand-600/20">
                        <IconPin className="h-4.5 w-4.5 text-white" />
                      </span>
                    </div>
                    {/* inland leg */}
                    <div className="relative flex-1 px-2">
                      <div className="h-0.5 w-full bg-gradient-to-r from-brand-500 to-ink-600" />
                      <span className="absolute -top-7 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-pill border border-ink-700 bg-ink-900 px-2 py-1 font-mono text-[10px] text-ink-300">
                        <IconTruck className="h-3 w-3 text-brand-400" /> {fmt(inland)}
                      </span>
                    </div>
                    {/* port */}
                    <div className="flex flex-col items-center">
                      <span className="grid h-7 w-7 place-items-center rounded-full border-2 border-ink-500 bg-ink-900">
                        <span className="h-2 w-2 rounded-full bg-ink-300" />
                      </span>
                    </div>
                    {/* ocean leg */}
                    <div className="relative flex-[1.4] px-2">
                      <div className="h-0.5 w-full border-t-2 border-dashed border-accent-500/70" />
                      <span className="absolute -top-7 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-pill border border-ink-700 bg-ink-900 px-2 py-1 font-mono text-[10px] text-ink-300">
                        <IconShip className="h-3 w-3 text-accent-400" /> {fmt(ocean)}
                      </span>
                    </div>
                    {/* dest */}
                    <div className="flex flex-col items-center">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-accent-600 ring-4 ring-accent-600/20">
                        <IconShip className="h-5 w-5 text-white" />
                      </span>
                    </div>
                  </div>
                  {/* labels */}
                  <div className="mt-3 flex items-center justify-between font-mono text-[11px] uppercase tracking-wide">
                    <span className="text-ink-100">{origin.split(',')[0]}</span>
                    <span className="text-ink-500">{o.port}</span>
                    <span className="text-ink-100">{dest}, GEO</span>
                  </div>
                </div>
              </div>

              {/* breakdown */}
              <div className="rounded-card border border-ink-800 bg-ink-900 p-6">
                <div className="grid gap-y-1">
                  {[
                    ['შიდა', inland],
                    ['საზღვაო', ocean],
                    ['სულ', total],
                  ].map(([l, v]: any) => (
                    <div key={l} className="flex items-center justify-between border-b border-dashed border-ink-800 py-2.5">
                      <span className="text-sm text-ink-400">{l}</span>
                      <span className="font-mono text-sm font-600 tabular-nums text-ink-100">{fmt(v)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex flex-col gap-4 rounded-btn bg-ink-950 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="font-display text-4xl font-700 tabular-nums text-brand-500">{fmt(total)}</div>
                  </div>
                  <button type="button" className="inline-flex h-12 items-center justify-center gap-2 rounded-btn bg-brand-600 px-6 font-display text-sm font-600 uppercase tracking-wide text-white shadow-[0_8px_24px_-8px_rgba(226,96,9,0.7)] transition-colors hover:bg-brand-500">
                    შეუკვეთე გადაზიდვა <IconArrow className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section className="border-b border-ink-800 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-brand-500">როგორ მუშაობს</span>
              <h2 className="mt-2 font-display text-4xl font-800 uppercase tracking-tight text-ink-50 sm:text-5xl">
                იმპორტი<br />4 ნაბიჯად
              </h2>
              <p className="mt-5 max-w-sm text-ink-300">
                ლოტის შერჩევიდან ეზოში მიყვანამდე — ყველა ეტაპს ჩვენ ვუძღვებით. შენ მხოლოდ აკონტროლებ პროცესს ერთი ანგარიშიდან.
              </p>
              <button type="button" className="mt-7 inline-flex h-12 items-center gap-2 rounded-btn border border-ink-700 px-6 font-display text-sm font-600 uppercase tracking-wide text-ink-100 transition-colors hover:border-ink-500 hover:bg-ink-800">
                დაიწყე იმპორტი <IconArrow className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="lg:col-span-8">
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ['01', 'აირჩიე ლოტი', 'იპოვე მანქანა Copart-სა და IAAI-ზე ან გამოგვიგზავნე ლოტის ნომერი — ჩვენ შევამოწმებთ ისტორიას.', true],
                  ['02', 'ჩვენ ვყიდულობთ', 'ვაბრუნებთ ფსონს შენი ლიმიტით და ვიხდით აუქციონზე ლიცენზირებული დილერის სტატუსით.', false],
                  ['03', 'ტრანსპორტი პორტამდე', 'სახმელეთო გადაზიდვა აუქციონიდან პორტამდე, შემდეგ კონტეინერით ფოთის ან ბათუმის ტერმინალამდე.', false],
                  ['04', 'გაბაჟება და მიწოდება', 'ვაფორმებთ საბაჟო პროცედურებს და მანქანას მზად, დარეგისტრირებულს გადმოგცემთ.', false],
                ].map(([n, t, d, hot]: any) => (
                  <div key={n} className={`rounded-card border p-6 transition-colors ${hot ? 'border-brand-500/40 bg-brand-600/[0.07]' : 'border-ink-800 bg-ink-900 hover:border-ink-600'}`}>
                    <div className="flex items-center justify-between">
                      <span className={`font-display text-3xl font-800 tabular-nums ${hot ? 'text-brand-500' : 'text-ink-600'}`}>{n}</span>
                      {hot && <span className="rounded-pill bg-brand-600/15 px-2.5 py-1 font-mono text-[10px] font-600 uppercase tracking-wider text-brand-400 ring-1 ring-brand-500/25">აქ იწყება</span>}
                    </div>
                    <h3 className="mt-4 font-display text-lg font-700 uppercase tracking-wide text-ink-50">{t}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-400">{d}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ WHY US ============ */}
      <section className="border-b border-ink-800 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="grid gap-4 lg:grid-cols-3">
            {[
              [<IconShield key="s" className="h-6 w-6" />, 'ლიცენზირებული დილერი', 'პირდაპირი წვდომა Copart-სა და IAAI-ზე — ვაჭრობ რეალურ დილერულ ფასებში, შუამავლის ზედნადებ გარეშე.'],
              [<IconShip key="h" className="h-6 w-6" />, 'გამჭვირვალე ლოგისტიკა', 'ფიქსირებული ფრახტი და რეალური ETA. ყველა ეტაპი თვალყურის დევნებით — აუქციონიდან ფოთამდე.'],
              [<IconTruck key="t" className="h-6 w-6" />, 'სრული მომსახურება', 'შემოწმება, ყიდვა, ტრანსპორტი, დაზღვევა და გაბაჟება — ერთ ხელშეკრულებაში, ერთ გუნდთან.'],
            ].map(([ic, t, d]: any) => (
              <div key={t} className="rounded-card border border-ink-800 bg-ink-900 p-7">
                <span className="grid h-12 w-12 place-items-center rounded-btn bg-brand-600/15 text-brand-500">{ic}</span>
                <h3 className="mt-5 font-display text-lg font-700 uppercase tracking-wide text-ink-50">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-400">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="border-b border-ink-800 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-brand-500">ხშირი კითხვები</span>
              <h2 className="mt-2 font-display text-4xl font-800 uppercase tracking-tight text-ink-50 sm:text-5xl">გაქვს კითხვა?</h2>
              <p className="mt-5 max-w-sm text-ink-300">ვერ იპოვე პასუხი? დაგვიკავშირდი — ჩვენი გუნდი ორ საათში გიპასუხებს.</p>
              <button type="button" className="mt-7 inline-flex h-12 items-center gap-2 rounded-btn bg-brand-600 px-6 font-display text-sm font-600 uppercase tracking-wide text-white shadow-[0_8px_24px_-8px_rgba(226,96,9,0.7)] transition-colors hover:bg-brand-500">
                დაგვიკავშირდი
              </button>
            </div>

            <div className="lg:col-span-8">
              <div className="divide-y divide-ink-800 overflow-hidden rounded-card border border-ink-800 bg-ink-900">
                {[
                  ['რა შედის ტრანსპორტირების ფასში?', 'ფასი მოიცავს სახმელეთო გადაზიდვას აუქციონიდან პორტამდე, საზღვაო ფრახტს, დაზღვევას და ლოტის გატანას. საბაჟო და აქციზი იანგარიშება ცალკე, ავტომობილის ასაკისა და ძრავის მიხედვით.'],
                  ['რამდენი ხანი სჭირდება მიწოდებას?', 'საშუალოდ 30-45 დღე აუქციონზე ყიდვიდან ფოთის პორტამდე. ზუსტი ETA დამოკიდებულია გასვლის პორტსა და კონტეინერის გრაფიკზე.'],
                  ['შემიძლია თვითონ ვაჭრო აუქციონზე?', 'დიახ. ჩვენი პლატფორმიდან აყენებ ლიმიტს და ჩვენ ვაბრუნებთ ფსონს შენი სახელით ლიცენზირებული დილერის სტატუსით.'],
                  ['როგორ ხდება გადახდა?', 'დეპოზიტი ლოტის მოგების შემდეგ, დანარჩენი — ტრანსპორტირების ეტაპებზე. ყველა გადარიცხვა ფიქსირდება შენს ანგარიშზე.'],
                ].map(([q, a], i) => (
                  <div key={q}>
                    <button type="button" onClick={() => setFaq(faq === i ? null : i)}
                      className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-ink-800/40">
                      <span className="font-display text-base font-600 uppercase tracking-wide text-ink-50">{q}</span>
                      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border transition-all ${faq === i ? 'rotate-180 border-brand-500 bg-brand-600/15 text-brand-500' : 'border-ink-700 text-ink-400'}`}>
                        <IconChevron className="h-4 w-4" />
                      </span>
                    </button>
                    {faq === i && (
                      <div className="px-6 pb-6 pr-16">
                        <p className="text-sm leading-relaxed text-ink-400">{a}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CTA BAND ============ */}
      <section className="border-b border-ink-800 py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="relative overflow-hidden rounded-card border border-brand-500/30 bg-gradient-to-br from-brand-600 to-brand-800 px-8 py-14 lg:px-16 lg:py-16">
            <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(0,0,0,0.25)_1px,transparent_1.5px)] bg-[length:22px_22px] opacity-40" />
            <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
              <div className="max-w-2xl">
                <h2 className="font-display text-4xl font-800 uppercase leading-[0.95] tracking-tight text-white sm:text-5xl">
                  მზად ხარ შენი მანქანის<br />იმპორტისთვის?
                </h2>
                <p className="mt-4 max-w-lg text-base text-brand-50">
                  დაარეგისტრირდი წუთებში და მიიღე წვდომა მილიონ ლოტზე დილერულ ფასებში.
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-3">
                <button type="button" className="inline-flex h-14 items-center gap-2 rounded-btn bg-ink-950 px-8 font-display text-sm font-700 uppercase tracking-widest text-white transition-colors hover:bg-ink-900">
                  დაიწყე ახლა <IconArrow className="h-5 w-5" />
                </button>
                <button type="button" className="inline-flex h-14 items-center gap-2 rounded-btn border border-white/30 bg-white/10 px-8 font-display text-sm font-700 uppercase tracking-widest text-white backdrop-blur transition-colors hover:bg-white/20">
                  დაგვირეკე
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="bg-ink-950 pt-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="grid gap-10 pb-14 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <Logo />
              <p className="mt-4 max-w-xs text-sm text-ink-400">
                ამერიკული აუქციონებიდან ავტომობილების იმპორტი და ტრანსპორტირება საქართველოში. 2004 წლიდან.
              </p>
              <div className="mt-6 flex gap-3">
                {['IN', 'FB', 'TG'].map((s) => (
                  <button key={s} type="button" className="grid h-10 w-10 place-items-center rounded-btn border border-ink-800 font-mono text-[11px] text-ink-400 transition-colors hover:border-ink-600 hover:text-ink-100">{s}</button>
                ))}
              </div>
            </div>
            {[
              ['პლატფორმა', ['ლოტების ძებნა', 'კალკულატორი', 'როგორ მუშაობს', 'ფასები']],
              ['კომპანია', ['ჩვენ შესახებ', 'ბლოგი', 'კარიერა', 'კონტაქტი']],
              ['დახმარება', ['ხშირი კითხვები', 'გაბაჟება', 'პირობები', 'კონფიდენციალურობა']],
            ].map(([title, links]: any) => (
              <div key={title} className="lg:col-span-2">
                <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-500">{title}</div>
                <ul className="mt-4 space-y-3">
                  {links.map((l: string) => (
                    <li key={l}><a href="#" onClick={(e) => e.preventDefault()} className="text-sm text-ink-300 transition-colors hover:text-brand-500">{l}</a></li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="lg:col-span-2">
              <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-500">კონტაქტი</div>
              <ul className="mt-4 space-y-3 text-sm text-ink-300">
                <li className="font-mono tabular-nums">+995 32 2 00 00 00</li>
                <li>info@soreli.ge</li>
                <li className="text-ink-400">თბილისი, დ. აღმაშენებლის 154</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-ink-800 py-6 sm:flex-row sm:items-center sm:justify-between">
            <span className="font-mono text-[11px] uppercase tracking-wider text-ink-500">© 2026 SRL Soreli. ყველა უფლება დაცულია.</span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-ink-500">Copart · IAAI · Manheim ოფიციალური წვდომა</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
