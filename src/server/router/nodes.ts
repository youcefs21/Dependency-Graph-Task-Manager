import {resolve} from "dns";
import { createRouter } from "./context";

export const nodeRouter = createRouter()
  .query("getAll", {
    async resolve({ ctx }) {
      return await ctx.prisma.node.findMany({
        select: {
          id: true,
          x: true,
          y: true
        }
      });
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
  })
  .query("goals", {
    async resolve({ ctx }) {
      const goals = await ctx.prisma.node.findMany({
        select: {
          id: true,
          goal: true
        }
      });
      const out = new Map<string, string>()
      goals.forEach(({id, goal}) => {
        out.set(id, goal);
      })
      return out 
    },
  });
