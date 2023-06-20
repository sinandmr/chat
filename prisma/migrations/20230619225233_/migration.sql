-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_recipient_id_fkey";

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "group_id" TEXT,
ALTER COLUMN "recipient_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;
