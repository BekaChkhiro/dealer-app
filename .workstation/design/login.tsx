// @page: Auth
import React, { useState } from 'react'

/* ===========================================================
   SRL / SORELI — Sign in
   =========================================================== */

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

const IconMail = (p: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 7 10 6 10-6" />
  </svg>
)
const IconLock = (p: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
)
const IconEye = (p: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
  </svg>
)
const IconEyeOff = (p: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M9.9 4.2A10.9 10.9 0 0 1 12 4c6.5 0 10 7 10 7a18 18 0 0 1-2.6 3.7M6.6 6.6A18 18 0 0 0 2 11s3.5 7 10 7a10.9 10.9 0 0 0 4.1-.8" />
    <path d="m9.5 9.5a3 3 0 0 0 4.2 4.2" /><path d="M2 2l20 20" />
  </svg>
)
const IconArrow = (p: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12h14m-6-7 7 7-7 7" /></svg>
)
const IconCheck = (p: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m5 12 5 5L20 7" /></svg>
)
const IconShip = (p: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M2 21c1.3.1 2.4-1 3.3-1s2.5 1 3.4 1c1 0 2.2-1 3.3-1s2.3 1 3.3 1c1.3.1 2.4-1 3.4-1s2.5 1 3.3 1" />
    <path d="M6 20.5c-1.4-1.8-2.4-4-2.8-5.2c-.2-.5 0-.7.5-.9l7.5-3.3c.4-.2.6-.3.8-.3s.4.1.8.3l7.5 3.3c.5.2.6.4.5.9c-.4 1.2-1.4 3.4-2.8 5.2" />
    <path d="m6 13l.2-2.8c.1-1.7.2-2.6.8-3.2c.6-.5 1.4-.5 3.2-.5h3.6c1.8 0 2.6 0 3.2.5c.6.6.6 1.5.8 3.2L21 13" /><path d="M12 3v8" />
  </svg>
)

export default function Login() {
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [show, setShow] = useState(false)
  const [remember, setRemember] = useState(true)

  return (
    <div className="grid min-h-[820px] w-full bg-ink-950 font-sans text-ink-100 antialiased lg:grid-cols-2">
      {/* ============ LEFT — brand panel ============ */}
      <div className="relative hidden overflow-hidden border-r border-ink-800 lg:block">
        <img src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&q=80" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink-950/70 via-ink-950/78 to-ink-950" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-ink-950/40" />
        <div className="absolute inset-0 bg-[radial-gradient(circle,#252529_1px,transparent_1.5px)] bg-[length:22px_22px] opacity-30" />

        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-2.5">
            <Mark className="h-9 w-14 shrink-0" />
            <div className="flex flex-col leading-none">
              <span className="font-display text-2xl font-800 tracking-[0.04em] text-ink-50">SRL</span>
              <span className="mt-1 font-mono text-[9px] font-500 tracking-[0.4em] text-ink-400">SORELI</span>
            </div>
          </div>



        </div>
      </div>

      {/* ============ RIGHT — form ============ */}
      <div className="flex items-center justify-center px-6 py-14 sm:px-10">
        <div className="w-full max-w-sm">
          {/* mobile logo */}
          <div className="mb-10 flex items-center gap-2.5 lg:hidden">
            <Mark className="h-8 w-12 shrink-0" />
            <div className="flex flex-col leading-none">
              <span className="font-display text-xl font-800 tracking-[0.04em] text-ink-50">SRL</span>
              <span className="mt-1 font-mono text-[9px] font-500 tracking-[0.4em] text-ink-400">SORELI</span>
            </div>
          </div>

          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-brand-500">ანგარიში</span>
          <h2 className="mt-2 font-display text-4xl font-800 uppercase tracking-tight text-ink-50">შესვლა</h2>


          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-400">ელ. ფოსტა</span>
              <div className="flex h-12 items-center rounded-field border border-ink-700 bg-ink-900 px-3.5 transition-colors focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/30 hover:border-ink-500">
                <IconMail className="mr-2.5 h-4.5 w-4.5 shrink-0 text-ink-500" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@soreli.ge"
                  className="h-full w-full bg-transparent text-sm font-500 text-ink-100 placeholder:text-ink-600 outline-none" />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-400">პაროლი</span>
              <div className="flex h-12 items-center rounded-field border border-ink-700 bg-ink-900 px-3.5 transition-colors focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/30 hover:border-ink-500">
                <IconLock className="mr-2.5 h-4.5 w-4.5 shrink-0 text-ink-500" />
                <input type={show ? 'text' : 'password'} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••"
                  className="h-full w-full bg-transparent text-sm font-500 text-ink-100 placeholder:text-ink-600 outline-none" />
                <button type="button" onClick={() => setShow(!show)} className="ml-2 shrink-0 text-ink-500 transition-colors hover:text-ink-200">
                  {show ? <IconEyeOff className="h-4.5 w-4.5" /> : <IconEye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </label>

            <div className="flex items-center justify-between pt-1">
              <button type="button" onClick={() => setRemember(!remember)} className="group flex items-center gap-2.5">
                <span className={`grid h-5 w-5 place-items-center rounded-[5px] border transition-colors ${remember ? 'border-brand-500 bg-brand-600 text-white' : 'border-ink-600 bg-ink-900 text-transparent group-hover:border-ink-400'}`}>
                  <IconCheck className="h-3 w-3" />
                </span>
                <span className="text-sm text-ink-300">დამიმახსოვრე</span>
              </button>
              <a href="#" onClick={(e) => e.preventDefault()} className="text-sm font-500 text-brand-500 transition-colors hover:text-brand-400">დაგავიწყდა პაროლი?</a>
            </div>

            <button type="submit" className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-btn bg-brand-600 font-display text-sm font-700 uppercase tracking-widest text-white shadow-[0_10px_30px_-8px_rgba(226,96,9,0.7)] transition-colors hover:bg-brand-500 active:bg-brand-700">
              შესვლა <IconArrow className="h-5 w-5" />
            </button>
          </form>

        </div>
      </div>
    </div>
  )
}
