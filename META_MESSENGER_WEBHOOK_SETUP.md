# Meta Messenger SMS Alert Setup

This webhook sends an SMS alert to `LIVE_TECHNICIAN_SMS_TO` or `P1_DISPATCH_SMS_TO` when a customer sends the All Solutions Facebook Page a Messenger message.

## Environment variables

Configure these production variables in Vercel:

```text
META_MESSENGER_APP_SECRET=
META_MESSENGER_VERIFY_TOKEN=
```

`META_MESSENGER_VERIFY_TOKEN` is a long random value you create and enter identically in Meta's callback setup. Do not commit either value.

The existing production variables must also be present:

```text
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_SMS=
LIVE_TECHNICIAN_SMS_TO=+18017553040
```

## Meta configuration

1. Create or open the app at `https://developers.facebook.com/apps/`.
2. Add the **Messenger** product.
3. Set the callback URL to:

```text
https://ashaac.com/api/webhooks/meta/messenger
```

4. Enter the same `META_MESSENGER_VERIFY_TOKEN` value.
5. Subscribe the Page to the `messages` webhook field.
6. Generate a Page access token with the required Page messaging permissions and complete Meta's required app review before production customer messaging is enabled.

## Behavior

- Meta verifies the endpoint with a signed GET challenge.
- POST events require the `X-Hub-Signature-256` HMAC signature.
- Echo messages are ignored, so only customer-originated messages send alerts.
- The SMS contains the Messenger sender ID and message text or attachment type. It does not attempt to reply to the Facebook customer.