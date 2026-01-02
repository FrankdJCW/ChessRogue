import { Piece, Position, Color, PieceType, PIECE_VALUES, PIECE_ICONS, GameState, Move } from '../types/types.js';
import { ChessBoard } from '../ui/board.js';
import { GameLogic } from './gameLogic.js';
import { ChessAI } from '../ai/ai.js';
import { Shop } from '../ui/shop.js';
import { PieceMovement } from '../pieces/pieces.js';

export class Game {
    private board: (Piece | null)[][];
    private chessBoard: ChessBoard;
    private shop: Shop;
    private gameState: GameState;
    private selectedPiece: Piece | null = null;
    private placingPieceType: PieceType | null = null;
    private gameInterval: number | null = null;
    private placedWhitePieces: Piece[] = [];
    private initialPlacements: Map<string, {type: PieceType, position: Position}> = new Map(); // Track original positions and types (key: "row,col")
    private lastGameResult: 'win' | 'draw' | null = null; // Track last game result for multiplier
    private lastBlackValue: number = 0; // Track previous round's black value to ensure it never decreases

    constructor() {
        this.board = this.createEmptyBoard();
        this.chessBoard = new ChessBoard('chessBoard');
        this.shop = new Shop();
        
        this.gameState = {
            board: this.board,
            currentTurn: 'white',
            moveHistory: [],
            whitePieces: [],
            blackPieces: [],
            points: 0,
            gamesWon: 0,
            currentGameNumber: 1,
            phase: 'placement'
        };

        this.setupEventListeners();
        
        // Setup black pieces for preview in first game
        this.setupBlackPiecesForPreview();
        
        this.updateUI();
        this.render();
    }

    private createEmptyBoard(): (Piece | null)[][] {
        const board: (Piece | null)[][] = [];
        for (let i = 0; i < 8; i++) {
            board[i] = new Array(8).fill(null);
        }
        return board;
    }

    private setupEventListeners(): void {
        const canvas = document.getElementById('chessBoard') as HTMLCanvasElement;
        canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        canvas.addEventListener('mousemove', (e) => this.handleCanvasHover(e));

        document.getElementById('startGameBtn')?.addEventListener('click', () => this.startGame());
        document.getElementById('resetPlacementBtn')?.addEventListener('click', () => this.resetPlacement());

        this.renderShop();
    }

    private handleCanvasClick(event: MouseEvent): void {
        const pos = this.chessBoard.getSquareFromMouse(event);

        if (this.gameState.phase === 'placement') {
            this.handlePlacementClick(pos);
        } else if (this.gameState.phase === 'playing') {
            this.handleGamePlayClick(pos);
        }
    }

    private handleGamePlayClick(pos: Position): void {
        const clickedPiece = this.board[pos.row][pos.col];
        
        // If white's turn, allow player to select and move white pieces
        if (this.gameState.currentTurn === 'white') {
            if (this.selectedPiece && this.selectedPiece.color === 'white') {
                // Try to move the selected piece
                const moveResult = GameLogic.makeMove(this.board, this.selectedPiece.position, pos);
                if (moveResult) {
                    this.handleMoveResult(moveResult, 'white');
                    this.selectedPiece = null;
                    this.chessBoard.setSelectedSquare(null);
                    this.chessBoard.setHighlightedSquares([]);
                    
                    // Switch to black's turn
                    this.gameState.currentTurn = 'black';
                    this.render();
                    
                    // Let black make its move after a short delay
                    setTimeout(() => this.makeBlackMove(), 500);
                } else {
                    // Invalid move, deselect
                    this.selectedPiece = null;
                    this.chessBoard.setSelectedSquare(null);
                    this.chessBoard.setHighlightedSquares([]);
                    this.render();
                }
            } else if (clickedPiece && clickedPiece.color === 'white') {
                // Select a white piece
                this.selectedPiece = clickedPiece;
                this.chessBoard.setSelectedSquare(pos);
                
                // Show possible moves
                const possibleMoves = PieceMovement.getPossibleMoves(clickedPiece, this.board)
                    .filter(move => GameLogic.isMoveLegal(this.board, clickedPiece, move));
                this.chessBoard.setHighlightedSquares(possibleMoves);
                this.render();
            }
        }
    }

    private async makeBlackMove(): Promise<void> {
        if (this.gameState.phase !== 'playing' || this.gameState.currentTurn !== 'black') {
            return;
        }
        
        // Check for game end conditions
        if (GameLogic.isCheckmate(this.board, 'black')) {
            this.handleGameEnd('white', 'checkmate');
            return;
        }
        
        if (GameLogic.isStalemate(this.board, 'black')) {
            this.handleGameEnd('draw', 'stalemate');
            return;
        }
        
        // Black makes a move using AI
        try {
            const move = ChessAI.getBestMove(this.board, 'black');
            if (move) {
                const moveResult = GameLogic.makeMove(this.board, move.from, move.to);
                if (moveResult) {
                    this.handleMoveResult(moveResult, 'black');
                    
                    // Switch back to white's turn
                    this.gameState.currentTurn = 'white';
                    this.render();
                    this.updateUI();
                    
                    // Check if white is in checkmate or stalemate
                    if (GameLogic.isCheckmate(this.board, 'white')) {
                        this.handleGameEnd('black', 'checkmate');
                    } else if (GameLogic.isStalemate(this.board, 'white')) {
                        this.handleGameEnd('draw', 'stalemate');
                    }
                }
            } else {
                this.handleGameEnd('white', 'no moves');
            }
        } catch (error) {
            console.error('Error during black move:', error);
            this.gameState.currentTurn = 'white';
        }
    }

    private handleMoveResult(moveResult: Move, color: Color): void {
        this.logMove(moveResult, color);
        
        // Check for pawn promotion
        const movedPiece = this.board[moveResult.to.row][moveResult.to.col];
        if (movedPiece && movedPiece.type === 'pawn') {
            if (movedPiece.color === 'white' && moveResult.to.row === 0) {
                movedPiece.type = 'queen';
                this.log(`White pawn promoted to Queen!`, 'victory');
            } else if (movedPiece.color === 'black' && moveResult.to.row === 7) {
                movedPiece.type = 'queen';
                this.log(`Black pawn promoted to Queen!`, 'error');
            }
        }
        
        // Award points for captures (half value, rounded up)
        if (moveResult.capturedPiece && color === 'white') {
            const fullValue = PIECE_VALUES[moveResult.capturedPiece.type];
            const points = Math.ceil(fullValue / 2);
            this.gameState.points += points;
            this.shop.addPoints(points);
            this.log(`+${points} points for capturing ${moveResult.capturedPiece.type}!`, 'important');
        }
        
        // Check if white lost a piece
        if (moveResult.capturedPiece && color === 'black') {
            this.log(`Lost ${moveResult.capturedPiece.type}!`, 'error');
        }
    }

    private handleCanvasHover(event: MouseEvent): void {
        if (this.gameState.phase !== 'placement') return;
        
        const canvas = event.target as HTMLCanvasElement;
        const pos = this.chessBoard.getSquareFromMouse(event);
        
        if (this.placingPieceType && this.canPlacePiece(pos)) {
            canvas.style.cursor = 'pointer';
        } else if (this.placingPieceType) {
            canvas.style.cursor = 'not-allowed';
        } else {
            canvas.style.cursor = 'default';
        }
    }

    private handlePlacementClick(pos: Position): void {
        if (this.placingPieceType) {
            // Place a piece
            if (this.canPlacePiece(pos)) {
                this.placePiece(this.placingPieceType, pos);
                this.placingPieceType = null;
                this.chessBoard.setHighlightedSquares([]);
                this.render();
            } else {
                this.log('Cannot place piece there!', 'error');
            }
        }
        // Once placed, pieces cannot be individually removed
        // Use "Reset Placement" button to clear all pieces if needed
    }

    private canPlacePiece(pos: Position): boolean {
        // Square must be empty
        if (this.board[pos.row][pos.col])
        {
            return false;
        }
        
        // Pawns can only be placed on rows 5, 6, 7 (ranks 3, 2, 1 - white's territory)
        if (this.placingPieceType === 'pawn' && pos.row < 5) {
            return false;
        }
        
        if (!this.placingPieceType) 
        {
            return false;
        }
        
        // Temporarily place the piece to test both kings' safety
        const testPiece: Piece = {
            type: this.placingPieceType,
            color: 'white',
            position: pos
        };
        this.board[pos.row][pos.col] = testPiece;
        
        // Check 1: Would this put the WHITE king in check?
        const whiteInCheck = GameLogic.isInCheck(this.board, 'white');
        
        // Check 2: Would this put the BLACK king in check?
        const blackInCheck = GameLogic.isInCheck(this.board, 'black');
        
        // Remove the test piece
        this.board[pos.row][pos.col] = null;
        
        // Reject if either king would be in check
        if (whiteInCheck || blackInCheck) {
            return false;
        }
        
        return true;
    }

    private placePiece(type: PieceType, pos: Position): void {
        if (!this.shop.removePiece(type)) {
            this.log('No pieces of this type available!', 'error');
            return;
        }

        const piece: Piece = {
            type,
            color: 'white',
            position: pos
        };

        this.board[pos.row][pos.col] = piece;
        this.placedWhitePieces.push(piece);
        
        // Store the initial placement position and ORIGINAL type (for pawn promotion tracking)
        const key = `${pos.row},${pos.col}`;
        this.initialPlacements.set(key, { type: type, position: pos });
        
        this.updateUI();
        this.log(`Placed ${type} at ${String.fromCharCode(97 + pos.col)}${8 - pos.row}`);
    }

    private removePlacedPiece(piece: Piece): void {
        const pos = piece.position;
        this.board[pos.row][pos.col] = null;
        this.placedWhitePieces = this.placedWhitePieces.filter(p => p !== piece);
        
        // Remove from initial placements using position key
        const key = `${pos.row},${pos.col}`;
        this.initialPlacements.delete(key);
        
        this.shop.addPiece(piece.type);
        this.updateUI();
        this.render();
        this.log(`Removed ${piece.type} from ${String.fromCharCode(97 + pos.col)}${8 - pos.row}`);
    }

    private resetPlacement(): void {
        // Remove all placed pieces and return them to inventory
        for (const piece of this.placedWhitePieces) {
            const pos = piece.position;
            this.board[pos.row][pos.col] = null;
            this.shop.addPiece(piece.type);
        }
        this.placedWhitePieces = [];
        this.initialPlacements.clear(); // Clear initial placements
        this.selectedPiece = null;
        this.placingPieceType = null;
        this.updateUI();
        this.render();
        this.log('Placement reset');
    }

    private startGame(): void {
        // Check if king is placed
        const hasKing = this.placedWhitePieces.some(p => p.type === 'king');
        if (!hasKing) {
            this.log('You must place your King before starting!', 'error');
            return;
        }

        this.gameState.phase = 'playing';
        this.gameState.currentTurn = 'white';
        this.selectedPiece = null;
        
        this.updateUI();
        this.render();
        this.log('Game started! Your turn - click a piece to move it.', 'important');
    }

    private setupBlackPiecesForPreview(): void {
        // Setup black pieces during placement phase so player can see them
        const gameNumber = this.gameState.currentGameNumber;
        
        // Place black king randomly anywhere on board, ensuring it's not in check AND doesn't put white king in check
        let kingPos: Position | null = null;
        let attempts = 0;
        while (!kingPos && attempts < 100) {
            const testPos = this.getRandomEmptyPosition(0, 7);
            // Temporarily place king to test if it would be in check
            const blackKing: Piece = {
                type: 'king',
                color: 'black',
                position: testPos
            };
            this.board[testPos.row][testPos.col] = blackKing;
            
            // Check if this position puts either king in check
            const blackInCheck = GameLogic.isInCheck(this.board, 'black');
            const whiteInCheck = GameLogic.isInCheck(this.board, 'white');
            
            if (!blackInCheck && !whiteInCheck) {
                kingPos = testPos;
            } else {
                // Remove king and try another position
                this.board[testPos.row][testPos.col] = null;
            }
            attempts++;
        }
        
        // If we couldn't find a safe position after many attempts, just place it anyway
        if (!kingPos) {
            kingPos = this.getRandomEmptyPosition(0, 7);
            const blackKing: Piece = {
                type: 'king',
                color: 'black',
                position: kingPos
            };
            this.board[kingPos.row][kingPos.col] = blackKing;
        }

        // Get pieces for this game number
        let piecesToAdd = this.getBlackPiecesForGame(gameNumber);
        
        // Balance black pieces to not exceed 150% of white pieces value
        piecesToAdd = this.balanceBlackPieces(piecesToAdd);
        
        // Add balanced pieces
        for (const pieceType of piecesToAdd) {
            let placementAttempts = 0;
            let placed = false;
            
            while (!placed && placementAttempts < 50) {
                // Pawns can only spawn on black's side (top 3 rows: 0-2)
                // Other pieces can spawn anywhere on the board
                const pos = pieceType === 'pawn' 
                    ? this.getRandomEmptyPosition(0, 2) 
                    : this.getRandomEmptyPosition(0, 7);
                if (pos) {
                    // Temporarily place the piece to test
                    const piece: Piece = {
                        type: pieceType,
                        color: 'black',
                        position: pos
                    };
                    this.board[pos.row][pos.col] = piece;
                    
                    // Check if this placement puts either king in check
                    const whiteInCheck = GameLogic.isInCheck(this.board, 'white');
                    const blackInCheck = GameLogic.isInCheck(this.board, 'black');
                    
                    if (!whiteInCheck && !blackInCheck) {
                        // Valid placement - keep the piece
                        placed = true;
                    } else {
                        // Invalid - remove and try another position
                        this.board[pos.row][pos.col] = null;
                    }
                }
                placementAttempts++;
            }
            
            // If we couldn't place after many attempts, skip this piece
            if (!placed) {
                this.log(`Could not safely place ${pieceType}`, 'error');
            }
        }

        this.gameState.blackPieces = GameLogic.getAllPieces(this.board, 'black');
        this.log(`Black pieces ready: ${this.gameState.blackPieces.length} pieces`, 'important');
    }

    private getBlackPiecesForGame(gameNumber: number): PieceType[] {
        // First round: only king (no other pieces)
        if (gameNumber === 1) {
            return [];
        }
        
        // Determine multiplier based on last game result
        let multiplier = 1.5; // Default for wins
        if (this.lastGameResult === 'draw') {
            multiplier = 1.0; // Equal if last game was a tie
        }
        
        // For other rounds, generate random pieces
        const availablePieces: PieceType[] = ['queen', 'rook', 'bishop', 'knight', 'pawn'];
        const randomPieces: PieceType[] = [];
        
        // Calculate white value (excluding king)
        const whiteValue = this.getWhitePiecesValue();
        let targetValue = Math.min(whiteValue * multiplier, 40); // Apply multiplier, cap at 40
        
        // Ensure black value never decreases from previous round
        targetValue = Math.max(targetValue, this.lastBlackValue);
        
        // Randomly add pieces until we reach approximately the target
        let currentValue = 0;
        let attempts = 0;
        const maxAttempts = 100;
        
        while (currentValue < targetValue && attempts < maxAttempts) {
            // Randomly select a piece type
            const randomPiece = availablePieces[Math.floor(Math.random() * availablePieces.length)];
            const pieceValue = PIECE_VALUES[randomPiece];
            
            // Add it if it doesn't exceed target by too much
            if (currentValue + pieceValue <= targetValue + 2) { // Allow slight overshoot
                randomPieces.push(randomPiece);
                currentValue += pieceValue;
            }
            
            attempts++;
        }
        
        return randomPieces;
    }

    private calculatePiecesValue(pieces: PieceType[]): number {
        return pieces.reduce((total, type) => total + PIECE_VALUES[type], 0);
    }

    private getWhitePiecesValue(): number {
        let total = 0;
        for (const piece of this.placedWhitePieces) {
            total += PIECE_VALUES[piece.type];
        }
        return total;
    }

    private balanceBlackPieces(blackPieces: PieceType[]): PieceType[] {
        const gameNumber = this.gameState.currentGameNumber;
        
        // First round: no pieces except king
        if (gameNumber === 1) {
            this.log(`Round 1: Black has only King`, 'important');
            return [];
        }
        
        // Determine multiplier based on last game result
        let multiplier = 1.5; // Default for wins
        let multiplierText = '1.5x (last: WIN)';
        if (this.lastGameResult === 'draw') {
            multiplier = 1.0;
            multiplierText = '1.0x (last: DRAW)';
        } else if (this.lastGameResult === 'win') {
            multiplierText = '1.5x (last: WIN)';
        }
        
        const whiteValue = this.getWhitePiecesValue();
        let targetValue = Math.min(whiteValue * multiplier, 40);
        
        // Ensure black value never decreases from previous round
        targetValue = Math.max(targetValue, this.lastBlackValue);
        
        const finalValue = blackPieces.reduce((sum, type) => sum + PIECE_VALUES[type], 0);
        const percentage = whiteValue > 0 ? ((finalValue / whiteValue) * 100).toFixed(0) : '0';
        
        // Update last black value for next round
        this.lastBlackValue = finalValue;
        
        const minValueNote = this.lastBlackValue > whiteValue * multiplier ? ` (min: ${this.lastBlackValue})` : '';
        this.log(`Black: ${finalValue} pts (${percentage}% of white's ${whiteValue}) - Multiplier: ${multiplierText}${minValueNote}`, 'important');
        return blackPieces;
    }

    private getRandomEmptyPosition(minRow: number, maxRow: number): Position {
        let attempts = 0;
        while (attempts < 100) {
            const row = minRow + Math.floor(Math.random() * (maxRow - minRow + 1));
            const col = Math.floor(Math.random() * 8);
            if (!this.board[row][col]) {
                return { row, col };
            }
            attempts++;
        }
        // Fallback: find any empty square
        for (let row = minRow; row <= maxRow; row++) {
            for (let col = 0; col < 8; col++) {
                if (!this.board[row][col]) {
                    return { row, col };
                }
            }
        }
        return { row: minRow, col: 0 };
    }

    private async playGame(): Promise<void> {
        let moveCount = 0;
        const maxMoves = 50; // 50 moves = draw/tie

        while (this.gameState.phase === 'playing' && moveCount < maxMoves) {
            await this.sleep(500); // Delay between moves
            
            const color = this.gameState.currentTurn;
            
            // Check for game end conditions
            if (GameLogic.isCheckmate(this.board, color)) {
                const winner = color === 'white' ? 'black' : 'white';
                this.handleGameEnd(winner, 'checkmate');
                return;
            }
            
            if (GameLogic.isStalemate(this.board, color)) {
                // Stalemate is a draw, not a win
                this.handleGameEnd('draw', 'stalemate');
                return;
            }

            // Make a move
            try {
                const move = ChessAI.getBestMove(this.board, color);
                if (move) {
                    const moveResult = GameLogic.makeMove(this.board, move.from, move.to);
                    if (moveResult) {
                        this.logMove(moveResult, color);
                        
                        // Check for pawn promotion
                        const movedPiece = this.board[move.to.row][move.to.col];
                        if (movedPiece && movedPiece.type === 'pawn') {
                            // White pawn reaches row 0 (rank 8)
                            if (movedPiece.color === 'white' && move.to.row === 0) {
                                movedPiece.type = 'queen';
                                this.log(`White pawn promoted to Queen at ${String.fromCharCode(97 + move.to.col)}8!`, 'victory');
                            }
                            // Black pawn reaches row 7 (rank 1)
                            else if (movedPiece.color === 'black' && move.to.row === 7) {
                                movedPiece.type = 'queen';
                                this.log(`Black pawn promoted to Queen at ${String.fromCharCode(97 + move.to.col)}1!`, 'error');
                            }
                        }
                        
                        // Award points for captures (half value, rounded up)
                        if (moveResult.capturedPiece && color === 'white') {
                            const fullValue = PIECE_VALUES[moveResult.capturedPiece.type];
                            const points = Math.ceil(fullValue / 2);
                            this.gameState.points += points;
                            this.shop.addPoints(points);
                            this.log(`+${points} points for capturing ${moveResult.capturedPiece.type}!`, 'important');
                        }
                        
                        // Check if white lost a piece
                        if (moveResult.capturedPiece && color === 'black') {
                            this.log(`Lost ${moveResult.capturedPiece.type}!`, 'error');
                            // Piece is already removed from board
                        }
                        
                        this.gameState.currentTurn = color === 'white' ? 'black' : 'white';
                        this.render();
                        this.updateUI();
                    } else {
                        this.log(`Invalid move attempted by ${color}`, 'error');
                        // No legal moves
                        this.handleGameEnd(color === 'white' ? 'black' : 'white', 'no moves');
                        return;
                    }
                } else {
                    this.log(`No moves available for ${color}`, 'error');
                    // No legal moves
                    this.handleGameEnd(color === 'white' ? 'black' : 'white', 'no moves');
                    return;
                }
            } catch (error) {
                console.error('Error during move:', error);
                this.log(`Error during ${color}'s move: ${error}`, 'error');
                // Continue to next iteration to try again
                this.gameState.currentTurn = color === 'white' ? 'black' : 'white';
            }
            
            moveCount++;
        }

        if (moveCount >= maxMoves) {
            this.log('Game ended in a draw (50 move limit)', 'important');
            this.handleGameEnd('draw', 'draw'); // It's a tie - doesn't count as win or loss
        }
    }

    private handleGameEnd(winner: Color | 'draw', reason: string): void {
        this.gameState.phase = 'gameOver';
        
        if (winner === 'white') {
            // White wins - count it and award 2 points
            this.gameState.gamesWon++;
            const bonusPoints = 3;
            this.gameState.points += bonusPoints;
            this.shop.addPoints(bonusPoints);
            this.log(`White wins by ${reason}!`, 'victory');
            this.log(`+${bonusPoints} bonus points for winning!`, 'important');
            
            // Track win for next round multiplier
            this.lastGameResult = 'win';
            
            if (this.gameState.gamesWon >= 10) {
                this.showVictoryScreen();
                return;
            }
            
            // Prepare for next game
            setTimeout(() => this.setupNextGame(), 2000);
        } else if (winner === 'draw') {
            // Draw/Tie - doesn't count as win but award 1 point
            const bonusPoints = 1;
            this.gameState.points += bonusPoints;
            this.shop.addPoints(bonusPoints);
            this.log(`Game ended in a draw (${reason}). No win counted.`, 'important');
            this.log(`+${bonusPoints} bonus point for surviving!`, 'important');
            this.log(`Games won: ${this.gameState.gamesWon}/10 - Keep trying!`, 'important');
            
            // Track draw for next round multiplier
            this.lastGameResult = 'draw';
            
            // Prepare for next game (game number increases but wins don't)
            setTimeout(() => this.setupNextGame(), 2000);
        } else {
            // Black wins - game over
            this.log(`Black wins by ${reason}. Game Over!`, 'error');
            this.log('Refresh to try again.', 'important');
        }
        
        this.updateUI();
    }

    private setupNextGame(): void {
        this.log('Preparing next game...', 'important');
        
        // Count how many of each piece type are currently on the board (after battle)
        const survivingPieceCounts: Map<PieceType, number> = new Map();
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === 'white') {
                    const count = survivingPieceCounts.get(piece.type) || 0;
                    survivingPieceCounts.set(piece.type, count + 1);
                }
            }
        }
        
        // Count how many of each ORIGINAL piece type we placed
        const originalPieceCounts: Map<PieceType, number> = new Map();
        const originalPiecePositions: Map<PieceType, Position[]> = new Map();
        for (const [key, placementData] of this.initialPlacements.entries()) {
            const originalType = placementData.type;
            const count = originalPieceCounts.get(originalType) || 0;
            originalPieceCounts.set(originalType, count + 1);
            
            const positions = originalPiecePositions.get(originalType) || [];
            positions.push(placementData.position);
            originalPiecePositions.set(originalType, positions);
        }
        
        // Determine which pieces survived
        // For promoted pawns: if we had X pawns and now have Y pawns + Z queens, 
        // then (Y + Z) survived (some as pawns, some as promoted queens)
        const piecesToRestore: Array<{type: PieceType, originalPos: Position}> = [];
        
        for (const [originalType, originalCount] of originalPieceCounts.entries()) {
            const positions = originalPiecePositions.get(originalType) || [];
            let survivorCount = 0;
            
            if (originalType === 'pawn') {
                // Pawns might be on board as pawns OR as queens (promoted)
                const remainingPawns = survivingPieceCounts.get('pawn') || 0;
                const remainingQueens = survivingPieceCounts.get('queen') || 0;
                const originalQueens = originalPieceCounts.get('queen') || 0;
                
                // Promoted pawns = total queens - original queens
                const promotedPawns = Math.max(0, remainingQueens - originalQueens);
                
                survivorCount = remainingPawns + promotedPawns;
            } else {
                // Non-pawn pieces: just check how many of that type remain
                survivorCount = survivingPieceCounts.get(originalType) || 0;
            }
            
            // Restore up to survivorCount pieces at their original positions
            for (let i = 0; i < Math.min(survivorCount, positions.length); i++) {
                piecesToRestore.push({
                    type: originalType, // Restore as ORIGINAL type
                    originalPos: positions[i]
                });
            }
        }
        
        // Log survivors
        if (piecesToRestore.length > 0) {
            const pieceNames = piecesToRestore.map(p => p.type).join(', ');
            this.log(`Surviving pieces: ${pieceNames}`, 'important');
        } else {
            this.log('All pieces lost! Game Over!', 'error');
            this.log('Refresh to try again.', 'important');
            this.gameState.phase = 'gameOver';
            this.updateUI();
            return;
        }
        
        // Clear board completely
        this.board = this.createEmptyBoard();
        this.placedWhitePieces = [];
        this.initialPlacements.clear();
        
        // Increment game number
        this.gameState.currentGameNumber++;
        
        // FIRST: Re-place surviving white pieces at their ORIGINAL positions as ORIGINAL types
        for (const pieceData of piecesToRestore) {
            const originalPos = pieceData.originalPos;
            const originalType = pieceData.type; // This is the ORIGINAL type (e.g., pawn)
            
            const newPiece: Piece = {
                type: originalType, // Use ORIGINAL type, so queens revert to pawns
                color: 'white',
                position: originalPos
            };
            
            this.board[originalPos.row][originalPos.col] = newPiece;
            this.placedWhitePieces.push(newPiece);
            
            // Store in initialPlacements with the ORIGINAL type
            const key = `${originalPos.row},${originalPos.col}`;
            this.initialPlacements.set(key, { type: originalType, position: originalPos });
            
            this.log(`${originalType} returned to ${String.fromCharCode(97 + originalPos.col)}${8 - originalPos.row}`, 'important');
        }
        
        // THEN: Setup new black pieces for preview (after white pieces are placed)
        this.setupBlackPiecesForPreview();
        
        // Set phase to placement (in case player wants to buy and place more)
        this.gameState.phase = 'placement';
        
        this.updateUI();
        this.render();
        this.log('Pieces restored. Buy more or Start Game!', 'important');
    }

    private showVictoryScreen(): void {
        const overlay = document.createElement('div');
        overlay.className = 'winner-overlay';
        overlay.innerHTML = `
            <div class="winner-card">
                <h2>🎉 VICTORY! 🎉</h2>
                <p>You won all 10 games!</p>
                <p>Total Points: ${this.gameState.points}</p>
                <button class="btn btn-primary" onclick="location.reload()">Play Again</button>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    private logMove(move: Move, color: Color): void {
        const from = `${String.fromCharCode(97 + move.from.col)}${8 - move.from.row}`;
        const to = `${String.fromCharCode(97 + move.to.col)}${8 - move.to.row}`;
        const capture = move.capturedPiece ? ` captures ${move.capturedPiece.type}` : '';
        this.log(`${color} ${move.piece.type} ${from} → ${to}${capture}`);
    }

    private log(message: string, type: 'normal' | 'important' | 'victory' | 'error' = 'normal'): void {
        const logMessages = document.getElementById('logMessages');
        if (logMessages) {
            const msgDiv = document.createElement('div');
            msgDiv.className = `log-message ${type}`;
            msgDiv.textContent = message;
            logMessages.insertBefore(msgDiv, logMessages.firstChild);
            
            // Keep only last 20 messages
            while (logMessages.children.length > 20) {
                logMessages.removeChild(logMessages.lastChild!);
            }
        }
    }

    private render(): void {
        this.chessBoard.render(this.board);
    }

    private updateUI(): void {
        // Update stats
        document.getElementById('gamesWon')!.textContent = this.gameState.gamesWon.toString();
        document.getElementById('points')!.textContent = this.shop.getPoints().toString();
        document.getElementById('currentGame')!.textContent = this.gameState.currentGameNumber.toString();

        // Update phase indicator
        const phaseTitle = document.getElementById('phaseTitle')!;
        const phaseDescription = document.getElementById('phaseDescription')!;
        
        if (this.gameState.phase === 'placement') {
            phaseTitle.textContent = 'Placement Phase';
            phaseDescription.textContent = 'Place your pieces';
        } else if (this.gameState.phase === 'playing') {
            phaseTitle.textContent = 'Battle Phase';
            phaseDescription.textContent = 'Watch the battle unfold!';
        } else {
            phaseTitle.textContent = 'Game Over';
            phaseDescription.textContent = '';
        }

        // Update buttons
        const startBtn = document.getElementById('startGameBtn') as HTMLButtonElement;
        const resetBtn = document.getElementById('resetPlacementBtn') as HTMLButtonElement;
        
        startBtn.disabled = this.gameState.phase !== 'placement';
        resetBtn.disabled = this.gameState.phase !== 'placement';

        this.renderShop();
        this.renderInventory();
    }

    private renderShop(): void {
        const shopItems = document.getElementById('shopItems')!;
        shopItems.innerHTML = '';

        const items = this.shop.getShopItems();
        
        for (const item of items) {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'shop-item';
            itemDiv.innerHTML = `
                <div class="shop-item-info">
                    <span class="piece-icon">${item.icon}</span>
                    <div>
                        <div class="piece-name">${item.type}</div>
                        <div class="piece-cost">${item.cost} points</div>
                    </div>
                </div>
                <button class="btn-buy" data-piece="${item.type}" 
                    ${!this.shop.canBuy(item.type) || this.gameState.phase !== 'placement' ? 'disabled' : ''}>
                    Buy
                </button>
            `;
            
            const buyBtn = itemDiv.querySelector('.btn-buy') as HTMLButtonElement;
            buyBtn.addEventListener('click', () => this.handleBuyPiece(item.type));
            
            shopItems.appendChild(itemDiv);
        }
    }

    private renderInventory(): void {
        const inventory = document.getElementById('inventory')!;
        inventory.innerHTML = '';

        const items = this.shop.getInventory();
        
        if (items.length === 0) {
            inventory.innerHTML = '<p style="color: #666;">No pieces available</p>';
            return;
        }

        for (const item of items) {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'inventory-item';
            
            if (this.gameState.phase === 'placement' && item.count > 0) {
                itemDiv.className += ' selectable';
                itemDiv.addEventListener('click', () => this.handleSelectPieceToPlace(item.type));
            }
            
            itemDiv.innerHTML = `
                <div class="inventory-item-info">
                    <span class="piece-icon">${PIECE_ICONS.white[item.type]}</span>
                    <span class="piece-name">${item.type}</span>
                </div>
                <span class="piece-count">×${item.count}</span>
            `;
            
            inventory.appendChild(itemDiv);
        }
    }

    private handleBuyPiece(type: PieceType): void {
        if (this.shop.buyPiece(type)) {
            this.log(`Bought ${type} for ${this.shop.getPieceCost(type)} points`);
            this.updateUI();
        } else {
            this.log('Not enough points!', 'error');
        }
    }

    private handleSelectPieceToPlace(type: PieceType): void {
        if (this.shop.getPieceCount(type) > 0) {
            this.placingPieceType = type;
            
            // Highlight valid placement squares (any empty square that doesn't put king in check)
            const validSquares: Position[] = [];
            for (let row = 0; row < 8; row++) {
                for (let col = 0; col < 8; col++) {
                    if (this.canPlacePiece({ row, col })) {
                        validSquares.push({ row, col });
                    }
                }
            }
            
            if (validSquares.length > 0) {
                this.chessBoard.setHighlightedSquares(validSquares);
                this.render();
                this.log(`Click on a highlighted square to place ${type} (${validSquares.length} valid positions)`, 'important');
            } else {
                // No valid squares available
                this.placingPieceType = null;
                this.chessBoard.setHighlightedSquares([]);
                this.render();
                this.log(`Cannot place ${type} - no valid positions available!`, 'error');
                
                // Debug: explain why
                if (type === 'pawn') {
                    this.log(`Pawns must be placed on rows 6-8 (bottom 3 rows)`, 'error');
                }
                const whiteKing = this.placedWhitePieces.find(p => p.type === 'king');
                if (!whiteKing) {
                    this.log(`Place your King first!`, 'error');
                }
            }
        } else {
            this.log(`No ${type} pieces available!`, 'error');
        }
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

