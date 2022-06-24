
interface RegisterUser {

    email:string,
    password:string,
    username:string
    name: string;
    first_name: string;
    profileUrl: string;

}

export interface IRegisterOnMutationArguments {
    user: RegisterUser
}


export interface ILoginOnMutationArguments {
    email:string,
    password:string
}