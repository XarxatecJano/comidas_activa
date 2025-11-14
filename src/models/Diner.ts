export interface Diner {
  id: string;
  name: string;
  preferences?: string;
}

export interface CreateDinerDTO {
  name: string;
  preferences?: string;
}
