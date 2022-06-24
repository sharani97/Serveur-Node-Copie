// user as contained in JWT

interface JwtUser {
    id: string;
    // name: string;
    username: string;
    roles: Array<string>;
    orgs?:Array<string>;
    ents?:Array<string>;
    groups?:Array<string>;
    missions?:Array<string>;
    points?:{[id:string]:number};
    entorgs?:Array<string>;
    // groups?:Array<string>;
    // points?:{[id:string]:number};
}

export = JwtUser;