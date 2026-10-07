import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { apiService } from '../../services/apiService';
import {
  Receipt,
  FileCheck,
  TrendingDown,
  Calendar,
  DollarSign,
  Users,
  Award,
  BarChart3,
  Plus,
  Send,
  Heart,
  ChevronLeft,
  Flame,
  Phone,
  MessageCircle,
  Mail,
  AlertTriangle,
} from 'lucide-react';

export const Phase2HubScreen: React.FC<{ initialModule?: string }> = ({ initialModule }) => {
  const { setActiveTab, showToast, profile } = useAppStore();

  const [currentModule, setCurrentModule] = useState<string>(initialModule || 'expenses');

  // Module 1: Expenses State
  const [expenses, setExpenses] = useState(() => apiService.getExpenses());
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCat, setExpCat] = useState<'Travel' | 'Food & Meal' | 'Client Meeting' | 'Office Supplies' | 'Internet/Phone'>('Travel');

  // Module 2: HR Letters State
  const [hrLetters, setHrLetters] = useState(() => apiService.getHRLetters());
  const [letterType, setLetterType] = useState<'Salary Certificate' | 'Experience Letter' | 'Address Proof' | 'Employment Verification'>('Salary Certificate');
  const [letterPurpose, setLetterPurpose] = useState('');

  // Module 4: Polls & Kudos State
  const [kudosList, setKudosList] = useState(() => apiService.getKudos());
  const [activePoll, setActivePoll] = useState(() => apiService.getActivePoll());
  const [newKudosTo, setNewKudosTo] = useState('Ananya Sharma');
  const [newKudosBadge, setNewKudosBadge] = useState<'Team Player' | 'Problem Solver' | 'Customer Champion' | 'Innovation Star'>('Team Player');
  const [newKudosMsg, setNewKudosMsg] = useState('');

  // Module 6: Directory & Org Chart State
  const directory = apiService.getDirectory();
  const [searchDir, setSearchDir] = useState('');

  // Handlers
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle || !expAmount) return;
    const item = await apiService.addExpense({
      title: expTitle,
      category: expCat,
      amount: parseFloat(expAmount),
      date: new Date().toISOString().split('T')[0],
      notes: 'Submitted via LogiHR mobile self-service',
    });
    setExpenses([item, ...expenses]);
    setShowAddExpense(false);
    setExpTitle('');
    setExpAmount('');
    showToast(`Expense claim for ₹${item.amount} submitted.`, 'success');
  };

  const handleRequestLetter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!letterPurpose) return;
    const req = await apiService.requestHRLetter(letterType, letterPurpose);
    setHrLetters([req, ...hrLetters]);
    setLetterPurpose('');
    showToast(`Request for ${letterType} submitted to HR.`, 'success');
  };

  const handleSendKudos = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKudosMsg) return;
    const k = apiService.addKudos({
      fromName: profile.name,
      toName: newKudosTo,
      badge: newKudosBadge,
      message: newKudosMsg,
    });
    setKudosList([k, ...kudosList]);
    setNewKudosMsg('');
    showToast(`Kudos sent to ${newKudosTo}! 🌟`, 'success');
  };

  const handleVotePoll = (optId: string) => {
    const updated = apiService.votePoll(optId);
    setActivePoll(updated);
    showToast('Your vote has been recorded anonymously.', 'success');
  };

  const filteredDir = directory.filter(
    (e) =>
      e.name.toLowerCase().includes(searchDir.toLowerCase()) ||
      e.department.toLowerCase().includes(searchDir.toLowerCase()) ||
      e.designation.toLowerCase().includes(searchDir.toLowerCase())
  );

  return (
    <div className="space-y-4 pb-20">
      {/* Top Header */}
      <div className="bg-[#121a2f] border border-[#243456] rounded-2xl p-4 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('home')}
            className="p-1.5 rounded-lg bg-[#18233e] hover:bg-[#243456] text-slate-300 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-base font-extrabold text-white">Extended HR Suite</h2>
            <p className="text-[10px] text-cyan-400 font-mono">Phase 2 Integrated Modules</p>
          </div>
        </div>
      </div>

      {/* Module Horizontal Selector Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'expenses', label: 'Expenses & Reimbursement', icon: Receipt },
          { id: 'hrletters', label: 'HR Letters', icon: FileCheck },
          { id: 'tax', label: 'Tax & PF Documents', icon: TrendingDown },
          { id: 'roster', label: 'Shift Roster & Swap', icon: Calendar },
          { id: 'loans', label: 'Loan & Advance', icon: DollarSign },
          { id: 'directory', label: 'Org Directory', icon: Users },
          { id: 'engagement', label: 'Kudos & Engagement', icon: Award },
          { id: 'insights', label: 'Manager Insights', icon: BarChart3 },
        ].map((mod) => {
          const Icon = mod.icon;
          const isActive = currentModule === mod.id;
          return (
            <button
              key={mod.id}
              onClick={() => setCurrentModule(mod.id)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-[#121a2f] text-slate-400 hover:text-slate-200 border border-[#243456]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{mod.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. EXPENSES & TOUR MODULE */}
      {currentModule === 'expenses' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Expense Reimbursement Claims
            </h3>
            <button
              onClick={() => setShowAddExpense(!showAddExpense)}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Claim</span>
            </button>
          </div>

          {showAddExpense && (
            <form
              onSubmit={handleAddExpense}
              className="bg-[#121a2f] border border-[#243456] rounded-2xl p-4 space-y-3 shadow-xl"
            >
              <h4 className="text-xs font-bold text-white">New Expense Submission</h4>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Expense Title (e.g. Client Dinner)"
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  required
                  className="bg-[#18233e] border border-[#243456] rounded-xl px-3 py-2 text-xs text-white"
                />
                <input
                  type="number"
                  placeholder="Amount (₹)"
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  required
                  className="bg-[#18233e] border border-[#243456] rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <select
                value={expCat}
                onChange={(e) => setExpCat(e.target.value as any)}
                className="w-full bg-[#18233e] border border-[#243456] rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="Travel">Travel</option>
                <option value="Food & Meal">Food & Meal</option>
                <option value="Client Meeting">Client Meeting</option>
                <option value="Office Supplies">Office Supplies</option>
                <option value="Internet/Phone">Internet/Phone</option>
              </select>
              <button
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl"
              >
                Submit Expense Claim
              </button>
            </form>
          )}

          {expenses.map((exp) => (
            <div
              key={exp.id}
              className="bg-[#121a2f] border border-[#243456] rounded-2xl p-3.5 flex items-center justify-between text-xs"
            >
              <div>
                <h4 className="font-bold text-white">{exp.title}</h4>
                <span className="text-[11px] text-slate-400">
                  {exp.category} · {exp.date}
                </span>
                <p className="text-[10px] text-slate-500 mt-0.5">{exp.notes}</p>
              </div>
              <div className="text-right">
                <span className="font-mono font-black text-cyan-300 block">
                  ₹{exp.amount.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  {exp.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. HR LETTERS MODULE */}
      {currentModule === 'hrletters' && (
        <div className="space-y-3">
          <form
            onSubmit={handleRequestLetter}
            className="bg-[#121a2f] border border-[#243456] rounded-2xl p-4 space-y-3 shadow-md"
          >
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Request Official HR Certificate
            </h3>
            <select
              value={letterType}
              onChange={(e) => setLetterType(e.target.value as any)}
              className="w-full bg-[#18233e] border border-[#243456] rounded-xl px-3 py-2 text-xs text-white"
            >
              <option value="Salary Certificate">Salary Certificate</option>
              <option value="Experience Letter">Experience Letter</option>
              <option value="Address Proof">Company Address Proof</option>
              <option value="Employment Verification">Employment Verification</option>
            </select>
            <input
              type="text"
              placeholder="Purpose of letter (e.g. Visa application, Bank loan)"
              value={letterPurpose}
              onChange={(e) => setLetterPurpose(e.target.value)}
              required
              className="w-full bg-[#18233e] border border-[#243456] rounded-xl px-3 py-2 text-xs text-white"
            />
            <button
              type="submit"
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl"
            >
              Submit Request to HR
            </button>
          </form>

          {hrLetters.map((l) => (
            <div
              key={l.id}
              className="bg-[#121a2f] border border-[#243456] rounded-2xl p-3.5 flex items-center justify-between text-xs"
            >
              <div>
                <h4 className="font-bold text-white">{l.type}</h4>
                <p className="text-[11px] text-slate-400">Purpose: {l.purpose}</p>
                <span className="text-[10px] text-slate-500 font-mono">
                  Requested: {l.requestDateIST}
                </span>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                {l.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 3. TAX & PF DOCUMENTS */}
      {currentModule === 'tax' && (
        <div className="space-y-3">
          <div className="bg-[#121a2f] border border-[#243456] rounded-2xl p-4 space-y-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Statutory Tax Documents & Form 16
            </h3>
            <p className="text-[11px] text-slate-400">
              UAN: <span className="font-mono text-cyan-300">100948291044</span> · PAN: <span className="font-mono text-cyan-300">ABCDE1234F</span>
            </p>
          </div>

          {apiService.getTaxDocuments().map((doc) => (
            <div
              key={doc.id}
              className="bg-[#121a2f] border border-[#243456] rounded-2xl p-3.5 flex items-center justify-between text-xs"
            >
              <div>
                <h4 className="font-bold text-white">{doc.title}</h4>
                <span className="text-[11px] text-slate-400 font-mono">
                  {doc.year} · {doc.size}
                </span>
              </div>
              <button
                onClick={() => showToast(`Downloaded ${doc.title}`, 'success')}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
              >
                Download PDF
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 4. SHIFT ROSTER & SWAP */}
      {currentModule === 'roster' && (
        <div className="space-y-3">
          <div className="bg-[#121a2f] border border-[#243456] rounded-2xl p-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
              Weekly Shift Schedule
            </h3>
            <div className="space-y-2 text-xs">
              {apiService.getShiftRoster().map((s, i) => (
                <div
                  key={i}
                  className="bg-[#18233e] p-2.5 rounded-xl flex items-center justify-between border border-[#243456]/60"
                >
                  <div>
                    <span className="font-bold text-white block">{s.date}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{s.timing}</span>
                  </div>
                  {s.canSwap && (
                    <button
                      onClick={() => showToast(`Shift swap request initiated for ${s.date}`, 'info')}
                      className="px-2.5 py-1 rounded-lg bg-blue-950 text-cyan-300 border border-blue-700 text-[10px] font-semibold"
                    >
                      Request Swap
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. LOAN & ADVANCE */}
      {currentModule === 'loans' && (
        <div className="space-y-3">
          <div className="bg-[#121a2f] border border-[#243456] rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Company Loan / Salary Advance
            </h3>
            <div className="bg-[#18233e] p-3 rounded-xl border border-[#243456]/60 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Active Advance:</span>
                <span className="font-mono font-bold text-white">₹50,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Monthly EMI Deduction:</span>
                <span className="font-mono font-bold text-amber-400">₹10,000 / month</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Outstanding Balance:</span>
                <span className="font-mono font-bold text-emerald-400">₹20,000</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. ORG DIRECTORY */}
      {currentModule === 'directory' && (
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Search by name, role or department..."
            value={searchDir}
            onChange={(e) => setSearchDir(e.target.value)}
            className="w-full bg-[#121a2f] border border-[#243456] rounded-xl px-3.5 py-2.5 text-xs text-white"
          />

          <div className="space-y-2.5">
            {filteredDir.map((e) => (
              <div
                key={e.id}
                className="bg-[#121a2f] border border-[#243456] rounded-2xl p-3.5 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-white">{e.name}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">({e.empCode})</span>
                  </div>
                  <p className="text-[11px] text-cyan-400">{e.designation} · {e.department}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{e.location}</p>
                </div>

                <div className="flex items-center gap-1.5">
                  <a
                    href={`tel:${e.phone}`}
                    className="p-2 rounded-lg bg-[#18233e] text-emerald-400 hover:bg-[#243456]"
                    title="Call"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={`https://wa.me/${e.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-[#18233e] text-green-400 hover:bg-[#243456]"
                    title="WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={`mailto:${e.email}`}
                    className="p-2 rounded-lg bg-[#18233e] text-blue-400 hover:bg-[#243456]"
                    title="Email"
                  >
                    <Mail className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. KUDOS & ENGAGEMENT */}
      {currentModule === 'engagement' && (
        <div className="space-y-4">
          {/* Active Poll Card */}
          <div className="bg-[#121a2f] border border-[#243456] rounded-2xl p-4 space-y-3 shadow-md">
            <span className="text-[10px] uppercase font-bold text-amber-400">
              Live Anonymous Poll
            </span>
            <h4 className="text-xs font-bold text-white">{activePoll.question}</h4>
            <div className="space-y-2">
              {activePoll.options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleVotePoll(opt.id)}
                  disabled={activePoll.hasVoted}
                  className={`w-full p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                    activePoll.selectedOptionId === opt.id
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-[#18233e] text-slate-300 border-[#243456]'
                  }`}
                >
                  <span>{opt.text}</span>
                  <span className="font-mono text-[11px] text-cyan-300">
                    {opt.votes} votes
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Give Kudos Form */}
          <form
            onSubmit={handleSendKudos}
            className="bg-[#121a2f] border border-[#243456] rounded-2xl p-4 space-y-3 shadow-md"
          >
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Send Peer Appreciation (Kudos)
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={newKudosTo}
                onChange={(e) => setNewKudosTo(e.target.value)}
                className="bg-[#18233e] border border-[#243456] rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="Ananya Sharma">Ananya Sharma</option>
                <option value="Ritesh Patel">Ritesh Patel</option>
                <option value="Neha Joshi">Neha Joshi</option>
                <option value="Harsh Vardhan">Harsh Vardhan</option>
              </select>

              <select
                value={newKudosBadge}
                onChange={(e) => setNewKudosBadge(e.target.value as any)}
                className="bg-[#18233e] border border-[#243456] rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="Team Player">Team Player 🤝</option>
                <option value="Problem Solver">Problem Solver 💡</option>
                <option value="Customer Champion">Customer Champion 🏆</option>
                <option value="Innovation Star">Innovation Star ⭐</option>
              </select>
            </div>

            <input
              type="text"
              placeholder="Why are you giving kudos?"
              value={newKudosMsg}
              onChange={(e) => setNewKudosMsg(e.target.value)}
              className="w-full bg-[#18233e] border border-[#243456] rounded-xl px-3 py-2 text-xs text-white"
            />

            <button
              type="submit"
              className="w-full py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold text-xs rounded-xl"
            >
              Send Kudos
            </button>
          </form>

          {/* Kudos Feed */}
          <div className="space-y-2.5">
            {kudosList.map((k) => (
              <div
                key={k.id}
                className="bg-[#121a2f] border border-[#243456] rounded-2xl p-3.5 space-y-2 text-xs shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white">{k.fromName}</span> appreciated{' '}
                    <span className="font-bold text-cyan-300">{k.toName}</span>
                  </div>
                  <span className="text-[10px] text-pink-400 font-bold bg-pink-950 px-2 py-0.5 rounded border border-pink-800">
                    {k.badge}
                  </span>
                </div>
                <p className="text-slate-300 bg-[#18233e] p-2 rounded-xl border border-[#243456]/40">
                  "{k.message}"
                </p>
                <span className="text-[10px] text-slate-500 font-mono">{k.dateIST}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. MANAGER & HR INSIGHTS (BURNOUT & OVERTIME ALERTS) */}
      {currentModule === 'insights' && (
        <div className="space-y-3">
          {/* Burnout Guard Alert */}
          <div className="bg-amber-950/70 border border-amber-600/60 rounded-2xl p-4 space-y-2 shadow-lg">
            <div className="flex items-center gap-2 text-amber-300">
              <Flame className="w-5 h-5 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                Workload & Burnout Guard
              </h3>
            </div>
            <p className="text-xs text-amber-200/90 leading-relaxed">
              No burnout triggers detected. Team average weekly work hours: <span className="font-bold text-white">42.4 hrs</span> (Threshold: 55 hrs/week).
            </p>
          </div>

          <div className="bg-[#121a2f] border border-[#243456] rounded-2xl p-4 space-y-3 text-xs">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Project Hours Allocation (Q4)
            </h3>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-300">Billable Client Projects (82%)</span>
                  <span className="font-mono text-cyan-300">328 hrs</span>
                </div>
                <div className="w-full bg-[#18233e] h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full w-[82%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-300">Internal R&D & Architecture (18%)</span>
                  <span className="font-mono text-slate-400">72 hrs</span>
                </div>
                <div className="w-full bg-[#18233e] h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full w-[18%]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
