import { Request } from "express"
import JwtUser = require ('../app/model/interfaces/JwtUser');
export interface IUserRequest extends Request {
  user: JwtUser // or any other type
}