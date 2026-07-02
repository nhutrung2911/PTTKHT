import { useState, useEffect, useRef } from "react";
import { 
  LayoutDashboard, Film, Calendar, QrCode, LogOut, Plus, Trash2, Edit2, 
  Search, Check, MapPin, TrendingUp, Ticket, DollarSign, Users, Clock, AlertCircle,
  Monitor, Printer, Camera, Upload, X, RefreshCw
} from "lucide-react";
import type { Movie, Showtime } from "../data/movies";
import { cinemas, TICKET_PRICES } from "../data/movies";
import { 
  loadMovies, saveMovies, loadShowtimes, saveShowtimes, 
  loadTickets, updateTicketStatus, BookedTicket, saveTicket
} from "../lib/db";

interface AdminPortalPageProps {
  userRole: "customer" | "staff" | "admin" | null;
  onBack: () => void;
}

type Tab = "dashboard" | "movies" | "showtimes" | "tickets" | "sales";

interface InteractiveSVGChartProps {
  data: { label: string; revenue: number; ticketsCount: number }[];
  reportType: 'date' | 'cinema' | 'movie';
}

function InteractiveSVGChart({ data, reportType }: InteractiveSVGChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [chartMode, setChartMode] = useState<'line' | 'bar'>('line');

  if (!data || data.length === 0) return null;

  const width = 600;
  const height = 260;
  const paddingLeft = 55;
  const paddingRight = 20;
  const paddingTop = 30;
  const paddingBottom = 45;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxVal = Math.max(...data.map(d => d.revenue)) || 1;
  const minVal = 0;

  // Compute point coordinates
  const points = data.map((d, index) => {
    const x = data.length === 1 
      ? paddingLeft + chartWidth / 2 
      : paddingLeft + (index / Math.max(1, data.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - ((d.revenue - minVal) / (maxVal - minVal)) * chartHeight;
    return { x, y, label: d.label, revenue: d.revenue, ticketsCount: d.ticketsCount };
  });

  let linePath = "";
  let areaPath = "";
  if (points.length > 1) {
    linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(" ");
    areaPath = `${linePath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;
  } else if (points.length === 1) {
    linePath = "";
    areaPath = "";
  }

  const formatPrice = (n: number) => {
    return new Intl.NumberFormat("vi-VN").format(Math.round(n)) + "đ";
  };

  const formatShortPrice = (n: number) => {
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + "B";
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(0) + "k";
    return n.toString();
  };

  const yTicks = 4;
  const yLabels = Array.from({ length: yTicks + 1 }).map((_, i) => {
    const val = minVal + (maxVal - minVal) * (i / yTicks);
    const y = paddingTop + chartHeight - (i / yTicks) * chartHeight;
    return { val, y };
  });

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-white font-bold text-sm flex items-center gap-2">
          <TrendingUp className="w-4.5 h-4.5 text-red-500" />
          Biểu Đồ Doanh Thu Lọc Chi Tiết
        </h3>
        
        <div className="flex gap-1.5 p-0.5 bg-zinc-950 border border-zinc-850 rounded-lg text-[10px]">
          <button
            type="button"
            onClick={() => setChartMode('line')}
            className={`px-2 py-1 rounded font-semibold transition-all ${
              chartMode === 'line' ? 'bg-zinc-800 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Đường
          </button>
          <button
            type="button"
            onClick={() => setChartMode('bar')}
            className={`px-2 py-1 rounded font-semibold transition-all ${
              chartMode === 'bar' ? 'bg-zinc-800 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Cột
          </button>
        </div>
      </div>

      <div className="relative">
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-auto overflow-visible select-none font-sans"
        >
          <defs>
            <linearGradient id="chartAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#dc2626" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#dc2626" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="chartBarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#dc2626" stopOpacity="1.0" />
              <stop offset="100%" stopColor="#991b1b" stopOpacity="0.6" />
            </linearGradient>
            <linearGradient id="hoverBarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="1.0" />
              <stop offset="100%" stopColor="#dc2626" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {yLabels.map((tick, i) => (
            <g key={i}>
              <line 
                x1={paddingLeft} 
                y1={tick.y} 
                x2={width - paddingRight} 
                y2={tick.y} 
                stroke="#27272a" 
                strokeWidth="1" 
                strokeDasharray="3 3"
              />
              <text 
                x={paddingLeft - 10} 
                y={tick.y + 4} 
                fill="#71717a" 
                fontSize="10" 
                textAnchor="end"
              >
                {formatShortPrice(tick.val)}
              </text>
            </g>
          ))}

          <line 
            x1={paddingLeft} 
            y1={paddingTop + chartHeight} 
            x2={width - paddingRight} 
            y2={paddingTop + chartHeight} 
            stroke="#3f3f46" 
            strokeWidth="1"
          />

          {chartMode === 'line' && (
            <>
              {areaPath && (
                <path 
                  d={areaPath} 
                  fill="url(#chartAreaGradient)" 
                />
              )}
              {linePath && (
                <path 
                  d={linePath} 
                  fill="none" 
                  stroke="#ef4444" 
                  strokeWidth="2.5" 
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {points.map((p, i) => (
                <g key={i}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={hoveredIndex === i ? 8 : 4}
                    fill="#ef4444"
                    fillOpacity={hoveredIndex === i ? 0.3 : 0}
                    className="transition-all duration-200"
                  />
                  <circle 
                    cx={p.x} 
                    cy={p.y} 
                    r={hoveredIndex === i ? 5 : 3} 
                    fill={hoveredIndex === i ? "#ffffff" : "#ef4444"} 
                    stroke="#dc2626"
                    strokeWidth="1.5"
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className="cursor-pointer transition-all duration-200"
                  />
                </g>
              ))}
            </>
          )}

          {chartMode === 'bar' && (() => {
            const barSpacing = data.length === 1 ? chartWidth : chartWidth / data.length;
            const barWidth = data.length === 1 ? 40 : Math.max(6, barSpacing * 0.4);

            return points.map((p, i) => {
              const barHeight = paddingTop + chartHeight - p.y;
              const barX = p.x - barWidth / 2;

              return (
                <g key={i}>
                  <rect
                    x={barX}
                    y={p.y}
                    width={barWidth}
                    height={Math.max(2, barHeight)}
                    rx="3"
                    fill={hoveredIndex === i ? "url(#hoverBarGradient)" : "url(#chartBarGradient)"}
                    className="cursor-pointer transition-all duration-200"
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                </g>
              );
            });
          })()}

          {points.map((p, i) => {
            const showLabel = data.length <= 10 || i % Math.ceil(data.length / 8) === 0 || i === data.length - 1;
            if (!showLabel) return null;

            const labelText = p.label.length > 10 ? p.label.substring(0, 8) + ".." : p.label;

            return (
              <text 
                key={i} 
                x={p.x} 
                y={paddingTop + chartHeight + 16} 
                fill="#71717a" 
                fontSize="9" 
                textAnchor="middle"
                transform={`rotate(-15, ${p.x}, ${paddingTop + chartHeight + 16})`}
              >
                {labelText}
              </text>
            );
          })}
        </svg>

        {hoveredIndex !== null && points[hoveredIndex] && (
          <div 
            className="absolute bg-zinc-950 border border-zinc-800 rounded-xl p-3 shadow-2xl text-xs space-y-1 z-10 pointer-events-none transition-all duration-150"
            style={{
              left: `${Math.min(width - 160, Math.max(10, points[hoveredIndex].x - 60))}px`,
              top: `${Math.min(height - 100, Math.max(10, points[hoveredIndex].y - 85))}px`,
            }}
          >
            <p className="text-gray-400 font-medium">{points[hoveredIndex].label}</p>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
              <p className="text-white font-bold">{formatPrice(points[hoveredIndex].revenue)}</p>
            </div>
            {points[hoveredIndex].ticketsCount > 0 && (
              <p className="text-gray-550 text-[10px]">Đã bán: <span className="text-red-400 font-bold">{points[hoveredIndex].ticketsCount} vé</span></p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminPortalPage({ userRole, onBack }: AdminPortalPageProps) {
  // If role is staff, restrict tab to tickets
  const isStaff = userRole === "staff";
  const [activeTab, setActiveTab] = useState<Tab>(isStaff ? "tickets" : "dashboard");
  const [moviesList, setMoviesList] = useState<Movie[]>([]);
  const [showtimesList, setShowtimesList] = useState<Showtime[]>([]);
  const [ticketsList, setTicketsList] = useState<BookedTicket[]>([]);

  // States for direct sales at counter
  const [selectedSalesMovie, setSelectedSalesMovie] = useState<Movie | null>(null);
  const [selectedSalesCinema, setSelectedSalesCinema] = useState<any>(cinemas[0] || null);
  const [selectedSalesDate, setSelectedSalesDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [selectedSalesShowtime, setSelectedSalesShowtime] = useState<Showtime | null>(null);
  const [salesSelectedSeats, setSalesSelectedSeats] = useState<string[]>([]);
  const [salesCustomerName, setSalesCustomerName] = useState("");
  const [salesPaymentMethod, setSalesPaymentMethod] = useState("cash");
  const [printedTicket, setPrintedTicket] = useState<BookedTicket | null>(null);
  const [salesMovieSearchQuery, setSalesMovieSearchQuery] = useState("");
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [isTransferConfirming, setIsTransferConfirming] = useState(false);

  // State for search and forms
  // State for search and forms
  const [searchTicketQuery, setSearchTicketQuery] = useState("");
  const [searchTicketResult, setSearchTicketResult] = useState<BookedTicket | null>(null);
  const [ticketSearchError, setTicketSearchError] = useState("");

  // States & Refs for QR Simulator & Scanner
  const [isScanningMode, setIsScanningMode] = useState(false);
  const [scanTab, setScanTab] = useState<'camera' | 'upload' | 'simulate'>('simulate');
  const [webcamActive, setWebcamActive] = useState(false);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [jsQRLoaded, setJsQRLoaded] = useState(false);
  const [isFlash, setIsFlash] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Load jsQR script dynamically
  useEffect(() => {
    if ((window as any).jsQR) {
      setJsQRLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js";
    script.async = true;
    script.onload = () => setJsQRLoaded(true);
    document.body.appendChild(script);
  }, []);

  // Clean up webcam on unmount
  useEffect(() => {
    return () => {
      if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [webcamStream]);

  // Beep Audio
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value = 1000;
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.12);
    } catch (e) {
      console.error("Audio beep error:", e);
    }
  };

  const startWebcam = async () => {
    try {
      setTicketSearchError("");
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setWebcamStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(err => console.error(err));
      }
      setWebcamActive(true);
    } catch (err) {
      console.error("Error accessing camera: ", err);
      setTicketSearchError("Không thể truy cập camera. Vui lòng kiểm tra quyền thiết bị hoặc dùng chế độ Tải Ảnh / Giả Lập.");
      setWebcamActive(false);
    }
  };

  const stopWebcam = () => {
    if (webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop());
      setWebcamStream(null);
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setWebcamActive(false);
  };

  const handleDecodedCode = (codeText: string) => {
    playBeep();
    setIsFlash(true);
    setTimeout(() => setIsFlash(false), 300);

    const cleanCode = codeText.trim().toUpperCase();
    setSearchTicketQuery(cleanCode);
    
    // Deactivate webcam
    if (webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop());
      setWebcamStream(null);
    }
    setWebcamActive(false);

    const ticket = ticketsList.find(t => t.id.toUpperCase() === cleanCode);
    if (ticket) {
      setSearchTicketResult(ticket);
      setTicketSearchError("");
    } else {
      setSearchTicketResult(null);
      setTicketSearchError(`Không tìm thấy mã đặt vé "${cleanCode}" trong hệ thống.`);
    }
  };

  // Webcam scanning loop
  useEffect(() => {
    if (!webcamActive || !webcamStream) return;

    const scanFrame = () => {
      const video = videoRef.current;
      if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          if ((window as any).jsQR) {
            const code = (window as any).jsQR(
              imageData.data,
              imageData.width,
              imageData.height,
              { inversionAttempts: "dontInvert" }
            );

            if (code && code.data) {
              handleDecodedCode(code.data);
              return;
            }
          }
        }
      }
      animationFrameRef.current = requestAnimationFrame(scanFrame);
    };

    animationFrameRef.current = requestAnimationFrame(scanFrame);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [webcamActive, webcamStream, ticketsList]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setTicketSearchError("");
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, img.width, img.height);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          
          if ((window as any).jsQR) {
            const code = (window as any).jsQR(
              imageData.data,
              imageData.width,
              imageData.height,
              { inversionAttempts: "dontInvert" }
            );

            if (code && code.data) {
              handleDecodedCode(code.data);
            } else {
              setTicketSearchError("Không tìm thấy mã QR hợp lệ trong ảnh này. Vui lòng thử ảnh khác.");
            }
          } else {
            setTicketSearchError("Thư viện giải mã QR đang tải. Vui lòng thử lại sau giây lát.");
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSimulatedScan = (ticketId: string) => {
    handleDecodedCode(ticketId);
  };

  // States for report filter (UC06)
  const [reportType, setReportType] = useState<"date" | "cinema" | "movie">("date");
  const [reportStartDate, setReportStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7); // Default to last 7 days
    return d.toISOString().split("T")[0];
  });
  const [reportEndDate, setReportEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [reportData, setReportData] = useState<any[]>([]);
  const [hasSearchedReport, setHasSearchedReport] = useState(false);

  // Modals
  const [showMovieModal, setShowMovieModal] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [movieForm, setMovieForm] = useState<Partial<Movie>>({
    title: "", titleVi: "", duration: 120, rating: "T16", score: 8.0, 
    poster: "", backdrop: "", status: "now_showing", releaseDate: "", 
    description: "", director: "", cast: [], language: "Phụ đề Tiếng Việt", genre: []
  });

  const [showShowtimeModal, setShowShowtimeModal] = useState(false);
  const [showtimeForm, setShowtimeForm] = useState<Partial<Showtime>>({
    movieId: 1, cinemaId: 1, date: new Date().toISOString().split("T")[0], 
    time: "18:00", hall: "Hall 1", type: "standard", availableSeats: 100, totalSeats: 100
  });

  // Load database
  useEffect(() => {
    setMoviesList(loadMovies());
    setShowtimesList(loadShowtimes());
    setTicketsList(loadTickets());
  }, []);

  // Update tab if role changes
  useEffect(() => {
    setActiveTab(userRole === "staff" ? "tickets" : "dashboard");
  }, [userRole]);

  const refreshDB = () => {
    setMoviesList(loadMovies());
    setShowtimesList(loadShowtimes());
    setTicketsList(loadTickets());
  };

  // Movie CRUD actions
  const handleOpenAddMovie = () => {
    setEditingMovie(null);
    setMovieForm({
      title: "", titleVi: "", duration: 120, rating: "T16", score: 8.0, 
      poster: "https://images.pexels.com/photos/7991486/pexels-photo-7991486.jpeg?auto=compress&cs=tinysrgb&w=400&h=600", 
      backdrop: "https://images.pexels.com/photos/7991486/pexels-photo-7991486.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750", 
      status: "now_showing", releaseDate: new Date().toISOString().split("T")[0], 
      description: "", director: "", cast: [], language: "Phụ đề Tiếng Việt", genre: ["Action", "Adventure"]
    });
    setShowMovieModal(true);
  };

  const handleOpenEditMovie = (movie: Movie) => {
    setEditingMovie(movie);
    setMovieForm({ ...movie });
    setShowMovieModal(true);
  };

  const handleDeleteMovie = (id: number) => {
    // Check if the movie has any showtimes or booked tickets
    const hasShowtimes = showtimesList.some(s => s.movieId === id);
    const hasTickets = ticketsList.some(t => t.movieId === id);

    if (hasShowtimes || hasTickets) {
      if (confirm("Không thể xóa phim này vì đã có lịch chiếu hoặc vé được đặt. Bạn có muốn chuyển trạng thái phim sang 'Ngưng chiếu' (Ended) không?")) {
        const updated = moviesList.map(m => {
          if (m.id === id) {
            return { ...m, status: 'ended' as const };
          }
          return m;
        });
        saveMovies(updated);
        refreshDB();
        alert("Đã chuyển trạng thái phim sang 'Ngưng chiếu'.");
      }
      return;
    }

    if (confirm("Bạn có chắc chắn muốn xóa phim này không?")) {
      const updated = moviesList.filter(m => m.id !== id);
      saveMovies(updated);
      refreshDB();
    }
  };

  const handleSaveMovie = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMovie) {
      // Edit
      const updated = moviesList.map(m => m.id === editingMovie.id ? (movieForm as Movie) : m);
      saveMovies(updated);
    } else {
      // Add
      const newId = moviesList.length > 0 ? Math.max(...moviesList.map(m => m.id)) + 1 : 1;
      const newMovie = {
        ...movieForm,
        id: newId,
        cast: typeof movieForm.cast === "string" ? (movieForm.cast as string).split(",").map(c => c.trim()) : movieForm.cast,
        genre: typeof movieForm.genre === "string" ? (movieForm.genre as string).split(",").map(g => g.trim()) : movieForm.genre
      } as Movie;
      saveMovies([...moviesList, newMovie]);
    }
    setShowMovieModal(false);
    refreshDB();
  };

  // Showtime CRUD actions
  const handleOpenAddShowtime = () => {
    const defaultMovieId = moviesList[0]?.id || 1;
    setShowtimeForm({
      movieId: defaultMovieId, cinemaId: 1, date: new Date().toISOString().split("T")[0], 
      time: "18:00", hall: "Hall 1", type: "standard", availableSeats: 100, totalSeats: 100
    });
    setShowShowtimeModal(true);
  };

  const handleDeleteShowtime = (id: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa lịch chiếu này không?")) {
      const updated = showtimesList.filter(s => s.id !== id);
      saveShowtimes(updated);
      refreshDB();
    }
  };

  const handleSaveShowtime = (e: React.FormEvent) => {
    e.preventDefault();
    const parseTimeToMinutes = (timeStr: string): number => {
      const [h, m] = timeStr.split(":").map(Number);
      return h * 60 + m;
    };

    const newShowtime = {
      ...showtimeForm,
      movieId: Number(showtimeForm.movieId),
      cinemaId: Number(showtimeForm.cinemaId),
      availableSeats: Number(showtimeForm.totalSeats),
      totalSeats: Number(showtimeForm.totalSeats)
    } as Showtime;

    // Check for showtime conflicts (Overlap)
    const movie = moviesList.find(m => m.id === newShowtime.movieId);
    const duration = movie ? movie.duration : 120;
    const start = parseTimeToMinutes(newShowtime.time);
    const end = start + duration;

    const overlap = showtimesList.some(s => {
      if (s.cinemaId === newShowtime.cinemaId && s.date === newShowtime.date && s.hall.toLowerCase() === newShowtime.hall.toLowerCase()) {
        const existMovie = moviesList.find(m => m.id === s.movieId);
        const existDuration = existMovie ? existMovie.duration : 120;
        const existStart = parseTimeToMinutes(s.time);
        const existEnd = existStart + existDuration;
        // overlap check
        return (start < existEnd) && (end > existStart);
      }
      return false;
    });

    if (overlap) {
      alert("Khung giờ này phòng chiếu đã bận! Vui lòng chọn thời gian khác hoặc phòng chiếu khác.");
      return;
    }

    const newId = showtimesList.length > 0 ? Math.max(...showtimesList.map(s => s.id)) + 1 : 1;
    newShowtime.id = newId;

    saveShowtimes([...showtimesList, newShowtime]);
    setShowShowtimeModal(false);
    refreshDB();
  };

  // Ticket scanner / check-in actions
  const handleSearchTicket = (e: React.FormEvent) => {
    e.preventDefault();
    setTicketSearchError("");
    setSearchTicketResult(null);

    const ticket = ticketsList.find(t => t.id.toLowerCase() === searchTicketQuery.trim().toLowerCase());
    if (ticket) {
      setSearchTicketResult(ticket);
    } else {
      setTicketSearchError("Không tìm thấy mã đặt vé này trong hệ thống.");
    }
  };

  const handleCheckIn = (id: string) => {
    const success = updateTicketStatus(id, "used");
    if (success) {
      refreshDB();
      // Update local search result state
      if (searchTicketResult && searchTicketResult.id === id) {
        setSearchTicketResult(prev => prev ? { ...prev, status: "used" } : null);
      }
    }
  };

  const handleCancelTicket = (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn hủy đơn vé này không? Toàn bộ ghế sẽ được hoàn trả lại phòng chiếu.")) return;

    const ticket = ticketsList.find(t => t.id === id);
    if (!ticket) {
      alert("Không tìm thấy thông tin vé!");
      return;
    }

    const success = updateTicketStatus(id, "cancelled");
    if (success) {
      const currentShowtimes = loadShowtimes();
      const cinemaObj = cinemas.find(c => c.name.toLowerCase() === ticket.cinemaName.toLowerCase());
      const cinemaId = cinemaObj ? cinemaObj.id : null;

      const stIdx = currentShowtimes.findIndex(s => 
        s.movieId === ticket.movieId &&
        (cinemaId === null || s.cinemaId === cinemaId) &&
        s.date === ticket.showtimeDate &&
        s.time === ticket.showtimeTime &&
        s.hall.toLowerCase() === ticket.hall.toLowerCase()
      );

      if (stIdx !== -1) {
        currentShowtimes[stIdx].availableSeats = Math.min(
          currentShowtimes[stIdx].totalSeats,
          currentShowtimes[stIdx].availableSeats + ticket.seats.length
        );
        saveShowtimes(currentShowtimes);
      }

      alert("Hủy đơn vé và hoàn trả ghế thành công!");
      refreshDB();

      if (searchTicketResult && searchTicketResult.id === id) {
        setSearchTicketResult(prev => prev ? { ...prev, status: "cancelled" } : null);
      }
    } else {
      alert("Hủy vé thất bại!");
    }
  };

  const downloadQRCode = (ticket: BookedTicket) => {
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${ticket.id}`;
    fetch(url)
      .then(response => response.blob())
      .then(blob => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `QR_Code_${ticket.id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      })
      .catch(error => {
        console.error("Error downloading QR code:", error);
        window.open(url, "_blank");
      });
  };

  const downloadReceiptTxt = (ticket: BookedTicket) => {
    const content = `
========================================
           CINESTAR CINEMA
========================================
Rạp: ${ticket.cinemaName}
Mã Đặt Vé: ${ticket.id}
Phim: ${ticket.movieTitle}
Ngày: ${ticket.showtimeDate}
Giờ Chiếu: ${ticket.showtimeTime}
Phòng: ${ticket.hall}
Ghế: ${ticket.seats.join(", ")}
----------------------------------------
Tổng Tiền: ${formatPrice(ticket.totalPrice)}
Thanh Toán: ${ticket.paymentMethod}
Thời Gian: ${ticket.bookedAt}
Nhân Viên: Counter Sale
========================================
Vui lòng trình mã đặt vé này tại quầy soát vé.
Cảm ơn quý khách và chúc xem phim vui vẻ!
`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Bien_lai_CineStar_${ticket.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate statistics
  const totalRevenue = ticketsList.reduce((sum, t) => sum + t.totalPrice, 0);
  const totalTicketsSold = ticketsList.reduce((sum, t) => sum + t.seats.length, 0);
  
  // Group revenue by movie
  const revenueByMovieMap = ticketsList.reduce((acc, t) => {
    acc[t.movieTitle] = (acc[t.movieTitle] || 0) + t.totalPrice;
    return acc;
  }, {} as Record<string, number>);

  const revenueByMovieArray = Object.entries(revenueByMovieMap).map(([title, rev]) => ({
    title,
    revenue: rev
  })).sort((a, b) => b.revenue - a.revenue);

  // Compute default last 7 days daily revenue trend
  const defaultChartData = (() => {
    const dataMap: Record<string, { label: string; revenue: number; ticketsCount: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const labelShort = `${d.getDate()}/${d.getMonth() + 1}`;
      dataMap[dateStr] = { label: labelShort, revenue: 0, ticketsCount: 0 };
    }

    ticketsList.forEach(t => {
      const dateStr = t.bookedAt.substring(0, 10);
      if (dataMap[dateStr]) {
        dataMap[dateStr].revenue += t.totalPrice;
        dataMap[dateStr].ticketsCount += t.seats.length;
      }
    });

    return Object.entries(dataMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(entry => entry[1]);
  })();

  const formatPrice = (n: number) => {
    return new Intl.NumberFormat("vi-VN").format(Math.round(n)) + "đ";
  };

  const handleExportReport = () => {
    if (reportData.length === 0) return;

    let csvContent = "\uFEFF"; // UTF-8 BOM
    csvContent += reportType === "date" ? "Ngày" : reportType === "cinema" ? "Rạp Chiếu" : "Phim";
    csvContent += ",Số Vé Bán Ra,Doanh Thu\n";

    reportData.forEach(row => {
      csvContent += `"${row.label}",${row.ticketsCount},${row.revenue}\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Bao_cao_doanh_thu_theo_${reportType === "date" ? "ngay" : reportType === "cinema" ? "rap" : "phim"}_${reportStartDate}_to_${reportEndDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter sidebar navigation items by role
  const sidebarItems = [
    ...(!isStaff ? [{ id: "dashboard", label: "Bảng Điều Khiển", icon: LayoutDashboard }] : []),
    ...(!isStaff ? [{ id: "movies", label: "Quản Lý Phim", icon: Film }] : []),
    ...(!isStaff ? [{ id: "showtimes", label: "Quản Lý Suất Chiếu", icon: Calendar }] : []),
    { id: "tickets", label: isStaff ? "Soát Vé QR" : "Soát Vé & Giao Dịch", icon: QrCode },
    { id: "sales", label: "Bán Vé Tại Quầy", icon: Ticket },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-16 flex flex-col">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full flex-1 flex flex-col md:flex-row gap-6">
        
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sticky top-24">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-zinc-800">
              <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-red-600/20">
                {isStaff ? "S" : "A"}
              </div>
              <div>
                <h3 className="text-white font-bold">{isStaff ? "Portal Nhân Viên" : "Portal Quản Trị Viên"}</h3>
                <p className="text-gray-500 text-xs font-medium">Quyền: {isStaff ? "Staff / Nhân Viên" : "Admin / Quản Trị Viên"}</p>
              </div>
            </div>

            <nav className="space-y-1.5">
              {sidebarItems.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as Tab);
                      if (item.id === "dashboard") {
                        setHasSearchedReport(false);
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      activeTab === item.id
                        ? "bg-red-600 text-white shadow-lg shadow-red-600/10"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}

              <button
                onClick={onBack}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-950/20 transition-all mt-4 border border-red-500/10"
              >
                <LogOut className="w-4 h-4" />
                Thoát Giao Diện
              </button>
            </nav>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          
          {/* DASHBOARD TAB */}
          {!isStaff && activeTab === "dashboard" && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold text-white">Báo Cáo & Thống Kê</h1>
              
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                  icon={<DollarSign className="w-5 h-5 text-emerald-400" />} 
                  bg="bg-emerald-500/10 border-emerald-500/20"
                  label="Doanh Thu Lịch Chiếu" 
                  value={formatPrice(totalRevenue + 12450000)} 
                  desc="+15.2% so với tháng trước" 
                />
                <StatCard 
                  icon={<Ticket className="w-5 h-5 text-red-400" />} 
                  bg="bg-red-500/10 border-red-500/20"
                  label="Tổng Số Vé Bán Ra" 
                  value={(totalTicketsSold + 138).toString()} 
                  desc="Trung bình 12 vé/suất" 
                />
                <StatCard 
                  icon={<Film className="w-5 h-5 text-amber-400" />} 
                  bg="bg-amber-500/10 border-amber-500/20"
                  label="Phim Đang Đặt Vé" 
                  value={moviesList.length.toString()} 
                  desc={`${moviesList.filter(m => m.status === 'now_showing').length} phim đang chiếu`} 
                />
                <StatCard 
                  icon={<Users className="w-5 h-5 text-purple-400" />} 
                  bg="bg-purple-500/10 border-purple-500/20"
                  label="Tổng Số Khách Hàng" 
                  value="1,248" 
                  desc="Hoạt động thường xuyên" 
                />
              </div>

              {/* Báo cáo lọc doanh thu (UC06) */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-white font-bold text-base flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-red-600 rounded-full" />
                  Bộ Lọc Doanh Thu Chi Tiết
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end text-xs">
                  <div>
                    <label className="block text-gray-400 text-[10px] font-semibold uppercase mb-1.5">Loại Báo Cáo</label>
                    <select
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value as any)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-500 font-sans"
                    >
                      <option value="date">Báo cáo theo ngày</option>
                      <option value="cinema">Báo cáo theo rạp</option>
                      <option value="movie">Báo cáo theo phim</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-[10px] font-semibold uppercase mb-1.5">Từ Ngày</label>
                    <input
                      type="date"
                      value={reportStartDate}
                      onChange={(e) => setReportStartDate(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500 font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-[10px] font-semibold uppercase mb-1.5">Đến Ngày</label>
                    <input
                      type="date"
                      value={reportEndDate}
                      onChange={(e) => setReportEndDate(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500 font-sans"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const start = reportStartDate;
                        const end = reportEndDate;

                        const filtered = ticketsList.filter(t => {
                          const ticketDate = t.bookedAt.substring(0, 10);
                          const matchStart = start ? ticketDate >= start : true;
                          const matchEnd = end ? ticketDate <= end : true;
                          return matchStart && matchEnd;
                        });

                        const groups: Record<string, { label: string; revenue: number; ticketsCount: number }> = {};
                        
                        filtered.forEach(t => {
                          let label = "";
                          if (reportType === "date") label = t.bookedAt.substring(0, 10);
                          else if (reportType === "cinema") label = t.cinemaName;
                          else if (reportType === "movie") label = t.movieTitle;

                          if (!groups[label]) {
                            groups[label] = { label, revenue: 0, ticketsCount: 0 };
                          }
                          groups[label].revenue += t.totalPrice;
                          groups[label].ticketsCount += t.seats.length;
                        });

                        const result = Object.values(groups);
                        if (reportType === "date") {
                          result.sort((a, b) => a.label.localeCompare(b.label));
                        } else {
                          result.sort((a, b) => b.revenue - a.revenue);
                        }

                        setReportData(result);
                        setHasSearchedReport(true);
                      }}
                      className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold py-2.5 px-4 rounded-xl transition-all cursor-pointer text-center text-xs"
                    >
                      Xem Báo Cáo
                    </button>
                    {reportData.length > 0 && (
                      <button
                        type="button"
                        onClick={handleExportReport}
                        className="bg-emerald-650 hover:bg-emerald-600 text-white font-semibold py-2.5 px-4 rounded-xl transition-all cursor-pointer text-center text-xs"
                      >
                        Xuất Báo Cáo
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {hasSearchedReport && reportData.length === 0 && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 text-center text-gray-500 font-sans text-sm">
                  Không có dữ liệu doanh thu trong khoảng thời gian này.
                </div>
              )}

              {hasSearchedReport && reportData.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Table (Left) */}
                  <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
                    <h3 className="text-white font-bold text-base">
                      {reportType === "date" ? "Doanh thu theo ngày" : reportType === "cinema" ? "Doanh thu theo rạp" : "Doanh thu theo phim"}
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs sm:text-sm text-gray-300">
                        <thead className="bg-zinc-950 text-gray-400 uppercase text-[10px] border-b border-zinc-800">
                          <tr>
                            <th className="px-4 py-3">{reportType === "date" ? "Ngày" : reportType === "cinema" ? "Rạp" : "Phim"}</th>
                            <th className="px-4 py-3 text-center">Số Vé Bán Ra</th>
                            <th className="px-4 py-3 text-right">Doanh Thu</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                          {reportData.map((row, i) => (
                            <tr key={i} className="hover:bg-white/5 transition-colors">
                              <td className="px-4 py-3 font-semibold text-white">{row.label}</td>
                              <td className="px-4 py-3 text-center text-red-400 font-bold">{row.ticketsCount}</td>
                              <td className="px-4 py-3 text-right text-emerald-400 font-bold">{formatPrice(row.revenue)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Interactive SVG Chart (Right) */}
                  <InteractiveSVGChart data={reportData} reportType={reportType} />
                </div>
              )}

              {/* Default Overview (If not searched yet) */}
              {!hasSearchedReport && (
                <div className="space-y-6">
                  {/* Interactive Dashboard Chart */}
                  <InteractiveSVGChart data={defaultChartData} reportType="date" />

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Revenue by Movie */}
                    <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                      <div className="flex items-center gap-2 mb-6">
                        <TrendingUp className="w-5 h-5 text-red-500" />
                        <h3 className="text-white font-bold">Top Doanh Thu Theo Phim</h3>
                      </div>

                      <div className="space-y-4">
                        {revenueByMovieArray.length > 0 ? (
                          revenueByMovieArray.slice(0, 5).map((item, idx) => {
                            const maxVal = Math.max(...revenueByMovieArray.map(i => i.revenue)) || 1;
                            const percent = (item.revenue / maxVal) * 100;
                            return (
                              <div key={idx} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-300 font-medium truncate max-w-xs">{item.title}</span>
                                  <span className="text-white font-semibold">{formatPrice(item.revenue)}</span>
                                </div>
                                <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                                  <div 
                                    className="bg-red-650 h-full rounded-full transition-all duration-1000" 
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-10 text-gray-550 text-sm">
                            Chưa có dữ liệu giao dịch đặt vé trực tuyến.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Info */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
                      <h3 className="text-white font-bold mb-4">Hoạt Động Gần Đây</h3>
                      <div className="space-y-4 max-h-72 overflow-y-auto">
                        {ticketsList.length > 0 ? (
                          ticketsList.slice(0, 5).map((t, idx) => (
                            <div key={idx} className="flex gap-3 text-xs border-b border-zinc-800 pb-3 last:border-0 last:pb-0">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-bold ${
                                t.status === "used" ? "bg-zinc-800 text-gray-500" : "bg-red-950 text-red-400"
                              }`}>
                                Ticket
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-white font-medium truncate">{t.movieTitle}</p>
                                <p className="text-gray-400 mt-0.5">Mã: {t.id} • {t.seats.join(", ")}</p>
                                <p className="text-gray-550 mt-0.5">{t.bookedAt}</p>
                              </div>
                              <div className="text-right">
                                <span className="text-white font-bold">{formatPrice(t.totalPrice)}</span>
                                <span className={`block mt-1 text-[10px] ${
                                  t.status === "used" ? "text-gray-500" : "text-green-500"
                                }`}>
                                  {t.status === "used" ? "Đã dùng" : "Chưa dùng"}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-10 text-gray-550 text-sm">
                            Chưa có giao dịch gần đây.
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>
          )}

          {/* MOVIES TAB */}
          {!isStaff && activeTab === "movies" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">Quản Lý Phim</h1>
                <button
                  onClick={handleOpenAddMovie}
                  className="bg-red-600 hover:bg-red-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Thêm Phim Mới
                </button>
              </div>

              {/* Movies Table */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-300">
                    <thead className="bg-zinc-950 text-gray-400 uppercase text-xs border-b border-zinc-800">
                      <tr>
                        <th className="px-6 py-4">Phim</th>
                        <th className="px-6 py-4">Đạo diễn</th>
                        <th className="px-6 py-4">Thời lượng</th>
                        <th className="px-6 py-4">Trạng thái</th>
                        <th className="px-6 py-4">Điểm</th>
                        <th className="px-6 py-4 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {moviesList.map(movie => (
                        <tr key={movie.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 flex items-center gap-3">
                            <img src={movie.poster} alt={movie.title} className="w-10 h-14 object-cover rounded-lg flex-shrink-0 bg-zinc-800" />
                            <div>
                              <p className="text-white font-bold text-sm leading-snug">{movie.titleVi || movie.title}</p>
                              <p className="text-gray-500 text-xs mt-1 italic">{movie.title}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-300">{movie.director}</td>
                          <td className="px-6 py-4">{movie.duration} phút</td>
                          <td className="px-6 py-4">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                              movie.status === 'now_showing' 
                                ? 'bg-green-600/10 text-green-400 border border-green-500/20' 
                                : 'bg-amber-600/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {movie.status === 'now_showing' ? 'Đang Chiếu' : 'Sắp Chiếu'}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-yellow-400">★ {movie.score}</td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <button
                              onClick={() => handleOpenEditMovie(movie)}
                              className="text-blue-400 hover:text-blue-300 p-2 hover:bg-blue-900/10 rounded-lg transition-colors inline-block"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteMovie(movie.id)}
                              className="text-red-400 hover:text-red-300 p-2 hover:bg-red-900/10 rounded-lg transition-colors inline-block"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SHOWTIMES TAB */}
          {!isStaff && activeTab === "showtimes" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">Quản Lý Suất Chiếu</h1>
                <button
                  onClick={handleOpenAddShowtime}
                  className="bg-red-600 hover:bg-red-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Tạo Suất Chiếu
                </button>
              </div>

              {/* Showtimes Table */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-300">
                    <thead className="bg-zinc-950 text-gray-400 uppercase text-xs border-b border-zinc-800">
                      <tr>
                        <th className="px-6 py-4">Phim</th>
                        <th className="px-6 py-4">Rạp</th>
                        <th className="px-6 py-4">Phòng</th>
                        <th className="px-6 py-4">Thời gian</th>
                        <th className="px-6 py-4">Định dạng</th>
                        <th className="px-6 py-4">Ghế trống</th>
                        <th className="px-6 py-4 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {showtimesList.map(showtime => {
                        const movie = moviesList.find(m => m.id === showtime.movieId);
                        const cinema = cinemas.find(c => c.id === showtime.cinemaId);
                        return (
                          <tr key={showtime.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 text-white font-semibold">
                              {movie ? (movie.titleVi || movie.title) : `Movie #${showtime.movieId}`}
                            </td>
                            <td className="px-6 py-4 flex items-center gap-1.5 text-gray-300">
                              <MapPin className="w-3.5 h-3.5 text-red-500" />
                              {cinema ? cinema.name : `Cinema #${showtime.cinemaId}`}
                            </td>
                            <td className="px-6 py-4">{showtime.hall}</td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="text-white font-semibold flex items-center gap-1"><Clock className="w-3 h-3 text-red-400" /> {showtime.time}</span>
                                <span className="text-gray-500 text-xs mt-0.5">{showtime.date}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="bg-zinc-800 text-gray-300 text-xs font-bold px-2 py-0.5 rounded border border-zinc-700 uppercase">
                                {showtime.type}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-semibold text-zinc-400">
                              {showtime.availableSeats} / {showtime.totalSeats}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => handleDeleteShowtime(showtime.id)}
                                className="text-red-400 hover:text-red-300 p-2 hover:bg-red-900/10 rounded-lg transition-colors inline-block"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TICKET SCANNER & STAFF VIEW */}
          {activeTab === "tickets" && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold text-white">{isStaff ? "Kiểm tra mã vé QR" : "Soát Vé & Giao Dịch"}</h1>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Simulated Scanner (Left) */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
                  <div>
                    <h3 className="text-white font-bold text-lg">Thiết Bị Quét Mã QR</h3>
                    <p className="text-gray-500 text-xs leading-relaxed mt-1">
                      Nhập mã đặt vé in trên vé của khách hàng hoặc giả lập quét mã QR để kiểm tra tính hợp lệ.
                    </p>
                  </div>

                  {/* Selector to switch manual and QR code scanner */}
                  <div className="flex gap-2 p-1 bg-zinc-950 border border-zinc-800 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setIsScanningMode(false);
                        stopWebcam();
                      }}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                        !isScanningMode 
                          ? "bg-zinc-800 text-white shadow"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      Nhập Mã Thủ Công
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsScanningMode(true);
                        setScanTab('simulate'); // Default to simulator tab for ease of test
                      }}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                        isScanningMode 
                          ? "bg-red-650 text-white shadow-lg shadow-red-600/10"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      Giả Lập & Quét QR Code
                    </button>
                  </div>

                  {!isScanningMode ? (
                    <form onSubmit={handleSearchTicket} className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          type="text"
                          value={searchTicketQuery}
                          onChange={(e) => setSearchTicketQuery(e.target.value)}
                          placeholder="Nhập mã đặt vé (ví dụ: CNSABC)"
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all text-sm font-mono uppercase"
                        />
                      </div>
                      <button
                        type="submit"
                        className="bg-red-600 hover:bg-red-500 text-white font-semibold px-6 rounded-xl text-sm transition-colors"
                      >
                        Kiểm Tra
                      </button>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      {/* Tabs for scanning mode */}
                      <div className="flex border-b border-zinc-800 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setScanTab('simulate');
                            stopWebcam();
                          }}
                          className={`pb-2.5 px-4 font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                            scanTab === 'simulate' 
                              ? "border-red-500 text-red-400" 
                              : "border-transparent text-gray-500 hover:text-gray-300"
                          }`}
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          1. Quét Giả Lập (Không cần cam)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setScanTab('camera');
                            startWebcam();
                          }}
                          className={`pb-2.5 px-4 font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                            scanTab === 'camera' 
                              ? "border-red-500 text-red-400" 
                              : "border-transparent text-gray-500 hover:text-gray-300"
                          }`}
                        >
                          <Camera className="w-3.5 h-3.5" />
                          2. Quét bằng Webcam
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setScanTab('upload');
                            stopWebcam();
                          }}
                          className={`pb-2.5 px-4 font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                            scanTab === 'upload' 
                              ? "border-red-500 text-red-400" 
                              : "border-transparent text-gray-500 hover:text-gray-300"
                          }`}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          3. Tải ảnh QR lên
                        </button>
                      </div>

                      {/* Camera Scan Content */}
                      {scanTab === 'camera' && (
                        <div className="relative aspect-video bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800 flex flex-col items-center justify-center">
                          {webcamActive ? (
                            <>
                              <video 
                                ref={videoRef} 
                                className="w-full h-full object-cover" 
                                playsInline
                              />
                              {/* Overlay grid & scan lines */}
                              <div className="absolute inset-0 border-[30px] border-black/45 pointer-events-none flex items-center justify-center">
                                <div className="w-36 h-36 border-2 border-red-500/50 relative flex items-center justify-center">
                                  {/* Neon Corners */}
                                  <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-red-500 -mt-[2px] -ml-[2px]"></div>
                                  <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-red-500 -mt-[2px] -mr-[2px]"></div>
                                  <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-red-500 -mb-[2px] -ml-[2px]"></div>
                                  <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-red-500 -mb-[2px] -mr-[2px]"></div>
                                  
                                  {/* Scanning Laser Line */}
                                  <div className="absolute w-full h-[2px] bg-red-500 shadow-md shadow-red-500 animate-pulse top-0" style={{ animation: 'scan 2.5s infinite ease-in-out' }}></div>
                                </div>
                              </div>
                              {isFlash && (
                                <div className="absolute inset-0 bg-white animate-[fadeOut_0.3s_ease-out] pointer-events-none" />
                              )}
                              <button 
                                type="button" 
                                onClick={stopWebcam}
                                className="absolute bottom-2 right-2 bg-black/70 hover:bg-black/90 text-white rounded-lg px-2.5 py-1 text-[10px] font-semibold flex items-center gap-1 border border-zinc-800 cursor-pointer"
                              >
                                <X className="w-3 h-3" /> Tắt Camera
                              </button>
                            </>
                          ) : (
                            <div className="p-4 text-center space-y-2">
                              <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-gray-550">
                                <Camera className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="text-white text-xs font-semibold">Camera chưa kích hoạt</p>
                                <p className="text-gray-500 text-[10px] mt-0.5">Cho phép quyền truy cập camera để quét mã QR từ điện thoại.</p>
                              </div>
                              <button
                                type="button"
                                onClick={startWebcam}
                                className="bg-red-650 hover:bg-red-600 text-white text-xs font-semibold px-4 py-1.5 rounded-xl transition-all cursor-pointer inline-block"
                              >
                                Bật Camera Quét
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* File Scan Content */}
                      {scanTab === 'upload' && (
                        <div className="border-2 border-dashed border-zinc-800 bg-zinc-950/30 hover:bg-zinc-950/60 rounded-xl p-6 transition-colors text-center">
                          <label className="cursor-pointer block space-y-3">
                            <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-gray-555">
                              <Upload className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-white text-xs font-semibold">Tải lên ảnh QR đặt vé</p>
                              <p className="text-gray-500 text-[10px] mt-0.5">Hệ thống sẽ tự động quét và giải mã QR từ tệp ảnh.</p>
                            </div>
                            <span className="inline-block bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors border border-zinc-755 cursor-pointer">
                              Chọn file ảnh QR
                            </span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={handleFileUpload} 
                              className="hidden" 
                            />
                          </label>
                        </div>
                      )}

                      {/* Simulate Scan Content */}
                      {scanTab === 'simulate' && (
                        <div className="space-y-3">
                          <p className="text-gray-400 text-[10px] leading-relaxed italic">
                            Chọn nhanh một vé bất kỳ bên dưới để giả lập hành động quét mã QR (hệ thống sẽ phát âm thanh bíp và tải vé tự động):
                          </p>
                          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                            {ticketsList.length > 0 ? (
                              ticketsList.slice(0, 5).map((ticket, i) => (
                                <div 
                                  key={i} 
                                  className="flex items-center justify-between p-2 bg-zinc-950 border border-zinc-850 rounded-xl hover:border-red-500/40 transition-colors text-xs"
                                >
                                  <div className="min-w-0 flex-1 pr-2">
                                    <p className="text-white font-bold truncate">{ticket.movieTitle}</p>
                                    <p className="text-gray-500 text-[10px] mt-0.5">
                                      Mã: <span className="font-mono text-zinc-300">{ticket.id}</span> • Ghế: {ticket.seats.join(", ")}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleSimulatedScan(ticket.id)}
                                    className="bg-red-600/10 hover:bg-red-650 hover:text-white text-red-400 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-red-500/20 transition-all flex items-center gap-1 cursor-pointer flex-shrink-0"
                                  >
                                    <QrCode className="w-3 h-3" />
                                    Mô phỏng Quét
                                  </button>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-4 text-gray-500 text-xs">
                                Chưa có vé nào trong cơ sở dữ liệu để giả lập quét.
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Inject scanner animations style inline */}
                      <style>{`
                        @keyframes scan {
                          0%, 100% { top: 0%; }
                          50% { top: 100%; }
                        }
                        @keyframes fadeOut {
                          0% { opacity: 1; }
                          100% { opacity: 0; }
                        }
                      `}</style>
                    </div>
                  )}

                  {ticketSearchError && (
                    <div className="p-4 bg-red-600/10 border border-red-500/20 rounded-xl flex gap-3 text-red-400">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <p className="text-sm font-medium">{ticketSearchError}</p>
                    </div>
                  )}

                  {searchTicketResult && (
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-4">
                      <div className="flex justify-between items-start border-b border-zinc-800 pb-3">
                        <div>
                          <h4 className="text-white font-bold text-base leading-tight">{searchTicketResult.movieTitle}</h4>
                          <p className="text-gray-400 text-xs mt-1.5">{searchTicketResult.cinemaName} • {searchTicketResult.hall}</p>
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                          searchTicketResult.status === "used" 
                            ? "bg-zinc-800 text-gray-500 border-zinc-700" 
                            : searchTicketResult.status === "cancelled"
                            ? "bg-red-950/20 text-red-500 border-red-500/20"
                            : "bg-green-600/10 text-green-400 border-green-500/20"
                        }`}>
                          {searchTicketResult.status === "used" ? "Đã dùng" : searchTicketResult.status === "cancelled" ? "Đã hủy" : "Hợp lệ"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                        <div>
                          <span className="text-gray-500">Mã đặt vé:</span>
                          <p className="text-white font-mono font-bold mt-0.5">{searchTicketResult.id}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Thời gian chiếu:</span>
                          <p className="text-white font-semibold mt-0.5">{searchTicketResult.showtimeTime} - {searchTicketResult.showtimeDate}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Số ghế đặt:</span>
                          <p className="text-red-400 font-bold mt-0.5 text-sm">{searchTicketResult.seats.join(", ")}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Giá thanh toán:</span>
                          <p className="text-white font-semibold mt-0.5">{formatPrice(searchTicketResult.totalPrice)}</p>
                        </div>
                      </div>

                      {searchTicketResult.status === "cancelled" ? (
                        <div className="text-center py-2.5 text-red-400 text-xs font-bold bg-red-950/20 rounded-xl border border-red-500/20">
                          Vé này đã bị hủy và hoàn trả ghế.
                        </div>
                      ) : (
                        <div className="space-y-2 pt-2 border-t border-zinc-900">
                          {searchTicketResult.status === "valid" ? (
                            <button
                              onClick={() => handleCheckIn(searchTicketResult.id)}
                              className="w-full bg-green-650 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-green-600/10 cursor-pointer"
                            >
                              <Check className="w-4 h-4" />
                              Xác Nhận Soát Vé (Cho Vào Rạp)
                            </button>
                          ) : (
                            <div className="text-center py-2.5 text-gray-550 text-xs font-semibold bg-zinc-900 rounded-xl border border-zinc-800/50 mb-2">
                              Vé này đã được check-in lúc {searchTicketResult.bookedAt}
                            </div>
                          )}
                          <button
                            onClick={() => handleCancelTicket(searchTicketResult.id)}
                            className="w-full bg-red-650/20 hover:bg-red-650 text-red-400 hover:text-white font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-xs border border-red-750/30 hover:border-red-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Hủy Vé & Hoàn Trả Ghế
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Transactions list (Right) */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 flex flex-col min-h-[400px]">
                  <h3 className="text-white font-bold text-lg">{isStaff ? "Vé Đã Bán Gần Đây" : "Danh Sách Vé Mới Đặt"}</h3>
                  <div className="flex-1 overflow-y-auto space-y-3 max-h-[350px]">
                    {ticketsList.length > 0 ? (
                      ticketsList.map((t, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => {
                            setSearchTicketQuery(t.id);
                            setSearchTicketResult(t);
                            setTicketSearchError("");
                          }}
                          className={`p-3 bg-zinc-950 border rounded-xl hover:border-red-500 transition-colors flex justify-between items-center cursor-pointer ${
                            searchTicketResult?.id === t.id ? "border-red-500" : "border-zinc-800"
                          }`}
                        >
                          <div>
                            <p className="text-white font-bold text-sm truncate max-w-xs">{t.movieTitle}</p>
                            <p className="text-gray-400 text-xs mt-1">Mã: <span className="font-mono">{t.id}</span> • Ghế: {t.seats.join(", ")}</p>
                          </div>
                          <div className="text-right flex flex-col items-end gap-1">
                            <span className="text-white font-bold text-sm">{formatPrice(t.totalPrice)}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              t.status === "used" 
                                ? "bg-zinc-800 text-gray-500 border-zinc-700" 
                                : t.status === "cancelled"
                                ? "bg-red-950/20 text-red-500 border-red-500/20"
                                : "bg-green-600/10 text-green-400 border-green-500/20"
                            }`}>
                              {t.status === "used" ? "Đã dùng" : t.status === "cancelled" ? "Đã hủy" : "Chưa dùng"}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 text-gray-500 text-sm">
                        Chưa có vé nào được đặt trên hệ thống.
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* SALES TAB (BÁN VÉ TẠI QUẦY) */}
          {activeTab === "sales" && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Ticket className="w-6 h-6 text-red-500" />
                Bán Vé Trực Tiếp Tại Quầy
              </h1>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left & Middle: Lịch chiếu & Sơ đồ ghế */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Tra cứu lịch chiếu */}
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
                    <h3 className="text-white font-bold text-base flex items-center gap-2">
                      <span className="w-1.5 h-4 bg-red-600 rounded-full" />
                      1. Tra cứu Lịch chiếu
                    </h3>
                    
                    {/* Visual Movie Selector with Search */}
                    {(() => {
                      const filteredSalesMovies = moviesList
                        .filter(m => m.status === "now_showing")
                        .filter(m => {
                          const term = salesMovieSearchQuery.toLowerCase().trim();
                          if (!term) return true;
                          return (m.titleVi || m.title).toLowerCase().includes(term) || m.title.toLowerCase().includes(term);
                        });

                      return (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider">
                              Chọn Phim ({filteredSalesMovies.length})
                            </label>
                            <div className="relative w-48">
                              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                              <input
                                type="text"
                                value={salesMovieSearchQuery}
                                onChange={(e) => setSalesMovieSearchQuery(e.target.value)}
                                placeholder="Tìm tên phim..."
                                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl pl-8 pr-3 py-1.5 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-red-500"
                              />
                            </div>
                          </div>

                          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                            {filteredSalesMovies.length === 0 ? (
                              <div className="text-center py-6 text-gray-500 text-xs italic w-full bg-zinc-950/40 rounded-xl border border-dashed border-zinc-850">
                                Không tìm thấy phim nào phù hợp.
                              </div>
                            ) : (
                              filteredSalesMovies.map(m => {
                                const isSelected = selectedSalesMovie?.id === m.id;
                                return (
                                  <div
                                    key={m.id}
                                    onClick={() => {
                                      setSelectedSalesMovie(isSelected ? null : m);
                                      setSelectedSalesShowtime(null);
                                      setSalesSelectedSeats([]);
                                    }}
                                    className={`w-28 flex-shrink-0 cursor-pointer group relative bg-zinc-950 border rounded-xl overflow-hidden p-1.5 transition-all hover:scale-102 ${
                                      isSelected 
                                        ? "border-red-500 bg-red-950/5 ring-1 ring-red-500/30" 
                                        : "border-zinc-850 hover:border-zinc-700 bg-zinc-950"
                                    }`}
                                  >
                                    <div className="relative h-28 rounded-lg overflow-hidden bg-zinc-900">
                                      <img 
                                        src={m.poster} 
                                        alt={m.title} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                      />
                                      <span className="absolute top-1 left-1 bg-black/60 text-white font-extrabold text-[8px] px-1 py-0.5 rounded border border-white/10 uppercase">
                                        {m.rating}
                                      </span>
                                      {isSelected && (
                                        <div className="absolute inset-0 bg-red-650/10 flex items-center justify-center backdrop-blur-[1px]">
                                          <span className="bg-red-600 text-white p-1 rounded-full shadow">
                                            <Check className="w-3.5 h-3.5" />
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="mt-1.5 px-0.5">
                                      <p className="text-[10px] text-white font-bold leading-tight line-clamp-2" title={m.titleVi || m.title}>
                                        {m.titleVi || m.title}
                                      </p>
                                      <p className="text-[9px] text-gray-500 truncate mt-0.5 font-sans">{m.duration} phút</p>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-zinc-850/50">
                      {/* Chọn rạp */}
                      <div>
                        <label className="block text-gray-400 text-xs font-semibold uppercase mb-1.5 font-sans">Chọn Rạp</label>
                        <select
                          value={selectedSalesCinema?.id || ""}
                          onChange={(e) => {
                            const cinema = cinemas.find(c => c.id === Number(e.target.value)) || null;
                            setSelectedSalesCinema(cinema);
                            setSelectedSalesShowtime(null);
                            setSalesSelectedSeats([]);
                          }}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-red-500 font-sans"
                        >
                          {cinemas.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Chọn ngày */}
                      <div>
                        <label className="block text-gray-400 text-xs font-semibold uppercase mb-1.5 font-sans">Chọn Ngày Chiếu</label>
                        <input
                          type="date"
                          value={selectedSalesDate}
                          onChange={(e) => {
                            setSelectedSalesDate(e.target.value);
                            setSelectedSalesShowtime(null);
                            setSalesSelectedSeats([]);
                          }}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 font-sans"
                        />
                      </div>
                    </div>

                    {/* Danh sách suất chiếu */}
                    {selectedSalesMovie && selectedSalesCinema && (
                      <div className="pt-2">
                        <label className="block text-gray-400 text-xs font-semibold uppercase mb-2">Suất chiếu khả dụng</label>
                        {(() => {
                          const showtimes = showtimesList.filter(
                            s => s.movieId === selectedSalesMovie.id &&
                                 s.cinemaId === selectedSalesCinema.id &&
                                 s.date === selectedSalesDate
                          );
                          if (showtimes.length === 0) {
                            return (
                              <p className="text-gray-550 text-sm italic py-2">Không tìm thấy suất chiếu nào phù hợp.</p>
                            );
                          }
                          return (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              {showtimes.map(st => (
                                <button
                                  key={st.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedSalesShowtime(st);
                                    setSalesSelectedSeats([]);
                                  }}
                                  className={`p-3 rounded-xl border text-left transition-all ${
                                    selectedSalesShowtime?.id === st.id
                                      ? "bg-red-600/10 border-red-500 shadow-md shadow-red-500/5"
                                      : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-white font-bold text-base">{st.time}</span>
                                    <span className="text-[10px] bg-zinc-850 px-1.5 py-0.5 rounded text-gray-450 border border-zinc-750 font-bold uppercase">{st.type}</span>
                                  </div>
                                  <div className="flex justify-between items-center mt-2 text-[10px] text-gray-500 font-medium">
                                    <span>{st.hall}</span>
                                    <span>Trống: {st.availableSeats} ghế</span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Sơ đồ ghế */}
                  {selectedSalesShowtime && selectedSalesMovie && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-white font-bold text-base flex items-center gap-2 font-sans">
                          <span className="w-1.5 h-4 bg-red-600 rounded-full" />
                          2. Sơ Đồ Chọn Ghế ({selectedSalesShowtime.hall})
                        </h3>
                        <span className="text-xs text-gray-500">
                          Định dạng: <strong className="text-red-400 uppercase font-sans">{selectedSalesShowtime.type}</strong>
                        </span>
                      </div>

                      {/* Màn hình */}
                      <div className="flex flex-col items-center">
                        <div className="w-full max-w-md h-2 bg-gradient-to-b from-red-500/40 to-transparent rounded-full mb-1" />
                        <div className="flex items-center gap-1.5 text-gray-600 text-[10px] uppercase font-bold tracking-wider font-sans">
                          <Monitor className="w-3 h-3" />
                          Màn hình chiếu
                        </div>
                      </div>

                      {/* Sơ đồ ghế */}
                      <div className="overflow-x-auto py-2">
                        <div className="flex flex-col gap-1.5 items-center min-w-fit">
                          {(() => {
                            const rows = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
                            const cols = Array.from({ length: 12 }, (_, i) => i + 1);
                            
                            // Lấy danh sách ghế đã bán cho suất chiếu này
                            const soldSeatsForShowtime = new Set<string>();
                            ticketsList
                              .filter(t => 
                                t.movieId === selectedSalesMovie.id &&
                                t.cinemaName === selectedSalesCinema?.name &&
                                t.showtimeDate === selectedSalesShowtime.date &&
                                t.showtimeTime === selectedSalesShowtime.time &&
                                t.hall === selectedSalesShowtime.hall
                              )
                              .forEach(t => t.seats.forEach(s => soldSeatsForShowtime.add(s)));

                            // Ghế đã bán mặc định để sinh động
                            const mockSold = new Set(["B5", "B6", "D4", "D5", "F7", "F8", "G3", "H10", "H11"]);
                            
                            return rows.map(row => {
                              const vipRows = new Set(["F", "G", "H"]);
                              const coupleRow = "J";
                              
                              return (
                                <div key={row} className="flex items-center gap-1.5">
                                  <span className="w-5 text-center text-gray-600 text-xs font-mono font-bold">{row}</span>
                                  <div className="flex gap-1.5">
                                    {cols.map(col => {
                                      const seatId = `${row}${col}`;
                                      const isSold = soldSeatsForShowtime.has(seatId) || mockSold.has(seatId);
                                      const isSelected = salesSelectedSeats.includes(seatId);
                                      
                                      let seatType: "standard" | "vip" | "couple" = "standard";
                                      if (row === coupleRow) seatType = "couple";
                                      else if (vipRows.has(row)) seatType = "vip";

                                      let btnClass = "w-7 h-7 rounded-t text-[10px] font-bold border border-b-2 transition-all flex items-center justify-center cursor-pointer select-none ";
                                      if (isSold) {
                                        btnClass += "bg-zinc-800 border-zinc-700 text-zinc-650 cursor-not-allowed";
                                      } else if (isSelected) {
                                        if (seatType === "vip") btnClass += "bg-amber-500 border-amber-400 border-b-amber-300 text-white scale-105 shadow-md shadow-amber-500/25";
                                        else if (seatType === "couple") btnClass += "bg-rose-600 border-rose-500 border-b-rose-400 text-white scale-105 shadow-md shadow-rose-600/25";
                                        else btnClass += "bg-red-600 border-red-500 border-b-red-400 text-white scale-105 shadow-md shadow-red-600/25";
                                      } else {
                                        if (seatType === "vip") btnClass += "bg-amber-700/50 border-amber-600/70 border-b-amber-600 text-amber-250 hover:bg-amber-650 hover:scale-105";
                                        else if (seatType === "couple") btnClass += "bg-rose-800/40 border-rose-700/60 border-b-rose-600 text-rose-250 hover:bg-rose-750 hover:scale-105";
                                        else btnClass += "bg-slate-700 border-slate-500 border-b-slate-400 text-slate-300 hover:bg-slate-650 hover:scale-105";
                                      }

                                      return (
                                        <button
                                          key={seatId}
                                          type="button"
                                          disabled={isSold}
                                          onClick={() => {
                                            if (salesSelectedSeats.includes(seatId)) {
                                              setSalesSelectedSeats(salesSelectedSeats.filter(s => s !== seatId));
                                            } else {
                                              setSalesSelectedSeats([...salesSelectedSeats, seatId]);
                                            }
                                          }}
                                          className={btnClass}
                                          title={`${seatId} (${seatType})`}
                                        >
                                          {col}
                                        </button>
                                      );
                                    })}
                                  </div>
                                  <span className="w-5 text-center text-gray-600 text-xs font-mono font-bold">{row}</span>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>

                      {/* Chú giải */}
                      <div className="flex flex-wrap gap-3 justify-center text-[10px] border-t border-zinc-800 pt-4 font-sans">
                        {[
                          { color: "bg-slate-700 border-slate-500", label: "Thường" },
                          { color: "bg-amber-700/50 border-amber-600", label: "VIP" },
                          { color: "bg-rose-800/40 border-rose-700", label: "Ghế đôi" },
                          { color: "bg-red-600 border-red-500", label: "Đang chọn" },
                          { color: "bg-zinc-800 border-zinc-700 text-zinc-650", label: "Đã bán" },
                        ].map((l, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <div className={`w-4 h-4 rounded-t border border-b-2 ${l.color}`} />
                            <span className="text-gray-400">{l.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Thanh toán quầy */}
                <div className="space-y-6">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-5 sticky top-24">
                    <h3 className="text-white font-bold text-base flex items-center gap-2">
                      <span className="w-1.5 h-4 bg-red-600 rounded-full" />
                      3. Thanh Toán Tại Quầy
                    </h3>

                    {/* Tóm tắt vé */}
                    {selectedSalesMovie && selectedSalesShowtime ? (
                      <div className="space-y-3 bg-zinc-950 p-4 border border-zinc-850 rounded-xl">
                        <div className="flex gap-2">
                          <img
                            src={selectedSalesMovie.poster}
                            alt={selectedSalesMovie.title}
                            className="w-12 h-16 object-cover rounded-lg bg-zinc-900 flex-shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <h4 className="text-white font-bold text-sm truncate font-sans">{selectedSalesMovie.titleVi || selectedSalesMovie.title}</h4>
                            <p className="text-gray-500 text-xs mt-1 truncate font-sans">{selectedSalesCinema?.name}</p>
                            <p className="text-red-400 text-xs mt-0.5 font-semibold font-sans">
                              {selectedSalesShowtime.time} • {selectedSalesShowtime.date}
                            </p>
                          </div>
                        </div>

                        <div className="border-t border-zinc-855 pt-2 space-y-1.5 text-xs text-gray-400 font-medium font-sans">
                          <div className="flex justify-between">
                            <span>Phòng chiếu:</span>
                            <span className="text-white font-semibold">{selectedSalesShowtime.hall}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Ghế chọn:</span>
                            <span className="text-red-400 font-bold truncate max-w-[150px]">
                              {salesSelectedSeats.length > 0 ? salesSelectedSeats.join(", ") : "Chưa chọn"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-500 text-xs italic bg-zinc-950 rounded-xl border border-zinc-850 font-sans">
                        Vui lòng tra cứu suất chiếu để thanh toán.
                      </div>
                    )}

                    {/* Form thông tin Khách hàng */}
                    <div className="space-y-3 pt-1">
                      <div>
                        <label className="block text-gray-400 text-xs font-semibold mb-1 font-sans">Tên khách hàng (Tùy chọn)</label>
                        <input
                          type="text"
                          placeholder="Nhập tên khách hàng"
                          value={salesCustomerName}
                          onChange={(e) => setSalesCustomerName(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-red-500 font-sans"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-400 text-xs font-semibold mb-1 font-sans">Hình thức thanh toán</label>
                        <select
                          value={salesPaymentMethod}
                          onChange={(e) => {
                            setSalesPaymentMethod(e.target.value);
                            setCashReceived(0);
                            setIsTransferConfirming(false);
                          }}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-red-500 font-sans"
                        >
                          <option value="cash">Tiền mặt tại quầy</option>
                          <option value="card">Thẻ ngân hàng (POS)</option>
                          <option value="transfer">Chuyển khoản QR ngân hàng</option>
                        </select>
                      </div>
                    </div>

                    {/* Chi phí & Nút xác nhận */}
                    {(() => {
                      const basePrice = selectedSalesShowtime ? TICKET_PRICES[selectedSalesShowtime.type] : 0;
                      const vipMultiplier = 1.3;
                      const coupleMultiplier = 2.2;
                      
                      const total = salesSelectedSeats.reduce((sum, seat) => {
                        const row = seat[0];
                        if (["F", "G", "H"].includes(row)) return sum + basePrice * vipMultiplier;
                        if (row === "J") return sum + basePrice * coupleMultiplier;
                        return sum + basePrice;
                      }, 0);

                      const handleConfirmSales = () => {
                        if (!selectedSalesMovie || !selectedSalesShowtime || salesSelectedSeats.length === 0) return;
                        
                        const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
                        const ticketId = `CNS${rand}`;

                        const newTicket: BookedTicket = {
                          id: ticketId,
                          movieId: selectedSalesMovie.id,
                          movieTitle: selectedSalesMovie.titleVi || selectedSalesMovie.title,
                          moviePoster: selectedSalesMovie.poster,
                          cinemaName: selectedSalesCinema?.name || "CineStar Cinema",
                          showtimeDate: selectedSalesShowtime.date,
                          showtimeTime: selectedSalesShowtime.time,
                          hall: selectedSalesShowtime.hall,
                          seats: salesSelectedSeats,
                          totalPrice: total,
                          paymentMethod: salesPaymentMethod === "cash" 
                            ? "Tiền mặt tại quầy" 
                            : salesPaymentMethod === "card"
                            ? "Thẻ ngân hàng (POS)"
                            : "Chuyển khoản QR",
                          bookedAt: new Date().toISOString().replace("T", " ").substring(0, 16),
                          status: "used",
                          userEmail: "counter_sale@cinestar.vn",
                        };

                        const currentShowtimes = loadShowtimes();
                        const stIdx = currentShowtimes.findIndex(s => s.id === selectedSalesShowtime.id);
                        if (stIdx !== -1) {
                          currentShowtimes[stIdx].availableSeats = Math.max(0, currentShowtimes[stIdx].availableSeats - salesSelectedSeats.length);
                          saveShowtimes(currentShowtimes);
                        }

                        saveTicket(newTicket);
                        
                        setSalesSelectedSeats([]);
                        refreshDB();
                        setPrintedTicket(newTicket);
                        setCashReceived(0);
                        setIsTransferConfirming(false);
                      };

                      return (
                        <div className="space-y-4 pt-3 border-t border-zinc-800">
                          {/* Cash received calculator */}
                          {salesPaymentMethod === "cash" && selectedSalesShowtime && salesSelectedSeats.length > 0 && (
                            <div className="space-y-2.5 pt-1 text-xs">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-400 font-semibold font-sans">Tiền khách đưa:</span>
                                <div className="relative w-36">
                                  <input
                                    type="number"
                                    placeholder="0"
                                    value={cashReceived || ""}
                                    onChange={(e) => setCashReceived(Number(e.target.value))}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-white text-right font-mono font-bold text-xs focus:outline-none focus:border-red-500"
                                  />
                                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-[10px] font-bold">đ</span>
                                </div>
                              </div>
                              
                              <div className="flex flex-wrap gap-1.5 justify-end">
                                {[total, 50000, 100000, 200000, 500000].map((denom) => {
                                  if (denom < total && denom !== total) return null;
                                  return (
                                    <button
                                      key={denom}
                                      type="button"
                                      onClick={() => setCashReceived(denom)}
                                      className="bg-zinc-850 hover:bg-zinc-800 border border-zinc-800 text-[9px] font-bold text-gray-300 py-1 px-2 rounded hover:text-white transition-colors cursor-pointer"
                                    >
                                      {denom === total ? "Đủ tiền" : formatPrice(denom)}
                                    </button>
                                  );
                                })}
                              </div>

                              <div className="flex justify-between items-center pt-1">
                                <span className="text-gray-400 font-semibold font-sans">Tiền thừa trả khách:</span>
                                <span className={`font-mono font-extrabold text-sm ${cashReceived >= total ? "text-emerald-450" : "text-red-400"}`}>
                                  {cashReceived >= total ? formatPrice(cashReceived - total) : "Chưa đủ"}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Bank Transfer QR section */}
                          {salesPaymentMethod === "transfer" && selectedSalesShowtime && salesSelectedSeats.length > 0 && (
                            <div className="space-y-3 pt-1 border-t border-zinc-850/50 flex flex-col items-center">
                              <span className="text-[10px] text-zinc-400 font-semibold uppercase self-start">Quét QR chuyển khoản:</span>
                              
                              <div className="bg-white p-3 rounded-xl border border-zinc-300 flex flex-col items-center gap-1 shadow-md">
                                <div className="w-32 h-32 relative">
                                  <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=STK:190060769999|NH:MBBank|ND:CK CNS_POS|ST:${total}`}
                                    alt="Banking Transfer QR"
                                    className="w-full h-full object-contain"
                                  />
                                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-blue-900 border border-white rounded-md flex items-center justify-center text-[7px] text-white font-extrabold shadow">
                                    MB
                                  </div>
                                </div>
                                <span className="text-[8px] font-black text-blue-900 font-mono tracking-wide uppercase">MB Bank • CINESTAR</span>
                              </div>
                              
                              <div className="text-[10px] text-zinc-400 text-center leading-normal">
                                STK: <strong className="text-white">1900 6076 9999</strong><br />
                                Số tiền: <strong className="text-emerald-400">{formatPrice(total)}</strong><br />
                                Nội dung: <strong className="text-red-400 font-mono uppercase">CK CNS POS</strong>
                              </div>

                              <label className="flex items-center gap-2 cursor-pointer pt-1">
                                <input
                                  type="checkbox"
                                  checked={isTransferConfirming}
                                  onChange={(e) => setIsTransferConfirming(e.target.checked)}
                                  className="rounded border-zinc-800 bg-zinc-950 text-red-650 focus:ring-red-500/20"
                                />
                                <span className="text-[10px] text-gray-300 font-medium select-none">Khách đã chuyển khoản thành công</span>
                              </label>
                            </div>
                          )}

                          <div className="flex justify-between items-center font-sans pt-2 border-t border-zinc-850">
                            <span className="text-gray-400 text-xs font-semibold uppercase">Tổng chi phí:</span>
                            <span className="text-white font-extrabold text-xl">{formatPrice(total)}</span>
                          </div>
                          
                          <button
                            type="button"
                            disabled={
                              !selectedSalesShowtime || 
                              salesSelectedSeats.length === 0 ||
                              (salesPaymentMethod === "cash" && cashReceived < total) ||
                              (salesPaymentMethod === "transfer" && !isTransferConfirming)
                            }
                            onClick={handleConfirmSales}
                            className={`w-full font-bold py-3.5 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98] font-sans ${
                              selectedSalesShowtime && 
                              salesSelectedSeats.length > 0 &&
                              (salesPaymentMethod !== "cash" || cashReceived >= total) &&
                              (salesPaymentMethod !== "transfer" || isTransferConfirming)
                                ? "bg-emerald-650 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-600/10 cursor-pointer"
                                : "bg-zinc-800 text-gray-500 cursor-not-allowed border border-zinc-850"
                            }`}
                          >
                            <Check className="w-4 h-4" />
                            Xác Nhận & In Vé Giấy
                          </button>
                        </div>
                      );
                    })()}

                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ADD/EDIT MOVIE MODAL */}
      {showMovieModal && !isStaff && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
              <h3 className="text-white font-bold text-xl">{editingMovie ? "Chỉnh Sửa Phim" : "Thêm Phim Mới"}</h3>
              <button onClick={() => setShowMovieModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveMovie} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-gray-400 mb-1">Tên Tiếng Anh</label>
                <input 
                  type="text" required
                  value={movieForm.title || ""} 
                  onChange={e => setMovieForm({...movieForm, title: e.target.value})}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" 
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Tên Tiếng Việt</label>
                <input 
                  type="text" required
                  value={movieForm.titleVi || ""} 
                  onChange={e => setMovieForm({...movieForm, titleVi: e.target.value})}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" 
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Thể Loại (Cách nhau bởi dấu phẩy)</label>
                <input 
                  type="text" required
                  value={Array.isArray(movieForm.genre) ? movieForm.genre.join(", ") : movieForm.genre || ""} 
                  onChange={e => setMovieForm({...movieForm, genre: e.target.value as any})}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" 
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Thời Lượng (Phút)</label>
                <input 
                  type="number" required
                  value={movieForm.duration || ""} 
                  onChange={e => setMovieForm({...movieForm, duration: Number(e.target.value)})}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" 
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Đạo Diễn</label>
                <input 
                  type="text" required
                  value={movieForm.director || ""} 
                  onChange={e => setMovieForm({...movieForm, director: e.target.value})}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" 
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Diễn Viên (Cách nhau bởi dấu phẩy)</label>
                <input 
                  type="text" required
                  value={Array.isArray(movieForm.cast) ? movieForm.cast.join(", ") : movieForm.cast || ""} 
                  onChange={e => setMovieForm({...movieForm, cast: e.target.value as any})}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" 
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Ảnh Poster URL</label>
                <input 
                  type="text" required
                  value={movieForm.poster || ""} 
                  onChange={e => setMovieForm({...movieForm, poster: e.target.value})}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" 
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Ảnh Backdrop URL</label>
                <input 
                  type="text" required
                  value={movieForm.backdrop || ""} 
                  onChange={e => setMovieForm({...movieForm, backdrop: e.target.value})}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" 
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Trạng Thái</label>
                <select 
                  value={movieForm.status || "now_showing"}
                  onChange={e => setMovieForm({...movieForm, status: e.target.value as any})}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value="now_showing">Đang Chiếu (Now Showing)</option>
                  <option value="coming_soon">Sắp Chiếu (Coming Soon)</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Ngày Phát Hành</label>
                <input 
                  type="date" required
                  value={movieForm.releaseDate || ""} 
                  onChange={e => setMovieForm({...movieForm, releaseDate: e.target.value})}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" 
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-gray-400 mb-1">Mô Tả Phim</label>
                <textarea 
                  required rows={3}
                  value={movieForm.description || ""} 
                  onChange={e => setMovieForm({...movieForm, description: e.target.value})}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white resize-none" 
                />
              </div>

              <div className="sm:col-span-2 flex justify-end gap-2 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowMovieModal(false)}
                  className="px-4 py-2 bg-zinc-850 hover:bg-zinc-800 text-white rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-colors"
                >
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE SHOWTIME MODAL */}
      {showShowtimeModal && !isStaff && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
              <h3 className="text-white font-bold text-xl font-sans">Tạo Suất Chiếu Mới</h3>
              <button onClick={() => setShowShowtimeModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveShowtime} className="space-y-4 text-sm">
              <div>
                <label className="block text-gray-400 mb-1">Chọn Phim</label>
                <select
                  value={showtimeForm.movieId}
                  onChange={e => setShowtimeForm({...showtimeForm, movieId: Number(e.target.value)})}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                >
                  {moviesList.map(m => (
                    <option key={m.id} value={m.id}>{m.titleVi || m.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Chọn Rạp</label>
                <select
                  value={showtimeForm.cinemaId}
                  onChange={e => setShowtimeForm({...showtimeForm, cinemaId: Number(e.target.value)})}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                >
                  {cinemas.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.city})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 mb-1">Ngày Chiếu</label>
                  <input
                    type="date" required
                    value={showtimeForm.date}
                    onChange={e => setShowtimeForm({...showtimeForm, date: e.target.value})}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Giờ Chiếu</label>
                  <input
                    type="time" required
                    value={showtimeForm.time}
                    onChange={e => setShowtimeForm({...showtimeForm, time: e.target.value})}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 mb-1">Phòng Chiếu</label>
                  <input
                    type="text" required
                    value={showtimeForm.hall}
                    onChange={e => setShowtimeForm({...showtimeForm, hall: e.target.value})}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Tổng Số Ghế</label>
                  <input
                    type="number" required
                    value={showtimeForm.totalSeats}
                    onChange={e => setShowtimeForm({...showtimeForm, totalSeats: Number(e.target.value)})}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Định Dạng Suất Chiếu</label>
                <select
                  value={showtimeForm.type}
                  onChange={e => setShowtimeForm({...showtimeForm, type: e.target.value as any})}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white font-semibold"
                >
                  <option value="standard">Standard (Thường)</option>
                  <option value="4dx">4DX</option>
                  <option value="imax">IMAX</option>
                  <option value="sweetbox">Sweetbox</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowShowtimeModal(false)}
                  className="px-4 py-2 bg-zinc-850 hover:bg-zinc-800 text-white rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-colors"
                >
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* THERMAL PRINTED TICKET MODAL */}
      {printedTicket && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-sm my-8 flex flex-col items-center">
            {/* Thermal ticket container */}
            <div id="thermal-ticket-print" className="w-full bg-white text-zinc-950 p-6 rounded shadow-2xl font-mono text-xs border border-zinc-300 relative select-none">
              
              {/* Jagged borders for thermal receipt look */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-[radial-gradient(circle_at_bottom,_transparent_3px,_white_3px)] bg-[length:8px_8px] bg-repeat-x -translate-y-1" />
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[radial-gradient(circle_at_top,_transparent_3px,_white_3px)] bg-[length:8px_8px] bg-repeat-x translate-y-1" />

              {/* Ticket header */}
              <div className="text-center space-y-1.5 border-b-2 border-dashed border-zinc-400 pb-4">
                <h2 className="text-lg font-black tracking-widest text-zinc-900 font-mono">CINESTAR CINEMA</h2>
                <p className="text-[10px] text-zinc-600 leading-tight font-sans">
                  {printedTicket.cinemaName}<br />
                  Hotline: 1900 6076 • Website: cinestar.com.vn
                </p>
                <div className="bg-zinc-900 text-white font-bold text-xs py-1 px-3 inline-block rounded tracking-wider uppercase mt-1 font-sans">
                  VÉ XEM PHIM / TICKET
                </div>
              </div>

              {/* Show info */}
              <div className="py-4 border-b-2 border-dashed border-zinc-400 space-y-2">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block font-sans">Phim / Movie:</span>
                  <span className="text-sm font-extrabold text-zinc-900 font-sans block leading-tight">{printedTicket.movieTitle}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-zinc-900 pt-1">
                  <div>
                    <span className="text-[9px] text-zinc-500 uppercase block font-sans">Ngày / Date:</span>
                    <span className="font-bold">{printedTicket.showtimeDate}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-500 uppercase block font-sans">Giờ chiếu / Time:</span>
                    <span className="font-bold text-sm">{printedTicket.showtimeTime}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-500 uppercase block font-sans">Phòng / Hall:</span>
                    <span className="font-bold">{printedTicket.hall}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-500 uppercase block font-sans">Ghế / Seat:</span>
                    <span className="font-bold text-red-650 text-sm">{printedTicket.seats.join(", ")}</span>
                  </div>
                </div>
              </div>

              {/* Payment details */}
              <div className="py-4 border-b-2 border-dashed border-zinc-400 space-y-2 text-zinc-900">
                <div className="flex justify-between font-bold">
                  <span>Tổng tiền / Total:</span>
                  <span>{formatPrice(printedTicket.totalPrice)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-zinc-700">
                  <span>Thanh toán / Payment:</span>
                  <span>{printedTicket.paymentMethod}</span>
                </div>
                <div className="flex justify-between text-[9px] text-zinc-500">
                  <span>Thời gian / Time:</span>
                  <span>{printedTicket.bookedAt}</span>
                </div>
                <div className="flex justify-between text-[9px] text-zinc-500">
                  <span>Nhân viên / Staff:</span>
                  <span>{userRole === "staff" ? "staff@gmail.com" : "nguyennhutrung788@gmail.com"}</span>
                </div>
              </div>

              {/* Barcode & check-in QR */}
              <div className="pt-4 flex flex-col items-center justify-center space-y-2">
                <div className="w-24 h-24 bg-white p-1 border border-zinc-200">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=96x96&data=${printedTicket.id}`}
                    alt="Check-in QR"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-black tracking-widest text-zinc-800 font-mono">{printedTicket.id}</p>
                  <p className="text-[8px] text-zinc-500 font-sans mt-0.5">Vui lòng quét QR để vào phòng chiếu</p>
                </div>
              </div>
            </div>

            {/* Print and Close controls */}
            <div className="flex gap-3 mt-6 w-full justify-center">
              <button
                type="button"
                onClick={() => {
                  const printContent = document.getElementById("thermal-ticket-print");
                  if (printContent) {
                    const printWindow = window.open("", "_blank");
                    if (printWindow) {
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>In Vé Giấy CineStar - ${printedTicket.id}</title>
                            <style>
                              body {
                                margin: 0;
                                padding: 20px;
                                display: flex;
                                justify-content: center;
                                font-family: monospace;
                                background-color: white;
                                color: black;
                              }
                              #thermal-ticket-print {
                                width: 280px;
                                font-size: 11px;
                                line-height: 1.4;
                              }
                              .text-center { text-align: center; }
                              .text-sm { font-size: 12px; }
                              .text-lg { font-size: 16px; }
                              .font-bold { font-weight: bold; }
                              .font-black { font-weight: 900; }
                              .uppercase { text-transform: uppercase; }
                              .border-b-2 { border-bottom: 2px dashed #000; }
                              .pb-4 { padding-bottom: 16px; }
                              .py-4 { padding-top: 16px; padding-bottom: 16px; }
                              .grid { display: grid; }
                              .grid-cols-2 { grid-template-columns: 1fr 1fr; }
                              .gap-2 { gap: 8px; }
                              .pt-1 { padding-top: 4px; }
                              .pt-4 { padding-top: 16px; }
                              .flex { display: flex; }
                              .flex-col { flex-direction: column; }
                              .items-center { align-items: center; }
                              .justify-between { justify-content: space-between; }
                              .bg-zinc-900 { background: #000; color: #fff; }
                              .py-1 { padding-top: 4px; padding-bottom: 4px; }
                              .px-3 { padding-left: 12px; padding-right: 12px; }
                              .inline-block { display: inline-block; }
                              .rounded { border-radius: 4px; }
                              .tracking-widest { tracking-spacing: 0.1em; }
                              .mt-1 { margin-top: 4px; }
                              .mt-2 { margin-top: 8px; }
                              .w-24 { width: 96px; }
                              .h-24 { height: 96px; }
                              .border { border: 1px solid #000; }
                              .p-1 { padding: 4px; }
                              .text-red-600 { color: #000; font-weight: bold; }
                              @media print {
                                body { padding: 0; }
                                #thermal-ticket-print { width: 100%; }
                              }
                            </style>
                          </head>
                          <body onload="window.print(); window.close();">
                            <div id="thermal-ticket-print">
                              \${printContent.innerHTML}
                            </div>
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                    }
                  }
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-md shadow-emerald-600/10 flex items-center gap-1.5 cursor-pointer animate-pulse"
              >
                <Printer className="w-3.5 h-3.5" /> In Vé Ngay
              </button>

              <button
                type="button"
                onClick={() => downloadQRCode(printedTicket)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5" /> Tải QR
              </button>

              <button
                type="button"
                onClick={() => downloadReceiptTxt(printedTicket)}
                className="bg-zinc-700 hover:bg-zinc-650 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Ticket className="w-3.5 h-3.5" /> Tải Biên Lai
              </button>

              <button
                type="button"
                onClick={() => setPrintedTicket(null)}
                className="bg-zinc-850 hover:bg-zinc-800 border border-zinc-800 text-gray-300 hover:text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all cursor-pointer"
              >
                Hoàn Tất
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function StatCard({ icon, label, value, desc, bg }: { icon: React.ReactNode; label: string; value: string; desc: string; bg: string }) {
  return (
    <div className={`border rounded-2xl p-5 space-y-2 bg-zinc-900 border-zinc-800`}>
      <div className="flex justify-between items-center">
        <span className="text-gray-400 text-xs font-semibold uppercase">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bg}`}>
          {icon}
        </div>
      </div>
      <p className="text-white font-bold text-2xl tracking-tight">{value}</p>
      <span className="text-[11px] text-gray-500 font-medium block">{desc}</span>
    </div>
  );
}
