import { createBaseErrorClass } from "./errorFactory";

const AwsError = createBaseErrorClass("Aws");

export namespace AwsErrors {
    export class SQSFailedToSend extends AwsError {
        constructor(message: string) {
            super(message);
            this.name = "SQSFailedToSendError";
        }
    }
}