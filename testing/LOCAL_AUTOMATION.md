# Local Automated Testing

This project can be tested locally without GitHub Actions.

## What it does

`npm run test:local` will:

1. Start the backend automatically if it is not running.
2. Start the local frontend server automatically.
3. Open the internship awareness system in a browser.
4. Run the real student/company/admin flow one step at a time.
5. Fill usernames, passwords, forms, search fields, and approval actions automatically.

## Use this command

```bash
npm run test:local
```

## What you will see

- A browser window opens on your system.
- The test logs show steps like registration, login, posting internships, approval, application, and notifications.
- If something fails, the browser stays on the step that failed so you can inspect it.

## If the browser does not open

Set the browser browsers first:

```bash
npx playwright install chromium
```

## If you want only the automated flow

Use the same command above. It is already designed for local system testing, not GitHub Actions.
