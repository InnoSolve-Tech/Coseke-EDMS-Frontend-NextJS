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
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address: string;
    password: string;
    roles: Role[];
}
