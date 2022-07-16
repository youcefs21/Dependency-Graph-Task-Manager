import { createRouter } from "./context";

export const nodeRouter = createRouter()
  .query("getAll", {
    async resolve({ ctx }) {
      return await ctx.prisma.node.findMany();
    }
  })
  .query("pairs", {
    async resolve({ ctx }) {
      return await ctx.prisma.edge.findMany({
        select: {
          node1_id: true,
          node2_id: true,
        }
      });
    },
  });
