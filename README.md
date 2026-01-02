# Auto Chess - Tower Defense Chess Game

A unique twist on chess where you strategically place pieces to defend against increasingly difficult AI opponents!

## AI Engine

This game now uses **js-chess-engine** for optimal chess move calculations! The AI uses minimax algorithm with alpha-beta pruning to play at a strong level, making the game more challenging and realistic.

## Game Rules

1. **Starting Setup**: You begin with a White King and a White Rook
2. **Placement Phase**: Before each game, place your pieces on the bottom 2 rows of the board
3. **Battle Phase**: Once you hit "Start Game", the pieces are locked and the AI takes over both sides
4. **Earning Points**: Capture enemy pieces to earn points (Pawn=1, Knight=3, Bishop=3, Rook=5, Queen=9)
5. **Shopping**: Use your points to buy more pieces between games
6. **Losing Pieces**: If one of your pieces is captured, you lose it permanently
7. **Win Condition**: Win by checkmate or stalemate (stalemate counts as a win for white!)
8. **Goal**: Win 10 games to achieve total victory!

## Piece Costs

- Pawn: 2 points
- Knight: 6 points
- Bishop: 6 points
- Rook: 10 points
- Queen: 18 points

## Special Rules

- You can have multiple pieces of each type (except King - only one King allowed)
- Each game, the black side gets progressively stronger with more pieces
- Black pieces are placed randomly on the top half of the board
- Once you place a piece and start the game, that piece cannot be moved until next game

## Game Progression

- **Game 1**: Black has only a King
- **Game 2+**: Black gains more pieces each game (pawns, knights, bishops, rooks, eventually queens!)
- Each successive game becomes more challenging

## How to Run

1. Install dependencies:
   ```
   npm install
   ```

2. Compile TypeScript:
   ```
   npm run build
   ```

3. Serve the application:
   ```
   npm run serve
   ```

4. Open your browser and navigate to `http://localhost:3000`

## Development

- TypeScript source files are in `/src`
- Compiled JavaScript is in `/dist`
- To watch for changes: `npm run watch`

## Strategy Tips

- Place your King in a safe corner
- Use Rooks and Queens for maximum attacking power
- Knights can help control the center and create complex tactical situations
- Don't spread your pieces too thin - coordinate them for mutual protection
- Save points for Queens in later games when Black gets stronger

Enjoy the game!

