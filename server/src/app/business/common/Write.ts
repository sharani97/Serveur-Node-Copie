/**
 * Created by D. Hockley on 16-06-2016.
 */

import JwtUser = require ('./../../model/interfaces/JwtUser');
import { deleteResult } from '../../shared/deleteResult';
interface Write <T> {
    create: (item: T, callback: (error: any, result: any ) => void) => void;
    update:(_id: string, item: T, _user:JwtUser, callback: (error: any, result: any)=> void) => void ;
    delete$:  (_id: string, _user:JwtUser) => Promise<deleteResult>;
    delete: (_id: string, _user:JwtUser, callback: (error: any, result: any) => void) => void;
    action: (_id: string, _name:string, _payload:any, _user:JwtUser, callback: (error: any, result: any) => void) => void;
    deleteField: (_id: string, _fieldName: string, _user:JwtUser, callback: (error: any, result: any) => void) => void;
    setFieldAndLog: (_id: string, field: string, value: any, logical_name:string, _user:JwtUser, callback: (error: any, result: any) => void) => void;

}

export = Write;