import { useMemo } from "react";
import { useLocalSearchParams } from "expo-router";

type ParamValue = string | boolean | null | undefined;

export default function useParams<T extends Record<string, ParamValue>>() {
  const params = useLocalSearchParams();
  const parsedParams = useMemo(
    () =>
      Object.keys(params).reduce((acc, key) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let value: any = params[key];

        switch (value) {
          case "true": {
            value = true;
            break;
          }
          case "false": {
            value = false;
            break;
          }
          case "null": {
            value = null;
            break;
          }
          case "undefined": {
            value = undefined;
            break;
          }
          default: {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            const numberValue = parseInt(value, 10);
            if (!Number.isNaN(numberValue) && String(numberValue) === value) {
              value = numberValue;
            }
          }
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        return { ...acc, [key]: value };
      }, {} as T),
    [params],
  );

  return parsedParams;
}
