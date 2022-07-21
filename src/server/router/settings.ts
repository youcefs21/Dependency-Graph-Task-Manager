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
  .query("updateScale", {
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
  });
