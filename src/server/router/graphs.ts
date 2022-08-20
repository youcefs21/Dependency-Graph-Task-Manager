import {z} from "zod";
import { createRouter } from "./context";

export const graphsRouter = createRouter()
  .query("getFirst", {
    input: z.object({
      userId: z.string().nullish(),
    }),
    async resolve({ input, ctx }) {
      if (input.userId === null) return;
      const firstGraph = await ctx.prisma.graph.findFirst({
        where: {
          userId: input.userId
        }
      });
      
      if (firstGraph === null) {
        return await ctx.prisma.graph.create({
          data: {
            userId: input.userId!,
            scale: 10
          }
        })
      } else {
        return firstGraph
      }

    }
  })
  .mutation("updateOne", {
    input: z.object({
      graphid: z.string(),
      userId: z.string(),
      name: z.string().optional(),
      scale: z.number().optional(),
      pos: z.object({
        x: z.number(),
        y: z.number()
      }).optional()
    }),
    async resolve({ input, ctx }) {
      return await ctx.prisma.graph.update({
        where: {id: input.graphid},
        data: {
          userId: input.userId,
          name: input.name,
          x: input.pos?.x,
          y: input.pos?.y,
          scale: input.scale
        },
      });
    },
  });

