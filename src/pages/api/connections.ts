import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../server/db/client";

const connections = async (req: NextApiRequest, res: NextApiResponse) => {
  const connections = await prisma.edge.findMany({
    select: {
      node1: true, 
      node2: true
    }
  });
  res.status(200).json(connections);
};

export default connections;
