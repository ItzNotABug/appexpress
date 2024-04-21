# AppExpress Demo

This is an Appwrite Function demonstrating the `AppExpress` framework.

## Table of Contents

- [Building](#building)
- [Live Function Testing](#live-function-testing)

## Building

`cd` in to `functions` directory & run below to create a `code.tar.gz` :

```shell
tar --exclude code.tar.gz --exclude node_modules -czf code.tar.gz .
```

Note: You can also use `appwrite-cli` to push this function directly.

Finally, create a deployment if uploading manually, below are the config details -

1. Endpoint - `index.js`
2. Build Commands - `npm install`

## Live Function Testing

Try with the urls listed below for testing different routes -

| URLs                                                                                   | Description                                                   |
|----------------------------------------------------------------------------------------|---------------------------------------------------------------| 
| https://appexpress.appwrite.global                                                     | Renders a html content from `string`.                         |  
| https://appexpress.appwrite.global/?html=true                                          | Renders a html content from `file`.                           |
| https://appexpress.appwrite.global/all                                                 | Do any type of request, you'll only see one message.          |
| https://appexpress.appwrite.global/post                                                | Do a `POST` request with Postman or cURL.                     |
| https://appexpress.appwrite.global/dump                                                | Do a `GET` request and see a dumped `request`.                |
| https://appexpress.appwrite.global/redirect?redirect_url=https://google.com            | Redirects to a given url. Defaults to my GitHub Profile.      |
| https://appexpress.appwrite.global/users/b4b2f41ee0a3/74a56d192dc942f78675b4b2f41ee0a3 | Do a `GET` request, this route extracts `id` & `transaction`. |
