import {
  SESv2Client,
  SendEmailCommand,
  SendEmailCommandInput,
  SendEmailCommandOutput,
} from '@aws-sdk/client-sesv2';

const client = new SESv2Client({
  region: 'us-east-1',
});

export const sendEmail = async (
  toAddress: string,
  subject: string,
  body: any,
): Promise<SendEmailCommandOutput> => {
  const input = {
    Content: {
      Simple: {
        Body: {
          Text: {
            Data: body,
          },
        },
        Subject: {
          Data: subject,
        },
      },
    },
    Destination: {
      ToAddresses: [toAddress],
    },
    FromEmailAddress: 'no-reply@vt6005cem.space',
  } as SendEmailCommandInput;

  const command = new SendEmailCommand(input);
  const response = await client.send(command);
  return response;
};
