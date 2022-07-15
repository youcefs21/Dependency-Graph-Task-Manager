import { createRouter } from "./context";

export const nodeRouter = createRouter()
  .query("getAll", {
    async resolve({ ctx }) {
      return await ctx.prisma.node.findMany();
    },
  });
