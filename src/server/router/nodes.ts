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
  .query("getGoals", {
    async resolve({ ctx }) {
      const goals = await ctx.prisma.node.findMany({
        select: {
          id: true,
          goal: true
        },
        where: {
          archive: false
        }
      });
      const out = new Map<string, string>()
      goals.forEach(({id, goal}) => {
        out.set(id, goal);
      })
      return out 
    },
  })
  .mutation("updateNode", {
    input: z.object({
      nodeId: z.string(),
      cords: z.object({x: z.number(), y: z.number()}),
    }),
    async resolve({ input, ctx }) {
      return await ctx.prisma.node.upsert({
        where: {id: input.nodeId},
        update: {
          x: Math.floor(input.cords.x),
          y: Math.floor(input.cords.y)
        },
        create: {
          id: input.nodeId,
          x: Math.floor(input.cords.x),
          y: Math.floor(input.cords.y)
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
  .mutation("archiveNode", {
    input: z.object({
      nodeId: z.string(),
      archive: z.boolean() 
    }),
    async resolve({ input, ctx }) {
      return await ctx.prisma.node.update({
        where: {id: input.nodeId},
        data: {
          archive: input.archive
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
  });
