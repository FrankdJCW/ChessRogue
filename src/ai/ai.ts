import { Piece, Position, PieceType, Color } from '../types/types.js';

// @ts-ignore - js-chess-engine is loaded as a global script
declare const window: any;

export class ChessAI {
    public static getBestMove(board: (Piece | null)[][], color: 'white' | 'black'): { from: Position, to: Position } | null {
        console.log(`AI calculating optimal move for ${color}...`);
        try {
            // Convert our board to engine format with turn information
            const engineConfig = this.boardToEngineFormat(board, color);
            console.log('Engine config:', JSON.stringify(engineConfig, null, 2));
            
            // Create engine instance with current position (from global window object)
            const ChessEngine = window['js-chess-engine'] || (window as any).jsChessEngine;
            if (!ChessEngine) {
                throw new Error('Chess engine not loaded');
            }
            
            console.log(`Creating engine with config for ${color}'s turn...`);
            const engine = new ChessEngine.Game(engineConfig);
            
            // Check what the engine thinks about the current state
            const status = engine.exportJson();
            console.log('Engine status:', status);
            console.log('Engine thinks it is turn:', status.turn);
            
            // Get the best move from the engine (difficulty level 4 for maximum strength)
            // js-chess-engine supports levels 0-4, where 4 is the strongest
            const aiMove = engine.aiMove(4);
            console.log(`${color} AI move result:`, aiMove);
            
            if (!aiMove) {
                console.warn(`Engine returned no move for ${color}, trying fallback`);
                return this.getFallbackMove(board, color);
            }
            
            // The aiMove is in format { "E2": "E4" } for example
            const moveKeys = Object.keys(aiMove);
            if (moveKeys.length === 0) {
                console.warn(`Empty move object for ${color}`);
                return this.getFallbackMove(board, color);
            }
            
            const fromSquare = moveKeys[0];
            const toSquare = aiMove[fromSquare];
            
            // Convert algebraic notation back to our Position format
            const from = this.algebraicToPosition(fromSquare);
            const to = this.algebraicToPosition(toSquare);
            
            console.log(`✓ ${color} optimal move: ${fromSquare} → ${toSquare}`, from, to);
            return { from, to };
        } catch (error) {
            console.error(`Chess engine error for ${color}:`, error);
            console.warn(`Falling back to basic move selection for ${color}`);
            // Fallback to a simple random legal move if engine fails
            return this.getFallbackMove(board, color);
        }
    }

    private static boardToEngineFormat(board: (Piece | null)[][], turn: 'white' | 'black' = 'white'): any {
        const config: any = {
            pieces: {},
            turn: turn === 'white' ? 'white' : 'black',
            // Disable castling to avoid compatibility issues
            castling: {
                whiteLong: false,
                whiteShort: false,
                blackLong: false,
                blackShort: false
            }
        };
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece) {
                    const square = this.positionToAlgebraic({ row, col });
                    const pieceCode = this.pieceToEngineCode(piece);
                    config.pieces[square] = pieceCode;
                }
            }
        }
        
        return config;
    }

    private static pieceToEngineCode(piece: Piece): string {
        // Engine uses uppercase for white, lowercase for black
        let code = '';
        
        switch (piece.type) {
            case 'king': code = 'K'; break;
            case 'queen': code = 'Q'; break;
            case 'rook': code = 'R'; break;
            case 'bishop': code = 'B'; break;
            case 'knight': code = 'N'; break;
            case 'pawn': code = 'P'; break;
        }
        
        return piece.color === 'white' ? code : code.toLowerCase();
    }

    private static positionToAlgebraic(pos: Position): string {
        // Convert row (0-7) and col (0-7) to algebraic notation like "E4"
        const file = String.fromCharCode(65 + pos.col); // 65 is 'A'
        const rank = (8 - pos.row).toString();
        return file + rank;
    }

    private static algebraicToPosition(square: string): Position {
        // Convert "E4" to { row: 4, col: 4 }
        const file = square.charCodeAt(0) - 65; // 'A' = 0
        const rank = parseInt(square[1]);
        return {
            row: 8 - rank,
            col: file
        };
    }

    private static getFallbackMove(board: (Piece | null)[][], color: Color): { from: Position, to: Position } | null {
        // Simple fallback: find any legal move
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece && piece.color === color) {
                    // Try to find a legal move for this piece
                    for (let toRow = 0; toRow < 8; toRow++) {
                        for (let toCol = 0; toCol < 8; toCol++) {
                            const to = { row: toRow, col: toCol };
                            if (row === toRow && col === toCol) continue;
                            
                            // Basic check - just try to move
                            const target = board[toRow][toCol];
                            if (!target || target.color !== color) {
                                return { 
                                    from: { row, col }, 
                                    to 
                                };
                            }
                        }
                    }
                }
            }
        }
        return null;
    }
}
