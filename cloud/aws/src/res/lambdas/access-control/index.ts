import type {
  CloudFrontRequestEvent,
  CloudFrontRequestResult,
} from "aws-lambda";

export async function handler(
  event: CloudFrontRequestEvent,
): Promise<CloudFrontRequestResult> {
  const request = event.Records[0]?.cf.request;
  if (request === undefined) {
    return { status: "404", statusDescription: "Not Found" };
  }

  const uri = request.uri;

  try {
    const postId = uri.split("/").pop()?.split(".")[0]; // Extract postId from URI

    if (!postId) {
      return { status: "404", statusDescription: "Not Found" };
    }

    console.log("postId", postId);

    return request;
  } catch (error) {
    console.error("Error:", error);
    return { status: "500", statusDescription: "Internal Server Error" };
  }
}
