-- Add the column as nullable first
ALTER TABLE "PollOption" ADD COLUMN "order" INTEGER;

-- Update existing rows with an order starting from 0 for each poll
UPDATE "PollOption" po
SET "order" = subquery.row_number - 1
FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY "pollId" ORDER BY id) as row_number
    FROM "PollOption"
) as subquery
WHERE po.id = subquery.id;

-- Make the column required
ALTER TABLE "PollOption" ALTER COLUMN "order" SET NOT NULL;