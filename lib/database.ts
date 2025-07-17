// Simulación de base de datos en memoria
interface Team {
  id: number
  name: string
  category: string
  captain_name: string
  captain_phone: string
  captain_email: string
  coach_name?: string
  type: string
  color1: string
  color2: string
  status: string
}

interface Player {
  id: number
  name: string
  team_id: number
  position: string
  jersey_number: number
  birth_date: string
  phone?: string
  email?: string
  status: string
  team?: { name: string; category: string }
}

interface Game {
  id: number
  home_team: string
  away_team: string
  home_score?: number
  away_score?: number
  date: string
  time: string
  venue: string
  field: string
  category: string
  status: string
  referee?: string
}

interface Payment {
  id: number
  type: string
  amount: number
  date: string
  status: string
  beneficiary_name: string
}

interface Staff {
  id: number
  name: string
  role: string
  phone: string
  email: string
  status: string
}

// Datos iniciales
const teams: Team[] = [
  {
    id: 1,
    name: "Águilas Doradas",
    category: "varonil-gold",
    captain_name: "Juan Pérez",
    captain_phone: "618-123-4567",
    captain_email: "juan@aguilas.com",
    coach_name: "Carlos López",
    type: "club",
    color1: "#FFD700",
    color2: "#8B4513",
    status: "active",
  },
  {
    id: 2,
    name: "Panteras Negras",
    category: "femenil-gold",
    captain_name: "María González",
    captain_phone: "618-234-5678",
    captain_email: "maria@panteras.com",
    type: "particular",
    color1: "#000000",
    color2: "#FF69B4",
    status: "active",
  },
]

const players: Player[] = [
  {
    id: 1,
    name: "Roberto Martínez",
    team_id: 1,
    position: "QB",
    jersey_number: 12,
    birth_date: "1995-03-15",
    phone: "618-345-6789",
    email: "roberto@email.com",
    status: "active",
    team: { name: "Águilas Doradas", category: "varonil-gold" },
  },
  {
    id: 2,
    name: "Ana Rodríguez",
    team_id: 2,
    position: "WR",
    jersey_number: 8,
    birth_date: "1998-07-22",
    phone: "618-456-7890",
    email: "ana@email.com",
    status: "active",
    team: { name: "Panteras Negras", category: "femenil-gold" },
  },
]

const games: Game[] = [
  {
    id: 1,
    home_team: "Águilas Doradas",
    away_team: "Leones FC",
    home_score: 21,
    away_score: 14,
    date: "2024-01-15",
    time: "16:00",
    venue: "Estadio Central",
    field: "Campo A",
    category: "varonil-gold",
    status: "finished",
    referee: "Luis Hernández",
  },
  {
    id: 2,
    home_team: "Panteras Negras",
    away_team: "Tigres Azules",
    date: "2024-01-20",
    time: "18:00",
    venue: "Estadio Norte",
    field: "Campo B",
    category: "femenil-gold",
    status: "scheduled",
    referee: "Carmen Vega",
  },
]

const payments: Payment[] = [
  {
    id: 1,
    type: "team_registration",
    amount: 2500,
    date: "2024-01-10",
    status: "paid",
    beneficiary_name: "Águilas Doradas",
  },
  {
    id: 2,
    type: "referee_payment",
    amount: 800,
    date: "2024-01-15",
    status: "pending",
    beneficiary_name: "Luis Hernández",
  },
]

const staff: Staff[] = [
  {
    id: 1,
    name: "Pedro Sánchez",
    role: "coordinador",
    phone: "618-567-8901",
    email: "pedro@liga.com",
    status: "active",
  },
  {
    id: 2,
    name: "Laura Jiménez",
    role: "paramedico",
    phone: "618-678-9012",
    email: "laura@liga.com",
    status: "active",
  },
]

const nextId = {
  teams: 3,
  players: 3,
  games: 3,
  payments: 3,
  staff: 3,
}

export const db = {
  teams: {
    getAll: async (): Promise<Team[]> => teams,
    create: async (data: Omit<Team, "id">): Promise<Team> => {
      const newTeam = { ...data, id: nextId.teams++ }
      teams.push(newTeam)
      return newTeam
    },
  },
  players: {
    getAll: async (): Promise<Player[]> => {
      return players.map((player) => ({
        ...player,
        team: teams.find((t) => t.id === player.team_id)
          ? {
              name: teams.find((t) => t.id === player.team_id)!.name,
              category: teams.find((t) => t.id === player.team_id)!.category,
            }
          : undefined,
      }))
    },
    create: async (data: Omit<Player, "id">): Promise<Player> => {
      const newPlayer = { ...data, id: nextId.players++ }
      const team = teams.find((t) => t.id === data.team_id)
      const playerWithTeam = {
        ...newPlayer,
        team: team ? { name: team.name, category: team.category } : undefined,
      }
      players.push(newPlayer)
      return playerWithTeam
    },
  },
  games: {
    getAll: async (): Promise<Game[]> => games,
    create: async (data: Omit<Game, "id">): Promise<Game> => {
      const newGame = { ...data, id: nextId.games++ }
      games.push(newGame)
      return newGame
    },
  },
  payments: {
    getAll: async (): Promise<Payment[]> => payments,
    create: async (data: Omit<Payment, "id">): Promise<Payment> => {
      const newPayment = { ...data, id: nextId.payments++ }
      payments.push(newPayment)
      return newPayment
    },
  },
  staff: {
    getAll: async (): Promise<Staff[]> => staff,
    create: async (data: Omit<Staff, "id">): Promise<Staff> => {
      const newStaff = { ...data, id: nextId.staff++ }
      staff.push(newStaff)
      return newStaff
    },
  },
}
