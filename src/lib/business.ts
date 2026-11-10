import { prisma } from "./prisma";

export async function getBusinessProfile() {
  const profile = await prisma.businessProfile.findFirst();
  return profile;
}
