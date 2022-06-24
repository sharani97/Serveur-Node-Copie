/**
 * Created by D. Hockley on 16-06-2016.
 */

interface Read<T> {
    retrieve:  (callback: (error: any, result: T) => void) => void ;
    retrievePage: (n: number, pagesize: number, callback: (error: any, result: T) => void) => void ;
    count:     (callback: (error: any, result: T) => void) => void ;
    findById:  (_id: string, callback: (error: any, result: T) => void) => void;
    findById$:  (_id: string) => Promise<T>;
    findOne:   (_id: Object, callback: (error: any, result: T) => void) => void;
    findQuery: (_query: Object, callback: (error: any, result: T) => void) => void;
    findText:  (_text: string, callback: (error: any, result: T) => void) => void;
    findName:  (_text: string, callback: (error: any, result: T) => void) => void;
    limitedfindQuery:(_query: Object, limit: number, callback: (error: any, result: T) => void) => void;
    limitedTopQuery:(_query: Object, limit: number, criterion: string, callback: (error: any, result: T) => void) => void;
}

export = Read;