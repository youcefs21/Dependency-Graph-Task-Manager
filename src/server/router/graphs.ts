import {z} from "zod";
import { createRouter } from "./context";
import cuid from 'cuid';
import { TRPCError } from "@trpc/server";

export const graphsRouter = createRouter()
  .middleware(async ({ ctx, next }) => {
    // Any queries or mutations after this middleware will
    // raise an error unless there is a current session
    if (!ctx.session) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next();
  })
  .query("getFirst", {
    input: z.object({
      userId: z.string().nullish(),
    }),
    async resolve({ input, ctx }) {
      if (input.userId === null) return;
      if (input.userId !== ctx.session?.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      // get the first graph for the user
      let firstGraph = await ctx.prisma.graph.findFirst({
        where: {
          userId: input.userId
        },
        include: {
          layers: true
        }
      });
      
      // if the graph doesn't exist, create it, also create the complete layer
      if (firstGraph === null) {
        const layerId = cuid();
        firstGraph = await ctx.prisma.graph.create({
          data: {
            userId: input.userId!,
            scale: 10,
            layers: {
              create: {
                id: layerId,
                name: "Graph",
              }
            },
            completeLayerId: layerId
          },
          include: {
            layers: true
          }
        })
      }

      return firstGraph
      

    }
  })
  .mutation("updateOne", {
    input: z.object({
      graphid: z.string(),
      userId: z.string(),
      name: z.string(),
      scale: z.number(),
      pos: z.object({
        x: z.number(),
        y: z.number()
      }),
      completeLayerId: z.string(),
      showArchive: z.boolean()
    }),
    async resolve({ input, ctx }) {
      if (input.userId !== ctx.session?.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return await ctx.prisma.graph.update({
        where: {id: input.graphid},
        data: {
          userId: input.userId,
          name: input.name,
          x: input.pos.x,
          y: input.pos.y,
          scale: input.scale,
          completeLayerId: input.completeLayerId,
          showArchive: input.showArchive
        }
      });
    },
  })
  .mutation("upsertLayer", {
    input: z.object({
      layerId: z.string(),
      graphId: z.string(),
      userId: z.string(),
      name: z.string(),
      visible: z.boolean()
    }),
    async resolve({ input, ctx }) {
      if (input.userId !== ctx.session?.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return await ctx.prisma.layer.upsert({
        where: {
          id: input.layerId
        },
        update: {
          name: input.name,
          visible: input.visible
        },
        create: {
          id: input.layerId,
          graphId: input.graphId,
          name: input.name,
          visible: input.visible
        }
      });
    }
  })
  .mutation("deleteLayer", {
    input: z.object({
      userId: z.string(),
      layerId: z.string()
    }),
    async resolve({ input, ctx }) {
      if (input.userId !== ctx.session?.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return await ctx.prisma.layer.delete({
        where: {
          id: input.layerId
        }
      });
    }
  })

