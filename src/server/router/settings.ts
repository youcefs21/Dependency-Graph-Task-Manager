import {z} from "zod";
import { createRouter } from "./context";

export const settingsRouter = createRouter()
  .query("getAll", {
    async resolve({ ctx }) {
      return await ctx.prisma.settings.findFirst({
        select: {
          scale: true,
          x: true,
          y: true
        }
      });
    }
  })
  .mutation("updateAll", {
    input: z.object({
      userId: z.string(),
      scale: z.number().optional(),
      pos: z.object({
        x: z.number(),
        y: z.number()
      }).optional()
    }),
    async resolve({ input, ctx }) {
      return await ctx.prisma.settings.upsert({
        where: {userId: input.userId},
        update: {
          x: input.pos?.x,
          y: input.pos?.y,
          scale: input.scale
        },
        create: {
          userId: input.userId,
          x: input.pos?.x,
          y: input.pos?.y,
          scale: input.scale
        }
      });
    },
  });

