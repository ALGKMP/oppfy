import type {
  Context,
  KinesisStreamEvent,
  KinesisStreamRecord,
} from "aws-lambda";

export const handler = async (event: KinesisStreamEvent, _context: Context) => {
  for (const record of event.Records) {
    const payload = Buffer.from(record.kinesis.data, "base64").toString(
      "utf-8",
    );
    console.log("Received record:", payload);
  }
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Records processed successfully" }),
  };
};
