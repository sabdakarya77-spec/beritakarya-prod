-- Migration: Rename ad slot values from old names to location-based names
-- Old: leaderboard, rectangle, rectangle_secondary, in_feed
-- New: HOME_TOP, HOME_FEED_1, HOME_FEED_2, ARTICLE_TOP, ARTICLE_MIDDLE, ARTICLE_BOTTOM

-- Advertisement table
UPDATE "Advertisement" SET slot = 'HOME_TOP' WHERE slot = 'leaderboard';
UPDATE "Advertisement" SET slot = 'HOME_FEED_1' WHERE slot = 'rectangle';
UPDATE "Advertisement" SET slot = 'HOME_FEED_2' WHERE slot = 'rectangle_secondary';
UPDATE "Advertisement" SET slot = 'ARTICLE_MIDDLE' WHERE slot = 'in_feed';

-- AdPackage table
UPDATE "AdPackage" SET slot = 'HOME_TOP' WHERE slot = 'leaderboard';
UPDATE "AdPackage" SET slot = 'HOME_FEED_1' WHERE slot = 'rectangle';
UPDATE "AdPackage" SET slot = 'HOME_FEED_2' WHERE slot = 'rectangle_secondary';
UPDATE "AdPackage" SET slot = 'ARTICLE_MIDDLE' WHERE slot = 'in_feed';
