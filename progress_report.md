Here's a progress update:

**Completed:**
*   Added `@google/generative-ai` dependency to `package.json`.
*   Switched from Gemini SDK to AvalAI (native fetch). Added `AVALAI_API_KEY` and `AI_MODEL_NAME` to `.env`.
*   Updated `prisma/schema.prisma` with the new `ChatMessage` model.

**In Progress:**
*   Creating the `ChatMessage` domain entity.

**Next Steps (User Action Required):**
*   Please run `npm install` to install the new dependencies.
*   Please run `npx prisma migrate dev` to update your database schema with the `ChatMessage` model.

I will continue with the remaining tasks once these prerequisite actions are addressed.