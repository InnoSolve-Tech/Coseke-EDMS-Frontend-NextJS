export interface Role {
    id: number;
    name: string;
    permissions: Permission[];
}

export interface Permission {
    id: number;
    name: string;
}

export interface User {
    id: number;
    firstName?: string;
    lastName?: string;
    email: string;
    phone: string;
    address: string;
    password: string;
    roles: Role[];
}
