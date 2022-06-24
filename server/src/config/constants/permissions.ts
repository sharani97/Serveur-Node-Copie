class Permissions {
    static perms: Object = {
        jobs: {
            get:  ['tool', 'admin','orgadmin'],
            post:  ['tool','admin','orgadmin'],
            put: ['tool','admin','orgadmin'],
            delete: ['tool','dev', 'admin']
        },
        entities: {
            get: ['admin','entadmin'],
            post: ['admin'],
            put: ['entadmin','admin'],
            delete: ['dev']
        },
        orgs: {
            get: ['admin','entadmin', 'orgadmin'],
            post: ['admin', 'entadmin', 'orgadmin'],
            put: ['orgadmin','admin','entadmin'],
            delete: ['dev', 'admin']
        },
        groups: {
            get: ['orgadmin','admin','entadmin'],
            post: ['orgadmin','admin'],
            put: ['orgadmin','admin'],
            delete: ['dev', 'distrib', 'admin', 'orgadmin']
        },
        users: {
            get: ['admin','entadmin', 'orgadmin'],
            post: ['admin'],
            put: ['admin'],
            delete: []
        },
        ideas: {
            get: ['user'],
            post: ['user'],
            put: ['user'],
            delete: ['admin', 'orgadmin']
        },

        upload:{
            get: ['user'],
            post: ['admin', 'orgadmin','entadmin' ,'user'],
            put: ['admin', 'orgadmin','entadmin', 'user'],
            delete: []
        },

        missions: {
            get: ['user'],
            post: ['admin','orgadmin'],
            put: ['admin','orgadmin'],
            delete: ['admin','orgadmin']
        },
        me: {
            get: ['user'],
            post: ['user'],
            put: ['user'],
            delete: []
        }

    }
}


export = Permissions;