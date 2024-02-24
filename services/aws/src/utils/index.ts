// AWS transforms all metadata keys to lowercase. TODO: Fix this in the future -> just ship
export interface Metadata {
  authorid: string;
  caption?: string;
  tags?: string;
}

export const kebabToPascal = (str: string) => {
  return str.replace(/(^|-)./g, (match) =>
    match.charAt(match.length - 1).toUpperCase(),
  );
};

export const isMetadata = (metadata: unknown): metadata is Metadata => {
  const m = metadata as Metadata;
  return (
    m.authorid !== undefined && m.caption !== undefined && m.tags !== undefined
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

