# AppExpress Demo

This is an Appwrite Function demonstrating the `AppExpress` framework.

## Table of Contents

- [Building](#building)
- [Live Function Testing](#live-function-testing)

## Building

`cd` in to `function` directory & run below to create a `code.tar.gz` :

```shell
tar --exclude code.tar.gz --exclude node_modules -czf code.tar.gz .
```

Note: You can also use `appwrite-cli` to push this function directly.

Finally, create a deployment if uploading manually, below are the config details -

1. Endpoint - `index.js`
2. Build Commands - `npm install --omit=dev`

## Live Function Testing

Go to - https://appexpress.appwrite.global/routes to see all routes!