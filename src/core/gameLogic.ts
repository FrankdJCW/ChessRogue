import { Piece, Position, Color, Move } from '../types/types.js';
import { PieceMovement } from '../pieces/pieces.js';

export class GameLogic {
    public static isInCheck(board: (Piece | null)[][], kingColor: Color): boolean {
        const king = this.findKing(board, kingColor);
        if (!king) return false;

        const opponentColor = kingColor === 'white' ? 'black' : 'white';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece && piece.color === opponentColor) {
                    if (PieceMovement.isValidMove(piece, king.position, board)) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }

    public static isCheckmate(board: (Piece | null)[][], color: Color): boolean {
        if (!this.isInCheck(board, color)) return false;
        return !this.hasLegalMoves(board, color);
    }

    public static isStalemate(board: (Piece | null)[][], color: Color): boolean {
        if (this.isInCheck(board, color)) return false;
        return !this.hasLegalMoves(board, color);
    }

    public static hasLegalMoves(board: (Piece | null)[][], color: Color): boolean {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece && piece.color === color) {
                    const moves = PieceMovement.getPossibleMoves(piece, board);
                    for (const move of moves) {
                        if (this.isMoveLegal(board, piece, move)) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    public static isMoveLegal(board: (Piece | null)[][], piece: Piece, to: Position): boolean {
        // Simulate the move
        const from = piece.position;
        const capturedPiece = board[to.row][to.col];
        
        board[to.row][to.col] = piece;
        board[from.row][from.col] = null;
        piece.position = to;
        
        const inCheck = this.isInCheck(board, piece.color);
        
        // Undo the move
        board[from.row][from.col] = piece;
        board[to.row][to.col] = capturedPiece;
        piece.position = from;
        
        return !inCheck;
    }

    public static makeMove(board: (Piece | null)[][], from: Position, to: Position): Move | null {
        const piece = board[from.row][from.col];
        if (!piece) return null;

        if (!PieceMovement.isValidMove(piece, to, board)) return null;
        if (!this.isMoveLegal(board, piece, to)) return null;

        const capturedPiece = board[to.row][to.col];
        
        board[to.row][to.col] = piece;
        board[from.row][from.col] = null;
        piece.position = to;
        piece.hasMoved = true;

        return {
            from,
            to,
            piece,
            capturedPiece: capturedPiece || undefined
        };
    }

    public static findKing(board: (Piece | null)[][], color: Color): Piece | null {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece && piece.type === 'king' && piece.color === color) {
                    return piece;
                }
            }
        }
        return null;
    }

    public static getAllPieces(board: (Piece | null)[][], color: Color): Piece[] {
        const pieces: Piece[] = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece && piece.color === color) {
                    pieces.push(piece);
                }
            }
        }
        return pieces;
    }
}

