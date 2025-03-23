declare module "*.worker.js" {
  class WebpackWorker extends Worker {
    constructor();
  }
  export default WebpackWorker;
}

declare module "*.worker" {
  class WebpackWorker extends Worker {
    constructor();
  }
  export default WebpackWorker;
}

declare module "worker-loader!*" {
  class WebpackWorker extends Worker {
    constructor();
  }
  export default WebpackWorker;
}

declare module "*/pokerWorker.js" {
  class WebpackWorker extends Worker {
    constructor();
  }
  export default WebpackWorker;
}

interface PokerWorkerMessage {
  action: string;
  data: any;
}

interface PokerWorkerResponse {
  type: string;
  result: any;
}

// Game types
interface GameState {
  id: number;
  players: Player[];
  communityCards: string[];
  pot: number;
  currentTurn: number;
  status: 'waiting' | 'playing' | 'ended';
  blinds: {
    small: number;
    big: number;
  };
}

interface Player {
  address: string;
  chips: number;
  cards?: [string, string];
  isFolded?: boolean;
  isAllIn?: boolean;
  currentBet?: number;
  seat: number;
} 