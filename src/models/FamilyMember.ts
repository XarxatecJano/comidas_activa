export interface FamilyMember {
  id: string;
  userId: string;
  name: string;
  preferences?: string;
  dietaryRestrictions?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFamilyMemberDTO {
  userId: string;
  name: string;
  preferences?: string;
  dietaryRestrictions?: string;
}

export interface UpdateFamilyMemberDTO {
  name?: string;
  preferences?: string;
  dietaryRestrictions?: string;
}
