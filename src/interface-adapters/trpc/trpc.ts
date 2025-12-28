import { initTRPC, TRPCError } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import jwt from 'jsonwebtoken';

export const createContext = ({
  req,
  res,
}: CreateExpressContextOptions) => {
  const getUserFromHeader = () => {
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { id: string };
        return { id: decoded.id };
      } catch (err) {
        return null;
      }
    }
    return null;
  };

  const user = getUserFromHeader();

  return {
    req,
    res,
    user,
  };
};

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC.context<typeof createContext>().create();

/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
export const router = t.router;
export const publicProcedure = t.procedure;

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      ...ctx,
      // infers that `user` is non-nullable to downstream procedures
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthed);
