All steps to integrate the AI-powered therapy bot have been completed.

**Before running the application, please perform the following crucial steps manually:**

1.  **Install new dependencies:**
    Open your terminal in the project root and run:
    ```bash
    npm install
    ```
    This will install `@google/generative-ai` and `uuid` which were added to `package.json`.

2.  **Update your database schema:**
    After installing dependencies, run the Prisma migration to create the `ChatMessage` table:
    ```bash
    npx prisma migrate dev --name add-chat-message
    ```

Once these steps are completed, you should be able to run `npx ts-node src/main.ts` and interact with the new AI chat functionality via the tRPC endpoint.