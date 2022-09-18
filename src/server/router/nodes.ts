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
    input: z.object({
      userID: z.string().nullish(),
      graphID: z.string().nullish(),
    }),
    async resolve({ ctx, input }) {
      if (input.userID === null || input.graphID === null) return;
      if (input.userID !== ctx.session?.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      const graph = await ctx.prisma.graph.findUnique({
        where: {
          id: input.graphID,
        },
        select: {
          userId: true,
        },
      });
      if (graph?.userId !== input.userID) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      return await ctx.prisma.node.findMany({
        where: {
          graphId: input.graphID,
        },
        select: {
          description: true,
          due: true,
          goal: true,
          id: true,
          nodeLayers: true,
          nodeDependencies: true,
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
  .mutation("updateNode", {
    input: z.object({
      nodeId: z.string(),
      graphId: z.string(),
      userId: z.string(),
      nodeDependencies: z.string(),
      nodeLayers: z.string(),
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
      
      const graph = await ctx.prisma.graph.findUnique({
        where: {
          id: input.graphId,
        },
        select: {
          userId: true,
        },
      });
      if (graph?.userId !== input.userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      return await ctx.prisma.node.upsert({
        where: {id: input.nodeId},
        update: {
          x: input.cords?.x,
          y: input.cords?.y,
          goal: input.goal,
          nodeDependencies: input.nodeDependencies,
          nodeLayers: input.nodeLayers,
          archive: input.archive,
          description: input.description,
          size: input.nodeSize,
          due: input.due,
          priority: input.priority,
          cascadeDue: input.cascadeDue
        },
        create: {
          id: input.nodeId,
          graphId: input.graphId,
          nodeDependencies: input.nodeDependencies,
          nodeLayers: input.nodeLayers,
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
  .mutation("deleteNode", {
    input: z.object({
      nodeId: z.string(),
      userId: z.string(),
      graphId: z.string(),
    }),
    async resolve({ input, ctx }) {
      if (input.userId !== ctx.session?.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      const graph = await ctx.prisma.graph.findUnique({
        where: {
          id: input.graphId,
        },
        select: {
          userId: true,
        },
      });
      if (graph?.userId !== input.userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return await ctx.prisma.node.deleteMany({
        where: {
          graphId: input.graphId,
          id: input.nodeId,
        },
      });
    },
  });