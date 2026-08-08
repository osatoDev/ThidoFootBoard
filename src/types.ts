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
  updatedAt?: number;
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

export type ManualLineupImport = {
  formation?: FormationName;
  name?: string;
  players: Player[];
  substitutes: Player[];
};
