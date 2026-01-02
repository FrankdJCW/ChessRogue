import { PIECE_VALUES, PIECE_ICONS } from '../types/types.js';
export class Shop {
    constructor() {
        this.points = 0;
        this.inventory = new Map();
        // Start with one king and one rook
        this.inventory.set('king', 1);
        this.inventory.set('rook', 1);
    }
    getPoints() {
        return this.points;
    }
    addPoints(amount) {
        this.points += amount;
    }
    setPoints(amount) {
        this.points = amount;
    }
    canBuy(pieceType) {
        const cost = this.getPieceCost(pieceType);
        if (pieceType === 'king') {
            return false; // Can't buy more kings
        }
        return this.points >= cost;
    }
    buyPiece(pieceType) {
        if (!this.canBuy(pieceType))
            return false;
        const cost = this.getPieceCost(pieceType);
        this.points -= cost;
        const current = this.inventory.get(pieceType) || 0;
        this.inventory.set(pieceType, current + 1);
        return true;
    }
    getInventory() {
        const items = [];
        const pieceOrder = ['king', 'queen', 'rook', 'bishop', 'knight', 'pawn'];
        for (const type of pieceOrder) {
            const count = this.inventory.get(type) || 0;
            if (count > 0) {
                items.push({ type, count });
            }
        }
        return items;
    }
    getPieceCount(type) {
        return this.inventory.get(type) || 0;
    }
    removePiece(type) {
        const count = this.inventory.get(type) || 0;
        if (count > 0) {
            this.inventory.set(type, count - 1);
            return true;
        }
        return false;
    }
    addPiece(type) {
        const current = this.inventory.get(type) || 0;
        this.inventory.set(type, current + 1);
    }
    getPieceCost(type) {
        // Cost equals the piece value
        return PIECE_VALUES[type];
    }
    getShopItems() {
        const items = [];
        const buyableTypes = ['queen', 'rook', 'bishop', 'knight', 'pawn'];
        for (const type of buyableTypes) {
            items.push({
                type,
                cost: this.getPieceCost(type),
                icon: PIECE_ICONS.white[type]
            });
        }
        return items;
    }
}
