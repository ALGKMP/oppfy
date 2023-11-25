export type OmitPropsStartingWith<T, Prefix extends string> = {
  [K in keyof T as K extends `${Prefix}${infer Rest}` ? never : K]: T[K];
};
