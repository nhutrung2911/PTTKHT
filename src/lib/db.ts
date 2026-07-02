import { movies as staticMovies, showtimes as staticShowtimes } from "../data/movies";
import type { Movie, Showtime } from "../data/movies";

export interface BookedTicket {
  id: string;
  movieId: number;
  movieTitle: string;
  moviePoster: string;
  cinemaName: string;
  showtimeDate: string;
  showtimeTime: string;
  hall: string;
  seats: string[];
  totalPrice: number;
  paymentMethod: string;
  bookedAt: string;
  status: 'valid' | 'used' | 'cancelled';
  userEmail: string | null;
  combos?: { name: string; quantity: number; price: number }[];
}

export function initializeDB() {
  const now = new Date();
  const todayStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split("T")[0];

  if (!localStorage.getItem("movies_db")) {
    localStorage.setItem("movies_db", JSON.stringify(staticMovies));
  }
  
  if (!localStorage.getItem("showtimes_db")) {
    const allShowtimes: Showtime[] = [];
    let idCounter = 1;
    for (let i = 0; i < 7; i++) {
      const d = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      const localTime = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
      const dateStr = localTime.toISOString().split("T")[0];
      
      staticShowtimes.forEach(s => {
        allShowtimes.push({
          ...s,
          id: idCounter++,
          date: dateStr
        });
      });
    }
    localStorage.setItem("showtimes_db", JSON.stringify(allShowtimes));
  } else {
    try {
      const current = JSON.parse(localStorage.getItem("showtimes_db") || "[]");
      // Filter out past showtimes and keep today & future ones
      const futureOrTodayShowtimes = current.filter((s: any) => s.date >= todayStr);
      
      // Ensure showtimes exist for all of the next 7 days
      const existingDates = new Set(futureOrTodayShowtimes.map((s: any) => s.date));
      const newShowtimes = [...futureOrTodayShowtimes];
      let maxId = newShowtimes.reduce((max, s) => Math.max(max, s.id), 0);
      let changed = current.length !== futureOrTodayShowtimes.length;
      
      for (let i = 0; i < 7; i++) {
        const d = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
        const localTime = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
        const dateStr = localTime.toISOString().split("T")[0];
        
        if (!existingDates.has(dateStr)) {
          staticShowtimes.forEach(s => {
            maxId++;
            newShowtimes.push({
              ...s,
              id: maxId,
              date: dateStr
            });
          });
          changed = true;
        }
      }
      if (changed) {
        localStorage.setItem("showtimes_db", JSON.stringify(newShowtimes));
      }
    } catch (e) {
      console.error(e);
    }
  }

  if (!localStorage.getItem("tickets_db")) {
    localStorage.setItem("tickets_db", JSON.stringify([]));
  }
}

export function loadMovies(): Movie[] {
  initializeDB();
  try {
    return JSON.parse(localStorage.getItem("movies_db") || "[]");
  } catch {
    return staticMovies;
  }
}

export function saveMovies(movies: Movie[]) {
  localStorage.setItem("movies_db", JSON.stringify(movies));
}

export function loadShowtimes(): Showtime[] {
  initializeDB();
  try {
    return JSON.parse(localStorage.getItem("showtimes_db") || "[]");
  } catch {
    return staticShowtimes;
  }
}

export function saveShowtimes(showtimes: Showtime[]) {
  localStorage.setItem("showtimes_db", JSON.stringify(showtimes));
}

export function loadTickets(): BookedTicket[] {
  initializeDB();
  try {
    return JSON.parse(localStorage.getItem("tickets_db") || "[]");
  } catch {
    return [];
  }
}

export function saveTicket(ticket: BookedTicket) {
  const tickets = loadTickets();
  tickets.unshift(ticket); // Add new ticket to the beginning
  localStorage.setItem("tickets_db", JSON.stringify(tickets));
}

export function updateTicketStatus(id: string, status: 'valid' | 'used' | 'cancelled'): boolean {
  const tickets = loadTickets();
  const index = tickets.findIndex(t => t.id === id);
  if (index !== -1) {
    tickets[index].status = status;
    localStorage.setItem("tickets_db", JSON.stringify(tickets));
    return true;
  }
  return false;
}
