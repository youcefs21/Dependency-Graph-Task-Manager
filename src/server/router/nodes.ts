import {resolve} from "dns";
import { createRouter } from "./context";
import { z } from "zod";

export const nodeRouter = createRouter()
  .query("getNodes", {
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
  .query("getPairs", {
    async resolve({ ctx }) {
      return await ctx.prisma.edge.findMany({
        select: {
          node1_id: true,
          node2_id: true,
        }
      });
    },
  })
  .query("getGoals", {
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
  })
  .query("updateNode", {
    input: z.object({
      nodeId: z.string(),
      cords: z.object({x: z.number(), y: z.number()})
    }),
    async resolve({ input, ctx }) {
      return await ctx.prisma.node.update({
        where: {id: input.nodeId},
        data: { x: input.cords.x, y: input.cords.y}
      });
    },
  });
