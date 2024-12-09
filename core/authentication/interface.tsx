export interface ILoginState {
  email: string;
  password: string;
}

export interface IPermission {
  id: number | string;
  name: string;
}

export interface IRole {
  id: string | number;
  name: string;
  permissions: Array<IPermission>;
}

export interface IUserDetails {
  id?: string | number;
  token: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  roles: Array<IRole>;
  address: string;
  password?: string;
}
