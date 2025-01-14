import { User } from "./user";

export default interface Department {
  id?: number;
  departmentName: string;
  users?: User[];
  createdDate?: number[];
  lastModifiedDateTime?: number[];
  lastModifiedBy?: number;
  createdBy?: number;
}
