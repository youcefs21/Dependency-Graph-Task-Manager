import {resolve} from "dns";
import {z} from "zod";
import { createRouter } from "./context";

export const settingsRouter = createRouter()
  .query("getScale", {
    async resolve({ ctx }) {
      return await ctx.prisma.settings.findFirst({
        select: {
          scale: true
        }
      });
    }
  })
  .query("getPos", {
    async resolve({ ctx }) {
      return await ctx.prisma.settings.findFirst({
        select: {
          x: true,
          y: true
        }
      });
    }
  })
  .mutation("updateScale", {
    input: z.object({
      userId: z.string(),
      scale: z.number()
    }),
    async resolve({ input, ctx }) {
      return await ctx.prisma.settings.update({
        where: {userId: input.userId},
        data: {scale: input.scale}
      });
    },
  })
  .mutation("updatePos", {
    input: z.object({
      userId: z.string(),
      pos: z.object({
        x: z.number(),
        y: z.number()
      })
    }),
    async resolve({ input, ctx }) {
      return await ctx.prisma.settings.update({
        where: {userId: input.userId},
        data: {x: input.pos.x, y: input.pos.y}
      });
    },
  });

