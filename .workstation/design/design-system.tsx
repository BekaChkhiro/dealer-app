import React, { useState } from 'react'

/* ============================================================
   CAUCASUS AUTO — Design System
   Dark industrial theme · red brand accent · Oswald display
   ============================================================ */

function Group({ id, title, children }: any) {
  return (
    <section className="mb-16">
      <div className="mb-6 flex items-center gap-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-brand-500">{id}</span>
        <h2 className="font-display text-2xl font-600 uppercase tracking-wide text-ink-50">{title}</h2>
        <span className="h-px flex-1 bg-ink-800" />
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">{children}</div>
    </section>
  )
}

function Panel({ title, span, children }: any) {
  return (
    <div className={`rounded-card border border-ink-800 bg-ink-900 p-6 ${span ? 'lg:col-span-2' : ''}`}>
      {title && <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-400">{title}</div>}
      {children}
    </div>
  )
}

/* ---------- Logo ---------- */
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
function Logo({ size = 'md' }: any) {
  const big = size === 'lg'
  return (
    <div className="flex items-center gap-2.5">
      <Mark className={big ? 'h-10 w-14 shrink-0' : 'h-8 w-12 shrink-0'} />
      <div className="flex flex-col leading-none">
        <span className={`font-display font-800 tracking-[0.04em] text-ink-50 ${big ? 'text-2xl' : 'text-xl'}`}>SRL</span>
        <span className="mt-1 font-mono text-[9px] font-500 tracking-[0.4em] text-ink-400">SORELI</span>
      </div>
    </div>
  )
}

/* ---------- Buttons ---------- */
function Btn({ children, variant = 'primary', size = 'md', ...p }: any) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-btn font-display font-600 uppercase tracking-wide transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950 disabled:cursor-not-allowed disabled:opacity-40'
  const sizes: any = { sm: 'h-9 px-3.5 text-xs', md: 'h-11 px-5 text-sm', lg: 'h-13 px-7 text-base' }
  const variants: any = {
    primary: 'bg-brand-600 text-white shadow-[0_6px_20px_-6px_rgba(226,96,9,0.6)] hover:bg-brand-500 active:bg-brand-700',
    ghost: 'border border-ink-700 bg-transparent text-ink-100 hover:border-ink-500 hover:bg-ink-800 active:bg-ink-700',
    light: 'bg-ink-50 text-ink-950 hover:bg-white active:bg-ink-200',
    link: 'h-auto px-0 text-brand-500 hover:text-brand-400',
  }
  return (
    <button type="button" className={`${base} ${sizes[size]} ${variants[variant]}`} {...p}>
      {children}
    </button>
  )
}

/* ---------- Form field ---------- */
function Field({ label, children }: any) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-400">{label}</span>
      {children}
    </label>
  )
}
function Select({ value, onChange, options }: any) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className="h-11 w-full appearance-none rounded-field border border-ink-700 bg-ink-950 px-3.5 pr-9 text-sm font-500 text-ink-100 outline-none transition-colors hover:border-ink-500 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
      >
        {options.map((o: string) => (
          <option key={o} className="bg-ink-900">{o}</option>
        ))}
      </select>
      <svg className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  )
}
function Input({ placeholder, prefix }: any) {
  return (
    <div className="flex h-11 items-center rounded-field border border-ink-700 bg-ink-950 px-3.5 transition-colors focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/30 hover:border-ink-500">
      {prefix && <span className="mr-1.5 font-mono text-sm text-ink-400">{prefix}</span>}
      <input placeholder={placeholder} className="h-full w-full bg-transparent text-sm font-500 text-ink-100 placeholder:text-ink-500 outline-none" />
    </div>
  )
}

/* ---------- Badge / chip ---------- */
function Badge({ children, tone = 'brand' }: any) {
  const tones: any = {
    brand: 'bg-brand-600/15 text-brand-400 ring-1 ring-brand-500/25',
    neutral: 'bg-ink-800 text-ink-300 ring-1 ring-ink-700',
    success: 'bg-success-500/15 text-success-400 ring-1 ring-success-500/25',
    warning: 'bg-warning-500/15 text-warning-400 ring-1 ring-warning-500/25',
    accent: 'bg-accent-500/15 text-accent-400 ring-1 ring-accent-500/25',
  }
  return <span className={`inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 font-mono text-[10px] font-600 uppercase tracking-wider ${tones[tone]}`}>{children}</span>
}

/* ---------- Stat ---------- */
function Stat({ value, label, sub }: any) {
  return (
    <div className="rounded-card border border-ink-800 bg-ink-900 p-5">
      <div className="font-display text-4xl font-700 leading-none tracking-tight text-ink-50 tabular-nums">{value}</div>
      <div className="mt-2 font-mono text-[11px] uppercase tracking-wider text-ink-400">{label}</div>
      {sub && <div className="mt-1 text-xs text-ink-500">{sub}</div>}
    </div>
  )
}

/* ---------- Price row (calculator breakdown) ---------- */
function PriceRow({ label, value, total }: any) {
  return (
    <div className={`flex items-center justify-between py-2.5 ${total ? '' : 'border-b border-dashed border-ink-800'}`}>
      <span className={`text-sm ${total ? 'font-display font-600 uppercase tracking-wide text-ink-100' : 'text-ink-400'}`}>{label}</span>
      <span className={`font-mono tabular-nums ${total ? 'text-xl font-700 text-brand-500' : 'text-sm font-600 text-ink-100'}`}>{value}</span>
    </div>
  )
}

export default function DesignSystem() {
  const [v1, setV1] = useState('Copart')
  const [v2, setV2] = useState('Georgia')
  const [tab, setTab] = useState('ocean')
  const [acc, setAcc] = useState<number | null>(0)

  return (
    <div className="min-h-[800px] w-full bg-ink-950 font-sans text-ink-100 antialiased">
      {/* header */}
      <div className="border-b border-ink-800 bg-ink-950/80 px-10 py-7">
        <div className="mx-auto max-w-6xl">
          <Logo size="lg" />
          <p className="mt-3 max-w-xl text-sm text-ink-400">
            დიზაინ-სისტემა — მუქი ინდუსტრიული თემა, წითელი აქცენტი და Oswald ტიპოგრაფიკა აუქციონ-იმპორტის პლატფორმისთვის.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-10 py-12">
        {/* ---------------- Foundations ---------------- */}
        <Group id="01" title="Foundations">
          <Panel title="Color tokens">
            <div className="space-y-3">
              {[
                ['brand', ['bg-brand-400', 'bg-brand-500', 'bg-brand-600', 'bg-brand-700', 'bg-brand-900']],
                ['accent', ['bg-accent-400', 'bg-accent-500', 'bg-accent-600', 'bg-accent-700', 'bg-accent-900']],
                ['ink', ['bg-ink-700', 'bg-ink-800', 'bg-ink-900', 'bg-ink-950', 'bg-ink-200']],
                ['status', ['bg-success-500', 'bg-warning-500', 'bg-danger-500', 'bg-accent-500', 'bg-ink-600']],
              ].map(([name, sh]: any) => (
                <div key={name} className="flex items-center gap-3">
                  <span className="w-16 font-mono text-[11px] uppercase tracking-wider text-ink-400">{name}</span>
                  <div className="flex flex-1 gap-1.5">
                    {sh.map((c: string) => <span key={c} className={`h-9 flex-1 rounded-[4px] ${c}`} />)}
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Type scale">
            <div className="space-y-3">
              <div className="font-display text-5xl font-700 uppercase leading-none tracking-tight text-ink-50">Your Move</div>
              <div className="font-display text-2xl font-600 uppercase tracking-wide text-ink-100">Section heading</div>
              <div className="text-base text-ink-200">Body — ამერიკული აუქციონებიდან მანქანის იმპორტი მარტივად.</div>
              <div className="text-sm text-ink-400">Small / muted supporting copy</div>
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-brand-500">Mono label · 11px</div>
              <div className="font-mono text-lg tabular-nums text-ink-100">$1,950.00</div>
            </div>
          </Panel>

          <Panel title="Radius & elevation" span>
            <div className="flex flex-wrap items-end gap-4">
              {['rounded-field', 'rounded-btn', 'rounded-card', 'rounded-pill'].map((r) => (
                <div key={r} className="text-center">
                  <div className={`h-16 w-24 border border-ink-700 bg-ink-800 ${r}`} />
                  <div className="mt-2 font-mono text-[10px] text-ink-400">{r}</div>
                </div>
              ))}
              <span className="mx-2 h-16 w-px bg-ink-800" />
              {['shadow-xs', 'shadow-card', 'shadow-pop', 'shadow-float'].map((sh) => (
                <div key={sh} className="text-center">
                  <div className={`h-16 w-24 rounded-card bg-ink-800 ${sh}`} />
                  <div className="mt-2 font-mono text-[10px] text-ink-400">{sh}</div>
                </div>
              ))}
            </div>
          </Panel>
        </Group>

        {/* ---------------- Components ---------------- */}
        <Group id="02" title="Components">
          <Panel title="Buttons">
            <div className="flex flex-wrap items-center gap-3">
              <Btn variant="primary">დაიწყე</Btn>
              <Btn variant="light">ნახე ლოტები</Btn>
              <Btn variant="ghost">გაიგე მეტი</Btn>
              <Btn variant="link">ყველა →</Btn>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Btn size="sm">Small</Btn>
              <Btn size="md">Medium</Btn>
              <Btn size="lg">Large</Btn>
              <Btn disabled>Disabled</Btn>
            </div>
          </Panel>

          <Panel title="Badges & chips">
            <div className="flex flex-wrap gap-2.5">
              <Badge tone="brand">Hot lot</Badge>
              <Badge tone="success">Run & Drive</Badge>
              <Badge tone="warning">Salvage</Badge>
              <Badge tone="accent">In transit</Badge>
              <Badge tone="neutral">Copart</Badge>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {['SUV', 'Sedan', 'Pickup', 'Electric', 'Moto'].map((c) => (
                <button key={c} type="button" className="rounded-pill border border-ink-700 bg-ink-800 px-3.5 py-1.5 text-xs font-500 text-ink-200 transition-colors hover:border-brand-500 hover:text-ink-50">{c}</button>
              ))}
            </div>
          </Panel>

          <Panel title="Form fields">
            <div className="grid grid-cols-2 gap-4">
              <Field label="აუქციონი"><Select value={v1} onChange={(e: any) => setV1(e.target.value)} options={['Copart', 'IAAI', 'Manheim']} /></Field>
              <Field label="დანიშნულება"><Select value={v2} onChange={(e: any) => setV2(e.target.value)} options={['Georgia', 'Armenia', 'Azerbaijan']} /></Field>
              <Field label="ლოტის ნომერი"><Input placeholder="49281736" prefix="#" /></Field>
              <Field label="ბაზრის ფასი"><Input placeholder="0.00" prefix="$" /></Field>
            </div>
          </Panel>

          <Panel title="Stat cards">
            <div className="grid grid-cols-2 gap-4">
              <Stat value="1.2M+" label="გამოტანილი ლოტი" />
              <Stat value="50+" label="აუქციონის გეითი" />
              <Stat value="700+" label="ყოველთვიური მიწოდება" />
              <Stat value="2004" label="გამოცდილება" sub="20 წელი ბაზარზე" />
            </div>
          </Panel>
        </Group>

        {/* ---------------- Patterns ---------------- */}
        <Group id="03" title="Patterns">
          <Panel title="Top navigation" span>
            <div className="flex items-center justify-between rounded-btn border border-ink-800 bg-ink-950 px-5 py-3">
              <Logo size="sm" />
              <nav className="hidden items-center gap-7 md:flex">
                {['მთავარი', 'ლოტები', 'კალკულატორი', 'როგორ მუშაობს', 'ბლოგი'].map((n, i) => (
                  <a key={n} href="#" onClick={(e) => e.preventDefault()} className={`text-sm font-500 transition-colors ${i === 2 ? 'text-ink-50' : 'text-ink-400 hover:text-ink-100'}`}>{n}</a>
                ))}
              </nav>
              <div className="flex items-center gap-3">
                <Btn size="sm" variant="ghost">შესვლა</Btn>
                <Btn size="sm">რეგისტრაცია</Btn>
              </div>
            </div>
          </Panel>

          <Panel title="Calculator — price breakdown">
            <div className="rounded-card border border-ink-800 bg-ink-950 p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-display text-sm font-600 uppercase tracking-wide text-ink-200">Los Angeles → ფოთი</span>
                <Badge tone="accent">≈ 45 დღე</Badge>
              </div>
              <PriceRow label="აუქციონის საფასური" value="$520" />
              <PriceRow label="სახმელეთო (CA → port)" value="$395" />
              <PriceRow label="საზღვაო ფრახტი" value="$1,050" />
              <PriceRow label="მომსახურება" value="$300" />
              <div className="mt-1">
                <PriceRow label="სულ ტრანსპორტი" value="$2,265" total />
              </div>
            </div>
          </Panel>

          <Panel title="Segmented control">
            <div className="inline-flex rounded-btn border border-ink-800 bg-ink-950 p-1">
              {[['ocean', 'საზღვაო'], ['land', 'სახმელეთო']].map(([id, lbl]) => (
                <button key={id} type="button" onClick={() => setTab(id)} className={`rounded-[6px] px-5 py-2 font-display text-xs font-600 uppercase tracking-wide transition-colors ${tab === id ? 'bg-brand-600 text-white' : 'text-ink-400 hover:text-ink-100'}`}>{lbl}</button>
              ))}
            </div>
            <p className="mt-3 text-xs text-ink-500">აქტიური: {tab === 'ocean' ? 'საზღვაო მარშრუტი' : 'სახმელეთო მარშრუტი'}</p>
          </Panel>

          <Panel title="Step card">
            <div className="flex gap-4 rounded-card border border-ink-800 bg-ink-950 p-5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-btn bg-brand-600/15 font-display text-xl font-700 text-brand-500">01</span>
              <div>
                <h4 className="font-display text-base font-600 uppercase tracking-wide text-ink-50">აირჩიე ლოტი</h4>
                <p className="mt-1 text-sm text-ink-400">იპოვე მანქანა Copart-სა და IAAI-ზე ან გამოგვიგზავნე ლოტის ნომერი.</p>
              </div>
            </div>
          </Panel>

          <Panel title="Route timeline">
            <div className="relative overflow-hidden rounded-card border border-ink-800 bg-ink-950 p-5">
              <div className="absolute inset-0 bg-[radial-gradient(circle,#252529_1px,transparent_1.5px)] bg-[length:18px_18px] opacity-60" />
              <div className="relative flex items-center">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-600 ring-4 ring-brand-600/20">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-white"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                </span>
                <div className="h-0.5 flex-1 bg-gradient-to-r from-brand-500 to-ink-600" />
                <span className="grid h-6 w-6 place-items-center rounded-full border-2 border-ink-500 bg-ink-900"><span className="h-1.5 w-1.5 rounded-full bg-ink-300" /></span>
                <div className="h-0.5 flex-[1.4] border-t-2 border-dashed border-accent-500/70" />
                <span className="grid h-8 w-8 place-items-center rounded-full bg-accent-600 ring-4 ring-accent-600/20">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4 text-white"><path d="m6 13l.2-2.8c.1-1.7.2-2.6.8-3.2c.6-.5 1.4-.5 3.2-.5h3.6c1.8 0 2.6 0 3.2.5c.6.6.6 1.5.8 3.2L21 13" /><path d="M4 14l7.5-3.3c.4-.2.6-.3.8-.3s.4.1.8.3L20 14" /></svg>
                </span>
              </div>
              <div className="relative mt-3 flex justify-between font-mono text-[10px] uppercase tracking-wide">
                <span className="text-ink-100">Los Angeles</span><span className="text-ink-500">Long Beach</span><span className="text-ink-100">ფოთი</span>
              </div>
            </div>
          </Panel>

          <Panel title="Lot card">
            <div className="overflow-hidden rounded-card border border-ink-800 bg-ink-950">
              <div className="relative aspect-[16/10] bg-ink-800">
                <img src="https://picsum.photos/seed/caucasusauto/640/400" alt="" width={640} height={400} className="h-full w-full object-cover opacity-90" />
                <div className="absolute left-3 top-3"><Badge tone="brand">Hot lot</Badge></div>
                <div className="absolute bottom-3 right-3"><Badge tone="neutral">Copart · CA</Badge></div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <h4 className="font-display text-base font-600 uppercase tracking-wide text-ink-50">2021 Toyota RAV4</h4>
                  <span className="font-mono text-base font-700 tabular-nums text-brand-500">$18,400</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-ink-400">
                  <span>42k mi</span><span className="text-ink-700">·</span><span>Run & Drive</span><span className="text-ink-700">·</span><span>Lot #49281736</span>
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="Category card">
            <a href="#" onClick={(e) => e.preventDefault()} className="group relative block overflow-hidden rounded-card border border-ink-800 bg-ink-900">
              <div className="relative aspect-[2/1]">
                <img src="https://picsum.photos/seed/caucasustype/720/360" alt="" className="h-full w-full object-cover opacity-70 transition-all duration-300 group-hover:scale-105 group-hover:opacity-90" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5">
                  <div>
                    <h4 className="font-display text-xl font-700 uppercase tracking-wide text-ink-50">ჯიპები / SUV</h4>
                    <div className="mt-1 font-mono text-[11px] uppercase tracking-wider text-ink-300">12,480 აქტიური ლოტი</div>
                  </div>
                  <span className="grid h-9 w-9 place-items-center rounded-full border border-ink-600 bg-ink-950/60 text-ink-100 transition-colors group-hover:border-brand-500 group-hover:bg-brand-600 group-hover:text-white">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M5 12h14m-6-7 7 7-7 7" /></svg>
                  </span>
                </div>
              </div>
            </a>
          </Panel>

          <Panel title="Route row">
            <div className="overflow-hidden rounded-card border border-ink-800 bg-ink-950">
              {[['Los Angeles', 'Long Beach', 'ფოთი', '$2,265', '45 დღე'], ['Newark', 'New York', 'ფოთი', '$1,950', '30 დღე']].map(([from, port, to, price, eta], i) => (
                <div key={from} className={`flex items-center justify-between px-4 py-4 transition-colors hover:bg-ink-800/50 ${i > 0 ? 'border-t border-ink-800' : ''}`}>
                  <div className="flex flex-wrap items-center gap-x-2 font-display text-sm font-600 uppercase tracking-wide text-ink-100">
                    <span>{from}</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 text-ink-600"><path d="M5 12h14m-6-7 7 7-7 7" /></svg>
                    <span className="text-ink-400">{port}</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 text-ink-600"><path d="M5 12h14m-6-7 7 7-7 7" /></svg>
                    <span>{to}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-ink-400">≈ {eta}</span>
                    <span className="font-mono text-base font-700 tabular-nums text-brand-500">{price}</span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Accordion (FAQ)">
            <div className="divide-y divide-ink-800 overflow-hidden rounded-card border border-ink-800 bg-ink-950">
              {[['რა შედის ფასში?', 'სახმელეთო, საზღვაო ფრახტი და დაზღვევა. საბაჟო ცალკე.'], ['რამდენი ხანი სჭირდება?', 'საშუალოდ 30-45 დღე პორტამდე.']].map(([q, a], i) => (
                <div key={q}>
                  <button type="button" onClick={() => setAcc(acc === i ? null : i)} className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-ink-800/40">
                    <span className="font-display text-sm font-600 uppercase tracking-wide text-ink-50">{q}</span>
                    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border transition-all ${acc === i ? 'rotate-180 border-brand-500 bg-brand-600/15 text-brand-500' : 'border-ink-700 text-ink-400'}`}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5"><path d="m6 9 6 6 6-6" /></svg>
                    </span>
                  </button>
                  {acc === i && <div className="px-4 pb-4 text-sm leading-relaxed text-ink-400">{a}</div>}
                </div>
              ))}
            </div>
          </Panel>
        </Group>
      </div>

      <div className="border-t border-ink-800 px-10 py-8">
        <div className="mx-auto max-w-6xl font-mono text-[11px] uppercase tracking-wider text-ink-500">
          SRL Soreli — design system · v1
        </div>
      </div>
    </div>
  )
}
