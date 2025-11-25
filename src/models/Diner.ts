export interface Diner {
  id: string;
  name: string;
  preferences?: string;
  familyMemberId?: string;
}

export interface CreateDinerDTO {
  name: string;
  preferences?: string;
  familyMemberId?: string;
}

export interface ResolvedDiner {
  id?: string;
  familyMemberId?: string;
  name: string;
  preferences?: string;
  dietaryRestrictions?: string;
}
