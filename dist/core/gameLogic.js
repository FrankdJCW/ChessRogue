import { PieceMovement } from '../pieces/pieces.js';
export class GameLogic {
    static isInCheck(board, kingColor) {
        const king = this.findKing(board, kingColor);
        if (!king)
            return false;
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
    static isCheckmate(board, color) {
        if (!this.isInCheck(board, color))
            return false;
        return !this.hasLegalMoves(board, color);
    }
    static isStalemate(board, color) {
        if (this.isInCheck(board, color))
            return false;
        return !this.hasLegalMoves(board, color);
    }
    static hasLegalMoves(board, color) {
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
    static isMoveLegal(board, piece, to) {
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
    static makeMove(board, from, to) {
        const piece = board[from.row][from.col];
        if (!piece)
            return null;
        if (!PieceMovement.isValidMove(piece, to, board))
            return null;
        if (!this.isMoveLegal(board, piece, to))
            return null;
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
    static findKing(board, color) {
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
    static getAllPieces(board, color) {
        const pieces = [];
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
