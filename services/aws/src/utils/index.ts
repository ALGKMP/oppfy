// AWS transforms all metadata keys to lowercase. TODO: Fix this in the future -> just ship
export interface MediaMedata {
  author: string;
  caption?: string;
  tags?: string;
}

export interface ProfileMetadata {
  user: string;
  key: string;
  bucket: string;
}

export interface PostMetadata {
  author: string;
  recipient: string;
  caption?: string;
};

export const kebabToPascal = (str: string) => {
  return str.replace(/(^|-)./g, (match) =>
    match.charAt(match.length - 1).toUpperCase(),
  );
};

export const isMetadata = (metadata: unknown): metadata is MediaMedata => {
  const m = metadata as MediaMedata;
  return (
    m.author !== undefined && m.caption !== undefined && m.tags !== undefined
  );
};

export const camelToKebab = (str: string) => {
  return (
    str
      // Insert a hyphen before each uppercase letter and convert that letter to lowercase
      .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
      .toLowerCase()
  );
};

export const pascalToKebab = (str: string) => {
  return (
    str
      // Insert a hyphen before each uppercase letter (except the first one) and convert that letter to lowercase
      .replace(/([a-z])([A-Z])/g, "$1-$2")
      .toLowerCase()
  );
};

