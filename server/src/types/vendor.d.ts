declare module NodeJS  {
  interface Global {
    appRoot: string;
    lambda: boolean;
  }
}