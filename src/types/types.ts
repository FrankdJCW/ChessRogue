export type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
export type Color = 'white' | 'black';

export interface Position {
    row: number;
    col: number;
}

export interface Piece {
    type: PieceType;
    color: Color;
    position: Position;
    hasMoved?: boolean;
}

export interface Move {
    from: Position;
    to: Position;
    piece: Piece;
    capturedPiece?: Piece;
}

export interface GameState {
    board: (Piece | null)[][];
    currentTurn: Color;
    moveHistory: Move[];
    whitePieces: Piece[];
    blackPieces: Piece[];
    points: number;
    gamesWon: number;
    currentGameNumber: number;
    phase: 'placement' | 'playing' | 'gameOver';
}

export interface ShopItem {
    type: PieceType;
    cost: number;
    icon: string;
}

export const PIECE_VALUES: Record<PieceType, number> = {
    pawn: 1,
    knight: 3,
    bishop: 3,
    rook: 5,
    queen: 9,
    king: 0
};

export const PIECE_ICONS: Record<Color, Record<PieceType, string>> = {
    white: {
        king: '♔',
        queen: '♕',
        rook: '♖',
        bishop: '♗',
        knight: '♘',
        pawn: '♙'
    },
    black: {
        king: '♚',
        queen: '♛',
        rook: '♜',
        bishop: '♝',
        knight: '♞',
        pawn: '♟'
    }
};

