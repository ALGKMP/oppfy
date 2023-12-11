export type OmitKeysStartingWith<T, Prefix extends string> = {
  [K in keyof T as K extends `${Prefix}${string}` ? never : K]: T[K];
};

export type OmitKeysEndingWith<T, Suffix extends string> = {
  [K in keyof T as K extends `${string}${Suffix}` ? never : K]: T[K];
};

export type OmitKeysContaining<T, Infix extends string> = {
  [K in keyof T as K extends `${string}${Infix}${string}` ? never : K]: T[K];
};
