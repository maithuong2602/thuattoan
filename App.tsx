
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, RotateCcw, ChevronRight, Pause, ArrowUp, Target, 
  Info, Search, ArrowDown, User, Minimize2, ArrowLeft, 
  ArrowRight, BrainCircuit, Zap, Sparkles, LayoutDashboard 
} from 'lucide-react';
import { 
  AlgorithmType, Customer, Phase, AlgoState, RangeState 
} from './types';
import { 
  BUBBLE_DATA, SELECTION_DATA, CUSTOMER_DATA, 
  BINARY_SEARCH_DATA, ANIMATION_SPEEDS 
} from './constants';
import { getAlgorithmExplanation } from './services/geminiService';

const App: React.FC = () => {
  // --- States ---
  const [algorithm, setAlgorithm] = useState<AlgorithmType>('selection');
  const [array, setArray] = useState<any[]>([]);
  const [targetName, setTargetName] = useState("Hoàng Mai");
  const [targetNumber, setTargetNumber] = useState(32);
  const [autoMode, setAutoMode] = useState(false);
  const [speed, setSpeed] = useState(ANIMATION_SPEEDS.normal);
  
  // Visual states
  const [comparing, setComparing] = useState<number[]>([]);
  const [swapping, setSwapping] = useState<number[]>([]);
  const [sortedIndices, setSortedIndices] = useState<number[]>([]);
  const [range, setRange] = useState<RangeState>({ low: 0, high: 0, mid: 0 });
  const [discarded, setDiscarded] = useState<number[]>([]);
  const [message, setMessage] = useState("Sẵn sàng mô phỏng.");
  const [aiExplanation, setAiExplanation] = useState<string>("Nhấn 'Tiếp Theo' để giáo viên AI bắt đầu giảng giải nhé!");
  const [loadingAi, setLoadingAi] = useState(false);

  const [algoState, setAlgoState] = useState<AlgoState>({
    i: 0,
    j: 0,
    phase: 'start'
  });

  // Use any to avoid "Cannot find namespace 'NodeJS'" error in browser environments
  const timerRef = useRef<any>(null);

  // Helper to check if data matches current algorithm to prevent render crashes during transitions
  const isNumberData = array.length > 0 && typeof array[0] === 'number';
  const isCustomerData = array.length > 0 && typeof array[0] === 'object' && array[0] !== null && 'tt' in array[0];

  // --- Reset Logic ---
  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    
    let currentData: any[];
    if (algorithm === 'bubble') currentData = [...BUBBLE_DATA];
    else if (algorithm === 'selection') currentData = [...SELECTION_DATA];
    else if (algorithm === 'linear_search') currentData = [...CUSTOMER_DATA];
    else currentData = [...BINARY_SEARCH_DATA];

    setArray(currentData);
    setAutoMode(false);
    setComparing([]);
    setSwapping([]);
    setSortedIndices([]);
    setDiscarded([]);
    setAiExplanation("Nhấn 'Tiếp Theo' để bắt đầu.");
    
    if (algorithm === 'bubble') {
      setAlgoState({ i: 0, j: currentData.length - 1, phase: 'start' });
      setMessage("Sắp xếp Nổi bọt: Nhấn Tiếp theo để bắt đầu.");
    } else if (algorithm === 'selection') {
      setAlgoState({ i: 0, j: 1, phase: 'start' });
      setMessage("Sắp xếp Chọn: Nhấn Tiếp theo để bắt đầu.");
    } else if (algorithm === 'linear_search') {
      setAlgoState({ i: 0, j: 0, phase: 'start' });
      setMessage(`Tìm kiếm tuần tự: Bắt đầu tìm "${targetName}".`);
    } else {
      const n = currentData.length;
      setRange({ low: 0, high: n - 1, mid: Math.floor((n - 1) / 2) });
      setAlgoState({ i: 0, j: 0, phase: 'start' });
      setMessage(`Tìm kiếm nhị phân: Tìm số ${targetNumber} trong dãy.`);
    }
  }, [algorithm, targetName, targetNumber]);

  useEffect(() => {
    reset();
  }, [reset]);

  // --- AI Tutor Link ---
  const updateAiExplanation = async (msg: string, state: any) => {
    setLoadingAi(true);
    const explanation = await getAlgorithmExplanation(algorithm, msg, state);
    setAiExplanation(explanation);
    setLoadingAi(false);
  };

  // --- Core Algorithm Logic ---
  const nextStep = async () => {
    if (algoState.phase === 'done') return;

    let { i, j, phase } = algoState;
    let newArr = [...array];
    let n = newArr.length;
    let nextMsg = message;

    if (algorithm === 'bubble') {
       if (phase === 'start' || phase === 'next_j') {
        setComparing([j, j - 1]);
        setSwapping([]);
        nextMsg = `So sánh cặp từ đáy lên: ${newArr[j]} và ${newArr[j-1]}`;
        setAlgoState(prev => ({ ...prev, phase: 'compare' }));
      } else if (phase === 'compare') {
        if (newArr[j] < newArr[j - 1]) {
          setSwapping([j, j - 1]);
          nextMsg = `Số ${newArr[j]} nhỏ hơn ${newArr[j-1]} nên sẽ nổi lên trên.`;
          setAlgoState(prev => ({ ...prev, phase: 'swap' }));
        } else {
          nextMsg = `${newArr[j]} không nhỏ hơn, giữ nguyên vị trí.`;
          setAlgoState(prev => ({ ...prev, phase: 'advance' }));
        }
      } else if (phase === 'swap') {
        [newArr[j], newArr[j - 1]] = [newArr[j - 1], newArr[j]];
        setArray(newArr);
        setSwapping([]);
        setAlgoState(prev => ({ ...prev, phase: 'advance' }));
      } else if (phase === 'advance') {
        setComparing([]);
        if (j > i + 1) {
          setAlgoState(prev => ({ ...prev, j: j - 1, phase: 'next_j' }));
        } else {
          setSortedIndices(prev => [...prev, i]);
          if (i < n - 2) {
            setAlgoState({ i: i + 1, j: n - 1, phase: 'next_j' });
            nextMsg = `Xong một vòng! Số nhỏ nhất lượt này đã ở đỉnh ống.`;
          } else {
            setSortedIndices([...Array(n).keys()]);
            setAlgoState(prev => ({ ...prev, phase: 'done' }));
            nextMsg = "Hoàn thành sắp xếp nổi bọt!";
            setAutoMode(false);
          }
        }
      }
    } 
    else if (algorithm === 'selection') {
       if (phase === 'start') {
        setComparing([i]);
        nextMsg = `Vòng lặp thứ ${i + 1}: Tìm số nhỏ nhất cho vị trí ${i}. Duyệt các số phía sau.`;
        setAlgoState(prev => ({ ...prev, j: i + 1, phase: 'compare' }));
      } else if (phase === 'compare') {
        setComparing([i, j]);
        nextMsg = `So sánh vị trí đầu (${newArr[i]}) với vị trí đang xét (${newArr[j]}).`;
        setAlgoState(prev => ({ ...prev, phase: 'check_swap' }));
      } else if (phase === 'check_swap') {
        if (newArr[j] < newArr[i]) {
          setSwapping([i, j]);
          nextMsg = `Phát hiện ${newArr[j]} < ${newArr[i]}. Đổi chỗ!`;
          setAlgoState(prev => ({ ...prev, phase: 'swap' }));
        } else {
          nextMsg = `${newArr[j]} >= ${newArr[i]}. Không đổi.`;
          setAlgoState(prev => ({ ...prev, phase: 'next_scan' }));
        }
      } else if (phase === 'swap') {
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
        setArray(newArr);
        setSwapping([]);
        setAlgoState(prev => ({ ...prev, phase: 'next_scan' }));
      } else if (phase === 'next_scan') {
        setComparing([]); 
        if (j < n - 1) {
          setAlgoState(prev => ({ ...prev, j: j + 1, phase: 'compare' }));
        } else {
          setAlgoState(prev => ({ ...prev, phase: 'finish_round' }));
        }
      } else if (phase === 'finish_round') {
        setSortedIndices(prev => [...prev, i]);
        if (i < n - 2) {
          setAlgoState({ i: i + 1, j: i + 2, phase: 'start' });
          nextMsg = `Kết thúc vòng ${i + 1}. Chuyển sang vị trí tiếp theo.`;
        } else {
          setSortedIndices([...Array(n).keys()]);
          setAlgoState(prev => ({ ...prev, phase: 'done' }));
          nextMsg = `Hoàn tất! Dãy đã được sắp xếp tăng dần.`;
          setAutoMode(false);
        }
      }
    }
    else if (algorithm === 'linear_search') {
      if (phase === 'start') {
        setComparing([i]);
        nextMsg = `Bước 1: Bắt đầu xét từ dòng đầu tiên (TT = ${newArr[i].tt}).`;
        setAlgoState(prev => ({ ...prev, phase: 'compare' }));
      } else if (phase === 'compare') {
        setComparing([i]);
        nextMsg = `Bước 2: So sánh "${newArr[i].name}" với "${targetName}".`;
        setAlgoState(prev => ({ ...prev, phase: 'check_match' }));
      } else if (phase === 'check_match') {
        if (newArr[i].name.toLowerCase() === targetName.toLowerCase()) {
          nextMsg = `TRÙNG NHAU! Chuyển sang Bước 4.`;
          setAlgoState(prev => ({ ...prev, phase: 'found' }));
        } else {
          nextMsg = `KHÔNG TRÙNG. Chuyển sang dòng tiếp theo.`;
          setAlgoState(prev => ({ ...prev, phase: 'check_end' }));
        }
      } else if (phase === 'check_end') {
        if (i < n - 1) {
           nextMsg = `Bước 3: Chưa xét hết. Xét dòng tiếp theo (TT = ${newArr[i+1].tt}).`;
           setAlgoState(prev => ({ ...prev, i: i + 1, phase: 'compare' }));
        } else {
           nextMsg = "Đã xét hết các dòng trong bảng.";
           setAlgoState(prev => ({ ...prev, phase: 'not_found' }));
        }
      } else if (phase === 'found') {
        setSortedIndices([i]); 
        nextMsg = `Bước 4: Tìm thấy khách hàng tại TT: ${newArr[i].tt}!`;
        setAlgoState(prev => ({ ...prev, phase: 'done' }));
        setAutoMode(false);
      } else if (phase === 'not_found') {
        setComparing([]); 
        nextMsg = `Bước 5: Không tìm thấy "${targetName}".`;
        setAlgoState(prev => ({ ...prev, phase: 'done' }));
        setAutoMode(false);
      }
    }
    else if (algorithm === 'binary_search') {
      let { low, high, mid } = range;
      if (phase === 'start') {
        nextMsg = `Xác định vùng tìm kiếm từ index ${low} đến ${high}.`;
        setAlgoState(prev => ({ ...prev, phase: 'calc_mid' }));
      }
      else if (phase === 'calc_mid') {
        mid = Math.floor((low + high) / 2);
        setRange({ low, high, mid });
        setComparing([mid]);
        nextMsg = `Lấy vị trí giữa Mid = ${mid}. Giá trị = ${newArr[mid]}.`;
        setAlgoState(prev => ({ ...prev, phase: 'compare' }));
      }
      else if (phase === 'compare') {
        if (newArr[mid] === targetNumber) {
          nextMsg = `Giá trị ${newArr[mid]} bằng số cần tìm. TÌM THẤY!`;
          setAlgoState(prev => ({ ...prev, phase: 'found' }));
        } else if (newArr[mid] > targetNumber) {
          nextMsg = `${newArr[mid]} > ${targetNumber}. Tìm nửa TRƯỚC.`;
          setAlgoState(prev => ({ ...prev, phase: 'go_left' }));
        } else {
          nextMsg = `${newArr[mid]} < ${targetNumber}. Tìm nửa SAU.`;
          setAlgoState(prev => ({ ...prev, phase: 'go_right' }));
        }
      }
      else if (phase === 'go_left') {
        let newlyDiscarded = [];
        for (let k = mid; k <= high; k++) newlyDiscarded.push(k);
        setDiscarded(prev => [...prev, ...newlyDiscarded]);
        const newHigh = mid - 1;
        if (low > newHigh) {
          setAlgoState(prev => ({ ...prev, phase: 'not_found' }));
        } else {
          setRange(prev => ({ ...prev, high: newHigh }));
          setComparing([]);
          nextMsg = `Thu hẹp: [${low} - ${newHigh}].`;
          setAlgoState(prev => ({ ...prev, phase: 'calc_mid' }));
        }
      }
      else if (phase === 'go_right') {
        let newlyDiscarded = [];
        for (let k = low; k <= mid; k++) newlyDiscarded.push(k);
        setDiscarded(prev => [...prev, ...newlyDiscarded]);
        const newLow = mid + 1;
        if (newLow > high) {
          setAlgoState(prev => ({ ...prev, phase: 'not_found' }));
        } else {
          setRange(prev => ({ ...prev, low: newLow }));
          setComparing([]);
          nextMsg = `Thu hẹp: [${newLow} - ${high}].`;
          setAlgoState(prev => ({ ...prev, phase: 'calc_mid' }));
        }
      }
      else if (phase === 'found') {
        setSortedIndices([mid]);
        nextMsg = `KẾT QUẢ: Tìm thấy số ${targetNumber} tại index ${mid}.`;
        setAlgoState(prev => ({ ...prev, phase: 'done' }));
        setAutoMode(false);
      }
      else if (phase === 'not_found') {
        nextMsg = `KẾT QUẢ: Không tìm thấy ${targetNumber}.`;
        setAlgoState(prev => ({ ...prev, phase: 'done' }));
        setAutoMode(false);
      }
    }

    setMessage(nextMsg);
    // Request AI explanation on significant changes (every few steps)
    if (phase !== 'done' && Math.random() > 0.4) {
      updateAiExplanation(nextMsg, { i, j, phase, algorithm });
    }
  };

  // Auto-run logic
  useEffect(() => {
    if (autoMode && algoState.phase !== 'done') {
      timerRef.current = setTimeout(() => {
        nextStep();
      }, speed);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [autoMode, algoState, speed]);

  return (
    <div className="min-h-screen bg-[#050b1a] text-slate-100 flex flex-col p-4 md:p-8 font-sans">
      {/* Decorative background grid */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]" 
           style={{ backgroundImage: `radial-gradient(#3b82f6 1px, transparent 1px)`, backgroundSize: '40px 40px' }}></div>

      <div className="max-w-7xl mx-auto w-full z-10 flex flex-col gap-8">
        
        {/* Navbar */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6 bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-6 rounded-[2.5rem] shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)] animate-pulse">
               <BrainCircuit className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent uppercase">
                AlgoVisualizer AI
              </h1>
              <p className="text-slate-500 text-xs font-semibold tracking-widest uppercase">Mô phỏng thuật toán thông minh</p>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2 p-1.5 bg-slate-950/50 rounded-2xl border border-slate-800">
             {[
               { id: 'bubble', label: 'Nổi Bọt', color: 'blue' },
               { id: 'selection', label: 'Chọn', color: 'amber' },
               { id: 'linear_search', label: 'Tuần Tự', icon: <User size={14}/>, color: 'purple' },
               { id: 'binary_search', label: 'Nhị Phân', icon: <Minimize2 size={14}/>, color: 'emerald' }
             ].map((btn) => (
               <button 
                key={btn.id}
                onClick={() => setAlgorithm(btn.id as AlgorithmType)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 
                  ${algorithm === btn.id ? `bg-${btn.color}-600 text-white shadow-xl scale-105` : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
               >
                 {btn.icon} {btn.label}
               </button>
             ))}
          </div>
        </div>

        {/* Search Inputs (Conditional) */}
        {(algorithm === 'linear_search' || algorithm === 'binary_search') && (
          <div className="flex justify-center gap-4 animate-in fade-in slide-in-from-top-4">
            <div className="bg-slate-900/80 border border-slate-700/50 p-2 pl-4 rounded-2xl flex items-center gap-3 backdrop-blur-md">
              <span className="text-xs font-black text-slate-500 uppercase">Tìm kiếm:</span>
              {algorithm === 'linear_search' ? (
                <input 
                  value={targetName}
                  onChange={(e) => setTargetName(e.target.value)}
                  disabled={algoState.phase !== 'start'}
                  className="bg-slate-800 border-none rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-purple-500 outline-none w-48"
                />
              ) : (
                <input 
                  type="number"
                  value={targetNumber}
                  onChange={(e) => setTargetNumber(Number(e.target.value))}
                  disabled={algoState.phase !== 'start'}
                  className="bg-slate-800 border-none rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none w-24"
                />
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Panel: Progress Tracker */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-[2.5rem] shadow-xl">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Target size={14} className="text-blue-500"/> Tiến trình
                </h3>
              </div>
              <div className="space-y-4">
                {algorithm === 'bubble' || algorithm === 'selection' ? (
                  [0, 1, 2, 3].map(idx => (
                    <div key={idx} className={`p-4 rounded-2xl transition-all border-2 
                      ${algoState.i === idx ? 'bg-blue-600/20 border-blue-500 shadow-lg' : 
                        algoState.i > idx || algoState.phase === 'done' ? 'bg-emerald-500/10 border-emerald-500/20 opacity-40' : 
                        'bg-slate-800/20 border-transparent opacity-20'}`}>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase">Vòng lặp {idx + 1}</span>
                        {(algoState.i > idx || algoState.phase === 'done') && <Sparkles size={14} className="text-emerald-500"/>}
                      </div>
                    </div>
                  ))
                ) : algorithm === 'binary_search' ? (
                  <div className="space-y-6">
                     <div className="grid grid-cols-3 gap-2">
                        {[
                          { l: 'Low', v: range.low, c: 'slate' },
                          { l: 'Mid', v: range.mid, c: 'emerald' },
                          { l: 'High', v: range.high, c: 'slate' }
                        ].map(item => (
                          <div key={item.l} className={`bg-${item.c}-900/40 p-3 rounded-2xl border border-${item.c}-800 text-center`}>
                             <span className="block text-[9px] font-black uppercase text-slate-500 mb-1">{item.l}</span>
                             <span className="text-lg font-mono font-bold">{item.v}</span>
                          </div>
                        ))}
                     </div>
                     <p className="text-[10px] text-slate-500 leading-relaxed italic text-center">
                       Phạm vi đang thu hẹp để tìm chính xác con số mục tiêu.
                     </p>
                  </div>
                ) : (
                  <div className="space-y-2 opacity-50 text-center py-8">
                     <Search size={32} className="mx-auto mb-2 text-slate-700" />
                     <p className="text-xs font-bold text-slate-600">Duyệt danh sách...</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-[2rem] shadow-xl">
               <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                  <Zap size={14} className="text-amber-500"/> Tốc độ
               </h3>
               <div className="flex gap-2">
                 {(['slow', 'normal', 'fast'] as const).map(s => (
                   <button 
                    key={s} 
                    onClick={() => setSpeed(ANIMATION_SPEEDS[s])}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all
                      ${speed === ANIMATION_SPEEDS[s] ? 'bg-slate-100 text-slate-900 shadow-lg' : 'bg-slate-800/50 text-slate-500 hover:text-white'}`}
                   >
                     {s === 'slow' ? 'Chậm' : s === 'normal' ? 'Vừa' : 'Nhanh'}
                   </button>
                 ))}
               </div>
            </div>
          </div>

          {/* Center Panel: Main Visualization */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center min-h-[600px] bg-slate-950/50 rounded-[3rem] border border-slate-900/50 shadow-inner relative overflow-hidden">
            
            {/* Visual background element */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none"></div>

            {algorithm === 'bubble' && isNumberData && (
              <div className="flex flex-col gap-6 items-center w-full max-w-sm h-[550px] relative">
                <div className="absolute -top-10 px-6 py-2 bg-blue-600/20 text-blue-400 text-[10px] font-black rounded-full border border-blue-500/30">
                  ỐNG THỬ NGHIỆM
                </div>
                {array.map((val, idx) => {
                  const isComp = comparing.includes(idx);
                  const isSwap = swapping.includes(idx);
                  const isSort = sortedIndices.includes(idx);
                  return (
                    <div 
                      key={idx} 
                      className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl font-black transition-all duration-500 shadow-2xl border-4
                        ${isSwap ? 'bg-amber-400 text-amber-950 scale-125 border-amber-200 z-50 animate-bounce' : 
                          isComp ? 'bg-blue-400 text-blue-950 scale-110 border-white ring-8 ring-blue-500/20' : 
                          isSort ? 'bg-emerald-600 text-white scale-90 border-emerald-400 opacity-60' : 
                          'bg-slate-800 text-slate-300 border-slate-700 opacity-90'}`}
                    >
                      {typeof val === 'number' ? val : ''}
                    </div>
                  );
                })}
              </div>
            )}

            {algorithm === 'selection' && isNumberData && (
              <div className="flex gap-4 items-end justify-center w-full px-8 pb-12 h-[300px]">
                {array.map((val, idx) => {
                  const isComp = comparing.includes(idx);
                  const isSwap = swapping.includes(idx);
                  const isSort = sortedIndices.includes(idx);
                  return (
                    <div key={idx} className="flex flex-col items-center gap-4 transition-all duration-500">
                      <div 
                        style={{ height: `${typeof val === 'number' ? val * 40 : 0}px` }}
                        className={`w-14 rounded-2xl flex items-end justify-center pb-4 transition-all duration-500 shadow-2xl
                          ${isSwap ? 'bg-gradient-to-t from-amber-600 to-amber-300 scale-110 ring-4 ring-amber-400/50' : 
                            isComp ? 'bg-gradient-to-t from-blue-700 to-blue-400 scale-105 ring-4 ring-blue-500/50' : 
                            isSort ? 'bg-gradient-to-t from-emerald-800 to-emerald-500 opacity-40' : 
                            'bg-gradient-to-t from-slate-800 to-slate-600'}`}
                      >
                        <span className="text-2xl font-black text-white mix-blend-overlay">{typeof val === 'number' ? val : ''}</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-600">idx {idx}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {algorithm === 'linear_search' && isCustomerData && (
              <div className="w-full max-w-lg space-y-3 p-6">
                {array.map((cust, idx) => {
                  const isCur = comparing.includes(idx);
                  const isFound = sortedIndices.includes(idx);
                  return (
                    <div 
                      key={idx} 
                      className={`flex items-center gap-6 p-5 rounded-3xl border transition-all duration-300
                        ${isFound ? 'bg-emerald-600/20 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.2)]' : 
                          isCur ? 'bg-purple-600/30 border-purple-400 scale-[1.02] shadow-xl' : 'bg-slate-900/40 border-slate-800 opacity-80'}`}
                    >
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm
                        ${isFound ? 'bg-emerald-500' : isCur ? 'bg-purple-500' : 'bg-slate-800'}`}>
                        {cust.tt}
                      </div>
                      <div className="flex-1">
                        <p className={`font-bold ${isFound ? 'text-emerald-400' : 'text-slate-100'}`}>{cust.name}</p>
                        <p className="text-[10px] text-slate-500 font-medium">{cust.address}</p>
                      </div>
                      {isFound && <Sparkles className="text-emerald-400 animate-pulse" size={20}/>}
                    </div>
                  );
                })}
              </div>
            )}

            {algorithm === 'binary_search' && isNumberData && (
               <div className="w-full px-12 space-y-12">
                  <div className="flex flex-wrap justify-center gap-2">
                    {array.map((val, idx) => {
                      const isMid = idx === range.mid;
                      const isLow = idx === range.low;
                      const isHigh = idx === range.high;
                      const isDisc = discarded.includes(idx);
                      const isFound = sortedIndices.includes(idx);
                      const inRange = idx >= range.low && idx <= range.high;

                      return (
                        <div key={idx} className={`relative flex flex-col items-center group transition-all duration-500 ${isDisc ? 'opacity-10 grayscale-[0.8] scale-90' : 'opacity-100'}`}>
                           
                           {/* Pointers */}
                           {!isDisc && !isFound && (
                            <>
                              {isLow && <div className="absolute -top-12 text-blue-400 flex flex-col items-center animate-bounce"><ArrowDown size={14}/><span className="text-[8px] font-black uppercase">Low</span></div>}
                              {isHigh && <div className="absolute -top-12 text-blue-400 flex flex-col items-center animate-bounce"><ArrowDown size={14}/><span className="text-[8px] font-black uppercase">High</span></div>}
                              {isMid && <div className="absolute -bottom-12 text-emerald-400 flex flex-col items-center"><ArrowUp size={20} className="animate-pulse"/><span className="text-[9px] font-black bg-emerald-900/50 px-2 rounded-full border border-emerald-500/30">MID</span></div>}
                            </>
                           )}

                           <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl border-2 transition-all
                             ${isFound ? 'bg-emerald-500 text-white border-emerald-300 scale-125 shadow-[0_0_40px_rgba(16,185,129,0.5)] z-20' : 
                               isMid && !isDisc ? 'bg-emerald-900/80 text-emerald-300 border-emerald-500 ring-4 ring-emerald-500/20' : 
                               inRange ? 'bg-slate-800 text-white border-slate-600' : 'bg-slate-900 text-slate-700 border-slate-800'}`}>
                             {typeof val === 'number' ? val : ''}
                           </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Visual Range bar */}
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className="h-full bg-blue-500/40 transition-all duration-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                      style={{ 
                        marginLeft: `${(range.low / array.length) * 100}%`,
                        width: `${((range.high - range.low + 1) / array.length) * 100}%`
                      }}
                    ></div>
                  </div>
               </div>
            )}
          </div>

          {/* Right Panel: AI Tutor & Controls */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* AI Assistant Card */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden flex flex-col min-h-[320px]">
              <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <BrainCircuit className="text-blue-600" size={20} />
                </div>
                <h3 className="text-[10px] font-black text-blue-900 uppercase tracking-widest">Giáo viên AI</h3>
              </div>
              
              <div className="flex-1 space-y-4">
                <p className="text-slate-800 font-bold text-lg leading-snug">
                  "{message}"
                </p>
                <div className={`p-4 rounded-3xl text-sm font-medium italic transition-all duration-500
                   ${loadingAi ? 'opacity-40 animate-pulse' : 'opacity-100'} 
                   ${algorithm === 'linear_search' ? 'bg-purple-50 text-purple-900 border border-purple-100' : 'bg-blue-50 text-blue-900 border border-blue-100'}`}>
                   {loadingAi ? "Đang suy nghĩ câu trả lời dễ hiểu nhất..." : aiExplanation}
                </div>
              </div>

              {/* Status Indicator */}
              {algoState.phase === 'done' && (
                <div className="mt-4 flex items-center gap-2 text-emerald-600 font-black text-xs uppercase animate-in zoom-in">
                  <Sparkles size={16}/> Tuyệt vời! Đã hoàn thành.
                </div>
              )}
            </div>

            {/* Main Controls */}
            <div className="flex flex-col gap-4">
               <button 
                onClick={nextStep}
                disabled={autoMode || algoState.phase === 'done'}
                className="w-full py-6 bg-blue-600 hover:bg-blue-500 disabled:opacity-20 text-white rounded-[2rem] font-black text-lg transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"
               >
                 TIẾP THEO <ChevronRight size={24} />
               </button>

               <div className="flex gap-4">
                 <button 
                  onClick={() => setAutoMode(!autoMode)}
                  disabled={algoState.phase === 'done'}
                  className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[1.5rem] font-black text-xs transition-all border
                    ${autoMode ? 'bg-amber-400 text-amber-950 border-amber-300 shadow-inner' : 'bg-slate-900 text-slate-100 border-slate-800 hover:bg-slate-800'}`}
                 >
                   {autoMode ? <><Pause size={18} fill="currentColor"/> DỪNG</> : <><Play size={18} fill="currentColor"/> TỰ ĐỘNG</>}
                 </button>

                 <button 
                  onClick={reset}
                  className="px-8 bg-slate-900 text-slate-100 border border-slate-800 rounded-[1.5rem] hover:bg-slate-800 transition-all flex items-center justify-center"
                 >
                   <RotateCcw size={20} />
                 </button>
               </div>
            </div>

            {/* Hint Box */}
            <div className="p-6 bg-slate-900/30 border border-slate-800 rounded-[2rem] text-center">
               <Info size={16} className="mx-auto mb-2 text-slate-600" />
               <p className="text-[10px] text-slate-500 leading-relaxed">
                 Mẹo: Dãy số Nhị Phân phải luôn được sắp xếp trước khi tìm kiếm.
               </p>
            </div>
          </div>

        </div>
      </div>

      {/* Footer / Branding */}
      <footer className="mt-12 text-center text-slate-700 font-black text-[10px] uppercase tracking-[0.4em]">
         Dành cho thế hệ lập trình viên tương lai
      </footer>
    </div>
  );
};

export default App;
