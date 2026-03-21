import Link from 'next/link'
import {
  ArrowRight,
  RefreshCw,
  Zap,
  Sliders,
  Activity,
  Clock,
  Layers,
  Check,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* ─── NAVBAR ─── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-[56px] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center">
              <span className="text-white text-[10px] font-bold tracking-tight">SB</span>
            </div>
            <span className="text-[15px] font-semibold text-gray-900">SheetBridgeX</span>
          </div>

          <nav className="hidden md:flex items-center gap-7">
            <a href="#product" className="text-[14px] text-gray-500 hover:text-gray-900 transition-colors">Product</a>
            <a href="#pricing" className="text-[14px] text-gray-500 hover:text-gray-900 transition-colors">Pricing</a>
            <a href="#faq" className="text-[14px] text-gray-500 hover:text-gray-900 transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 bg-gray-900 text-white text-[13px] font-medium px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Go to dashboard <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden sm:block text-[14px] text-gray-500 hover:text-gray-900 transition-colors">
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-1.5 bg-gray-900 text-white text-[13px] font-medium px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Start Free <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── HERO TEXT ─── */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-10 text-center">
        <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-3.5 py-1.5 mb-8">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[13px] font-medium text-gray-600">Auto-sync every 5 minutes on Pro</span>
        </div>

        <h1 className="text-[52px] sm:text-[64px] font-bold tracking-[-0.03em] text-gray-900 max-w-3xl mx-auto leading-[1.08] mb-6">
          Sync Notion to Google Sheets{' '}
          <span className="text-gray-400">without the manual work</span>
        </h1>

        <p className="text-[18px] text-gray-500 max-w-xl mx-auto leading-relaxed mb-10">
          Keep your spreadsheets automatically updated from Notion databases.
          No exports, no copy-paste, no messy workflows.
        </p>

        <div className="flex items-center justify-center gap-4 mb-8">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-gray-900 text-white font-semibold px-6 py-3.5 rounded-xl hover:bg-gray-800 transition-colors text-[14px]"
          >
            Start Free <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#product"
            className="inline-flex items-center gap-1 text-[14px] text-gray-500 hover:text-gray-900 transition-colors"
          >
            See how it works <ChevronRight className="w-4 h-4" />
          </a>
        </div>

        <div className="flex items-center justify-center gap-7 flex-wrap">
          {['Set up in minutes', 'Automatic scheduled syncs', 'Built for reliable workflows'].map((b) => (
            <div key={b} className="flex items-center gap-1.5 text-[13px] text-gray-400">
              <Check className="w-3.5 h-3.5 text-green-500" />
              {b}
            </div>
          ))}
        </div>
      </section>

      {/* ─── HERO VISUAL ─── */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="rounded-2xl border border-gray-200 shadow-[0_4px_32px_rgba(0,0,0,0.06)] overflow-hidden bg-gray-50">
          {/* Browser chrome */}
          <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
              <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
              <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
            </div>
            <div className="flex-1 max-w-xs mx-auto bg-gray-50 border border-gray-200 rounded-md px-3 py-1">
              <span className="text-[12px] text-gray-400 block text-center">app.sheetbridgex.com/dashboard</span>
            </div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-[1fr_120px_1fr] items-start gap-0 p-6">

            {/* Notion table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100 bg-white">
                <div className="w-5 h-5 bg-gray-900 rounded flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-[9px] font-black">N</span>
                </div>
                <span className="text-[12px] font-semibold text-gray-800 truncate">Q3 Marketing Campaigns</span>
              </div>
              <table className="w-full text-[11.5px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-3 py-2 font-medium text-gray-400 whitespace-nowrap">Name</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-400 whitespace-nowrap">Status</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-400 whitespace-nowrap">Budget</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-400 whitespace-nowrap">Owner</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Summer Launch', status: 'Live', budget: '$12k', owner: 'Sarah', dot: 'bg-green-500' },
                    { name: 'Email Nurture', status: 'Draft', budget: '$3.5k', owner: 'Tom', dot: 'bg-gray-400' },
                    { name: 'Retargeting', status: 'Live', budget: '$8.2k', owner: 'Sarah', dot: 'bg-green-500' },
                    { name: 'Content Push', status: 'Review', budget: '$2.1k', owner: 'Amy', dot: 'bg-amber-400' },
                  ].map((row) => (
                    <tr key={row.name} className="border-b border-gray-50 last:border-0">
                      <td className="px-3 py-2 font-medium text-gray-800 whitespace-nowrap">{row.name}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center gap-1 text-[10.5px] font-medium ${
                          row.status === 'Live' ? 'text-green-700' :
                          row.status === 'Draft' ? 'text-gray-500' : 'text-amber-600'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${row.dot}`} />
                          {row.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-500">{row.budget}</td>
                      <td className="px-3 py-2 text-gray-400">{row.owner}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Middle arrow */}
            <div className="flex flex-col items-center justify-center gap-3 py-8 px-2">
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-[1px] bg-gray-300" />
                  <div className="w-2 h-[1px] bg-gray-300" />
                  <div className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center">
                    <ArrowRight className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
                <span className="text-[11px] text-gray-400 font-medium">syncing</span>
              </div>
              <div className="bg-white border border-green-200 rounded-lg px-2.5 py-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10.5px] font-medium text-green-700 whitespace-nowrap">2 min ago</span>
                </div>
              </div>
            </div>

            {/* Google Sheets */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100 bg-white">
                <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 bg-[#0F9D58]">
                  <span className="text-white text-[9px] font-black">S</span>
                </div>
                <span className="text-[12px] font-semibold text-gray-800 truncate">Campaign Tracker 2024</span>
              </div>
              <table className="w-full text-[11.5px]">
                <thead>
                  <tr className="bg-[#f8f9fa] border-b border-gray-200">
                    {['A', 'B', 'C', 'D'].map((col) => (
                      <th key={col} className="text-center px-2 py-1.5 font-normal text-gray-400 border-r border-gray-200 last:border-0 w-[25%]">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-[#e8f0fe] border-b border-gray-200">
                    {['Name', 'Status', 'Budget', 'Owner'].map((h) => (
                      <td key={h} className="px-2 py-2 font-medium text-[#1a73e8] border-r border-gray-200 last:border-0 whitespace-nowrap">{h}</td>
                    ))}
                  </tr>
                  {[
                    ['Summer Launch', 'Live', '$12k', 'Sarah'],
                    ['Email Nurture', 'Draft', '$3.5k', 'Tom'],
                    ['Retargeting', 'Live', '$8.2k', 'Sarah'],
                    ['Content Push', 'Review', '$2.1k', 'Amy'],
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-[#f8f9fa]">
                      {row.map((cell, j) => (
                        <td key={j} className="px-2 py-2 text-gray-600 border-r border-gray-200 last:border-0 whitespace-nowrap">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </section>

      {/* ─── TRUST BAR ─── */}
      <section className="border-y border-gray-100 bg-[#FAFAFA] py-12">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-[15px] font-medium text-gray-700 mb-2">
            Built for teams that live in Notion and work in Sheets
          </p>
          <p className="text-[14px] text-gray-400">
            For operators, analysts, and teams who need clean data without extra busywork
          </p>
        </div>
      </section>

      {/* ─── PROBLEM / SOLUTION ─── */}
      <section id="product" className="max-w-6xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Problem */}
          <div className="bg-[#FAFAFA] rounded-2xl p-8 border border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center mb-6">
              <AlertCircle className="w-4 h-4 text-gray-500" />
            </div>
            <h2 className="text-[22px] font-bold text-gray-900 leading-snug mb-4">
              Notion is great for collaboration.
              Sheets is better for analysis.
            </h2>
            <p className="text-[14px] text-gray-500 leading-relaxed">
              Teams manage work in Notion, but still rely on Google Sheets for reporting,
              formulas, and dashboards. That leads to manual exports, broken workflows,
              and outdated data.
            </p>
          </div>

          {/* Solution */}
          <div className="bg-white rounded-2xl p-8 border border-gray-200">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center mb-6">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-[22px] font-bold text-gray-900 leading-snug mb-4">
              SheetBridgeX keeps both in sync
            </h2>
            <p className="text-[14px] text-gray-500 leading-relaxed mb-7">
              Connect your Notion database, map your fields, and automatically sync
              everything into Google Sheets.
            </p>
            <div className="space-y-3">
              {[
                { n: '1', label: 'Connect Notion' },
                { n: '2', label: 'Map fields' },
                { n: '3', label: 'Sync automatically' },
              ].map(({ n, label }) => (
                <div key={n} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-[11px] font-bold text-gray-600">{n}</span>
                  </div>
                  <span className="text-[14px] font-medium text-gray-700">{label}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="border-t border-gray-100 bg-[#FAFAFA] py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-[32px] font-bold text-gray-900 tracking-tight">
              Everything you need for a clean sync workflow
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              {
                icon: <RefreshCw className="w-4 h-4" />,
                title: 'Automatic Syncs',
                desc: 'Run updates on a schedule so your sheet stays current without manual effort.',
              },
              {
                icon: <Zap className="w-4 h-4" />,
                title: 'Manual Sync Anytime',
                desc: 'Trigger a sync instantly whenever you need fresh data. No waiting required.',
              },
              {
                icon: <Sliders className="w-4 h-4" />,
                title: 'Field Mapping',
                desc: 'Control how Notion properties map into spreadsheet columns. Rename, reorder, skip.',
              },
              {
                icon: <Activity className="w-4 h-4" />,
                title: 'Sync Status & Logs',
                desc: 'Track every run, view error messages, and review the full sync history.',
              },
              {
                icon: <Clock className="w-4 h-4" />,
                title: 'Simple Setup',
                desc: 'Get started in minutes. No code, no API keys, no configuration files.',
              },
              {
                icon: <Layers className="w-4 h-4" />,
                title: 'Built for Real Workflows',
                desc: 'Designed for reporting, finance, operations, and data dashboards.',
              },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="w-8 h-8 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-600 mb-5">
                  {f.icon}
                </div>
                <h3 className="text-[15px] font-semibold text-gray-900 mb-1.5">{f.title}</h3>
                <p className="text-[13.5px] text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRODUCT FLOW ─── */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-[32px] font-bold text-gray-900 tracking-tight mb-4">
            From Notion database to analysis-ready sheet
          </h2>
          <p className="text-[15px] text-gray-500 leading-relaxed">
            SheetBridgeX handles the busywork so your team can focus on using the data.
          </p>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-3.5 left-[calc(16.67%+16px)] right-[calc(16.67%+16px)] h-px bg-gray-200" />

          {[
            {
              step: '01',
              title: 'Connect your Notion workspace',
              desc: 'Authorize access and select the database you want to sync.',
            },
            {
              step: '02',
              title: 'Choose your Google Sheet',
              desc: 'Pick the exact sheet where your synced data will land.',
            },
            {
              step: '03',
              title: 'Stay up to date automatically',
              desc: 'Run manual syncs or enable scheduled updates on your cadence.',
            },
          ].map((item) => (
            <div key={item.step} className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative z-10 w-7 h-7 rounded-full bg-white border border-gray-300 flex items-center justify-center flex-shrink-0">
                  <span className="text-[11px] font-bold text-gray-500">{item.step}</span>
                </div>
              </div>
              <h3 className="text-[16px] font-semibold text-gray-900 mb-2 leading-snug">{item.title}</h3>
              <p className="text-[14px] text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── USE CASES ─── */}
      <section className="border-t border-gray-100 bg-[#FAFAFA] py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-[32px] font-bold text-gray-900 tracking-tight">
              Built for teams that need reliable data flow
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: 'Operations',
                desc: 'Track workflows and systems in Sheets without manual overhead.',
              },
              {
                label: 'Finance',
                desc: 'Sync structured Notion data directly into financial models.',
              },
              {
                label: 'Marketing',
                desc: 'Keep campaign and content tracking data always up to date.',
              },
              {
                label: 'Founders & Analysts',
                desc: 'Use Notion as your source of truth. Use Sheets for analysis.',
              },
            ].map((uc) => (
              <div key={uc.label} className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-[14px] font-semibold text-gray-900 mb-2">{uc.label}</h3>
                <p className="text-[13.5px] text-gray-500 leading-relaxed">{uc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <h2 className="text-[32px] font-bold text-gray-900 tracking-tight mb-3">Simple, transparent pricing</h2>
          <p className="text-[15px] text-gray-500">
            Start free. Upgrade when your data outgrows the free tier.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Free */}
          <div className="rounded-2xl border border-gray-200 p-6 flex flex-col">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.1em] mb-3">Free</p>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-[40px] font-bold text-gray-900 tracking-tight leading-none">$0</span>
              <span className="text-[13px] text-gray-400 mb-1.5">/mo</span>
            </div>
            <p className="text-[12px] text-gray-400 mb-6">Try it out — no credit card required.</p>
            <ul className="space-y-2.5 mb-8 flex-1">
              {['1 sync connection', '100 rows / month', '30-minute sync interval', 'Notion → Sheets (one-way)', 'Manual sync'].map((item) => (
                <li key={item} className="flex items-start gap-2 text-[13px] text-gray-600">
                  <Check className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="block w-full text-center border border-gray-200 text-gray-900 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-[13px]"
            >
              Start free
            </Link>
          </div>

          {/* Starter */}
          <div className="rounded-2xl border border-gray-200 p-6 flex flex-col">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.1em] mb-3">Starter</p>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-[40px] font-bold text-gray-900 tracking-tight leading-none">$9</span>
              <span className="text-[13px] text-gray-400 mb-1.5">/mo</span>
            </div>
            <p className="text-[12px] text-gray-400 mb-6">For individuals who sync regularly.</p>
            <ul className="space-y-2.5 mb-8 flex-1">
              {['3 sync connections', '1,000 rows / month', '15-minute sync interval', 'Notion → Sheets (one-way)', 'Email support'].map((item) => (
                <li key={item} className="flex items-start gap-2 text-[13px] text-gray-600">
                  <Check className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/pricing"
              className="block w-full text-center bg-gray-900 text-white font-medium py-2.5 rounded-xl hover:bg-gray-800 transition-colors text-[13px]"
            >
              Upgrade to Starter
            </Link>
          </div>

          {/* Pro */}
          <div className="rounded-2xl border-2 border-gray-900 p-6 relative flex flex-col">
            <div className="absolute -top-[13px] left-1/2 -translate-x-1/2">
              <span className="bg-gray-900 text-white text-[11px] font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                Most popular
              </span>
            </div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.1em] mb-3">Pro</p>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-[40px] font-bold text-gray-900 tracking-tight leading-none">$19</span>
              <span className="text-[13px] text-gray-400 mb-1.5">/mo</span>
            </div>
            <p className="text-[12px] text-gray-400 mb-6">For power users who need real-time 2-way sync.</p>
            <ul className="space-y-2.5 mb-8 flex-1">
              {['10 sync connections', '5,000 rows / month', '5-minute sync interval', 'Bidirectional & Sheets → Notion', 'Priority support'].map((item) => (
                <li key={item} className="flex items-start gap-2 text-[13px] text-gray-700">
                  <Check className="w-3.5 h-3.5 text-gray-900 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/pricing"
              className="block w-full text-center bg-gray-900 text-white font-medium py-2.5 rounded-xl hover:bg-gray-800 transition-colors text-[13px]"
            >
              Upgrade to Pro
            </Link>
          </div>

          {/* Business */}
          <div className="rounded-2xl border border-gray-200 p-6 flex flex-col">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.1em] mb-3">Business</p>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-[40px] font-bold text-gray-900 tracking-tight leading-none">$49</span>
              <span className="text-[13px] text-gray-400 mb-1.5">/mo</span>
            </div>
            <p className="text-[12px] text-gray-400 mb-6">For teams with high-volume sync needs.</p>
            <ul className="space-y-2.5 mb-8 flex-1">
              {['Unlimited connections', '100,000 rows / month', '1-minute sync interval', 'Bidirectional sync', 'Priority support'].map((item) => (
                <li key={item} className="flex items-start gap-2 text-[13px] text-gray-600">
                  <Check className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/pricing"
              className="block w-full text-center bg-gray-900 text-white font-medium py-2.5 rounded-xl hover:bg-gray-800 transition-colors text-[13px]"
            >
              Upgrade to Business
            </Link>
          </div>

        </div>

        <p className="text-center mt-8 text-[13px] text-gray-400">
          Full pricing details on the <Link href="/pricing" className="underline hover:text-gray-700">pricing page</Link>
        </p>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="border-t border-gray-100 bg-[#FAFAFA] py-24">
        <div className="max-w-[680px] mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-[32px] font-bold text-gray-900 tracking-tight">
              Frequently asked questions
            </h2>
          </div>
          <div className="space-y-2">
            {[
              {
                q: 'How does SheetBridgeX work?',
                a: 'SheetBridgeX connects to your Notion workspace and Google Sheets via OAuth. You choose a Notion database, map fields to columns, and set a sync schedule. SheetBridgeX then writes fresh data into your sheet automatically.',
              },
              {
                q: 'Do I need coding knowledge?',
                a: 'No. Everything is configured through a simple UI. If you can use Notion and Google Sheets, you can use SheetBridgeX.',
              },
              {
                q: 'Can I sync instantly?',
                a: 'Yes. Every sync job has a "Sync Now" button that triggers an immediate update regardless of your scheduled interval.',
              },
              {
                q: 'How often can it update?',
                a: 'On the Free plan, syncs run every 30 minutes. On Pro, you can sync as frequently as every 5 minutes.',
              },
              {
                q: 'Is it two-way sync?',
                a: 'Currently, SheetBridgeX syncs one-way: Notion → Google Sheets. Two-way sync is on the roadmap. We want the one-way experience to be rock-solid first.',
              },
            ].map(({ q, a }) => (
              <details key={q} className="group bg-white border border-gray-200 rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between px-6 py-4 cursor-pointer list-none select-none gap-4">
                  <span className="text-[14px] font-medium text-gray-900">{q}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 group-open:rotate-90 transition-transform duration-150" />
                </summary>
                <div className="px-6 pb-5">
                  <p className="text-[14px] text-gray-500 leading-relaxed">{a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="bg-gray-900 rounded-3xl px-8 py-20 text-center">
          <h2 className="text-[40px] font-bold text-white tracking-tight leading-snug mb-4">
            Stop exporting. Start syncing.
          </h2>
          <p className="text-[16px] text-gray-400 max-w-md mx-auto mb-10 leading-relaxed">
            Use SheetBridgeX to keep your Notion data connected to the spreadsheets your team already relies on.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-white text-gray-900 font-semibold px-7 py-3.5 rounded-xl hover:bg-gray-100 transition-colors text-[14px]"
          >
            Start Free <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="mt-5 text-[12px] text-gray-600">
            No credit card required · Free plan available ·{' '}
            <a href="mailto:hello@satosushi.co" className="underline underline-offset-2 hover:text-gray-400 transition-colors">
              Questions? hello@satosushi.co
            </a>
          </p>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-gray-100 py-14">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-start justify-between gap-10">

            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-gray-900 rounded-md flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">SB</span>
                </div>
                <span className="text-[14px] font-semibold text-gray-900">SheetBridgeX</span>
              </div>
              <p className="text-[13px] text-gray-400 max-w-[200px] leading-relaxed">
                Sync Notion databases to Google Sheets automatically.
              </p>
            </div>

            {/* Links */}
            <div className="flex gap-12">
              <div>
                <p className="text-[11px] font-bold text-gray-900 uppercase tracking-widest mb-4">Product</p>
                <div className="space-y-2.5">
                  {[
                    { label: 'Product', href: '#product' },
                    { label: 'Pricing', href: '#pricing' },
                    { label: 'FAQ', href: '#faq' },
                  ].map((l) => (
                    <a key={l.label} href={l.href} className="block text-[13px] text-gray-500 hover:text-gray-900 transition-colors">
                      {l.label}
                    </a>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-900 uppercase tracking-widest mb-4">Legal</p>
                <div className="space-y-2.5">
                  <Link href="/terms" className="block text-[13px] text-gray-500 hover:text-gray-900 transition-colors">Terms</Link>
                  <Link href="/privacy" className="block text-[13px] text-gray-500 hover:text-gray-900 transition-colors">Privacy</Link>
                </div>
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-900 uppercase tracking-widest mb-4">Support</p>
                <div className="space-y-2.5">
                  <a
                    href="mailto:hello@satosushi.co"
                    className="block text-[13px] text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    hello@satosushi.co
                  </a>
                </div>
              </div>
            </div>

          </div>

          <div className="mt-12 pt-6 border-t border-gray-100 flex items-center justify-between">
            <p className="text-[12px] text-gray-400">© 2026 SheetBridgeX. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  )
}
