export enum PhaseType {
    None = 0,
    Brainstorm,
    Vote,
    Collaboration,
    Finished
}


export interface Phase {
    ptype?: PhaseType; // phase type
    start: Date;
    end:Date;
    active:Boolean;
    state:string;
    description?:string;
    image?:string;
}

//export = Phase;