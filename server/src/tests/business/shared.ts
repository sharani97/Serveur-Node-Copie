
import randomstring = require('randomstring');
import bcrypt = require('bcrypt');
import UserModel = require('../../app/model/UserModel');

// import JwtUser = require('../../app/model/interfaces/JwtUser');

export const _email = "test@test.com";
export const _email2 = "test2@test.com";
export const _pass = randomstring.generate();
export const _pass2 = randomstring.generate();
export const _name='testman';



export const _id = 'test.user';

export var token:string;

//export var jwt:string; 

export class cached {
    static mission1:any
    static mission2:any
}

export class ws {
    static ws_admin:any
    static ws_ent_admin:any
    static ws_org_admin:any
    static ws_guest:any
}


export class users {
    static admin:any
    static ent_admin:any
    static org_admin:any
    static guest:any
    static register_user:UserModel
    static login_user:UserModel
}

export class tokens {

    static ent_admin_jwt:string;

    static jwt: string;
    static jwt2:string;

    static test_user:any;

    static test_user_jwt:string;
    static conversation_id:string;
    static orgadmin_jwt:string;
    static entity_id:string;
    static new_orguser_id:string;
    static new_org_id:string;
    static general_org_id:string;
    static mission_id:string;
    static mission_id2:string;
    static mission_id3:string;
    static group_id1:string;
    static group_id2:string;

    static notif_id:string;

}

export const generalEntity = {
    id:"general_entity",
    name: "General Entity",
    description:"general entity",
    email_admin:["entadmin@test.org"],
};


export const generalOrg = {
    id:"common",
    name: "common org"
};


export const testOrg = {
    id:"testorg",
    name: "test Org",
    email_admin:["orgadmin@test.org", "orgAdmin@test.org", "bob@test.org"],
    max_user_nb:10
};

export const testGroup = {
    title:"this is a test group"
};


export const secondGroup = {
    title:"this is a second test group"
};

export const userData = {
    id: _id,
    token: bcrypt.hashSync(_pass, 3),
    password:_pass,
    username: _name,
    name: _name,
    email: _email,
    auth_type: 'email',
    roles: ['admin'],
    points:[
        {
            name: 'xp',
            amount:0
        }
    ]
};

export const login_user = {
    pass: _pass,
    email: _email
};

export var register_user = {
    pass: _pass,
    email: _email
};


export const test_user = {
    email: 'jim@test.org',
    pass: 'thisisatest',
    username: 'thisisatest'
}
