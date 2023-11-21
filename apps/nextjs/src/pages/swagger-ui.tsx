import type { NextPage } from "next";
import dynamic from "next/dynamic";
import Error from "next/error";

import "swagger-ui-react/swagger-ui.css";

const SwaggerUIComponent = dynamic(() => import("swagger-ui-react"), {
  ssr: false,
});

const SwaggerUI: NextPage = () => {
  if (process.env.NODE_ENV !== "development") {
    return <Error statusCode={404} />;
  }

  return <SwaggerUIComponent url="/api/openapi.json" />;
};

export default SwaggerUI;
