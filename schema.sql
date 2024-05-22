CREATE TABLE IF NOT EXISTS guilds(
    guildid TEXT PRIMARY KEY,
    forumid TEXT
);

CREATE TABLE IF NOT EXISTS auctions(
    guildid TEXT NOT NULL,
    auctionid TEXT NOT NULL,
    channelid INT NOT NULL,
    highestbid REAL NOT NULL,
    FOREIGN KEY (guildid) REFERENCES guilds(guildid),
    PRIMARY KEY (guildid, auctionid, channelid)
);

CREATE TABLE IF NOT EXISTS bidders(
  guildid TEXT NOT NULL,
  auctionid INT NOT NULL,
  bidderid TEXT NOT NULL,
  FOREIGN KEY (guildid) REFERENCES guild(guildid),
  FOREIGN KEY (auctionid) REFERENCES auction(auctionid),
  PRIMARY KEY (guildid, auctionid, bidderid)

);