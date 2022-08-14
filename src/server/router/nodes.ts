import { createRouter } from "./context";
import { z } from "zod";

export const nodeRouter = createRouter()
  .query("getAll", {
    async resolve({ ctx }) {
      return await ctx.prisma.node.findMany({
        select: {
          id: true,
          x: true,
          y: true,
          goal: true,
          description: true
        },
        where: {
          archive: false
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
  .mutation("updateNode", {
    input: z.object({
      nodeId: z.string(),
      cords: z.object({x: z.number(), y: z.number()}).optional(),
      goal: z.string().optional(),
      archive: z.boolean().optional(),
      description: z.string().nullish()
    }),
    async resolve({ input, ctx }) {
      return await ctx.prisma.node.upsert({
        where: {id: input.nodeId},
        update: {
          x: input.cords?.x,
          y: input.cords?.y,
          goal: input.goal,
          archive: input.archive,
          description: input.description
        },
        create: {
          id: input.nodeId,
          x: input.cords?.x,
          y: input.cords?.y,
          goal: input.goal,
          archive: input.archive,
          description: input.description
        }
      });
    },
  })
  .mutation("addPair", {
    input: z.object({
      node1Id: z.string(),
      node2Id: z.string()
    }),
    async resolve({ input, ctx }) {
      return await ctx.prisma.edge.create({
        data: {
          node1_id: input.node1Id,
          node2_id: input.node2Id
        }
      });
    },
  })
  .mutation("deleteNode", {
    input: z.object({
      nodeId: z.string()
    }),
    async resolve({ input, ctx }) {
      return await ctx.prisma.node.delete({
        where: {id: input.nodeId},
      });
    },
  })
  .mutation("deletePair", {
    input: z.object({
      node1Id: z.string(),
      node2Id: z.string()
    }),
    async resolve({ input, ctx }) {
      return await ctx.prisma.edge.deleteMany({
        where: {
          node1_id: input.node1Id,
          node2_id: input.node2Id
        }
      });
    },
  });
