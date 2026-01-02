import { PieceType, PIECE_VALUES, PIECE_ICONS } from '../types/types.js';

export interface InventoryItem {
    type: PieceType;
    count: number;
}

export class Shop {
    private points: number;
    private inventory: Map<PieceType, number>;
    
    constructor() {
        this.points = 0;
        this.inventory = new Map();
        // Start with one king and one rook
        this.inventory.set('king', 1);
        this.inventory.set('rook', 1);
    }

    public getPoints(): number {
        return this.points;
    }

    public addPoints(amount: number): void {
        this.points += amount;
    }

    public setPoints(amount: number): void {
        this.points = amount;
    }

    public canBuy(pieceType: PieceType): boolean {
        const cost = this.getPieceCost(pieceType);
        if (pieceType === 'king') {
            return false; // Can't buy more kings
        }
        return this.points >= cost;
    }

    public buyPiece(pieceType: PieceType): boolean {
        if (!this.canBuy(pieceType)) return false;
        
        const cost = this.getPieceCost(pieceType);
        this.points -= cost;
        
        const current = this.inventory.get(pieceType) || 0;
        this.inventory.set(pieceType, current + 1);
        
        return true;
    }

    public getInventory(): InventoryItem[] {
        const items: InventoryItem[] = [];
        const pieceOrder: PieceType[] = ['king', 'queen', 'rook', 'bishop', 'knight', 'pawn'];
        
        for (const type of pieceOrder) {
            const count = this.inventory.get(type) || 0;
            if (count > 0) {
                items.push({ type, count });
            }
        }
        
        return items;
    }

    public getPieceCount(type: PieceType): number {
        return this.inventory.get(type) || 0;
    }

    public removePiece(type: PieceType): boolean {
        const count = this.inventory.get(type) || 0;
        if (count > 0) {
            this.inventory.set(type, count - 1);
            return true;
        }
        return false;
    }

    public addPiece(type: PieceType): void {
        const current = this.inventory.get(type) || 0;
        this.inventory.set(type, current + 1);
    }

    public getPieceCost(type: PieceType): number {
        // Cost equals the piece value
        return PIECE_VALUES[type];
    }

    public getShopItems(): { type: PieceType, cost: number, icon: string }[] {
        const items: { type: PieceType, cost: number, icon: string }[] = [];
        const buyableTypes: PieceType[] = ['queen', 'rook', 'bishop', 'knight', 'pawn'];
        
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

