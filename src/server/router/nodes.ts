import { createRouter } from "./context";
import { z } from "zod";

export const nodeRouter = createRouter()
  .query("getAll", {
    input: z.object({userID: z.string().nullish()}),
    async resolve({ ctx, input }) {
      if (input.userID === null)
        return

      return await ctx.prisma.node.findMany({
        where: {
          userId: input.userID,
          archive: false
        }
      });
    }
  })
  .query("getPairs", {
    input: z.object({userID: z.string().nullish()}),
    async resolve({ ctx, input}) {
      if (input.userID === null) return;
      return await ctx.prisma.edge.findMany({
        select: {
          node1_id: true,
          node2_id: true,
        },
        where: {
          userId: input.userID
        }
      });
    },
  })
  .mutation("updateNode", {
    input: z.object({
      nodeId: z.string(),
      userId: z.string(),
      cords: z.object({x: z.number(), y: z.number()}).optional(),
      goal: z.string().optional(),
      archive: z.boolean().optional(),
      description: z.string().nullish(),
      nodeSize: z.number(),
      due: z.string().nullish(),
      priority: z.string()
    }),
    async resolve({ input, ctx }) {
      return await ctx.prisma.node.upsert({
        where: {id: input.nodeId},
        update: {
          x: input.cords?.x,
          y: input.cords?.y,
          goal: input.goal,
          archive: input.archive,
          description: input.description,
          size: input.nodeSize,
          due: input.due,
          priority: input.priority
        },
        create: {
          id: input.nodeId,
          userId: input.userId,
          x: input.cords?.x,
          y: input.cords?.y,
          goal: input.goal,
          archive: input.archive,
          description: input.description,
          priority: input.priority
        }
      });
    },
  })
  .mutation("addPair", {
    input: z.object({
      node1Id: z.string(),
      node2Id: z.string(),
      userId: z.string()
    }),
    async resolve({ input, ctx }) {
      if (input.userId === null) return;
      return await ctx.prisma.edge.create({
        data: {
          node1_id: input.node1Id,
          node2_id: input.node2Id,
          userId: input.userId
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
