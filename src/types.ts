export type FormationName =
  | "4-3-3"
  | "4-2-3-1"
  | "3-5-2"
  | "4-4-2"
  | "4-1-4-1"
  | "4-3-2-1"
  | "3-4-3"
  | "3-4-2-1"
  | "5-3-2"
  | "5-4-1";

export type PositionCoordinate = {
  role: string;
  x: number;
  y: number;
};

export type Player = {
  name: string;
  number: string;
  customX?: number;
  customY?: number;
};

export type SavedLineup = {
  id: string;
  name: string;
  formation: FormationName;
  players: Player[];
  substitutes: Player[];
  arrows?: MovementArrow[];
  createdAt: number;
};

export type PitchTheme = "classic" | "dark";
export type ArrowStyle = "solid" | "dashed";

export type MovementArrow = {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: string;
  style: ArrowStyle;
};

export type CurrentLineup = {
  formation: FormationName;
  players: Player[];
  substitutes: Player[];
  arrows: MovementArrow[];
  pitchTheme: PitchTheme;
  playerBadges: boolean;
};

export type EditorTab = "starting" | "substitutes";
export type MatchLoadSide = "teamA" | "teamB";

export type MatchSummary = {
  fixtureId: number;
  date: string;
  status: string;
  league: {
    id: number;
    name: string;
    country: string;
    season: number;
    logo?: string;
  };
  venue?: string;
  home: {
    id: number;
    name: string;
    logo?: string;
  };
  away: {
    id: number;
    name: string;
    logo?: string;
  };
};

export type ImportedLineupPlayer = {
  id?: number;
  name: string;
  number: string;
  role: string;
  grid: string;
};

export type ImportedLineup = {
  team: {
    id: number;
    name: string;
    logo?: string;
  };
  formation: string;
  coach?: {
    id?: number;
    name?: string;
    photo?: string;
  };
  startXI: ImportedLineupPlayer[];
  substitutes: ImportedLineupPlayer[];
};
