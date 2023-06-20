/*
  Warnings:

  - A unique constraint covering the columns `[user_id,group_id]` on the table `UserGroup` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "UserGroup_user_id_group_id_key" ON "UserGroup"("user_id", "group_id");
