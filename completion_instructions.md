All steps to integrate the AI-powered therapy bot have been completed.

**Before running the application, please perform the following crucial steps manually:**

1.  **Install dependencies (if you haven't already):**
    Open your terminal in the project root and run:
    ```bash
    pnpm install
    ```
    No new AI SDKs are required — the integration now uses the native Node.js `fetch` API to call AvalAI.
2.  **Update your database schema:**
    After installing dependencies, run the Prisma migration to create the `ChatMessage` table:
    ```bash
    npx prisma migrate dev --name add-chat-message
    ```

Once these steps are completed, you should be able to run `npx ts-node src/main.ts` and interact with the new AI chat functionality via the tRPC endpoint.