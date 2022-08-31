import { createRouter } from "./context";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const nodeRouter = createRouter()
  .middleware(async ({ ctx, next }) => {
    // Any queries or mutations after this middleware will
    // raise an error unless there is a current session
    if (!ctx.session) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next();
  })
  .query("getAll", {
    input: z.object({userID: z.string().nullish()}),
    async resolve({ ctx, input }) {
      if (input.userID === null) return;
      if (input.userID !== ctx.session?.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return await ctx.prisma.node.findMany({
        where: {
          userId: input.userID,
        },
        select: {
          description: true,
          due: true,
          goal: true,
          id: true,
          nodeLayers: {select: {layerId: true}},
          priority: true,
          size: true,
          x: true,
          y: true,
          archive: true,
          cascadeDue: true,
        }
      });
    }
  })
  .query("getPairs", {
    input: z.object({userID: z.string().nullish()}),
    async resolve({ ctx, input}) {
      if (input.userID === null) return;
      if (input.userID !== ctx.session?.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
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
      priority: z.string(),
      cascadeDue: z.boolean()
    }),
    async resolve({ input, ctx }) {
      if (input.userId !== ctx.session?.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
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
          priority: input.priority,
          cascadeDue: input.cascadeDue
        },
        create: {
          id: input.nodeId,
          userId: input.userId,
          x: input.cords?.x,
          y: input.cords?.y,
          goal: input.goal,
          archive: input.archive,
          description: input.description,
          priority: input.priority,
          cascadeDue: input.cascadeDue
        }
      });
    },
  })
  .mutation("addNodeLayer", {
    input: z.object({
      nodeId: z.string(),
      layerId: z.string(),
      userId: z.string(),
    }),
    async resolve({ input, ctx }) {
      if (input.userId !== ctx.session?.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return await ctx.prisma.nodeLayers.create({
        data: {
          nodeId: input.nodeId,
          layerId: input.layerId
        }
      });
    }
  })
  .mutation("addPair", {
    input: z.object({
      node1Id: z.string(),
      node2Id: z.string(),
      userId: z.string()
    }),
    async resolve({ input, ctx }) {
      if (input.userId === null) return;
      if (input.userId !== ctx.session?.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
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
      nodeId: z.string(),
      userId: z.string()
    }),
    async resolve({ input, ctx }) {
      if (input.userId !== ctx.session?.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return await ctx.prisma.node.delete({
        where: {id: input.nodeId},
      });
    },
  })
  .mutation("deleteNodeLayer", {
    input: z.object({
      nodeId: z.string(),
      layerId: z.string(),
      userId: z.string()
    }),
    async resolve({ input, ctx }) {
      if (input.userId !== ctx.session?.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return await ctx.prisma.nodeLayers.deleteMany({
        where: {
          nodeId: input.nodeId,
          layerId: input.layerId
        }
      });
    },
  })
  .mutation("deletePair", {
    input: z.object({
      node1Id: z.string(),
      node2Id: z.string(),
      userId: z.string()
    }),
    async resolve({ input, ctx }) {
      if (input.userId !== ctx.session?.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return await ctx.prisma.edge.deleteMany({
        where: {
          node1_id: input.node1Id,
          node2_id: input.node2Id
        }
      });
    },
  });
