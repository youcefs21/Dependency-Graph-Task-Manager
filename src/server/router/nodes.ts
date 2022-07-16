import { createRouter } from "./context";

export const nodeRouter = createRouter()
  .query("getAll", {
    async resolve({ ctx }) {
      return await ctx.prisma.node.findMany();
    }
  })
  .query("connections", {
    async resolve({ ctx }) {
      return await ctx.prisma.node.findMany({
        select: {
          id: true,
          in_edges: true,
          out_edges: true,
        }
      });
    },
  });
