import { Piece, Position, PieceType, Color } from '../types/types.js';

export class PieceMovement {
    public static isValidMove(piece: Piece, to: Position, board: (Piece | null)[][]): boolean {
        const from = piece.position;
        
        // Can't move to same square
        if (from.row === to.row && from.col === to.col) return false;
        
        // Can't move off board
        if (to.row < 0 || to.row > 7 || to.col < 0 || to.col > 7) return false;
        
        // Can't capture own piece
        const targetPiece = board[to.row][to.col];
        if (targetPiece && targetPiece.color === piece.color) return false;
        
        switch (piece.type) {
            case 'king':
                return this.isValidKingMove(from, to);
            case 'queen':
                return this.isValidQueenMove(from, to, board);
            case 'rook':
                return this.isValidRookMove(from, to, board);
            case 'bishop':
                return this.isValidBishopMove(from, to, board);
            case 'knight':
                return this.isValidKnightMove(from, to);
            case 'pawn':
                return this.isValidPawnMove(piece, from, to, board);
            default:
                return false;
        }
    }

    public static getPossibleMoves(piece: Piece, board: (Piece | null)[][]): Position[] {
        const moves: Position[] = [];
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const to = { row, col };
                if (this.isValidMove(piece, to, board)) {
                    moves.push(to);
                }
            }
        }
        
        return moves;
    }

    private static isValidKingMove(from: Position, to: Position): boolean {
        const rowDiff = Math.abs(to.row - from.row);
        const colDiff = Math.abs(to.col - from.col);
        return rowDiff <= 1 && colDiff <= 1;
    }

    private static isValidQueenMove(from: Position, to: Position, board: (Piece | null)[][]): boolean {
        return this.isValidRookMove(from, to, board) || this.isValidBishopMove(from, to, board);
    }

    private static isValidRookMove(from: Position, to: Position, board: (Piece | null)[][]): boolean {
        if (from.row !== to.row && from.col !== to.col) return false;
        return this.isPathClear(from, to, board);
    }

    private static isValidBishopMove(from: Position, to: Position, board: (Piece | null)[][]): boolean {
        const rowDiff = Math.abs(to.row - from.row);
        const colDiff = Math.abs(to.col - from.col);
        if (rowDiff !== colDiff) return false;
        return this.isPathClear(from, to, board);
    }

    private static isValidKnightMove(from: Position, to: Position): boolean {
        const rowDiff = Math.abs(to.row - from.row);
        const colDiff = Math.abs(to.col - from.col);
        return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
    }

    private static isValidPawnMove(piece: Piece, from: Position, to: Position, board: (Piece | null)[][]): boolean {
        const direction = piece.color === 'white' ? -1 : 1;
        const startRow = piece.color === 'white' ? 6 : 1;
        
        const rowDiff = to.row - from.row;
        const colDiff = Math.abs(to.col - from.col);
        
        // Move forward one square
        if (colDiff === 0 && rowDiff === direction && !board[to.row][to.col]) {
            return true;
        }
        
        // Move forward two squares from start
        if (colDiff === 0 && rowDiff === 2 * direction && from.row === startRow 
            && !board[to.row][to.col] && !board[from.row + direction][from.col]) {
            return true;
        }
        
        // Capture diagonally
        if (colDiff === 1 && rowDiff === direction && board[to.row][to.col]) {
            return true;
        }
        
        return false;
    }

    private static isPathClear(from: Position, to: Position, board: (Piece | null)[][]): boolean {
        const rowStep = to.row === from.row ? 0 : (to.row - from.row) / Math.abs(to.row - from.row);
        const colStep = to.col === from.col ? 0 : (to.col - from.col) / Math.abs(to.col - from.col);
        
        let currentRow = from.row + rowStep;
        let currentCol = from.col + colStep;
        
        while (currentRow !== to.row || currentCol !== to.col) {
            if (board[currentRow][currentCol]) return false;
            currentRow += rowStep;
            currentCol += colStep;
        }
        
        return true;
    }
}

