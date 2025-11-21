export interface UserDinerPreferences {
    id: string;
    userId: string;
    mealType: 'lunch' | 'dinner';
    familyMemberId: string;
    createdAt: Date;
}
