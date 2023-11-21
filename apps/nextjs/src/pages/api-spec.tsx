import type { NextPage } from "next";
import dynamic from "next/dynamic";
import Error from "next/error";

import "swagger-ui-react/swagger-ui.css";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), {
  ssr: false,
});

const ApiSpec: NextPage = () => {
  if (process.env.NODE_ENV !== "development") {
    return <Error statusCode={404} />;
  }

  return <SwaggerUI url="/api/openapi.json" />;
};

export default ApiSpec;
