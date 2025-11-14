export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  preferences: string;
  defaultDiners: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDTO {
  email: string;
  password: string;
  name: string;
  preferences?: string;
  defaultDiners?: number;
}

export interface UpdateUserDTO {
  email?: string;
  name?: string;
  preferences?: string;
  defaultDiners?: number;
}
