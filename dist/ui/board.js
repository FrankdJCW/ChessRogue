import { PIECE_ICONS } from '../types/types.js';
export class ChessBoard {
    constructor(canvasId) {
        this.selectedSquare = null;
        this.highlightedSquares = [];
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.squareSize = this.canvas.width / 8;
    }
    render(board) {
        this.drawBoard();
        this.drawHighlights();
        this.drawPieces(board);
    }
    drawBoard() {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const isLight = (row + col) % 2 === 0;
                this.ctx.fillStyle = isLight ? '#f0d9b5' : '#b58863';
                this.ctx.fillRect(col * this.squareSize, row * this.squareSize, this.squareSize, this.squareSize);
            }
        }
    }
    drawHighlights() {
        if (this.selectedSquare) {
            this.ctx.fillStyle = 'rgba(255, 255, 0, 0.4)';
            this.ctx.fillRect(this.selectedSquare.col * this.squareSize, this.selectedSquare.row * this.squareSize, this.squareSize, this.squareSize);
        }
        // Draw highlighted squares with a nice glow effect
        for (const square of this.highlightedSquares) {
            this.ctx.fillStyle = 'rgba(102, 126, 234, 0.4)';
            this.ctx.fillRect(square.col * this.squareSize, square.row * this.squareSize, this.squareSize, this.squareSize);
            // Draw border
            this.ctx.strokeStyle = 'rgba(102, 126, 234, 0.8)';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(square.col * this.squareSize, square.row * this.squareSize, this.squareSize, this.squareSize);
        }
    }
    drawPieces(board) {
        this.ctx.font = `${this.squareSize * 0.8}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece) {
                    const icon = PIECE_ICONS[piece.color][piece.type];
                    this.ctx.fillStyle = '#000';
                    this.ctx.fillText(icon, col * this.squareSize + this.squareSize / 2, row * this.squareSize + this.squareSize / 2);
                }
            }
        }
    }
    getSquareFromMouse(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        return {
            row: Math.floor(y / this.squareSize),
            col: Math.floor(x / this.squareSize)
        };
    }
    setSelectedSquare(pos) {
        this.selectedSquare = pos;
    }
    setHighlightedSquares(squares) {
        this.highlightedSquares = squares;
    }
    getSquareSize() {
        return this.squareSize;
    }
}
