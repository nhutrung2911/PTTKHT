import { useState, useMemo } from "react";
import { ArrowLeft, Monitor, ChevronRight, Minus, Plus } from "lucide-react";
import type { Movie, Showtime } from "../data/movies";
import { cinemas, TICKET_PRICES } from "../data/movies";

interface SeatsPageProps {
  movie: Movie;
  showtime: Showtime;
  onBack: () => void;
  onConfirm: (
    seats: string[], 
    total: number, 
    combos: { name: string; quantity: number; price: number }[]
  ) => void;
}

type SeatStatus = "available" | "selected" | "sold" | "vip" | "vip_selected" | "couple" | "couple_selected";

function generateSeats() {
  const rows = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
  const cols = 12;
  const soldPositions = new Set([
    "A3", "A4", "B7", "B8", "C2", "C5", "C6", "D10", "D11",
    "E1", "E2", "F4", "F5", "F6", "G8", "G9", "H3", "I7", "J2", "J3",
  ]);
  const vipRows = new Set(["F", "G", "H"]);
  const coupleRow = "J";

  const seats: Record<string, SeatStatus> = {};
  for (const row of rows) {
    for (let col = 1; col <= cols; col++) {
      const key = `${row}${col}`;
      if (soldPositions.has(key)) {
        seats[key] = "sold";
      } else if (row === coupleRow) {
        seats[key] = col % 2 === 1 ? "couple" : "couple";
      } else if (vipRows.has(row)) {
        seats[key] = "vip";
      } else {
        seats[key] = "available";
      }
    }
  }
  return seats;
}

const TYPE_LABELS: Record<string, string> = {
  standard: "Standard", "4dx": "4DX", imax: "IMAX", sweetbox: "Sweetbox",
};

const COMBOS = [
  { id: "solo", name: "Combo Solo", desc: "1 Bắp ngọt lớn + 1 Nước ngọt lớn", price: 60000, icon: "🍿" },
  { id: "double", name: "Combo Double", desc: "1 Bắp ngọt lớn + 2 Nước ngọt lớn", price: 85000, icon: "🥤" },
  { id: "party", name: "Combo Party", desc: "2 Bắp ngọt lớn + 4 Nước ngọt lớn", price: 150000, icon: "🎉" }
];

export default function SeatsPage({ movie, showtime, onBack, onConfirm }: SeatsPageProps) {
  const [seatMap, setSeatMap] = useState<Record<string, SeatStatus>>(generateSeats);
  const [selectedCombos, setSelectedCombos] = useState<Record<string, number>>({
    solo: 0,
    double: 0,
    party: 0
  });
  const [showCombos, setShowCombos] = useState(false);

  const rows = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
  const cols = Array.from({ length: 12 }, (_, i) => i + 1);

  const cinema = cinemas.find((c) => c.id === showtime.cinemaId);
  const basePrice = TICKET_PRICES[showtime.type];
  const vipMultiplier = 1.3;
  const coupleMultiplier = 2.2;

  const selectedSeats = useMemo(
    () => Object.entries(seatMap).filter(([, s]) => s === "selected" || s === "vip_selected" || s === "couple_selected").map(([k]) => k),
    [seatMap]
  );

  const totalPrice = useMemo(() => {
    return selectedSeats.reduce((sum, seat) => {
      const row = seat[0];
      if (["F", "G", "H"].includes(row)) return sum + basePrice * vipMultiplier;
      if (row === "J") return sum + basePrice * coupleMultiplier;
      return sum + basePrice;
    }, 0);
  }, [selectedSeats, basePrice]);

  const comboPrice = useMemo(() => {
    return Object.entries(selectedCombos).reduce((sum, [id, qty]) => {
      const c = COMBOS.find(x => x.id === id);
      return sum + (c ? c.price * qty : 0);
    }, 0);
  }, [selectedCombos]);

  const overallTotalPrice = totalPrice + comboPrice;

  const toggleSeat = (key: string) => {
    setSeatMap((prev) => {
      const current = prev[key];
      if (current === "sold") return prev;
      const next: Record<SeatStatus, SeatStatus> = {
        available: "selected", selected: "available",
        vip: "vip_selected", vip_selected: "vip",
        couple: "couple_selected", couple_selected: "couple",
        sold: "sold",
      };
      return { ...prev, [key]: next[current] };
    });
  };

  const getSeatClass = (status: SeatStatus) => {
    const base = "w-7 h-7 sm:w-8 sm:h-8 rounded-t-lg text-xs font-medium transition-all duration-200 border border-b-2 flex items-center justify-center cursor-pointer select-none";
    const styles: Record<SeatStatus, string> = {
      available: `${base} bg-slate-700 border-slate-500 border-b-slate-400 text-slate-300 hover:bg-slate-600 hover:scale-110 active:scale-95`,
      selected: `${base} bg-red-600 border-red-500 border-b-red-400 text-white scale-110 shadow-lg shadow-red-600/30`,
      sold: `${base} bg-zinc-800 border-zinc-700 border-b-zinc-700 text-zinc-600 cursor-not-allowed`,
      vip: `${base} bg-amber-700/70 border-amber-600 border-b-amber-500 text-amber-200 hover:bg-amber-600 hover:scale-110`,
      vip_selected: `${base} bg-amber-500 border-amber-400 border-b-amber-300 text-white scale-110 shadow-lg shadow-amber-500/30`,
      couple: `${base} bg-rose-800/60 border-rose-700 border-b-rose-600 text-rose-200 hover:bg-rose-700 hover:scale-110`,
      couple_selected: `${base} bg-rose-600 border-rose-500 border-b-rose-400 text-white scale-110 shadow-lg shadow-rose-600/30`,
    };
    return styles[status];
  };

  const formatPrice = (price: number) => new Intl.NumberFormat("vi-VN").format(Math.round(price));

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 sm:px-6 py-4 mt-16">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-white font-bold text-lg leading-tight">{movie.titleVi || movie.title}</h1>
            <div className="flex items-center gap-2 text-sm text-gray-400 mt-0.5 flex-wrap">
              <span>{cinema?.name}</span>
              <span className="text-zinc-600">•</span>
              <span>{showtime.date}</span>
              <span className="text-zinc-600">•</span>
              <span className="text-red-400 font-medium">{showtime.time}</span>
              <span className="text-zinc-600">•</span>
              <span className="bg-blue-900/40 text-blue-300 border border-blue-700 text-xs px-2 py-0.5 rounded">
                {TYPE_LABELS[showtime.type]}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          {/* Progress */}
          <div className="flex items-center gap-2 mb-8 max-w-2xl mx-auto">
            {["Chọn ghế", "Thanh toán", "Hoàn tất"].map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0 ? "bg-red-600 text-white" : "bg-zinc-800 text-gray-500"}`}>
                  {i + 1}
                </div>
                <span className={`text-xs font-medium flex-shrink-0 ${i === 0 ? "text-white" : "text-gray-500"}`}>{s}</span>
                {i < 2 && <div className="flex-1 h-px bg-zinc-800" />}
              </div>
            ))}
          </div>

          {/* Screen */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-full max-w-md h-3 bg-gradient-to-b from-red-500/40 to-transparent rounded-full mb-1" />
            <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
              <Monitor className="w-3 h-3" />
              Màn hình
            </div>
          </div>

          {/* Seat Map */}
          <div className="overflow-x-auto">
            <div className="flex flex-col gap-1.5 items-center min-w-fit">
              {rows.map((row) => (
                <div key={row} className="flex items-center gap-1.5">
                  <span className="w-5 text-center text-gray-600 text-xs font-mono flex-shrink-0">{row}</span>
                  <div className="flex gap-1.5">
                    {cols.map((col) => {
                      const key = `${row}${col}`;
                      const status = seatMap[key];
                      return (
                        <button
                          key={key}
                          onClick={() => toggleSeat(key)}
                          className={getSeatClass(status)}
                          title={key}
                          disabled={status === "sold"}
                        >
                          {col}
                        </button>
                      );
                    })}
                  </div>
                  <span className="w-5 text-center text-gray-600 text-xs font-mono flex-shrink-0">{row}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-4 justify-center mt-8">
            {[
              { color: "bg-slate-700 border-slate-500 border-b-slate-400", label: `Thường (${formatPrice(basePrice)}đ)` },
              { color: "bg-amber-700/70 border-amber-600 border-b-amber-500", label: `VIP (${formatPrice(basePrice * 1.3)}đ)` },
              { color: "bg-rose-800/60 border-rose-700 border-b-rose-600", label: `Đôi (${formatPrice(basePrice * 2.2)}đ)` },
              { color: "bg-red-600 border-red-500 border-b-red-400", label: "Đã chọn" },
              { color: "bg-zinc-800 border-zinc-700", label: "Đã bán" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-t-lg border border-b-2 ${l.color}`} />
                <span className="text-gray-400 text-xs">{l.label}</span>
              </div>
            ))}
          </div>

          {/* Combos Section (UML <<extend>> relationship) */}
          <div className="mt-12 border-t border-zinc-800 pt-8">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center justify-between hover:border-zinc-700 transition-all">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🍿</span>
                <div>
                  <h4 className="text-white font-bold text-sm">Mua Thêm Combo Bắp & Nước? (Tùy Chọn)</h4>
                  <p className="text-gray-400 text-[11px] mt-0.5">Tiết kiệm đến 20% khi mua online cùng vé xem phim</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCombos(!showCombos);
                  if (showCombos) {
                    setSelectedCombos({ solo: 0, double: 0, party: 0 });
                  }
                }}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${
                  showCombos 
                    ? "bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-750" 
                    : "bg-red-600/10 text-red-400 border-red-650/20 hover:bg-red-600/20"
                }`}
              >
                {showCombos ? "Hủy chọn" : "Chọn thêm"}
              </button>
            </div>

            {showCombos && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                {COMBOS.map((c) => (
                  <div key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center justify-between hover:border-zinc-700 transition-all">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{c.icon}</span>
                      <div>
                        <h4 className="text-white font-bold text-sm">{c.name}</h4>
                        <p className="text-gray-550 text-[11px] mt-0.5">{c.desc}</p>
                        <p className="text-red-400 font-bold text-xs mt-2">{formatPrice(c.price)}đ</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-zinc-950 px-2 py-1 rounded-lg border border-zinc-800">
                      <button
                        onClick={() => setSelectedCombos(prev => ({ ...prev, [c.id]: Math.max(0, prev[c.id] - 1) }))}
                        className="text-gray-400 hover:text-white p-1"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-white font-bold text-xs w-4 text-center">{selectedCombos[c.id]}</span>
                      <button
                        onClick={() => setSelectedCombos(prev => ({ ...prev, [c.id]: prev[c.id] + 1 }))}
                        className="text-gray-400 hover:text-white p-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Bottom Bar */}
      <div className="sticky bottom-0 bg-zinc-900 border-t border-zinc-800 px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div>
            {selectedSeats.length > 0 ? (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-gray-400 text-sm">Ghế đã chọn:</span>
                  <div className="flex gap-1 flex-wrap">
                    {selectedSeats.map((s) => (
                      <span key={s} className="bg-red-600/20 text-red-400 text-xs px-2 py-0.5 rounded border border-red-600/30">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm">Tổng tiền:</span>
                  <span className="text-white font-bold text-lg">{formatPrice(overallTotalPrice)}đ</span>
                </div>
              </>
            ) : (
              <p className="text-gray-550 text-sm">Chọn ghế để tiếp tục đặt vé</p>
            )}
          </div>

          <button
            onClick={() => {
              if (selectedSeats.length === 0) return;

              // 15% chance of seat collision simulation
              const simulateCollision = Math.random() < 0.15;
              
              if (simulateCollision) {
                const conflictedSeat = selectedSeats[Math.floor(Math.random() * selectedSeats.length)];
                alert(`Rất tiếc, ghế ${conflictedSeat} vừa có người đặt trước đó vài giây. Vui lòng chọn ghế khác!`);
                
                // Update seatMap: mark conflicted seat as sold
                setSeatMap(prev => ({
                  ...prev,
                  [conflictedSeat]: "sold"
                }));
                return;
              }

              const combosList = Object.entries(selectedCombos)
                .filter(([, qty]) => qty > 0)
                .map(([id, qty]) => {
                  const c = COMBOS.find(x => x.id === id)!;
                  return { name: c.name, quantity: qty, price: c.price };
                });

              onConfirm(selectedSeats, overallTotalPrice, combosList);
            }}
            disabled={selectedSeats.length === 0}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
              selectedSeats.length > 0
                ? "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20 hover:shadow-red-600/40"
                : "bg-zinc-800 text-gray-600 cursor-not-allowed"
            }`}
          >
            Tiếp Theo
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
